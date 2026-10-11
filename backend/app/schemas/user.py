"""
Pydantic Schemas for User Authentication and Profile.
"""

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserBase(BaseModel):
    """Base user data."""
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=128)


class UserRegisterRequest(UserBase):
    """Payload for user registration."""
    password: str = Field(..., min_length=6, max_length=128)


class UserLoginRequest(BaseModel):
    """Payload for user login."""
    email: EmailStr
    password: str


class UserResponse(UserBase):
    """Response model for user profiles."""
    id: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    """JWT Token bearer response."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenPayload(BaseModel):
    """Decoded JWT payload."""
    sub: str
    exp: int
