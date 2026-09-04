"""Authentication business logic."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User
from app.modules.auth.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.schemas.auth import UserRegister


def get_user_by_email(db: Session, email: str) -> User | None:
    """Return a user by email, or None if not found."""

    statement = select(User).where(User.email == email)
    return db.scalar(statement)


def register_user(db: Session, user_data: UserRegister) -> User:
    """Create and store a new user."""

    email = str(user_data.email).lower()
    existing_user = get_user_by_email(db, email)

    if existing_user is not None:
        raise ValueError("Email is already registered")

    user = User(
        name=user_data.name,
        email=email,
        hashed_password=hash_password(user_data.password),
        role="citizen",
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def authenticate_user(
    db: Session,
    email: str,
    password: str,
) -> User | None:
    """Authenticate a user using email and password."""

    user = get_user_by_email(db, email.lower())

    if user is None:
        return None

    if not user.is_active:
        return None

    if not verify_password(password, user.hashed_password):
        return None

    return user


def create_user_token(user: User) -> str:
    """Create an access token for an authenticated user."""

    return create_access_token(
        subject=str(user.id),
        extra_claims={
            "email": user.email,
            "role": user.role,
        },
    )