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
    """Possible duplicate challenge."""

    challenge_id: int
    title: str
    similarity_score: float


class ChallengeIntelligenceResponse(BaseModel):
    """AI intelligence result for an existing challenge."""

    challenge_id: int

    analysis: ProblemAnalysisResponse

    possible_duplicates: list[DuplicateChallenge]

    duplicate_count: int