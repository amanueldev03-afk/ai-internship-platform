from pathlib import Path

from docx import Document
from pypdf import PdfReader


ALLOWED_EXTENSIONS = {
    ".pdf",
    ".docx",
}


def validate_cv_extension(filename):
    """
    Validate CV file extension.
    """

    extension = Path(
        filename
    ).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError(
            "Only PDF and DOCX files are supported."
        )

    return extension


def extract_pdf_text(file):
    """
    Extract text from a PDF file.
    """

    reader = PdfReader(file)

    pages = []

    for page in reader.pages:
        text = page.extract_text()

        if text:
            pages.append(text)

    return "\n".join(pages)


def extract_docx_text(file):
    """
    Extract text from a DOCX file.
    """

    document = Document(file)

    paragraphs = []

    for paragraph in document.paragraphs:

        text = paragraph.text.strip()

        if text:
            paragraphs.append(text)

    return "\n".join(paragraphs)


def extract_cv_text(file):
    """
    Validate and extract CV text.
    """

    validate_cv_size(file)

    extension = validate_cv_extension(
        file.name
    )

    if extension == ".pdf":
        return extract_pdf_text(file)

    if extension == ".docx":
        return extract_docx_text(file)

    raise ValueError(
        "Unsupported CV format."
    )


def validate_cv_size(file):
    """
    Ensure the CV is not too large.
    """

    MAX_CV_SIZE = 5 * 1024 * 1024

    if file.size > MAX_CV_SIZE:
        raise ValueError(
            "CV file must not exceed 5 MB."
        )