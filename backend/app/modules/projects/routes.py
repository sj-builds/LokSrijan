"""Project management API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.project import Project
from app.models.user import User
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.permissions import require_roles
from app.modules.challenges.service import get_challenge_by_id
from app.modules.projects.service import (
    create_project,
    delete_project,
    get_project_by_id,
    get_projects,
    get_projects_by_challenge,
    update_project,
)
from app.modules.projects.state_machine import can_transition
from app.schemas.project import (
    ProjectCreate,
    ProjectResponse,
    ProjectStatusUpdate,
    ProjectUpdate,
)


router = APIRouter()


PROJECT_CREATOR_ROLES = (
    "citizen",
    "university",
    "ngo",
    "industry",
)


@router.post(
    "/",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_new_project(
    project_data: ProjectCreate,
    current_user: User = Depends(
        require_roles(*PROJECT_CREATOR_ROLES),
    ),
    db: Session = Depends(get_db),
) -> Project:
    """Create a solution project for a validated challenge."""

    challenge = get_challenge_by_id(
        db,
        project_data.challenge_id,
    )

    if challenge is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found",
        )

    if challenge.status != "VALIDATED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Projects can only be created "
                "for validated challenges"
            ),
        )

    return create_project(
        db=db,
        project_data=project_data,
        user_id=current_user.id,
    )


@router.get(
    "/",
    response_model=list[ProjectResponse],
)
def list_projects(
    db: Session = Depends(get_db),
) -> list[Project]:
    """Return all projects."""

    return get_projects(db)


@router.get(
    "/challenge/{challenge_id}",
    response_model=list[ProjectResponse],
)
def list_projects_for_challenge(
    challenge_id: int,
    db: Session = Depends(get_db),
) -> list[Project]:
    """Return all projects for a challenge."""

    challenge = get_challenge_by_id(
        db,
        challenge_id,
    )

    if challenge is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found",
        )

    return get_projects_by_challenge(
        db,
        challenge_id,
    )


@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
) -> Project:
    """Return a project by ID."""

    project = get_project_by_id(
        db,
        project_id,
    )

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return project


@router.put(
    "/{project_id}",
    response_model=ProjectResponse,
)
def update_existing_project(
    project_id: int,
    project_data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Project:
    """Update an existing draft project."""

    project = get_project_by_id(
        db,
        project_id,
    )

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    if project.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own projects",
        )

    if project.status != "DRAFT":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft projects can be updated",
        )

    return update_project(
        db=db,
        project=project,
        project_data=project_data,
    )


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_existing_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Delete an existing draft project."""

    project = get_project_by_id(
        db,
        project_id,
    )

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    if project.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own projects",
        )

    if project.status != "DRAFT":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft projects can be deleted",
        )

    delete_project(
        db,
        project,
    )


@router.patch(
    "/{project_id}/status",
    response_model=ProjectResponse,
)
def update_project_status(
    project_id: int,
    status_data: ProjectStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Project:
    """Update the lifecycle status of a project."""

    project = get_project_by_id(
        db,
        project_id,
    )

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    if not can_transition(
        project.status,
        status_data.new_status,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Invalid status transition: "
                f"{project.status} -> {status_data.new_status}"
            ),
        )

    creator_transitions = {
        ("DRAFT", "SUBMITTED"),
        ("APPROVED", "IN_PROGRESS"),
        ("IN_PROGRESS", "COMPLETED"),
    }

    government_transitions = {
        ("SUBMITTED", "UNDER_REVIEW"),
        ("UNDER_REVIEW", "APPROVED"),
        ("UNDER_REVIEW", "REJECTED"),
    }

    transition = (
        project.status,
        status_data.new_status,
    )

    if transition in creator_transitions:
        if project.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Only the project creator can "
                    "perform this status transition"
                ),
            )

    elif transition in government_transitions:
        if current_user.role != "government":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Only government users can "
                    "perform this status transition"
                ),
            )

    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission for this transition",
        )

    project.status = status_data.new_status

    db.commit()
    db.refresh(project)

    return project