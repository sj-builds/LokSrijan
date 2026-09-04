"""Institution matching API schemas."""

from pydantic import BaseModel, Field


class InstitutionMatch(BaseModel):
    """A ranked institution match."""

    institution_id: int
    institution_name: str
    institution_type: str
    location: str
    matched_capabilities: list[str]
    match_score: float = Field(ge=0, le=100)


class ChallengeMatchingResponse(BaseModel):
    """Institution matching results for a challenge."""

    challenge_id: int
    challenge_title: str
    required_capabilities: list[str]
    matches: list[InstitutionMatch]