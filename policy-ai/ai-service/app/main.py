from fastapi import FastAPI
from app.api import internal_v1 # Importa tu router

app = FastAPI(
    title="Policy AI - AI Service",
    description="Handles AI/ML tasks like RAG, document processing, and embedding for Policy AI.",
    version="0.1.0"
)

# Incluye el router de la API interna
# Puedes prefijarlo si quieres, ej: prefix="/internal/v1"
app.include_router(internal_v1.router, prefix="/api/internal/v1")

@app.get("/health", tags=["Health"])
def read_root():
    """Health check endpoint."""
    return {"status": "OK"}

# Añadir eventos de startup si necesitas inicializar algo
# @app.on_event("startup")
# async def startup_event():
#     print("AI Service starting up...")
#     # Inicializar modelos, conexiones, etc.
#     pass
