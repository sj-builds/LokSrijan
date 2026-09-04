"""Analytics API schemas."""

from pydantic import BaseModel


class AnalyticsOverview(BaseModel):
    """High-level LokSrijan platform statistics."""

    total_users: int
    total_challenges: int
    validated_challenges: int
    total_projects: int
    completed_projects: int
    total_institutions: int
    universities: int
    ngos: int
    industries: int
    total_beneficiaries: int
    average_impact_score: float