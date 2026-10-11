"""
User Authentication Service.
Handles registration, password hashing verification, and user lookup.
"""

from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.schemas.user import UserRegisterRequest


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """Retrieve user entity by email address."""
    stmt = select(User).where(User.email == email.lower().strip())
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
    """Retrieve user entity by primary key ID."""
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def register_user(db: AsyncSession, user_in: UserRegisterRequest) -> User:
    """Register and persist a new user."""
    hashed_pwd = get_password_hash(user_in.password)
    user = User(
        email=user_in.email.lower().strip(),
        hashed_password=hashed_pwd,
        full_name=user_in.full_name.strip(),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[User]:
    """Authenticate credentials against database."""
    user = await get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


async def get_or_create_demo_user(db: AsyncSession) -> User:
    """Ensures a default demo user exists for seamless evaluation."""
    demo_email = "scholar@msit.edu.in"
    user = await get_user_by_email(db, demo_email)
    if not user:
        user = User(
            email=demo_email,
            hashed_password=get_password_hash("ResearchPass@2026"),
            full_name="MCA Research Scholar",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return user
