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
    calculate_similarity,
)
from app.schemas.intelligence import (
    ChallengeIntelligenceResponse,
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