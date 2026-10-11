"""
Application Configuration Module.

Loads and validates environment variables using Pydantic Settings.
Suitable for academic evaluation in Master of Computer Applications (MCA).
"""

from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Core settings configuration model."""
    
    APP_NAME: str = "Variance Tracker API"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    
    # Database Settings
    DATABASE_URL: str = "sqlite+aiosqlite:///./variance_tracker.db"
    
    # JWT Authentication
    SECRET_KEY: str = "super-secret-mca-minor-project-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # Anomaly Detection Constraints
    MICRO_SPEND_THRESHOLD: float = 500.00
    
    # CORS Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
