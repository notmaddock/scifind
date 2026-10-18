from dataclasses import dataclass
from pathlib import Path
from typing import BinaryIO, Literal

from pypdf import PdfReader
from pypdf.errors import PdfReadError


class DocumentIntakeError(ValueError):
    pass


@dataclass(frozen=True)
class TextSegment:
    text: str
    page_number: int | None = None


@dataclass(frozen=True)
class ExtractedDocument:
    filename: str
    format: Literal["txt", "pdf"]
    segments: tuple[TextSegment, ...]
    empty_page_numbers: tuple[int, ...] = ()


def extract_document(source: BinaryIO, *, filename: str) -> ExtractedDocument:
    extension = Path(filename).suffix.lower()

    if extension not in {".txt", ".pdf"}:
        raise DocumentIntakeError("Unsupported file type. Use a PDF or TXT file.")

    try:
        source.seek(0)
        if not source.read(1):
            raise DocumentIntakeError(f"File is empty: {filename}")

        source.seek(0)
        if extension == ".pdf":
            return _extract_pdf(source, filename)
        text = source.read().decode(
            "utf-8-sig"
        )  # -sig handles some extra encoding stuff some documents have

    except OSError as error:
        raise DocumentIntakeError(f"Could not read {filename}: {error}") from error
    except UnicodeDecodeError as error:
        raise DocumentIntakeError("TXT files must use UTF-8 encoding.") from error
    except PdfReadError as error:
        raise DocumentIntakeError(f"Could not parse PDF: {filename}") from error

    if not text.strip():
        raise DocumentIntakeError("TXT file contains no non-whitespace text.")

    return ExtractedDocument(
        filename=filename, format="txt", segments=(TextSegment(text),)
    )


def _extract_pdf(source: BinaryIO, filename: str) -> ExtractedDocument:
    reader = PdfReader(source)
    # PdfReader already attempts the empty password when opening encrypted PDFs.
    if reader.is_encrypted and not reader.decrypt(""):
        raise DocumentIntakeError("PDF requires a password.")

    segments: list[TextSegment] = []
    empty_pages: list[int] = []
    for page_number, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        if text.strip():
            segments.append(TextSegment(text, page_number))
        else:
            empty_pages.append(page_number)

    if not segments:
        raise DocumentIntakeError("PDF contains no extractable text. It may need OCR.")
    return ExtractedDocument(filename, "pdf", tuple(segments), tuple(empty_pages))
