"""Business logic for challenge management."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.challenge import Challenge
from app.schemas.challenge import (
    ChallengeCreate,
    ChallengeUpdate,
)


def create_challenge(
    db: Session,
    challenge_data: ChallengeCreate,
    user_id: int,
) -> Challenge:
    """Create and store a new challenge."""

    challenge = Challenge(
        title=challenge_data.title,
        description=challenge_data.description,
        category=challenge_data.category,
        location=challenge_data.location,
        severity=challenge_data.severity,
        urgency=challenge_data.urgency,
        status="SUBMITTED",
        created_by=user_id,
    )

    db.add(challenge)
    db.commit()
    db.refresh(challenge)

    return challenge


def get_challenge_by_id(
    db: Session,
    challenge_id: int,
) -> Challenge | None:
    """Return a challenge by ID."""

    return db.get(Challenge, challenge_id)


def get_challenges(
    db: Session,
) -> list[Challenge]:
    """Return all challenges."""

    statement = select(Challenge).order_by(
        Challenge.created_at.desc()
    )

    return list(db.scalars(statement).all())


def update_challenge(
    db: Session,
    challenge: Challenge,
    challenge_data: ChallengeUpdate,
) -> Challenge:
    """Update editable challenge fields."""

    update_data = challenge_data.model_dump(
        exclude_unset=True,
    )

    for field, value in update_data.items():
        if value is not None:
            setattr(challenge, field, value)

    db.commit()
    db.refresh(challenge)

    return challenge


def delete_challenge(
    db: Session,
    challenge: Challenge,
) -> None:
    """Delete a challenge."""

    db.delete(challenge)
    db.commit()