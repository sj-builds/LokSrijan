"""Challenge lifecycle state transition rules."""

from app.schemas.challenge import ChallengeStatus


VALID_TRANSITIONS: dict[str, set[str]] = {
    "SUBMITTED": {
        "UNDER_REVIEW",
    },
    "UNDER_REVIEW": {
        "VALIDATED",
        "REJECTED",
    },
    "VALIDATED": {
        "TEAM_FORMED",
    },
    "TEAM_FORMED": {
        "IN_PROGRESS",
    },
    "IN_PROGRESS": {
        "SOLUTION_PROPOSED",
    },
    "SOLUTION_PROPOSED": {
        "IMPLEMENTED",
    },
    "IMPLEMENTED": {
        "RESOLVED",
    },
    "REJECTED": set(),
    "RESOLVED": set(),
}


def can_transition(
    current_status: str,
    new_status: ChallengeStatus,
) -> bool:
    """Return whether a status transition is allowed."""

    allowed_statuses = VALID_TRANSITIONS.get(
        current_status,
        set(),
    )

    return new_status in allowed_statuses