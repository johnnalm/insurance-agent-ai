import os, logging
from fastapi import HTTPException
from supabase import create_client
from supabase.lib.client_options import ClientOptions

SUPABASE_URL  = os.getenv("SUPABASE_URL")
SERVICE_KEY   = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
BUCKET_NAME   = os.getenv("SUPABASE_STORAGE_BUCKET", "documents")

def _sb():
    return create_client(
        SUPABASE_URL,
        SERVICE_KEY,
        options=ClientOptions(
            auto_refresh_token=False,
            persist_session=False,
            headers={"Authorization": f"Bearer {SERVICE_KEY}"},
        ),
    )

def upload_pdf_to_supabase(file: bytes, filename: str, subpath: str) -> str:
    sb = _sb()
    object_path = f"{subpath.strip('/')}/{filename}"

    try:
        resp = sb.storage.from_(BUCKET_NAME).upload(
            path=object_path,
            file=file,
            file_options={"content-type": "application/pdf"},
        )

        if hasattr(resp, "error") and resp.error:
            raise RuntimeError(resp.error.message)

        return sb.storage.from_(BUCKET_NAME).get_public_url(object_path)

    except Exception as e:
        logging.exception("Error subiendo PDF")
        raise HTTPException(500, f"Storage error: {e}")
