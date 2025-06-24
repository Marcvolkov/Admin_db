from pydantic_settings import BaseSettings
from enum import Enum

class Environment(str, Enum):
    DEV = "dev"
    TEST = "test"
    STAGE = "stage"
    PROD = "prod"

class Settings(BaseSettings):
    # PostgreSQL Database URLs
    DATABASE_URL_DEV: str = "postgresql://postgres:password@localhost:5432/app_dev"
    DATABASE_URL_TEST: str = "postgresql://postgres:password@localhost:5432/app_test"
    DATABASE_URL_STAGE: str = "postgresql://postgres:password@localhost:5432/app_stage"
    DATABASE_URL_PROD: str = "postgresql://postgres:password@localhost:5432/app_prod"
    METADATA_DB_URL: str = "postgresql://postgres:password@localhost:5432/metadata_db"
    
    # JWT Settings
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    class Config:
        env_file = ".env"

settings = Settings()