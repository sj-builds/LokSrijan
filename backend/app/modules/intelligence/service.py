"""AI problem intelligence services."""

from __future__ import annotations

import json
import logging
from typing import Any

from google import genai

from difflib import SequenceMatcher
from app.core.config import settings

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.challenge import Challenge
from app.schemas.intelligence import (
    ChallengeIntelligenceResponse,
    DuplicateChallenge,
    ProblemAnalysisResponse,
    SimilarityResponse,
)

logger = logging.getLogger(__name__)


ANALYSIS_PROMPT = """
You are an AI system that analyzes a citizen's societal problem.

Return ONLY valid JSON.

Analyze the problem using exactly these fields:

- domain: broad problem area such as water, education,
  healthcare, sanitation, agriculture, roads, environment.
- subdomain: more specific area.
- problem: concise description of the actual problem.
- severity: LOW, MEDIUM, HIGH, or CRITICAL.
- urgency: LOW, MEDIUM, HIGH, or CRITICAL.
- affected_population: who is affected.
- keywords: important words or phrases.
- required_capabilities: skills, departments, technologies,
  or expertise that could help solve the problem.
- potential_causes: possible causes; do not state guesses as facts.
- confidence: number from 0 to 1.
- reason: brief explanation of the classification.
- human_verification_required: boolean.

Citizen problem:
"""


def _fallback_analysis() -> ProblemAnalysisResponse:
    """Return a safe fallback when AI is unavailable."""

    return ProblemAnalysisResponse(
        domain="unknown",
        subdomain="unknown",
        problem="Problem requires manual analysis",
        severity="MEDIUM",
        urgency="MEDIUM",
        affected_population="Unknown",
        keywords=[],
        required_capabilities=[],
        potential_causes=[],
        confidence=0.0,
        reason="AI analysis was unavailable.",
        human_verification_required=True,
    )


def analyze_with_mock(
    description: str,
) -> ProblemAnalysisResponse:
    """Return deterministic analysis for local development."""

    text = description.lower()

    if "water" in text or "pipeline" in text or "leak" in text:
        return ProblemAnalysisResponse(
            domain="water",
            subdomain="water supply",
            problem="Water supply or pipeline problem",
            severity="HIGH",
            urgency="HIGH",
            affected_population="Residents in the affected area",
            keywords=[
                "water",
                "pipeline",
                "supply",
            ],
            required_capabilities=[
                "water infrastructure",
                "maintenance",
                "monitoring",
            ],
            potential_causes=[
                "Infrastructure damage",
                "Leakage",
            ],
            confidence=0.90,
            reason=(
                "The complaint contains strong indicators "
                "of a water infrastructure problem."
            ),
            human_verification_required=False,
        )

    return ProblemAnalysisResponse(
        domain="general",
        subdomain="community issue",
        problem=description[:200],
        severity="MEDIUM",
        urgency="MEDIUM",
        affected_population=(
            "Residents or community members"
        ),
        keywords=[],
        required_capabilities=[],
        potential_causes=[],
        confidence=0.70,
        reason="Basic local mock analysis was used.",
        human_verification_required=False,
    )


def analyze_with_gemini(
    description: str,
) -> ProblemAnalysisResponse:
    """Analyze a problem using Gemini."""

    if not settings.ai_api_key:
        raise ValueError(
            "AI_API_KEY is not configured."
        )

    client = genai.Client(
        api_key=settings.ai_api_key,
    )

    response = client.models.generate_content(
        model=settings.ai_text_model,
        contents=ANALYSIS_PROMPT + "\n" + description,
        config={
            "response_mime_type": "application/json",
        },
    )

    if not response.text:
        raise ValueError(
            "Gemini returned an empty response."
        )

    data: dict[str, Any] = json.loads(
        response.text
    )

    result = ProblemAnalysisResponse.model_validate(
        data
    )

    result.human_verification_required = (
        result.confidence
        < settings.ai_confidence_threshold
    )

    return result


def analyze_problem(
    description: str,
) -> ProblemAnalysisResponse:
    """Analyze a problem using the configured provider."""

    provider = settings.ai_provider.lower().strip()

    if provider == "gemini":
        try:
            return analyze_with_gemini(
                description
            )

        except Exception as error:
            logger.exception(
                "Gemini analysis failed: %s",
                error,
            )

            return _fallback_analysis()

    return analyze_with_mock(
        description
    )

def calculate_similarity(
    text_a: str,
    text_b: str,
) -> SimilarityResponse:
    """Calculate basic similarity between two problem descriptions."""

    normalized_a = " ".join(
        text_a.lower().split()
    )

    normalized_b = " ".join(
        text_b.lower().split()
    )

    similarity_score = SequenceMatcher(
        None,
        normalized_a,
        normalized_b,
    ).ratio()

    return SimilarityResponse(
        similarity_score=round(
            similarity_score,
            4,
        ),
        is_possible_duplicate=(
            similarity_score
            >= settings.similarity_threshold
        ),
    )

def analyze_challenge_intelligence(
    db: Session,
    challenge: Challenge,
) -> ChallengeIntelligenceResponse:
    """Analyze an existing challenge and find possible duplicates."""

    analysis = analyze_problem(
        challenge.description
    )

    statement = select(Challenge).where(
        Challenge.id != challenge.id
    )

    other_challenges = list(
        db.scalars(statement).all()
    )

    duplicates: list[DuplicateChallenge] = []

    for other in other_challenges:
        similarity = calculate_similarity(
            challenge.description,
            other.description,
        )

        if similarity.is_possible_duplicate:
            duplicates.append(
                DuplicateChallenge(
                    challenge_id=other.id,
                    title=other.title,
                    similarity_score=(
                        similarity.similarity_score
                    ),
                )
            )

    duplicates.sort(
        key=lambda item: item.similarity_score,
        reverse=True,
    )

    return ChallengeIntelligenceResponse(
        challenge_id=challenge.id,
        analysis=analysis,
        possible_duplicates=duplicates,
        duplicate_count=len(duplicates),
    )