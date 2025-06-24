from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.sql import func
from enum import Enum as PyEnum
from ..database import Base

class Role(PyEnum):
    ADMIN = "admin"
    REGULAR_USER = "regular_user"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(Enum(Role, name='role_enum'), nullable=False, default=Role.REGULAR_USER)
    created_at = Column(DateTime(timezone=True), server_default=func.now())