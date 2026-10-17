from fastapi import APIRouter, HTTPException, UploadFile

from scifind.documents.intake import DocumentIntakeError, ExtractedDocument, extract_document

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post("", response_model=ExtractedDocument)
def upload_document(file: UploadFile) -> ExtractedDocument:
    try:
        return extract_document(file.file, filename=file.filename or "")
    except DocumentIntakeError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
