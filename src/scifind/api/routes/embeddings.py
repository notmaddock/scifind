from typing import Literal, Protocol, cast

import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from sklearn.cluster import KMeans  # type: ignore[import-untyped]
from sklearn.manifold import TSNE  # type: ignore[import-untyped]

from scifind.api.routes.documents import DocumentProcessorDep

router = APIRouter(prefix="/api/embeddings", tags=["embeddings"])


type PositionArray = np.ndarray[tuple[int, ...], np.dtype[np.float64]]


class FittedClusters(Protocol):
    labels_: np.ndarray[tuple[int, ...], np.dtype[np.int64]]
    inertia_: float
    n_iter_: int


class EmbeddedDocument(BaseModel):  # type: ignore[explicit-any]
    id: str
    filename: str
    position: tuple[float, float]


@router.get("", response_model=list[EmbeddedDocument])  # type: ignore[misc]
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
        coordinates = [(index - (count - 1) / 2, 0.0) for index in range(count)]
        positions = np.array(coordinates, dtype=np.float64)
    elif method == "tsne":
        positions = cast(
            PositionArray,
            TSNE(  # type: ignore[misc]
                n_components=2,
                perplexity=min(30, count - 1),
                init="random",
                random_state=42,
            ).fit_transform(result["embeddings"]),
        )
    else:
        from umap import UMAP  # type: ignore[import-not-found]

        positions = cast(
            PositionArray,
            UMAP(  # type: ignore[misc]
                n_components=2,
                n_neighbors=min(15, count - 1),
                init="random",
                random_state=42,
                n_jobs=1,
            ).fit_transform(result["embeddings"]),
        )
    return [
        EmbeddedDocument(
            id=identifier,
            filename=str(metadata["filename"]),
            position=(float(position[0]), float(position[1])),
        )
        for identifier, metadata, position in zip(
            result["ids"],
            result["metadatas"] or [],
            cast(list[list[float]], positions.tolist()),
        )
    ]


class ClusteringSettings(BaseModel):  # type: ignore[explicit-any]
    n_clusters: int = Field(default=3, ge=1, le=100)
    init: Literal["k-means++", "random"] = "k-means++"
    n_init: int = Field(default=10, ge=1, le=100)
    max_iter: int = Field(default=300, ge=1, le=1000)
    random_state: int = Field(default=42, ge=0, le=4294967295)


class ClusteringResult(BaseModel):  # type: ignore[explicit-any]
    labels: dict[str, int]
    inertia: float
    iterations: int


@router.post("/cluster", response_model=ClusteringResult)  # type: ignore[misc]
def cluster_embeddings(
    settings: ClusteringSettings, processor: DocumentProcessorDep
) -> ClusteringResult:
    result = processor.seeds.get(where={"type": "upload"}, include=["embeddings"])
    if settings.n_clusters > len(result["ids"]):
        raise HTTPException(422, "Cluster count cannot exceed the number of documents.")
    model = cast(
        FittedClusters,
        KMeans(  # type: ignore[misc]
            n_clusters=settings.n_clusters,
            init=settings.init,
            n_init=settings.n_init,
            max_iter=settings.max_iter,
            random_state=settings.random_state,
        ).fit(result["embeddings"]),
    )
    return ClusteringResult(
        labels=dict(zip(result["ids"], map(int, model.labels_))),
        inertia=float(model.inertia_),
        iterations=int(model.n_iter_),
    )
