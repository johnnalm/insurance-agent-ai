import os, json, logging
from typing import Dict, Any
from fastapi import HTTPException
from supabase import create_client
from supabase.lib.client_options import ClientOptions

SUPABASE_URL   = os.getenv("SUPABASE_URL")
SERVICE_KEY    = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # service-role
ANON_KEY       = os.getenv("SUPABASE_ANON_KEY")          # public anon
PROFILES_TABLE = "profiles"

def _sb(*, admin: bool = False):
    """admin=True → service-role; admin=False → anon."""
    key = SERVICE_KEY if admin else ANON_KEY
    if not key:
        raise RuntimeError("Faltan SUPABASE_*_KEY en el entorno")

    client = create_client(
        SUPABASE_URL,
        key,
        options=ClientOptions(
            auto_refresh_token=False,
            persist_session=False,
            headers={"Authorization": f"Bearer {key}"},
        ),
    )
    return client


async def register_user(email: str,
                  password: str,
                  user_data: Dict[str, Any] | None = None) -> Dict[str, Any]:

    try:
        sb_admin = _sb(admin=True)
        auth_res = sb_admin.auth.sign_up({"email": email, "password": password})

        user = getattr(auth_res, "user", None)
        if user is None:
            raise HTTPException(400, "Error al registrar usuario")

        user_id = user.id
        logging.info(f"Usuario registrado con ID: {user_id}")

        if user_data:
            sb_admin = _sb(admin=True)
            profile = {**user_data, "id": user_id}
            
            try:
                insert_res = sb_admin.table(PROFILES_TABLE).insert(profile, upsert=False).execute()
                
                if getattr(insert_res, "error", None):
                    logging.warning(f"Profile insert error: {insert_res.error}")
            except Exception as profile_error:
                logging.warning(f"Error insertando perfil con table(): {profile_error}")
                try:
                    insert_res = sb_admin.from_(PROFILES_TABLE).insert(profile).execute()
                    if not insert_res.data:
                        logging.warning("Inserción de perfil no devolvió datos")
                except Exception as e:
                    logging.error(f"Error también en from_(): {e}")

        return {
            "user_id": user_id,
            "email": email,
            "message": "Usuario registrado correctamente",
        }

    except HTTPException:
        raise
    except Exception as e:
        logging.exception("register_user failed")
        raise HTTPException(500, f"Registro falló: {e}")


async def login_user(email: str, password: str) -> Dict[str, Any]:

    try:
        sb_admin = _sb(admin=True)
        auth_res = sb_admin.auth.sign_in_with_password(
            {"email": email, "password": password}
        )

        session = getattr(auth_res, "session", None)
        user = getattr(auth_res, "user", None)
        if session is None or user is None:
            raise HTTPException(401, "Credenciales incorrectas")

        profile_res = (
            sb_admin.table(PROFILES_TABLE).select("*").eq("id", user.id).single().execute()
        )
        profile = profile_res.data if profile_res and profile_res.data else None

        return {
            "access_token": session.access_token,
            "refresh_token": session.refresh_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "profile": profile,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        logging.exception("login_user failed")
        raise HTTPException(500, f"Login falló: {e}")


async def get_user_by_id(user_id: str) -> Dict[str, Any]:

    try:
        sb_admin = _sb(admin=True)
        user_res = sb_admin.auth.admin.get_user_by_id(user_id)

        user = getattr(user_res, "user", None)
        if user is None:
            raise HTTPException(404, "Usuario no encontrado")

        profile_res = sb_admin.table(PROFILES_TABLE).select("*").eq("id", user_id).single().execute()
        profile = profile_res.data if profile_res and profile_res.data else None

        return {
            "id": user.id,
            "email": user.email,
            "profile": profile,
        }

    except HTTPException:
        raise
    except Exception as e:
        logging.exception("get_user_by_id failed")
        raise HTTPException(500, f"Obtención falló: {e}")
