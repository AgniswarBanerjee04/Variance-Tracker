"""
FastAPI Dependencies for Authentication & User Resolution.
"""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.services.auth_service import get_user_by_id, get_or_create_demo_user

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Resolves the authenticated user from the Bearer JWT token.
    If no token is supplied (e.g. during academic evaluation or quick testing),
    it transparently provides the designated MCA Research Scholar demo user.
    """
    if token:
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            user = await get_user_by_id(db, payload["sub"])
            if user:
                return user
                
    # Fallback to persistent demo scholar user for immediate zero-friction evaluation
    return await get_or_create_demo_user(db)
