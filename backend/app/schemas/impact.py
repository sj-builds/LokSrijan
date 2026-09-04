"""Impact API schemas."""

from datetime import datetime

from pydantic import BaseModel, Field


class ImpactCreate(BaseModel):
    """Schema for recording project impact."""

    project_id: int
    beneficiaries: int = Field(default=0, ge=0)
    outcome: str = Field(min_length=5)
    impact_score: float = Field(default=0.0, ge=0, le=100)
    evidence: str | None = None


class ImpactUpdate(BaseModel):
    """Schema for updating project impact."""

    beneficiaries: int | None = Field(default=None, ge=0)
    outcome: str | None = Field(default=None, min_length=5)
    impact_score: float | None = Field(default=None, ge=0, le=100)
    evidence: str | None = None


class ImpactResponse(BaseModel):
    """Impact response schema."""

    id: int
    project_id: int
    beneficiaries: int
    outcome: str
    impact_score: float
    evidence: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True