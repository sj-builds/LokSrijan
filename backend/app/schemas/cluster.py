"""Challenge cluster API schemas."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


ClusterStatus = Literal[
    "SUGGESTED",
    "VALIDATED",
    "REJECTED",
]


class ClusterMemberOut(BaseModel):
    """A challenge linked to a cluster, with the evidence captured."""

    challenge_id: int
    title: str
    location: str
    category: str
    severity: str
    status: str
    similarity_score: float | None = None


class ClusterCreate(BaseModel):
    """Create a cluster with explicit member challenge IDs."""

    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10)
    rationale: str = Field(default="")
    challenge_ids: list[int] = Field(min_length=2)


class ClusterResponse(BaseModel):
    """Cluster as returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    title: str
    description: str
    status: ClusterStatus
    rationale: str
    created_by: int
    created_at: datetime
    updated_at: datetime
    members: list[ClusterMemberOut] = []


class SuggestedCluster(BaseModel):
    """One candidate cluster produced by the suggestion engine."""

    title: str
    code: str
    description: str
    rationale: str
    member_count: int
    locations: list[str]
    categories: list[str]
    average_similarity: float
    member_challenge_ids: list[int]
    member_titles: list[str]


class ClusterSuggestResponse(BaseModel):
    """Candidate clusters for the current set of challenges."""

    suggested_clusters: list[SuggestedCluster]
    methodology_note: str = (
        "Prototype clustering: challenges are grouped by shared category, "
        "nearby location, and text similarity. Suggestions require human "
        "validation before they become systemic challenges."
    )