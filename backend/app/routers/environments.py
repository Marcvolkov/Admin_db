from fastapi import APIRouter, Depends
from typing import List
from ..config import Environment
from ..models.user import User
from ..services.auth_service import get_current_user

router = APIRouter()

# Simple in-memory storage for current environment per user
user_environments = {}

@router.get("/", response_model=List[str])
def get_environments(current_user: User = Depends(get_current_user)):
    """Get list of available environments"""
    return [env.value for env in Environment]

@router.get("/current", response_model=str)
def get_current_environment(current_user: User = Depends(get_current_user)):
    """Get current environment for user"""
    return user_environments.get(current_user.id, Environment.DEV.value)

@router.post("/switch")
def switch_environment(environment: str, current_user: User = Depends(get_current_user)):
    """Switch active environment"""
    if environment not in [env.value for env in Environment]:
        return {"error": "Invalid environment"}
    
    user_environments[current_user.id] = environment
    return {"message": f"Switched to {environment}", "environment": environment}