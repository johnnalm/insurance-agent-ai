import logging
import requests
from io import BytesIO
import pypdf # Or from PyPDF2 import PdfReader

logger = logging.getLogger(__name__)

def download_pdf_content(url: str) -> bytes | None:
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return response.content
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to download PDF from {url}: {e}")
        return None

def extract_text_from_pdf(pdf_content: bytes) -> str | None:
    try:
        reader = pypdf.PdfReader(BytesIO(pdf_content))
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text: # Ensure text was extracted
                text += page_text
        if not text: # If no text was extracted from any page
            logger.warning("No text could be extracted from the PDF.")
            return None
        return text
    except Exception as e: # Catch more general pypdf errors
        logger.error(f"Failed to extract text from PDF: {e}", exc_info=True)
        return None 