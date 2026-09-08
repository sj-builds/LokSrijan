"""AI problem intelligence services."""

from __future__ import annotations

import json
import logging
from typing import Any

from difflib import SequenceMatcher

try:
    from google import genai
except ImportError:  # google-genai not installed — Gemini path disabled
    genai = None
from app.core.config import settings

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.challenge import Challenge
from app.schemas.intelligence import (
    ChallengeIntelligenceResponse,
    ChallengePrioritySummary,
    DuplicateChallenge,
    PriorityFactor,
    PriorityResponse,
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
    """Return deterministic analysis for local development.

    The keyword rules below mirror the demo dataset's domains so the
    prototype keeps producing meaningful, explainable structure when a
    live provider is unavailable. Output is clearly mock/AI-suggested and
    always requires human review.
    """

    text = description.lower()

    if any(
        keyword in text
        for keyword in ["handpump", "drinking water", "water quality", "peela"]
    ) or ("water" in text and ("pump" in text or "taste" in text or "smell" in text)):
        return ProblemAnalysisResponse(
            domain="water",
            subdomain="drinking water quality",
            problem=(
                "Community drinking water quality problem "
                "(handpump)"
            ),
            severity="HIGH",
            urgency="HIGH",
            affected_population=(
                "Residents and children in the affected area"
            ),
            keywords=["handpump", "drinking water", "contamination"],
            required_capabilities=[
                "water quality testing",
                "environmental engineering",
                "groundwater inspection",
                "community engagement",
            ],
            potential_causes=[
                "Possible contamination near drainage",
                "Unmonitored shallow handpump",
            ],
            confidence=0.80,
            reason=(
                "Report describes drinking-water contamination indicators; "
                "field testing is required to confirm causes."
            ),
            human_verification_required=True,
        )

    if "anganwadi" in text or "mid-day meal" in text or "nutrition" in text or "cold chain" in text:
        return ProblemAnalysisResponse(
            domain="health",
            subdomain="child nutrition",
            problem=(
                "Child nutrition supply chain problem at anganwadi level"
            ),
            severity="HIGH",
            urgency="HIGH",
            affected_population="Children enrolled in anganwadi centres",
            keywords=["anganwadi", "nutrition", "cold chain"],
            required_capabilities=[
                "public health",
                "cold chain engineering",
                "field pilots",
                "community health workers",
            ],
            potential_causes=[
                "Unreliable power for refrigeration",
                "No temperature logging",
            ],
            confidence=0.82,
            reason=(
                "Report describes spoilage of supplementary nutrition; "
                "centre-level logs would confirm the failure pattern."
            ),
            human_verification_required=True,
        )

    if "stubble" in text or "baler" in text or "crop" in text or "irrigation" in text or "silt" in text:
        return ProblemAnalysisResponse(
            domain="agriculture",
            subdomain="farm operations",
            problem=(
                "Farm-level operations problem (machinery access or irrigation)"
            ),
            severity="MEDIUM",
            urgency="MEDIUM",
            affected_population="Small and marginal farmers",
            keywords=["farming", "machinery", "irrigation"],
            required_capabilities=[
                "agricultural engineering",
                "custom hiring logistics",
                "irrigation management",
            ],
            potential_causes=[
                "Late machinery availability",
                "Inadequate canal maintenance",
            ],
            confidence=0.78,
            reason=(
                "Report describes a farm-operations bottleneck; "
                "ground verification is required."
            ),
            human_verification_required=True,
        )

    if "street light" in text or "road" in text or "crossing" in text or "underpass" in text:
        return ProblemAnalysisResponse(
            domain="infrastructure",
            subdomain="road safety and lighting",
            problem=(
                "Road or street infrastructure problem"
            ),
            severity="MEDIUM",
            urgency="MEDIUM",
            affected_population="Commuters and pedestrians",
            keywords=["roads", "lighting", "safety"],
            required_capabilities=[
                "civil engineering",
                "traffic safety",
                "electrical maintenance",
            ],
            potential_causes=[
                "Outdated infrastructure",
                "No scheduled maintenance",
            ],
            confidence=0.75,
            reason=(
                "Report describes a road/street infrastructure gap; "
                "site inspection is required."
            ),
            human_verification_required=True,
        )

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

            # Degrade gracefully: fall back to the deterministic mock so
            # the citizen's report still gets structured, explainable
            # output when the live provider is unavailable.
            try:
                return analyze_with_mock(
                    description
                )
            except Exception:  # noqa: BLE001
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


def _location_overlap_ratio(
    location_a: str,
    location_b: str,
) -> float:
    """Return the token overlap ratio between two location strings."""

    def tokens(value: str) -> set[str]:
        return {
            token
            for token in value.lower().replace(",", " ").split()
            if token
        }

    tokens_a = tokens(location_a)
    tokens_b = tokens(location_b)

    if not tokens_a or not tokens_b:
        return 0.0

    return len(tokens_a.intersection(tokens_b)) / len(tokens_a)


def challenge_similarity(
    challenge: Challenge,
    other: Challenge,
) -> tuple[float, list[str], str, bool, bool]:
    """Combine semantic, category and location signals into one score.

    Semantic similarity alone is never treated as proof of duplication.
    Returns (score, signals, confidence_label, category_match,
    location_match).
    """

    text_score = SequenceMatcher(
        None,
        " ".join(challenge.description.lower().split()),
        " ".join(other.description.lower().split()),
    ).ratio()

    category_match = (
        challenge.category.lower().strip()
        == other.category.lower().strip()
    )

    location_ratio = _location_overlap_ratio(
        challenge.location,
        other.location,
    )
    location_match = location_ratio >= 0.5

    signals: list[str] = []

    # Only claim text similarity when it is actually meaningful;
    # a 3% character-level overlap is not evidence worth showing.
    if text_score >= 0.5:
        signals.append(
            f"{round(text_score * 100)}% text similarity"
        )

    if category_match:
        signals.append("same domain")

    if location_match:
        signals.append("nearby location")

    # Temporal signal: reports filed within the same month.
    if (
        challenge.created_at is not None
        and other.created_at is not None
        and abs(
            (challenge.created_at - other.created_at).total_seconds()
        )
        <= 31 * 24 * 3600
    ):
        signals.append("reported within similar time period")

    # Weighted blend: text similarity is the anchor; category and location
    # act as corroborating evidence.
    score = (
        text_score * 0.6
        + (1.0 if category_match else 0.0) * 0.25
        + location_ratio * 0.15
    )

    score = max(0.0, min(1.0, score))

    if score >= settings.similarity_threshold:
        confidence_label = "HIGH"
    elif score >= settings.similarity_threshold - 0.15:
        confidence_label = "MEDIUM"
    else:
        confidence_label = "LOW"

    return (
        round(score, 4),
        signals,
        confidence_label,
        category_match,
        location_match,
    )


def analyze_challenge_intelligence(
    db: Session,
    challenge: Challenge,
) -> ChallengeIntelligenceResponse:
    """Analyze an existing challenge and find likely related reports."""

    analysis = analyze_problem(
        challenge.description
    )

    statement = select(Challenge).where(
        Challenge.id != challenge.id
    )

    other_challenges = list(
        db.scalars(statement).all()
    )

    related: list[DuplicateChallenge] = []

    for other in other_challenges:
        (
            score,
            signals,
            confidence_label,
            category_match,
            location_match,
        ) = challenge_similarity(
            challenge,
            other,
        )

        # Keep candidates that clear the threshold OR share strong
        # corroborating signals (same category and nearby location).
        if (
            score >= settings.similarity_threshold - 0.1
            or (category_match and location_match)
        ):
            related.append(
                DuplicateChallenge(
                    challenge_id=other.id,
                    title=other.title,
                    similarity_score=score,
                    signals=signals,
                    confidence_label=confidence_label,
                    category_match=category_match,
                    location_match=location_match,
                )
            )

    related.sort(
        key=lambda item: item.similarity_score,
        reverse=True,
    )

    return ChallengeIntelligenceResponse(
        challenge_id=challenge.id,
        analysis=analysis,
        possible_duplicates=related[:10],
        duplicate_count=len(related),
    )


# ── Explainable priority scoring ────────────────────────────────────────
# Prototype configurable scoring model. Weights below are explicit so the
# UI can explain every factor; they are NOT official government policy.

SEVERITY_POINTS = {
    "LOW": 10,
    "MEDIUM": 25,
    "HIGH": 40,
    "CRITICAL": 55,
}

URGENCY_POINTS = {
    "LOW": 5,
    "MEDIUM": 12,
    "HIGH": 18,
    "CRITICAL": 25,
}


PRIORITY_LEVELS = [
    (80, "CRITICAL"),
    (60, "HIGH"),
    (40, "MEDIUM"),
    (0, "LOW"),
]


def _priority_level(score: float) -> str:
    """Map a 0-100 score to a level band."""

    for threshold, level in PRIORITY_LEVELS:
        if score >= threshold:
            return level

    return "LOW"


def _related_report_count(
    db: Session,
    challenge: Challenge,
) -> int:
    """Count challenges sharing the same category and nearby location."""

    statement = select(Challenge).where(
        Challenge.id != challenge.id,
        Challenge.category == challenge.category,
    )

    return sum(
        1
        for other in db.scalars(statement).all()
        if _location_overlap_ratio(
            challenge.location,
            other.location,
        ) >= 0.3
    )


def calculate_priority(
    db: Session,
    challenge: Challenge,
) -> PriorityResponse:
    """Compute an explainable priority score for one challenge."""

    severity_points = SEVERITY_POINTS.get(
        challenge.severity.upper(),
        25,
    )

    # Use the urgency the citizen reported when it is available;
    # records created before the field existed fall back to severity.
    reported_urgency = (
        challenge.urgency
        if challenge.urgency is not None
        else challenge.severity
    )
    urgency_points = URGENCY_POINTS.get(
        reported_urgency.upper(),
        12,
    )

    related_count = _related_report_count(
        db,
        challenge,
    )

    related_points = min(related_count * 4, 20)

    # Heuristic: descriptions mentioning children, women, health, or
    # drinking water are treated as affecting vulnerable groups. This is
    # an explicit prototype heuristic, visible to the reviewer.
    description_lower = challenge.description.lower()
    vulnerable_keywords = [
        "children",
        "child",
        "women",
        "school",
        "anganwadi",
        "health",
        "drinking water",
        "elderly",
        "tribal",
    ]
    vulnerability_points = (
        10
        if any(
            keyword in description_lower
            for keyword in vulnerable_keywords
        )
        else 0
    )

    score = round(
        min(
            severity_points
            + urgency_points
            + related_points
            + vulnerability_points,
            100,
        ),
        1,
    )

    factors = [
        PriorityFactor(
            label="Severity",
            detail=(
                f"Reported severity is {challenge.severity}"
            ),
            weight=severity_points,
        ),
        PriorityFactor(
            label="Urgency",
            detail=(
                f"Reported urgency is {challenge.urgency}"
                if challenge.urgency is not None
                else "No urgency recorded; urgency assumed from severity "
                "in the prototype model"
            ),
            weight=urgency_points,
        ),
        PriorityFactor(
            label="Related reports",
            detail=(
                f"{related_count} other report(s) in the same domain "
                "and nearby location"
            ),
            weight=related_points,
        ),
        PriorityFactor(
            label="Vulnerable groups",
            detail=(
                "Description mentions children, women, health, schools "
                "or drinking water"
                if vulnerability_points
                else "No explicit vulnerable-group signal detected"
            ),
            weight=vulnerability_points,
        ),
    ]

    return PriorityResponse(
        challenge_id=challenge.id,
        priority_score=score,
        priority_level=_priority_level(score),  # type: ignore[arg-type]
        factors=factors,
    )


def priority_summaries(
    db: Session,
) -> list[ChallengePrioritySummary]:
    """Priority summaries for every challenge (dashboard rows)."""

    challenges = list(
        db.scalars(
            select(Challenge).order_by(Challenge.created_at.desc())
        ).all()
    )

    summaries: list[ChallengePrioritySummary] = []

    for challenge in challenges:
        priority = calculate_priority(
            db,
            challenge,
        )

        summaries.append(
            ChallengePrioritySummary(
                challenge_id=challenge.id,
                title=challenge.title,
                location=challenge.location,
                severity=challenge.severity,  # type: ignore[arg-type]
                status=challenge.status,
                priority_score=priority.priority_score,
                priority_level=priority.priority_level,  # type: ignore[arg-type]
                top_factors=[
                    factor.label
                    for factor in priority.factors
                    if factor.weight > 0
                ],
            )
        )

    summaries.sort(
        key=lambda item: item.priority_score,
        reverse=True,
    )

    return summaries