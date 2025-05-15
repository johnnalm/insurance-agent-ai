import logging
from langchain_core.tools import tool
from app.utils.pdf_processor import download_pdf_content, extract_text_from_pdf # Adjusted import path

logger = logging.getLogger(__name__)

@tool
def specific_document_qa_tool(query: str, document_url: str) -> str:
    """
    Answers questions about a specific insurance policy document provided via a URL.
    This tool MUST be used when a document_url is available in the context of the query.
    It downloads the document from the URL, extracts its text, and uses that text to answer the query.
    Args:
        query (str): The user's question about the document.
        document_url (str): The URL of the document to query.
    """
    logger.info(f"Executing SPECIFIC DOCUMENT QA tool for query: '{query}'. Document URL: {document_url}")

    if not document_url:
        logger.error("specific_document_qa_tool called without a document_url, though it is a required parameter.")
        return "Error: This tool requires a document_url, but none was provided effectively by the agent."

    logger.info(f"Processing specific document from URL: {document_url}")
    pdf_bytes = download_pdf_content(document_url)
    if not pdf_bytes:
        return "Failed to download the specified document. Please check the URL or network."

    text_content = extract_text_from_pdf(pdf_bytes)
    if not text_content:
        return "Failed to extract text from the specified document. It might be empty, corrupted, or a non-text PDF."

    context_snippet = text_content[:12000]
    logger.info(f"Extracted text snippet for SPECIFIC DOCUMENT QA tool (first 200 chars): {context_snippet[:200]}...")
    
    # The tool returns context. The agent LLM will use this to synthesize the final answer.
    return f"Context from the uploaded document ({document_url}):\\n\\n{context_snippet}" 