"""Solution passport business logic and replication engine.

A passport is generated deterministically from a completed project and
its impact ledger — nothing is fabricated. The team edits the guidance
fields (root cause, technology, costs, limitations, replication
suitability) and publishes it. Only PUBLISHED passports feed the
replication engine, which scores a new challenge against each passport
and explains every match.
"""

from difflib import SequenceMatcher

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.challenge import Challenge
from app.models.impact import Impact
from app.models.project import Project
from app.models.solution import SolutionPassport
from app.models.user import User
from app.modules.intelligence.service import _location_overlap_ratio
from app.schemas.solution import (
    PassportUpdate,
    ReplicationMatch,
    ReplicationResponse,
    SolutionPassportResponse,
)

# Text similarity above this is considered a meaningful problem overlap.
TEXT_SIMILARITY_THRESHOLD = 0.45


def generate_passport(
    db: Session,
    project_id: int,
    user: User,
) -> SolutionPassport:
    """Generate a passport draft from a completed project + impact ledger."""

    project = db.get(Project, project_id)

    if project is None:
        raise ValueError("Project not found")

    existing = db.scalar(
        select(SolutionPassport).where(
            SolutionPassport.project_id == project_id
        )
    )

    if existing is not None:
        raise ValueError("A passport already exists for this project")

    challenge = db.get(Challenge, project.challenge_id)

    if challenge is None:
        raise ValueError("Linked challenge not found")

    impact = db.scalar(
        select(Impact).where(Impact.project_id == project_id)
    )

    if impact is None:
        raise ValueError(
            "Record measurable impact for this project before generating "
            "a passport"
        )

    passport = SolutionPassport(
        project_id=project.id,
        challenge_id=challenge.id,
        title=f"Reusable solution: {project.title}",
        category=challenge.category,
        location=challenge.location,
        # Deterministic snapshots — never fabricated.
        problem=challenge.description,
        solution=project.solution_summary,
        metric_name=impact.metric_name,
        baseline_value=impact.baseline_value,
        actual_value=impact.actual_value,
        unit=impact.unit,
        improvement_pct=impact.improvement_pct,
        evidence=impact.evidence,
        impact_verification_status=impact.verification_status,
        impact_verification_note=impact.verification_note,
        status="DRAFT",
        created_by=user.id,
    )

    db.add(passport)
    db.commit()
    db.refresh(passport)

    return passport


def get_passport(
    db: Session,
    passport_id: int,
) -> SolutionPassport | None:
    """Return one passport."""

    return db.get(SolutionPassport, passport_id)


def list_passports(db: Session) -> list[SolutionPassport]:
    """Return all passports, most recently updated first."""

    return list(
        db.scalars(
            select(SolutionPassport).order_by(
                SolutionPassport.updated_at.desc()
            )
        ).all()
    )


def update_passport(
    db: Session,
    passport: SolutionPassport,
    data: PassportUpdate,
) -> SolutionPassport:
    """Edit editable passport fields."""

    updates = data.model_dump(exclude_unset=True)

    for field, value in updates.items():
        if value is not None:
            setattr(passport, field, value)

    db.commit()
    db.refresh(passport)

    return passport


def publish_passport(
    db: Session,
    passport: SolutionPassport,
) -> SolutionPassport:
    """Publish a passport so it can feed replication matching."""

    if passport.status == "PUBLISHED":
        raise ValueError("Passport is already published")

    passport.status = "PUBLISHED"

    db.commit()
    db.refresh(passport)

    return passport


def similar_passports(
    db: Session,
    challenge: Challenge,
) -> ReplicationResponse:
    """Score published passports against a new challenge.

    Score = problem text similarity (anchor) + domain match + location
    overlap. Every match carries human-readable reasons and the passport's
    honest impact verification status.
    """

    passports = list(
        db.scalars(
            select(SolutionPassport).where(
                SolutionPassport.status == "PUBLISHED"
            )
        ).all()
    )

    matches: list[ReplicationMatch] = []

    for passport in passports:
        text_score = SequenceMatcher(
            None,
            " ".join(challenge.description.lower().split()),
            " ".join(passport.problem.lower().split()),
        ).ratio()

        category_match = (
            challenge.category.lower().strip()
            == passport.category.lower().strip()
        )

        location_ratio = _location_overlap_ratio(
            challenge.location,
            passport.location,
        )

        score = (
            text_score * 0.45
            + (1.0 if category_match else 0.0) * 0.30
            + location_ratio * 0.25
        )

        score = max(0.0, min(1.0, score))

        # Only surface candidates with at least one meaningful signal.
        if score < 0.35 and not category_match:
            continue

        reasons: list[str] = []

        if text_score >= TEXT_SIMILARITY_THRESHOLD:
            reasons.append(
                f"{round(text_score * 100)}% problem similarity"
            )

        if category_match:
            reasons.append("same domain")

        if location_ratio >= 0.5:
            reasons.append("similar location")

        if passport.pilot_conditions:
            reasons.append("implementation conditions documented")

        reasons.append(
            f"impact verification: {passport.impact_verification_status.lower()}"
        )

        matches.append(
            ReplicationMatch(
                passport_id=passport.id,
                passport_title=passport.title,
                project_title=(
                    passport.project.title
                    if passport.project is not None
                    else f"Project #{passport.project_id}"
                ),
                challenge_title=(
                    passport.challenge.title
                    if passport.challenge is not None
                    else f"Challenge #{passport.challenge_id}"
                ),
                match_score=round(score * 100, 1),
                reasons=reasons,
                impact_verification_status=passport.impact_verification_status,
            )
        )

    matches.sort(
        key=lambda item: item.match_score,
        reverse=True,
    )

    return ReplicationResponse(
        challenge_id=challenge.id,
        challenge_title=challenge.title,
        matches=matches[:5],
    )


def to_response(passport: SolutionPassport) -> SolutionPassportResponse:
    """Build the API response shape from the ORM object."""

    return SolutionPassportResponse.model_validate(passport)