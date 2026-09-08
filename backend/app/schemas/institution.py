"""Institution API schemas."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, EmailStr, Field


class InstitutionType(str, Enum):
    """Supported institution types."""

    UNIVERSITY = "UNIVERSITY"
    NGO = "NGO"
    INDUSTRY = "INDUSTRY"


class InstitutionCreate(BaseModel):
    """Schema for creating an institution."""

    name: str = Field(
        min_length=2,
        max_length=200,
    )

    institution_type: InstitutionType

    description: str = Field(
        min_length=10,
    )

    location: str = Field(
        min_length=2,
        max_length=200,
    )

    capabilities: str = Field(
        min_length=2,
    )

    website: str | None = None

    contact_email: EmailStr | None = None


class InstitutionUpdate(BaseModel):
    """Schema for updating an institution."""

    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=200,
    )

    description: str | None = Field(
        default=None,
        min_length=10,
    )

    location: str | None = Field(
        default=None,
        min_length=2,
        max_length=200,
    )

    capabilities: str | None = Field(
        default=None,
        min_length=2,
    )

    website: str | None = None

    contact_email: EmailStr | None = None

    is_active: bool | None = None


class InstitutionResponse(BaseModel):
    """Institution response schema."""

    id: int
    name: str
    institution_type: InstitutionType
    description: str
    location: str
    capabilities: str
    website: str | None
    contact_email: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    # True for records from the seeded demo dataset.
    is_demo: bool = False

    class Config:
        from_attributes = True