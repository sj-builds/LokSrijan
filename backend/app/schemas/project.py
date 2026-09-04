"""Pydantic schemas for project management."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


ProjectStatus = Literal[
    "DRAFT",
    "SUBMITTED",
    "UNDER_REVIEW",
    "APPROVED",
    "REJECTED",
    "IN_PROGRESS",
    "COMPLETED",
]


class ProjectCreate(BaseModel):
    """Request body for creating a solution project."""

    title: str = Field(
        min_length=3,
        max_length=200,
    )

    description: str = Field(
        min_length=10,
    )

    solution_summary: str = Field(
        min_length=10,
    )

    category: str = Field(
        min_length=2,
        max_length=100,
    )

    challenge_id: int


class ProjectUpdate(BaseModel):
    """Request body for updating a project."""

    title: str | None = Field(
        default=None,
        min_length=3,
        max_length=200,
    )

    description: str | None = Field(
        default=None,
        min_length=10,
    )

    solution_summary: str | None = Field(
        default=None,
        min_length=10,
    )

    category: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )


class ProjectStatusUpdate(BaseModel):
    """Request body for changing project status."""

    new_status: ProjectStatus


class ProjectResponse(BaseModel):
    """Public project response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    solution_summary: str
    category: str
    challenge_id: int
    created_by: int
    status: ProjectStatus
    created_at: datetime
    updated_at: datetime