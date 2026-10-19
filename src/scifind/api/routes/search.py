from dataclasses import dataclass
from typing import Annotated, cast

from fastapi import APIRouter, HTTPException, Query

from scifind.api.routes.documents import DocumentProcessorDep
from scifind.documents.processing import FloatArray

router = APIRouter(prefix="/api/search", tags=["search"])


@dataclass(frozen=True)
class SearchResult:
    id: str
    filename: str
    format: str
    text: str
    similarity: float
    page_number: int | None = None


@router.get("", response_model=list[SearchResult])  # type: ignore[misc]
def search_documents(
    processor: DocumentProcessorDep,
    q: Annotated[str, Query(min_length=1)],
    limit: Annotated[int, Query(ge=1, le=100)] = 10,
) -> list[SearchResult]:
    query = q.strip()
    if not query:
        raise HTTPException(status_code=422, detail="Search query must not be blank.")
    embedding = cast(
        FloatArray,
        processor.model.encode(
            [query],  # type: ignore[misc]
            normalize_embeddings=True,
            convert_to_numpy=True,
            show_progress_bar=False,
        ),
    )
    count = processor.seeds.count()
    if not count:
        return []
    candidates = min(limit, count)
    while True:
        result = processor.seeds.query(
            query_embeddings=embedding,
            where={"type": "upload_chunk"},
            n_results=candidates,
            include=["documents", "metadatas", "distances"],
        )
        metadatas = result["metadatas"]
        documents = result["documents"]
        distances = result["distances"]
        if metadatas is None or documents is None or distances is None:
            raise RuntimeError("Search response is missing requested fields.")
        matches: dict[str, SearchResult] = {}
        for metadata, text, distance in zip(
            metadatas[0], documents[0], distances[0], strict=True
        ):
            identifier = cast(str, metadata["document_id"])
            if identifier not in matches:
                matches[identifier] = SearchResult(
                    id=identifier,
                    filename=cast(str, metadata["filename"]),
                    format=cast(str, metadata["format"]),
                    text=text,
                    similarity=max(-1.0, min(1.0, 1 - distance)),
                    page_number=cast(int | None, metadata.get("page_number")),
                )
            if len(matches) == limit:
                return list(matches.values())
        if len(result["ids"][0]) < candidates or candidates == count:
            return list(matches.values())

        candidates = min(candidates * 2, count)
