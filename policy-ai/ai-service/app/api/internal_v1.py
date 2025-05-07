from fastapi import APIRouter, HTTPException, BackgroundTasks

from app.ai.rag_agent import get_agent_response
from app.schemas.internal_api import QueryRequest, QueryResponse
from app.services.document_processor import process_s3_documents

router = APIRouter()

@router.post("/answer_query", response_model=QueryResponse)
def answer_query(request: QueryRequest):
    """Receives a query and returns the RAG agent's answer."""
    try:
        config = {}
        if request.thread_id:
            config = {"configurable": {"thread_id": request.thread_id}}
        else:
            # Fallback to a default thread_id if not provided by client
            # This ensures agent can still maintain state for this specific call if needed,
            # or use its own default if config is empty.
            # LangGraph agent uses "default_thread" if no thread_id is in config.
            # For clarity, we could explicitly set it, or let the agent handle it.
            # logger.warning("thread_id not provided by client, agent will use its default.")
            pass # Agent will use its default or handle empty config

        answer = get_agent_response(request.query, config=config)
        return QueryResponse(answer=answer)
    except Exception as e:
        # Log the error e
        print(f"Error processing query: {e}")
        raise HTTPException(status_code=500, detail="Failed to process query using RAG agent.")

@router.post("/load-documents-from-s3", status_code=202) # 202 Accepted
async def load_s3_documents(background_tasks: BackgroundTasks):
    """Triggers the background task to load and process documents from S3."""
    print("Received request to load documents from S3. Starting background task.")
    # Ejecuta el proceso de carga en segundo plano
    background_tasks.add_task(process_s3_documents)
    return {"message": "Document processing from S3 started in the background."}

# Añadir aquí endpoints para procesar documentos
# @router.post("/process_document", response_model=DocumentProcessResponse)
# def process_document_endpoint(request: DocumentProcessRequest):
#     try:
#         # Llama a la lógica en services/document_processor.py
#         # ...
#         return DocumentProcessResponse(success=True)
#     except Exception as e:
#         # Log error
#         raise HTTPException(status_code=500, detail="Failed to process document.")
