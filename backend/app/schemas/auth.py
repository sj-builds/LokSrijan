"""Pydantic schemas for authentication."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


UserRole = Literal[
    "citizen",
    "government",
    "university",
    "ngo",
    "industry",
]


class UserRegister(BaseModel):
    """Request body for user registration."""

    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: UserRole = "citizen"


class UserLogin(BaseModel):
    """Request body for user login."""

    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Public user response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime


class TokenResponse(BaseModel):
    """JWT token response."""

    access_token: str
    token_type: str = "bearer"


class AuthResponse(BaseModel):
    """Response returned after successful authentication."""

    user: UserResponse
    token: TokenResponse