import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App
    PROJECT_NAME: str = "HR AI Problem Classifier & Triage System"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./hr_ai.db"
    )

    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # JWT Authentication
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super_secret_jwt_key_hr_ai_classifier_32bytes_min_dev_default")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Ollama LLM
    OLLAMA_API_URL: str = os.getenv("OLLAMA_API_URL", "http://localhost:11434")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "llama2:7b")
    LLM_TIMEOUT_SECONDS: int = 30

    # DPDP Compliance & Encryption
    DB_ENCRYPTION_KEY: str = os.getenv(
        "DB_ENCRYPTION_KEY",
        "s8bQnK1dY5_Vj2A_8QW9k7jU_mP0N3zL5rT8vX2c1E0="
    )
    DATA_RETENTION_DAYS: int = 730  # 2 years
    ENABLE_FIELD_ENCRYPTION: bool = True

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
