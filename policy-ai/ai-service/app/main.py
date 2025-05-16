from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import internal_v1, auth

app = FastAPI(
    title="Policy AI - AI Service",
    description="Handles AI/ML tasks like RAG, document processing, and embedding for Policy AI.",
    version="0.1.0"
)

origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  
    allow_credentials=True,  
    allow_methods=["*"],  
    allow_headers=["*"],    
)

app.include_router(internal_v1.router, prefix="/api/internal/v1")
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])

@app.get("/health", tags=["Health"])
def read_root():
    """Health check endpoint."""
    return {"status": "OK"}
