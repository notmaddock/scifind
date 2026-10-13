import kagglehub
import polars as pl


def load_arxiv_dataset() -> pl.LazyFrame:
    return kagglehub.dataset_load(
        adapter=kagglehub.KaggleDatasetAdapter.POLARS,
        handle="sumitm004/arxiv-scientific-research-papers-dataset",
        path="arXiv_scientific_dataset.csv"
    )
