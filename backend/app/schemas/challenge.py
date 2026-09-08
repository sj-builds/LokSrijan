"""Pydantic schemas for challenge management."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


ChallengeSeverity = Literal[
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL",
]


ChallengeStatus = Literal[
    "SUBMITTED",
    "UNDER_REVIEW",
    "VALIDATED",
    "REJECTED",
    "TEAM_FORMED",
    "IN_PROGRESS",
    "SOLUTION_PROPOSED",
    "IMPLEMENTED",
    "RESOLVED",
]


class ChallengeCreate(BaseModel):
    """Request body for creating a challenge."""

    title: str = Field(
        min_length=3,
        max_length=200,
    )

    description: str = Field(
        min_length=10,
    )

    category: str = Field(
        min_length=2,
        max_length=100,
    )

    location: str = Field(
        min_length=2,
        max_length=200,
    )

    severity: ChallengeSeverity = "MEDIUM"

    # Reported urgency; omitted on legacy clients, in which case the
    # priority model derives it from severity.
    urgency: ChallengeSeverity | None = None


class ChallengeUpdate(BaseModel):
    """Request body for updating a challenge."""

    title: str | None = Field(
        default=None,
        min_length=3,
        max_length=200,
    )

    description: str | None = Field(
        default=None,
        min_length=10,
    )

    category: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    location: str | None = Field(
        default=None,
        min_length=2,
        max_length=200,
    )

    severity: ChallengeSeverity | None = None

    urgency: ChallengeSeverity | None = None


class ChallengeStatusUpdate(BaseModel):
    """Request body for changing challenge status."""

    new_status: ChallengeStatus


class ChallengeResponse(BaseModel):
    """Public challenge response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    category: str
    location: str
    severity: ChallengeSeverity
    urgency: ChallengeSeverity | None = None
    status: ChallengeStatus
    created_by: int
    created_at: datetime
    updated_at: datetime

    # True for records from the seeded demo dataset.
    is_demo: bool = False