"""Impact API schemas.

The Impact Ledger tracks Baseline -> Target -> Actual -> Evidence ->
Verification. improvement_pct is computed server-side from baseline and
actual; clients never send it. verification_status starts PENDING and
only becomes VERIFIED through the explicit verification workflow.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


VerificationStatus = Literal[
    "PENDING",
    "VERIFIED",
]


class ImpactCreate(BaseModel):
    """Schema for recording project impact."""

    project_id: int
    beneficiaries: int = Field(default=0, ge=0)
    outcome: str = Field(min_length=5)
    impact_score: float = Field(default=0.0, ge=0, le=100)
    evidence: str | None = None

    # Impact Ledger
    metric_name: str | None = Field(default=None, max_length=200)
    baseline_value: float | None = None
    target_value: float | None = None
    actual_value: float | None = None
    unit: str | None = Field(default=None, max_length=50)
    improvement_direction: Literal["down", "up"] | None = "down"


class ImpactUpdate(BaseModel):
    """Schema for updating project impact."""

    beneficiaries: int | None = Field(default=None, ge=0)
    outcome: str | None = Field(default=None, min_length=5)
    impact_score: float | None = Field(default=None, ge=0, le=100)
    evidence: str | None = None

    # Impact Ledger
    metric_name: str | None = Field(default=None, max_length=200)
    baseline_value: float | None = None
    target_value: float | None = None
    actual_value: float | None = None
    unit: str | None = Field(default=None, max_length=50)
    improvement_direction: Literal["down", "up"] | None = None
    verification_note: str | None = None


class ImpactVerify(BaseModel):
    """Mark impact evidence as verified by an authorised user."""

    verification_note: str = Field(min_length=5)
    verified: bool = True


class ImpactResponse(BaseModel):
    """Impact response schema."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    beneficiaries: int
    outcome: str
    impact_score: float
    evidence: str | None
    metric_name: str | None
    baseline_value: float | None
    target_value: float | None
    actual_value: float | None
    unit: str | None
    improvement_direction: str | None
    improvement_pct: float | None
    verification_status: VerificationStatus
    verification_note: str | None
    created_at: datetime
    updated_at: datetime