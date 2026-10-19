from pathlib import Path
from typing import Annotated

from collections.abc import Sequence
from uuid import UUID, uuid4
from shutil import copyfileobj

from chromadb.api.types import Metadata
from fastapi import APIRouter, Depends, HTTPException, Response, UploadFile
from pydantic import BaseModel
from fastapi.responses import FileResponse

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


class DocumentSummary(BaseModel):  # type: ignore[explicit-any]
    id: str
    filename: str
    format: str


@router.get("", response_model=list[DocumentSummary])  # type: ignore[misc]
def list_documents(
    processor: DocumentProcessorDep, q: str = ""
) -> list[DocumentSummary]:
    result = processor.seeds.get(
        where={"type": "upload"}, include=["metadatas", "documents"]
    )
    query = q.strip().casefold()
    documents: list[DocumentSummary] = []
    for identifier, metadata, text in zip(
        result["ids"], result["metadatas"] or [], result["documents"] or []
    ):
        if metadata and (
            not query
            or query in str(metadata["filename"]).casefold()
            or query in (text or "").casefold()
        ):
            documents.append(
                DocumentSummary(
                    id=identifier,
                    filename=str(metadata["filename"]),
                    format=str(metadata["format"]),
                )
            )

    def sort_key(document: DocumentSummary) -> tuple[str, str]:
        return document.filename.casefold(), document.id

    return sorted(documents, key=sort_key)


def document_file(
    document_id: UUID, processor: DocumentProcessor
) -> tuple[Path, Metadata]:
    identifier = str(document_id)
    result = processor.seeds.get(ids=[identifier], include=["metadatas"])
    metadatas = result["metadatas"]
    metadata = metadatas[0] if metadatas else None
    if not metadata or metadata.get("type") != "upload":
        raise HTTPException(status_code=404, detail="Document not found.")
    file_format = metadata.get("format")
    if file_format not in {"pdf", "txt"}:
        raise HTTPException(status_code=404, detail="Document not found.")
    return UPLOAD_PATH / f"{identifier}.{file_format}", metadata


@router.delete("/{document_id}", status_code=204)  # type: ignore[misc]
def delete_document(document_id: UUID, processor: DocumentProcessorDep) -> Response:
    original, _ = document_file(document_id, processor)
    original.unlink(missing_ok=True)
    processor.seeds.delete(where={"document_id": str(document_id)})
    processor.seeds.delete(ids=[str(document_id)])
    return Response(status_code=204)


@router.get("/{document_id}/download")  # type: ignore[misc]
def download_document(
    document_id: UUID, processor: DocumentProcessorDep, inline: bool = False
) -> FileResponse:
    original, metadata = document_file(document_id, processor)
    if not original.is_file():
        raise HTTPException(status_code=404, detail="Original file not found.")
    return FileResponse(
        original,
        filename=str(metadata["filename"]),
        media_type=(
            "application/pdf"
            if metadata["format"] == "pdf"
            else "text/plain; charset=utf-8"
        ),
        content_disposition_type="inline" if inline else "attachment",
        headers={"X-Content-Type-Options": "nosniff"},
    )
