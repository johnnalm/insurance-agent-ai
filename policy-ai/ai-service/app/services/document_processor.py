import os
import boto3
from pypdf import PdfReader
from io import BytesIO
from langchain.docstore.document import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from dotenv import load_dotenv

from app.ai.vector_store import add_documents_to_pinecone

load_dotenv()

# Load AWS credentials and S3 config from environment variables
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
S3_PREFIX = os.getenv("S3_PREFIX")

def extract_text_from_pdf(pdf_content: bytes) -> str:
    """Extracts text from PDF content bytes."""
    text = ""
    try:
        reader = PdfReader(BytesIO(pdf_content))
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n" # Add newline between pages
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        # Handle cases where PDF might be corrupted or unreadable
    return text

def get_text_chunks(text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> list[str]:
    """Splits text into chunks using RecursiveCharacterTextSplitter."""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        is_separator_regex=False, # Use default separators
    )
    chunks = text_splitter.split_text(text)
    return chunks

def process_s3_documents():
    """Downloads PDFs from S3, processes them, and adds them to Pinecone."""
    if not all([AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME, S3_PREFIX]):
        print("Error: AWS credentials or S3 configuration missing in environment variables.")
        return

    print(f"Starting S3 document processing from bucket '{S3_BUCKET_NAME}' prefix '{S3_PREFIX}'")

    s3_client = boto3.client(
        's3',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY
    )

    paginator = s3_client.get_paginator('list_objects_v2')
    pages = paginator.paginate(Bucket=S3_BUCKET_NAME, Prefix=S3_PREFIX)

    total_files_processed = 0
    for page in pages:
        if "Contents" not in page:
            continue
        for obj in page['Contents']:
            s3_key = obj['Key']
            if not s3_key.lower().endswith('.pdf'):
                print(f"Skipping non-PDF file: {s3_key}")
                continue

            print(f"Processing file: {s3_key}...")
            try:
                # Download PDF content
                response = s3_client.get_object(Bucket=S3_BUCKET_NAME, Key=s3_key)
                pdf_content = response['Body'].read()

                # Extract text
                extracted_text = extract_text_from_pdf(pdf_content)
                if not extracted_text:
                    print(f"No text extracted from {s3_key}. Skipping.")
                    continue

                # Split into chunks
                text_chunks = get_text_chunks(extracted_text)
                if not text_chunks:
                    print(f"No chunks created from {s3_key}. Skipping.")
                    continue
                
                # Create Langchain Document objects for chunks
                docs_to_add = []
                for i, chunk in enumerate(text_chunks):
                    # Add relevant metadata
                    metadata = {
                        "source": f"s3://{S3_BUCKET_NAME}/{s3_key}",
                        "chunk_index": i,
                        # Add other relevant metadata if available, e.g., policy_id
                    }
                    docs_to_add.append(Document(page_content=chunk, metadata=metadata))
                
                # Add documents (with embeddings) to Pinecone
                add_documents_to_pinecone(docs_to_add)
                total_files_processed += 1

            except Exception as e:
                print(f"Error processing file {s3_key}: {e}")
                # Continue with the next file

    print(f"Finished S3 document processing. Total files processed: {total_files_processed}")

# Example usage (you would typically trigger this from an API endpoint or a script)
# if __name__ == "__main__":
#     process_s3_documents()
