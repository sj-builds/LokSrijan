"""AI problem intelligence API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.challenge import Challenge
from app.models.user import User
from app.modules.auth.dependencies import get_current_user
from app.modules.intelligence.service import (
    analyze_challenge_intelligence,
    analyze_problem,
    calculate_priority,
    calculate_similarity,
    priority_summaries,
)
from app.schemas.intelligence import (
    ChallengeIntelligenceResponse,
    ChallengePrioritySummary,
    PriorityResponse,
    ProblemAnalysisRequest,
    ProblemAnalysisResponse,
    SimilarityRequest,
    SimilarityResponse,
)

router = APIRouter()


@router.post(
    "/analyze",
    response_model=ProblemAnalysisResponse,
)
def analyze_problem_endpoint(
    request: ProblemAnalysisRequest,
    current_user: User = Depends(get_current_user),
) -> ProblemAnalysisResponse:
    """Analyze a societal problem using AI."""

    return analyze_problem(
        request.description,
    )


@router.post(
    "/similarity",
    response_model=SimilarityResponse,
)
def calculate_similarity_endpoint(
    request: SimilarityRequest,
    current_user: User = Depends(get_current_user),
) -> SimilarityResponse:
    """Compare two problem descriptions."""

    return calculate_similarity(
        text_a=request.text_a,
        text_b=request.text_b,
    )

@router.post(
    "/challenges/{challenge_id}/analyze",
    response_model=ChallengeIntelligenceResponse,
)
def analyze_existing_challenge(
    challenge_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ChallengeIntelligenceResponse:
    """Analyze an existing challenge and detect duplicates."""

    challenge = db.get(
        Challenge,
        challenge_id,
    )

    if challenge is None:
        raise HTTPException(
            status_code=404,
            detail="Challenge not found",
        )

    return analyze_challenge_intelligence(
        db=db,
        challenge=challenge,
    )


@router.post(
    "/challenges/{challenge_id}/priority",
    response_model=PriorityResponse,
)
def challenge_priority(
    challenge_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PriorityResponse:
    """Explainable priority score for one challenge.

    Prototype configurable scoring model — not official policy.
    """

    challenge = db.get(
        Challenge,
        challenge_id,
    )

    if challenge is None:
        raise HTTPException(
            status_code=404,
            detail="Challenge not found",
        )

    return calculate_priority(
        db=db,
        challenge=challenge,
    )


@router.get(
    "/priorities",
    response_model=list[ChallengePrioritySummary],
)
def all_challenge_priorities(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ChallengePrioritySummary]:
    """Priority summary for every challenge (government dashboard)."""

    return priority_summaries(db)