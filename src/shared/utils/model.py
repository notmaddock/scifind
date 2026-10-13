from sentence_transformers import SentenceTransformer

MODEL = "sentence-transformers/all-MiniLM-L6-v2"

def get_embedding_model() -> SentenceTransformer:
    return SentenceTransformer(MODEL)