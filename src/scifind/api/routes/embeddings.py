from typing import Literal

import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from sklearn.cluster import KMeans
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


class ClusteringSettings(BaseModel):
    n_clusters: int = Field(default=3, ge=1, le=100)
    init: Literal["k-means++", "random"] = "k-means++"
    n_init: int = Field(default=10, ge=1, le=100)
    max_iter: int = Field(default=300, ge=1, le=1000)
    random_state: int = Field(default=42, ge=0, le=4294967295)


class ClusteringResult(BaseModel):
    labels: dict[str, int]
    inertia: float
    iterations: int


@router.post("/cluster", response_model=ClusteringResult)
def cluster_embeddings(
    settings: ClusteringSettings, processor: DocumentProcessorDep
) -> ClusteringResult:
    result = processor.seeds.get(where={"type": "upload"}, include=["embeddings"])
    if settings.n_clusters > len(result["ids"]):
        raise HTTPException(422, "Cluster count cannot exceed the number of documents.")
    model = KMeans(**settings.model_dump()).fit(np.asarray(result["embeddings"]))
    return ClusteringResult(
        labels=dict(zip(result["ids"], map(int, model.labels_))),
        inertia=float(model.inertia_),
        iterations=int(model.n_iter_),
    )
