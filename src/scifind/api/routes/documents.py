from typing import Annotated
from collections.abc import Sequence
from uuid import uuid4
from shutil import copyfileobj

from fastapi import APIRouter, Depends, HTTPException, UploadFile

from scifind.documents.intake import DocumentIntakeError, extract_document
from scifind.root import REPO_ROOT
from scifind.documents.processing import (
    ProcessedDocument,
    DocumentProcessor,
    get_document_processor,
)

router = APIRouter(prefix="/api/documents", tags=["documents"])
UPLOAD_PATH = REPO_ROOT / "uploads"


DocumentProcessorDep = Annotated[DocumentProcessor, Depends(get_document_processor)]


@router.post("", response_model=ProcessedDocument)  # type: ignore[misc]
def upload_document(
    file: UploadFile,
    processor: DocumentProcessorDep,
) -> ProcessedDocument:
    try:
        document = extract_document(file.file, filename=file.filename or "")
        result = processor.process(document)
        if result.accepted:
            identifier = str(uuid4())
            UPLOAD_PATH.mkdir(parents=True, exist_ok=True)
            original = UPLOAD_PATH / f"{identifier}.{result.format}"
            try:
                file.file.seek(0)
                with original.open("xb") as destination:
                    copyfileobj(file.file, destination)
                embeddings: list[Sequence[float]] = [result.general_embedding]
                processor.seeds.add(
                    ids=[identifier],
                    embeddings=embeddings,
                    documents=[
                        "\n\n".join(segment.text for segment in document.segments)
                    ],
                    metadatas=[
                        {
                            "type": "upload",
                            "filename": result.filename,
                            "format": result.format,
                            "original_path": f"uploads/{original.name}",
                        }
                    ],
                )
                chunk_embeddings: list[Sequence[float]] = [
                    chunk.embedding for chunk in result.chunks
                ]
                processor.seeds.add(
                    ids=[
                        f"{identifier}:{index}" for index in range(len(result.chunks))
                    ],
                    embeddings=chunk_embeddings,
                    documents=[chunk.text for chunk in result.chunks],
                    metadatas=[
                        {
                            "type": "upload_chunk",
                            "document_id": identifier,
                            "filename": result.filename,
                            "format": result.format,
                            **(
                                {"page_number": chunk.page_number}
                                if chunk.page_number is not None
                                else {}
                            ),
                        }
                        for chunk in result.chunks
                    ],
                )
            except Exception:
                processor.seeds.delete(where={"document_id": identifier})
                processor.seeds.delete(ids=[identifier])
                original.unlink(missing_ok=True)
                raise
        return result
    except DocumentIntakeError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
