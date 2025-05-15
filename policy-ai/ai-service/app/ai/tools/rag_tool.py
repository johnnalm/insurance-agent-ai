import logging
from langchain_core.tools import tool
from langchain_core.runnables import RunnableLambda

# Correct relative import assuming vector_store.py is in the parent directory 'ai'
from ..vector_store import get_vector_store

logger = logging.getLogger(__name__)

def format_docs(docs):
    """Formats list of documents into a single string."""
    return "\n\n".join(doc.page_content for doc in docs)

def log_retrieved_docs(docs):
    """Logs retrieved documents (simplified for tool context)."""
    if docs:
        logger.info(f"Retrieved {len(docs)} documents for RAG tool.")
    else:
        logger.info("No documents retrieved for RAG tool.")
    return docs

@tool
def policy_rag_tool(query: str) -> str:
    """
    Searches and answers questions about insurance policies using the general internal knowledge base (e.g., Pinecone).
    This tool should NOT be used if a specific document_url is available for context.
    If a specific document_url is provided elsewhere in the conversation, use the 'specific_document_qa_tool' instead.
    """
    logger.info(f"Executing GENERAL RAG tool for query: '{query}'")
    try:
        vector_store = get_vector_store()
        retriever = vector_store.as_retriever(search_type="similarity", search_kwargs={'k': 3}) # Reduced K for tool context

        # Simplified RAG chain for tool - Agent LLM will handle final answer synthesis
        rag_chain_for_tool = (
            retriever
            | RunnableLambda(log_retrieved_docs)
            | format_docs
        )
        context = rag_chain_for_tool.invoke(query)
        if not context:
            return "No relevant policy information found in the internal knowledge base."
        # Return context for the agent to synthesize the answer
        return f"Retrieved context:\n{context}"
    except Exception as e:
        logger.error(f"Error in RAG tool: {e}", exc_info=True)
        return "Error executing the policy RAG tool." 