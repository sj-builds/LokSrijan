"""Team API schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TeamCreate(BaseModel):
    """Request body for creating a student team."""

    name: str = Field(min_length=2, max_length=150)
    department: str = Field(min_length=2, max_length=150)
    mentor: str = Field(default="Unassigned", max_length=150)
    members: int = Field(default=0, ge=0)
    challenge_id: int | None = None


class TeamUpdate(BaseModel):
    """Request body for updating a student team."""

    name: str | None = Field(default=None, min_length=2, max_length=150)
    department: str | None = Field(default=None, min_length=2, max_length=150)
    mentor: str | None = Field(default=None, max_length=150)
    members: int | None = Field(default=None, ge=0)
    challenge_id: int | None = None
    status: str | None = Field(default=None, max_length=50)
    progress: int | None = Field(default=None, ge=0, le=100)
    last_update: str | None = None


class TeamResponse(BaseModel):
    """Team returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    department: str
    mentor: str
    members: int
    challenge_id: int | None
    created_by: int
    status: str
    progress: int
    last_update: str
    created_at: datetime
    updated_at: datetime