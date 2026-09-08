"""Solution passport API schemas.

A passport is generated from a completed project and its impact ledger,
then edited and optionally published. Only PUBLISHED passports feed the
replication engine. `impact_verification_status` is always displayed — a
passport never claims verified impact the ledger has not verified.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


PassportStatus = Literal[
    "DRAFT",
    "PUBLISHED",
]


class PassportGenerate(BaseModel):
    """Request to generate a passport from a completed project."""

    project_id: int


class PassportUpdate(BaseModel):
    """Editable passport fields."""

    title: str | None = Field(default=None, min_length=3, max_length=200)
    root_cause: str | None = None
    solution: str | None = Field(default=None, min_length=5)
    technology: str | None = None
    cost_estimate: str | None = None
    implementation_time: str | None = None
    required_skills: str | None = None
    infrastructure: str | None = None
    pilot_conditions: str | None = None
    limitations: str | None = None
    failure_conditions: str | None = None
    replication_suitability: str | None = None


class SolutionPassportResponse(BaseModel):
    """Passport as returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    challenge_id: int
    title: str
    category: str
    location: str

    problem: str
    root_cause: str | None
    solution: str
    technology: str | None
    cost_estimate: str | None
    implementation_time: str | None
    required_skills: str | None
    infrastructure: str | None
    pilot_conditions: str | None

    metric_name: str | None
    baseline_value: float | None
    actual_value: float | None
    unit: str | None
    improvement_pct: float | None
    evidence: str | None

    impact_verification_status: str
    impact_verification_note: str | None

    limitations: str | None
    failure_conditions: str | None
    replication_suitability: str | None

    status: PassportStatus
    created_by: int
    is_demo: bool
    created_at: datetime
    updated_at: datetime


class ReplicationMatch(BaseModel):
    """One published passport matched against a new challenge."""

    passport_id: int
    passport_title: str
    project_title: str
    challenge_title: str
    match_score: float  # 0-100 capability/suitability score, not a probability
    reasons: list[str]
    impact_verification_status: str


class ReplicationResponse(BaseModel):
    """Replication recommendations for a new challenge."""

    challenge_id: int
    challenge_title: str
    matches: list[ReplicationMatch]
    methodology_note: str = (
        "Prototype replication matching: published solution passports are "
        "scored against the new challenge by problem similarity, domain, "
        "location and documented implementation conditions. A high match "
        "recommends adapting an existing solution instead of starting from "
        "scratch — it is a suitability score, not a prediction of success."
    )