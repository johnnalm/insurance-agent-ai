from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Dict, Any

from app.services.auth_service import register_user, login_user, get_user_by_id
from app.schemas.auth import UserRegisterRequest, UserLoginRequest, UserResponse, TokenResponse

router = APIRouter()

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserRegisterRequest):
    user_profile = {
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "phone": user_data.phone
    }
    
    result = await register_user(
        email=user_data.email, 
        password=user_data.password, 
        user_data=user_profile
    )
    
    return {
        "user_id": result["user_id"],
        "email": result["email"],
        "profile": user_profile
    }

@router.post("/login", response_model=TokenResponse)
async def login(login_data: UserLoginRequest):
    result = await login_user(
        email=login_data.email, 
        password=login_data.password
    )
    
    return {
        "access_token": result["access_token"],
        "refresh_token": result["refresh_token"],
        "token_type": "bearer",
        "user": {
            "user_id": result["user"]["id"],
            "email": result["user"]["email"],
            "profile": result["user"]["profile"]
        }
    }

@router.post("/token", response_model=TokenResponse)
async def login_form(form_data: OAuth2PasswordRequestForm = Depends()):
    result = await login_user(
        email=form_data.username,
        password=form_data.password
    )
    
    return {
        "access_token": result["access_token"],
        "refresh_token": result["refresh_token"],
        "token_type": "bearer",
        "user": {
            "user_id": result["user"]["id"],
            "email": result["user"]["email"],
            "profile": result["user"]["profile"]
        }
    }

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        user_id = "user_id_from_token" 
        user = await get_user_by_id(user_id)
        return user
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    return {
        "user_id": current_user["id"],
        "email": current_user["email"],
        "profile": current_user["profile"]
    }