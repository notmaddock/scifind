from typing import cast
import kagglehub  # type: ignore[import-untyped]
import polars as pl

# this file contains a bunch of hacks for ignoring errors from mypy because kagglehub just returns Any most times

def load_arxiv_dataset() -> pl.LazyFrame:
    return cast(
        pl.LazyFrame,
        kagglehub.dataset_load(  # type: ignore[misc]
            adapter=kagglehub.KaggleDatasetAdapter.POLARS,  # type: ignore[misc]
            handle="sumitm004/arxiv-scientific-research-papers-dataset",
            path="arXiv_scientific_dataset.csv",
        ),
    )
