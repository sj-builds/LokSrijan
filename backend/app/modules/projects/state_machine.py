"""Project lifecycle state transition rules."""

from app.schemas.project import ProjectStatus


VALID_TRANSITIONS: dict[str, set[str]] = {
    "DRAFT": {
        "SUBMITTED",
    },
    "SUBMITTED": {
        "UNDER_REVIEW",
    },
    "UNDER_REVIEW": {
        "APPROVED",
        "REJECTED",
    },
    "APPROVED": {
        "IN_PROGRESS",
    },
    "IN_PROGRESS": {
        "COMPLETED",
    },
    "REJECTED": set(),
    "COMPLETED": set(),
}


def can_transition(
    current_status: str,
    new_status: ProjectStatus,
) -> bool:
    """Return whether a project status transition is allowed."""

    allowed_statuses = VALID_TRANSITIONS.get(
        current_status,
        set(),
    )

    return new_status in allowed_statuses