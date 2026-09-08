"""Schemas for AI problem intelligence."""

from typing import Literal

from pydantic import BaseModel, Field


SeverityLevel = Literal[
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL",
]


class ProblemAnalysisRequest(BaseModel):
    """Request for AI-powered problem analysis."""

    description: str = Field(
        min_length=10,
        max_length=5000,
    )


class ProblemAnalysisResponse(BaseModel):
    """Structured AI analysis of a citizen problem."""

    domain: str
    subdomain: str
    problem: str

    severity: SeverityLevel
    urgency: SeverityLevel

    affected_population: str

    keywords: list[str]

    required_capabilities: list[str]

    potential_causes: list[str]

    confidence: float = Field(
        ge=0.0,
        le=1.0,
    )

    reason: str

    human_verification_required: bool


class SimilarityRequest(BaseModel):
    """Request for comparing two problem descriptions."""

    text_a: str = Field(
        min_length=3,
        max_length=5000,
    )

    text_b: str = Field(
        min_length=3,
        max_length=5000,
    )


class SimilarityResponse(BaseModel):
    """Semantic similarity result."""

    similarity_score: float

    is_possible_duplicate: bool

class DuplicateChallenge(BaseModel):
    """Possible duplicate challenge.

    Semantic similarity alone is never treated as proof of duplication; the
    signals list explains what evidence supports the link.
    """

    challenge_id: int
    title: str
    similarity_score: float

    # Human-readable evidence signals, e.g. "same domain", "4.8 km away".
    signals: list[str] = []

    # HIGH / MEDIUM / LOW — label the confidence honestly.
    confidence_label: str = "LOW"

    category_match: bool = False
    location_match: bool = False


class ChallengeIntelligenceResponse(BaseModel):
    """AI intelligence result for an existing challenge."""

    challenge_id: int

    analysis: ProblemAnalysisResponse

    possible_duplicates: list[DuplicateChallenge]

    duplicate_count: int


class PriorityFactor(BaseModel):
    """One explainable factor contributing to a priority score."""

    label: str
    detail: str
    weight: float


class PriorityResponse(BaseModel):
    """Explainable priority assessment for one challenge.

    IMPORTANT: this is a prototype configurable scoring model, not an
    official government priority policy. AI never makes the final decision.
    """

    challenge_id: int
    priority_score: float = Field(ge=0, le=100)
    priority_level: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    factors: list[PriorityFactor]
    methodology_note: str = (
        "Prototype configurable scoring model — not official government "
        "policy. Weights can be adjusted by the platform administrator."
    )


class ChallengePrioritySummary(BaseModel):
    """Compact priority summary for a dashboard row."""

    challenge_id: int
    title: str
    location: str
    severity: SeverityLevel
    status: str
    priority_score: float = Field(ge=0, le=100)
    priority_level: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    top_factors: list[str]