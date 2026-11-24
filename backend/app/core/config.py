"""Configuration management for LUMEN Hardware Backend using Pydantic Settings."""

import os
from typing import List, Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application and database settings loaded from environment or .env file."""

    # Resolve root .env path dynamically
    _backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    _root_dir = os.path.dirname(_backend_dir)
    _root_env = os.path.join(_root_dir, ".env")
    _backend_env = os.path.join(_backend_dir, ".env")

    model_config = SettingsConfigDict(
        env_file=(_root_env, _backend_env, ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # General App Config
    PROJECT_NAME: str = "LUMEN Hardware API"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 5000

    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5000",
        "http://127.0.0.1:5000"
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v):
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        return ["*"]

    # PostgreSQL Database Credentials
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = ""
    POSTGRES_DB: str = "lumen_db"
    POSTGRES_SOCKET_DIR: Optional[str] = None  # e.g. "/tmp" for local unix socket

    # Direct database URI override (e.g., from DATABASE_URL)
    DATABASE_URL: Optional[str] = None

    # Firebase Authentication & Admin SDK
    FIREBASE_PROJECT_ID: str = "e-commerce-d60a7"
    FIREBASE_CREDENTIALS_PATH: Optional[str] = None
    FIREBASE_AUTH_EMULATOR: bool = False

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        """Construct database URI based on settings or return explicit DATABASE_URL."""
        if self.DATABASE_URL:
            # Normalize postgres:// to postgresql:// for SQLAlchemy
            if self.DATABASE_URL.startswith("postgres://"):
                return self.DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
            elif self.DATABASE_URL.startswith("postgresql://") and not self.DATABASE_URL.startswith("postgresql+"):
                return self.DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)
            return self.DATABASE_URL

        # Unix domain socket connection (e.g. host=/tmp)
        if self.POSTGRES_SOCKET_DIR:
            auth_part = self.POSTGRES_USER
            if self.POSTGRES_PASSWORD:
                auth_part = f"{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            return f"postgresql+psycopg2://{auth_part}@/{self.POSTGRES_DB}?host={self.POSTGRES_SOCKET_DIR}&port={self.POSTGRES_PORT}"

        # Standard TCP connection
        auth_part = self.POSTGRES_USER
        if self.POSTGRES_PASSWORD:
            auth_part = f"{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
        return f"postgresql+psycopg2://{auth_part}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"


# Global settings singleton
settings = Settings()
