import os
from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import Pinecone as LangchainPinecone
# Importa la clase de embeddings correcta
from langchain_openai import OpenAIEmbeddings # Ya no la usamos por defecto
# from langchain_community.embeddings import HuggingFaceEmbeddings # Ejemplo
# from langchain_community.embeddings import OllamaEmbeddings # Si usas Ollama
from dotenv import load_dotenv

load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENVIRONMENT = os.getenv("PINECONE_ENVIRONMENT") # Lee el environment de .env
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY") # Asegúrate que esta línea existe si no está ya

# Identificador del modelo de embeddings que coincide con llama-text-embed-v2 y dimensión 1024
# ¡¡DEBES VERIFICAR ESTE NOMBRE!! Busca el modelo en Hugging Face Hub o tu proveedor.
# Ejemplo: "sentence-transformers/all-mpnet-base-v2" (¡ESTE NO ES!, es solo un ejemplo de formato)
# Ejemplo: "intfloat/multilingual-e5-large" (Otro ejemplo, verifica dimensiones)
# EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2" # <-- YA NO SE USA DIRECTAMENTE

pinecone_client = None
pinecone_index = None

def get_pinecone_client():
    """Initializes and returns the Pinecone client."""
    global pinecone_client
    if pinecone_client is None:
        if not PINECONE_API_KEY or not PINECONE_ENVIRONMENT:
            raise ValueError("PINECONE_API_KEY or PINECONE_ENVIRONMENT not found in environment variables.")
        pinecone_client = Pinecone(api_key=PINECONE_API_KEY)
        # Código opcional de creación de índice actualizado (Dimension 1024, Serverless AWS us-east-1)
        # if PINECONE_INDEX_NAME not in pinecone_client.list_indexes().names:
        #     print(f"Creating Pinecone index '{PINECONE_INDEX_NAME}'...")
        #     pinecone_client.create_index(
        #         name=PINECONE_INDEX_NAME,
        #         dimension=1024, # <-- Coincide con tu índice
        #         metric='cosine',
        #         spec=ServerlessSpec(cloud='aws', region='us-east-1') # <-- Coincide con tu índice
        #     )
        # else:
        #    print(f"Pinecone index '{PINECONE_INDEX_NAME}' already exists.")

    return pinecone_client

def get_pinecone_index():
    """Returns the Pinecone index object."""
    global pinecone_index
    if pinecone_index is None:
        client = get_pinecone_client()
        if not PINECONE_INDEX_NAME:
             raise ValueError("PINECONE_INDEX_NAME not found in environment variables.")
        pinecone_index = client.Index(PINECONE_INDEX_NAME)
    return pinecone_index

def get_embedding_model():
    """Initializes and returns the specified embedding model."""
    # Verifica que la API key esté presente
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY not found in environment variables.")

    # Usa OpenAIEmbeddings
    # Puedes especificar el modelo si no quieres el default, ej: model="text-embedding-ada-002"
    print("Loading OpenAI embedding model: text-embedding-3-small")
    embeddings = OpenAIEmbeddings(
        openai_api_key=OPENAI_API_KEY,
        model="text-embedding-3-small" # Especifica el modelo
    )

    # Ejemplo con HuggingFaceEmbeddings
    # Asegúrate de que el modelo descargado/accedido sea el correcto
    # embeddings = HuggingFaceEmbeddings(
    #     model_name=EMBEDDING_MODEL_NAME,
    #     model_kwargs={'device': 'cpu'}, # Cambia a 'cuda' si tienes GPU y PyTorch con CUDA
    #     encode_kwargs={'normalize_embeddings': True} # Depende del modelo, a menudo recomendado
    # )
    
    # Ejemplo con Ollama
    # print(f"Loading Ollama embedding model: llama-text-embed-v2")
    # ollama_base_url = os.getenv("OLLAMA_BASE_URL") # Leer la URL base de .env
    # embeddings = OllamaEmbeddings(model="llama-text-embed-v2", base_url=ollama_base_url) # Ajusta el nombre del modelo si es necesario

    return embeddings

def get_vector_store():
    """Initializes and returns the Langchain Pinecone vector store."""
    index = get_pinecone_index()
    embeddings = get_embedding_model()
    vector_store = LangchainPinecone(index=index, embedding=embeddings, text_key="text")
    return vector_store

def add_documents_to_pinecone(docs):
    """Adds Langchain Document objects to the Pinecone index."""
    if not docs:
        print("No documents provided to add.")
        return

    vector_store = get_vector_store()
    try:
        print(f"Adding {len(docs)} documents/chunks to Pinecone index '{PINECONE_INDEX_NAME}'...")
        vector_store.add_documents(docs)
        print(f"Successfully added documents/chunks.")
    except Exception as e:
        print(f"Error adding documents to Pinecone: {e}")

# Puedes añadir aquí funciones para añadir documentos/vectores al índice
# def add_documents_to_pinecone(docs):
#    vector_store = get_vector_store()
#    vector_store.add_documents(docs)
#    print(f"Added {len(docs)} documents to Pinecone index '{PINECONE_INDEX_NAME}'")
