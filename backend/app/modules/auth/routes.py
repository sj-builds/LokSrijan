"""Authentication API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.modules.auth.dependencies import get_current_user

from app.core.database import get_db
from app.schemas.auth import (
    AuthResponse,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
)
from app.modules.auth.service import (
    authenticate_user,
    create_user_token,
    register_user,
)


router = APIRouter()


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    user_data: UserRegister,
    db: Session = Depends(get_db),
) -> AuthResponse:
    """Register a new user."""

    try:
        user = register_user(db, user_data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    token = create_user_token(user)

    return AuthResponse(
        user=UserResponse.model_validate(user),
        token=TokenResponse(access_token=token),
    )


@router.post(
    "/login",
    response_model=AuthResponse,
)
def login(
    credentials: UserLogin,
    db: Session = Depends(get_db),
) -> AuthResponse:
    """Authenticate a user and return an access token."""

    user = authenticate_user(
        db=db,
        email=str(credentials.email),
        password=credentials.password,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_user_token(user)

    return AuthResponse(
        user=UserResponse.model_validate(user),
        token=TokenResponse(access_token=token),
    )

@router.get(
    "/me",
    response_model=UserResponse,
)
def get_me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Return the currently authenticated user."""

    return UserResponse.model_validate(current_user)