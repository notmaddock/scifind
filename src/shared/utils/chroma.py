from pathlib import Path
import chromadb
from chromadb.api import ClientAPI
from root import REPO_ROOT

CHROMA_PATH: Path = REPO_ROOT / "chroma"

ALL_DOCUMENTS_COLLECTION_NAME: str = "all_documents"
DOCUMENT_CHUNKS_COLLECTION_NAME: str = "document_chunks"


def get_chroma_client(path: str | Path = CHROMA_PATH) -> ClientAPI:
    return chromadb.PersistentClient(path=str(path))
