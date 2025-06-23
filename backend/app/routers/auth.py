from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from datetime import timedelta
from ..database import get_metadata_db
from ..schemas.user import UserLogin, Token, User
from ..services.auth_service import authenticate_user, create_access_token, get_current_user
from ..config import settings

router = APIRouter()
security = HTTPBearer()

@router.post("/login", response_model=Token)
def login(user_login: UserLogin, db: Session = Depends(get_metadata_db)):
    """Login endpoint - returns JWT token"""
    user = authenticate_user(db, user_login.username, user_login.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return current_user