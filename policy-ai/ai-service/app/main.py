from fastapi import FastAPI
from app.api import internal_v1, auth

app = FastAPI(
    title="Policy AI - AI Service",
    description="Handles AI/ML tasks like RAG, document processing, and embedding for Policy AI.",
    version="0.1.0"
)

app.include_router(internal_v1.router, prefix="/api/internal/v1")
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])

@app.get("/health", tags=["Health"])
def read_root():
    """Health check endpoint."""
    return {"status": "OK"}
