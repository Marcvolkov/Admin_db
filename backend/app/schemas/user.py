from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from ..models.user import Role

class UserBase(BaseModel):
    username: str
    email: str
    role: Role = Role.REGULAR_USER

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class User(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User