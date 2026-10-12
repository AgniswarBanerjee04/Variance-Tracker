"""
Authentication & User API Router.

Exposes endpoints for registration, login, and profile fetching.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token
from app.models.user import User
from app.routers.deps import get_current_user
from app.schemas.user import (
    UserRegisterRequest,
    UserResponse,
    TokenResponse,
    UserLoginRequest,
)
from app.services.auth_service import (
    register_user,
    authenticate_user,
    get_user_by_email,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@router.post("/signup/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@router.post("/register/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_in: UserRegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """
    Register a new user account.
    
    - Validates email uniqueness.
    - Hashes password using bcrypt.
    - Returns sanitized UserResponse model.
    """
    existing = await get_user_by_email(db, user_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )
    user = await register_user(db, user_in)
    return UserResponse.model_validate(user)


@router.post("/login", response_model=TokenResponse)
@router.post("/login/", response_model=TokenResponse)
@router.post("/login-json", response_model=TokenResponse)
@router.post("/login-json/", response_model=TokenResponse)
async def login(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """
    Flexible token login endpoint.
    
    - Accepts both JSON payloads and OAuth2 application/x-www-form-urlencoded payloads.
    - Issues a signed JWT Bearer access token upon successful authentication.
    """
    content_type = request.headers.get("content-type", "")
    username = None
    password = None

    if "application/json" in content_type:
        try:
            body = await request.json()
            username = body.get("email") or body.get("username")
            password = body.get("password")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Malformed JSON body.",
            )
    else:
        try:
            form_data = await request.form()
            username = form_data.get("username") or form_data.get("email")
            password = form_data.get("password")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Malformed form data.",
            )

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Both email/username and password are required.",
        )

    user = await authenticate_user(db, username, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
@router.get("/me/", response_model=UserResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Fetch current user profile details."""
    return UserResponse.model_validate(current_user)
