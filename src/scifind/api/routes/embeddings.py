from typing import Literal

import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel
from sklearn.manifold import TSNE

from scifind.api.routes.documents import DocumentProcessorDep

router = APIRouter(prefix="/api/embeddings", tags=["embeddings"])


class EmbeddedDocument(BaseModel):
    id: str
    filename: str
    position: tuple[float, float]


@router.get("", response_model=list[EmbeddedDocument])
def list_embeddings(
    processor: DocumentProcessorDep, method: Literal["umap", "tsne"] = "umap"
) -> list[EmbeddedDocument]:
    result = processor.seeds.get(
        where={"type": "upload"}, include=["embeddings", "metadatas"]
    )
    count = len(result["ids"])
    if not count:
        return []
    if count < 3:
        positions = np.column_stack(
            (np.arange(count) - (count - 1) / 2, np.zeros(count))
        )
    elif method == "tsne":
        positions = TSNE(
            n_components=2, perplexity=min(30, count - 1), init="random", random_state=42
        ).fit_transform(np.asarray(result["embeddings"]))
    else:
        from umap import UMAP

        positions = UMAP(
            n_components=2,
            n_neighbors=min(15, count - 1),
            init="random",
            random_state=42,
            n_jobs=1,
        ).fit_transform(np.asarray(result["embeddings"]))
    return [
        EmbeddedDocument(
            id=identifier, filename=str(metadata["filename"]),
            position=(float(position[0]), float(position[1])),
        )
        for identifier, metadata, position in zip(
            result["ids"], result["metadatas"] or [], positions
        )
    ]
