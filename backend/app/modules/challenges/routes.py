"""Challenge management API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.challenge import Challenge
from app.models.user import User
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.permissions import require_roles
from app.modules.challenges.service import (
    create_challenge,
    delete_challenge,
    get_challenge_by_id,
    get_challenges,
    update_challenge,
)
from app.modules.challenges.state_machine import can_transition
from app.schemas.challenge import (
    ChallengeCreate,
    ChallengeResponse,
    ChallengeStatusUpdate,
    ChallengeUpdate,
)


router = APIRouter()


@router.post(
    "/",
    response_model=ChallengeResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_new_challenge(
    challenge_data: ChallengeCreate,
    current_user: User = Depends(require_roles("citizen", "government")),
    db: Session = Depends(get_db),
) -> Challenge:
    """Create a new societal challenge."""

    return create_challenge(
        db=db,
        challenge_data=challenge_data,
        user_id=current_user.id,
    )


@router.get(
    "/",
    response_model=list[ChallengeResponse],
)
def list_challenges(
    db: Session = Depends(get_db),
) -> list[Challenge]:
    """Return all challenges."""

    return get_challenges(db)


@router.get(
    "/{challenge_id}",
    response_model=ChallengeResponse,
)
def get_challenge(
    challenge_id: int,
    db: Session = Depends(get_db),
) -> Challenge:
    """Return a challenge by ID."""

    challenge = get_challenge_by_id(
        db,
        challenge_id,
    )

    if challenge is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found",
        )

    return challenge


@router.put(
    "/{challenge_id}",
    response_model=ChallengeResponse,
)
def update_existing_challenge(
    challenge_id: int,
    challenge_data: ChallengeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Challenge:
    """Update an existing challenge."""

    challenge = get_challenge_by_id(
        db,
        challenge_id,
    )

    if challenge is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found",
        )

    if challenge.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own challenges",
        )

    return update_challenge(
        db=db,
        challenge=challenge,
        challenge_data=challenge_data,
    )


@router.delete(
    "/{challenge_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_existing_challenge(
    challenge_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Delete an existing challenge."""

    challenge = get_challenge_by_id(
        db,
        challenge_id,
    )

    if challenge is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found",
        )

    if challenge.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own challenges",
        )

    delete_challenge(
        db,
        challenge,
    )


@router.patch(
    "/{challenge_id}/status",
    response_model=ChallengeResponse,
)
def update_challenge_status(
    challenge_id: int,
    status_data: ChallengeStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Challenge:
    """Update the lifecycle status of a challenge according to role."""

    challenge = get_challenge_by_id(
        db,
        challenge_id,
    )

    if challenge is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found",
        )

    # Government handles review and validation.
    if current_user.role == "government":
        allowed_transitions = {
            "SUBMITTED": ["UNDER_REVIEW"],
            "UNDER_REVIEW": ["VALIDATED", "REJECTED"],
        }

    # University handles team formation.
    elif current_user.role == "university":
        allowed_transitions = {
            "VALIDATED": ["TEAM_FORMED"],
        }

    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your role cannot change challenge status",
        )

    allowed_next_statuses = allowed_transitions.get(challenge.status, [])

    if status_data.new_status not in allowed_next_statuses:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"Role '{current_user.role}' cannot transition "
                f"{challenge.status} -> {status_data.new_status}"
            ),
        )

    # Also keep the global state machine as a safety check.
    if not can_transition(
        challenge.status,
        status_data.new_status,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Invalid status transition: "
                f"{challenge.status} -> {status_data.new_status}"
            ),
        )

    challenge.status = status_data.new_status

    db.commit()
    db.refresh(challenge)

    return challenge