from fastapi import APIRouter, HTTPException, BackgroundTasks, UploadFile, File, Form, Depends
from fastapi.responses import JSONResponse
import os
import uuid
from typing import Optional
import magic
import logging
from datetime import datetime

from app.ai.rag_agent import get_agent_response, generate_policy_draft, edit_policy
from app.schemas.internal_api import QueryRequest, QueryResponse, PolicyDraftRequest, PolicyDraftResponse, PolicyEditRequest, PolicyEditResponse
from app.services.document_processor import process_s3_documents
from app.services.storage_service import upload_pdf_to_supabase

router = APIRouter()

# Configure logging for this module
logger = logging.getLogger(__name__)

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

        # Add document_url to config if present
        if request.document_url:
            config["document_context"] = {"url": request.document_url}
            
        answer = get_agent_response(request.query, current_policy_text=request.current_policy_text, config=config)
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

@router.post("/upload-pdf", status_code=201)
async def upload_pdf_document(
    file: UploadFile = File(...),
    document_type: str = Form(...),
    description: Optional[str] = Form(None),
):
    try:
        # Validate file size (max 10MB)
        content = await file.read()
        file_size = len(content)
        
        if file_size > 10 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File size exceeds the 10MB limit")
            
        mime_type = magic.from_buffer(content[:2048], mime=True)
        if mime_type != "application/pdf":
            raise HTTPException(
                status_code=415, 
                detail=f"Invalid file type. Expected PDF, got {mime_type}"
            )
        
        allowed_types = ["policy"]
        if document_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid document type. Must be one of: {', '.join(allowed_types)}"
            )
            
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        original_filename = file.filename
        sanitized_filename = original_filename.replace(" ", "_").lower()
        sanitized_filename = ''.join(c for c in sanitized_filename if c.isalnum() or c in '._-')
        filename = f"{timestamp}_{unique_id}_{sanitized_filename}"
        
        bucket_path = f"documents/{document_type}"
        file_url = upload_pdf_to_supabase(content, filename, bucket_path)
        
        logging.info(f"Document uploaded successfully: {filename} ({file_size} bytes)")
        
        
        return JSONResponse(
            status_code=201,
            content={
                "message": "Document uploaded successfully",
                "document": {
                    "filename": filename,
                    "original_filename": original_filename,
                    "size": file_size,
                    "type": document_type,
                    "description": description,
                    "url": file_url,
                    "upload_date": datetime.now().isoformat()
                }
            }
        )
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logging.error(f"Error uploading PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# --- Policy Creation and Editing Endpoints ---

@router.post("/generate-policy-draft", response_model=PolicyDraftResponse)
async def generate_draft_endpoint(request: PolicyDraftRequest):
    """
    Receives a prompt and optionally the current policy text. 
    Returns a generated policy draft, possibly diffed against the current text.
    """
    logger.info(f"Received request to generate policy draft. Prompt: {request.prompt[:100]}... Current text provided: {request.current_policy_text is not None}")
    try:
        draft_text = generate_policy_draft(request.prompt, request.current_policy_text)
        if "<p>Error:" in draft_text: # Check for error snippet more robustly
            logger.error(f"Failed to generate policy draft: {draft_text}")
            raise HTTPException(status_code=500, detail=draft_text)
        logger.info(f"Policy draft (or diff) generated successfully. Returning to client. Length: {len(draft_text)}")
        return PolicyDraftResponse(draft_text=draft_text)
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in generate-policy-draft endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate policy draft.")

@router.post("/edit-policy", response_model=PolicyEditResponse)
async def edit_policy_endpoint(request: PolicyEditRequest):
    """
    Receives current policy text and an edit instruction, 
    returns an HTML diff of the modified policy text against the current text.
    """
    logger.info(f"Received request to edit policy. Instruction: {request.edit_instruction[:100]}...")
    try:
        edited_text_diff = edit_policy(request.current_policy_text, request.edit_instruction)
        if "<p>Error:" in edited_text_diff: # Check for error snippet more robustly
            logger.error(f"Failed to edit policy and generate diff: {edited_text_diff}")
            raise HTTPException(status_code=500, detail=edited_text_diff)
        logger.info(f"Policy edit diff generated successfully. Returning to client. Length: {len(edited_text_diff)}")
        return PolicyEditResponse(edited_policy_text=edited_text_diff)
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in edit-policy endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to edit policy.")
