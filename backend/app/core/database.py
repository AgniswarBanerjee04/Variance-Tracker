"""
Asynchronous Database Connection and Session Management.

Implements asynchronous connection pooling via SQLAlchemy 2.0 with asyncpg.
Strictly connects to cloud PostgreSQL database via os.getenv("DATABASE_URL").
Adheres to strict separation of concerns for database transactions.
"""

import os
from pathlib import Path
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import declarative_base

from app.core.config import settings

# Fetch database URL from environment or fallback to application settings
DATABASE_URL = os.getenv("DATABASE_URL") or settings.DATABASE_URL

# Normalize PostgreSQL driver for SQLAlchemy asyncpg engine if needed
# (Cloud providers such as Neon, Supabase, Render, Railway often supply postgres:// or postgresql://)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+asyncpg://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# Canonical path resolution for local SQLite development
if DATABASE_URL.startswith("sqlite+aiosqlite:///"):
    sqlite_path_str = DATABASE_URL.replace("sqlite+aiosqlite:///", "", 1)
    if not os.path.isabs(sqlite_path_str):
        # Resolve relative SQLite path to the backend directory
        backend_dir = Path(__file__).resolve().parent.parent.parent
        db_file = (backend_dir / sqlite_path_str.lstrip("./\\")).resolve()
        DATABASE_URL = f"sqlite+aiosqlite:///{db_file.as_posix()}"

# Connection engine arguments
engine_kwargs = {
    "echo": False,
    "future": True,
}

# Apply connection pool settings for PostgreSQL
if not DATABASE_URL.startswith("sqlite"):
    engine_kwargs.update({
        "pool_size": 10,
        "max_overflow": 20,
        "pool_pre_ping": True,
    })

engine = create_async_engine(DATABASE_URL, **engine_kwargs)

# Asynchronous session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that yields an asynchronous database session.
    Ensures safe transaction cleanup and rollback on unhandled exceptions.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
