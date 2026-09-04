"""AI problem intelligence API routes."""

from fastapi import APIRouter, Depends

from app.models.user import User
from app.modules.auth.dependencies import get_current_user
from app.modules.intelligence.service import (
    analyze_problem,
    calculate_similarity,
)
from app.schemas.intelligence import (
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