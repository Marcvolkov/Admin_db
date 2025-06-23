from pydantic_settings import BaseSettings
from enum import Enum

class Environment(str, Enum):
    DEV = "dev"
    TEST = "test"
    STAGE = "stage"
    PROD = "prod"

class Settings(BaseSettings):
    # Database URLs
    DATABASE_URL_DEV: str = "sqlite:///./data/app_dev.db"
    DATABASE_URL_TEST: str = "sqlite:///./data/app_test.db"
    DATABASE_URL_STAGE: str = "sqlite:///./data/app_stage.db"
    DATABASE_URL_PROD: str = "sqlite:///./data/app_prod.db"
    METADATA_DB_URL: str = "sqlite:///./data/metadata.db"
    
    # JWT Settings
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    class Config:
        env_file = ".env"

settings = Settings()