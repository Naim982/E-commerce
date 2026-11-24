"""Database connectivity and session management using Synchronous SQLAlchemy 2.0."""

from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from app.core.config import settings


class Base(DeclarativeBase):
    """Central declarative base for all SQLAlchemy models."""
    pass


# Configure synchronous SQLAlchemy 2.0 engine
engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URI,
    echo=False,  # Set to True for verbose SQL query logging during debug
    pool_pre_ping=True,  # Automatically detect disconnected connections
    pool_size=10,
    max_overflow=20
)

# Central database session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False
)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a database session and ensures it is closed."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
