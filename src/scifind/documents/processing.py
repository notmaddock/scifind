from dataclasses import dataclass
from functools import cache
from typing import cast

import numpy as np
from chromadb.api.collection_configuration import CollectionConfiguration
from chromadb.api.models.Collection import Collection
from chromadb.errors import InvalidDimensionException, NotFoundError
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
from transformers import PreTrainedTokenizerBase

from scifind.documents.intake import ExtractedDocument
from scifind.integrations.chroma import ALL_DOCUMENTS_COLLECTION_NAME, get_chroma_client
from scifind.integrations.model import MODEL, get_embedding_model

type FloatArray = np.ndarray[tuple[int, ...], np.dtype[np.float32]]


class ProcessingUnavailableError(RuntimeError):
    pass


def ensure_collection_cosine(collection: Collection) -> None:
    configuration = cast(CollectionConfiguration, collection.configuration)
    hnsw = configuration["hnsw"]
    if hnsw is None or hnsw.get("space") != "cosine":
        raise ProcessingUnavailableError(
            "Seed collection must use cosine distance. Reseed the database."
        )


@dataclass(frozen=True)
class EmbeddedChunk:
    text: str
    page_number: int | None
    embedding: list[float]


@dataclass(frozen=True)
class ProcessedDocument:
    filename: str
    format: str
    empty_page_numbers: tuple[int, ...]
    chunks: tuple[EmbeddedChunk, ...]
    general_embedding: list[float]
    model: str
    chunk_token_limit: int
    chunk_overlap: int
    similarity: float
    threshold: float
    accepted: bool


class DocumentProcessor:
    def __init__(
        self,
        model: SentenceTransformer,
        seeds: Collection,
        *,
        threshold: float = 0.5,
        chunk_overlap: int = 32,
    ):
        if not -1 <= threshold <= 1:
            raise ValueError("Cosine similarity threshold must be between -1 and 1.")
        token_limit = model.max_seq_length
        if token_limit is None or not 0 <= chunk_overlap < token_limit:
            raise ValueError("Chunk overlap must be smaller than the token limit.")
        ensure_collection_cosine(seeds)
        self.token_limit = token_limit
        self.model = model
        self.seeds = seeds
        self.threshold = threshold
        self.chunk_overlap = chunk_overlap
        tokenizer = cast(PreTrainedTokenizerBase, model.tokenizer)

        def token_count(text: str) -> int:
            return len(cast(list[int], tokenizer.encode(text)))

        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=token_limit,
            chunk_overlap=chunk_overlap,
            length_function=token_count,
        )

    def process(self, document: ExtractedDocument) -> ProcessedDocument:
        parts = [
            (text, segment.page_number)
            for segment in document.segments
            for text in self.splitter.split_text(segment.text)
        ]
        vectors = cast(
            FloatArray,
            self.model.encode(
                [text for text, _ in parts],  # type: ignore[misc]
                normalize_embeddings=True,
                convert_to_numpy=True,
                show_progress_bar=False,
            ),
        )
        general = vectors.mean(axis=0)
        if (
            not np.isfinite(vectors).all()
            or not np.isfinite(general).all()
            or not general.any()
        ):
            raise ProcessingUnavailableError(
                "Cannot compare invalid or zero-length embeddings."
            )
        general /= np.linalg.norm(general)
        similarity = self._evaluate_acceptance(general)
        chunk_vectors = cast(list[list[float]], vectors.tolist())
        return ProcessedDocument(
            filename=document.filename,
            format=document.format,
            empty_page_numbers=document.empty_page_numbers,
            chunks=tuple(
                EmbeddedChunk(text, page, vector)
                for (text, page), vector in zip(parts, chunk_vectors, strict=True)
            ),
            general_embedding=cast(list[float], general.tolist()),
            model=MODEL,
            chunk_token_limit=self.token_limit,
            chunk_overlap=self.chunk_overlap,
            similarity=similarity,
            threshold=self.threshold,
            accepted=similarity >= self.threshold,
        )

    def _evaluate_acceptance(self, general_embedding: FloatArray) -> float:
        try:
            result = self.seeds.query(
                query_embeddings=general_embedding,
                where={"type": "seed"},
                n_results=1,
                include=["distances"],
            )
        except InvalidDimensionException as error:
            raise ProcessingUnavailableError(
                "Seed embedding dimensions do not match the model. Reseed the database."
            ) from error
        distances = result["distances"]
        if not distances or not distances[0]:
            raise ProcessingUnavailableError(
                "No seed embeddings found. Run procedures/seed.ipynb first."
            )
        return max(-1.0, min(1.0, 1 - distances[0][0]))


@cache
def get_document_processor() -> DocumentProcessor:
    try:
        seeds = get_chroma_client().get_collection(ALL_DOCUMENTS_COLLECTION_NAME)
    except NotFoundError as error:
        raise ProcessingUnavailableError(
            "Seed collection missing. Run procedures/seed.ipynb first."
        ) from error
    return DocumentProcessor(get_embedding_model(), seeds)
