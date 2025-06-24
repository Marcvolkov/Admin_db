from fastapi import APIRouter, Depends, HTTPException
from typing import List
from pydantic import BaseModel
from ..config import Environment
from ..models.user import User
from ..services.auth_service import get_current_user

router = APIRouter()

# Simple in-memory storage for current environment per user
user_environments = {}

class EnvironmentSwitch(BaseModel):
    environment: str

@router.get("/", response_model=List[str])
def get_environments(current_user: User = Depends(get_current_user)):
    """Get list of available environments"""
    return [env.value for env in Environment]

@router.get("/current", response_model=str)
def get_current_environment(current_user: User = Depends(get_current_user)):
    """Get current environment for user"""
    return user_environments.get(current_user.id, Environment.DEV.value)

@router.post("/switch")
def switch_environment(request: EnvironmentSwitch, current_user: User = Depends(get_current_user)):
    """Switch active environment"""
    if request.environment not in [env.value for env in Environment]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid environment '{request.environment}'. Available environments: {[env.value for env in Environment]}"
        )
    
    user_environments[current_user.id] = request.environment
    return {"message": f"Switched to {request.environment}", "environment": request.environment}