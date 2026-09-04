"""Institution matching service."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.challenge import Challenge
from app.models.institution import Institution
from app.modules.intelligence.service import analyze_problem
from app.schemas.matching import (
    ChallengeMatchingResponse,
    InstitutionMatch,
)


def _normalize_capability(value: str) -> str:
    """Normalize a capability for comparison."""

    return " ".join(value.lower().strip().split())


def _capability_matches(
    required: str,
    available: str,
) -> bool:
    """Check whether two capabilities are sufficiently similar."""

    required_normalized = _normalize_capability(required)
    available_normalized = _normalize_capability(available)

    if required_normalized == available_normalized:
        return True

    if required_normalized in available_normalized:
        return True

    if available_normalized in required_normalized:
        return True

    required_words = set(required_normalized.split())
    available_words = set(available_normalized.split())

    if not required_words or not available_words:
        return False

    overlap = required_words.intersection(available_words)

    return len(overlap) / len(required_words) >= 0.5


def _parse_institution_capabilities(
    capabilities: str,
) -> list[str]:
    """Parse comma/semicolon/newline separated capabilities."""

    return [
        item.strip()
        for item in capabilities.replace(";", ",").split(",")
        if item.strip()
    ]


def match_institutions_to_challenge(
    db: Session,
    challenge: Challenge,
) -> ChallengeMatchingResponse:
    """Analyze a challenge and rank institutions by capability match."""

    analysis = analyze_problem(challenge.description)

    required_capabilities = analysis.required_capabilities

    institutions = list(
        db.scalars(
            select(Institution).where(
                Institution.is_active.is_(True)
            )
        ).all()
    )

    matches: list[InstitutionMatch] = []

    for institution in institutions:
        institution_capabilities = _parse_institution_capabilities(
            institution.capabilities
        )

        matched_capabilities: list[str] = []

        for required in required_capabilities:
            if any(
                _capability_matches(required, available)
                for available in institution_capabilities
            ):
                matched_capabilities.append(required)

        if required_capabilities:
            score = (
                len(matched_capabilities)
                / len(required_capabilities)
            ) * 100
        else:
            score = 0.0

        if matched_capabilities:
            matches.append(
                InstitutionMatch(
                    institution_id=institution.id,
                    institution_name=institution.name,
                    institution_type=institution.institution_type,
                    location=institution.location,
                    matched_capabilities=matched_capabilities,
                    match_score=round(score, 2),
                )
            )

    matches.sort(
        key=lambda match: match.match_score,
        reverse=True,
    )

    return ChallengeMatchingResponse(
        challenge_id=challenge.id,
        challenge_title=challenge.title,
        required_capabilities=required_capabilities,
        matches=matches,
    )