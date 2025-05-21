from pydantic import BaseModel
from typing import Optional

class QueryRequest(BaseModel):
    query: str
    thread_id: str | None = None
    document_url: str | None = None

class QueryResponse(BaseModel):
    answer: str

# Añadir aquí schemas para el procesamiento de documentos si es necesario
# class DocumentProcessRequest(BaseModel):
#     file_path: str # O el contenido del archivo
#     document_id: str

# class DocumentProcessResponse(BaseModel):
#     success: bool
#     message: str | None = None

# --- Schemas for Policy Creation and Editing ---

class PolicyDraftRequest(BaseModel):
    prompt: str
    current_policy_text: Optional[str] = None

class PolicyDraftResponse(BaseModel):
    draft_text: str

class PolicyEditRequest(BaseModel):
    current_policy_text: str
    edit_instruction: str

class PolicyEditResponse(BaseModel):
    edited_policy_text: str
