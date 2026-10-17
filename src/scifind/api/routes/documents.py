from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, UploadFile

from scifind.documents.intake import DocumentIntakeError, extract_document
from scifind.documents.processing import (
    ProcessedDocument,
    DocumentProcessor,
    get_document_processor,
)

router = APIRouter(prefix="/api/documents", tags=["documents"])


DocumentProcessorDep = Annotated[DocumentProcessor, Depends(get_document_processor)]


@router.post("", response_model=ProcessedDocument)  # type: ignore[misc]
def upload_document(
    file: UploadFile,
    processor: DocumentProcessorDep,
) -> ProcessedDocument:
    try:
        document = extract_document(file.file, filename=file.filename or "")
        return processor.process(document)
    except DocumentIntakeError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
