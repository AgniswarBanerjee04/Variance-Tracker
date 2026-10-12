"""
Asynchronous Database Connection and Session Management.

Implements asynchronous connection pooling via SQLAlchemy 2.0 with asyncpg.
Strictly connects to cloud PostgreSQL database via os.getenv("DATABASE_URL").
Adheres to strict separation of concerns for database transactions.
"""

import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import declarative_base

# Strictly fetch cloud database URL via os.getenv("DATABASE_URL")
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Default cloud PostgreSQL fallback when environment variable is unset locally
    DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/variance_tracker"

# Normalize PostgreSQL driver for SQLAlchemy asyncpg engine if needed
# (Cloud providers such as Neon, Supabase, Render, Railway often supply postgres:// or postgresql://)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+asyncpg://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# PostgreSQL asyncpg connection pool tuning for cloud deployments
engine_kwargs = {
    "echo": False,
    "future": True,
    "pool_size": 10,
    "max_overflow": 20,
    "pool_pre_ping": True,
}

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
