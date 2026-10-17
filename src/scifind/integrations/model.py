import torch
from sentence_transformers import SentenceTransformer

MODEL = "sentence-transformers/all-MiniLM-L6-v2"


def get_embedding_model(device: str | None = None) -> SentenceTransformer:
    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
    return SentenceTransformer(MODEL, device=device)
