"""Impact API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.project import Project
from app.modules.auth.dependencies import get_current_user
from app.modules.impact.service import (
    create_impact,
    get_impact,
    update_impact,
)
from app.schemas.impact import (
    ImpactCreate,
    ImpactResponse,
    ImpactUpdate,
)

router = APIRouter()


@router.post(
    "",
    response_model=ImpactResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_impact_endpoint(
    data: ImpactCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Record measurable impact for a project."""

    project = db.get(Project, data.project_id)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    existing = get_impact(db, data.project_id)

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Impact already exists for this project",
        )

    return create_impact(db, data)


@router.get(
    "/{project_id}",
    response_model=ImpactResponse,
)
def get_impact_endpoint(
    project_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get impact for a project."""

    impact = get_impact(db, project_id)

    if not impact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Impact record not found",
        )

    return impact


@router.patch(
    "/{project_id}",
    response_model=ImpactResponse,
)
def update_impact_endpoint(
    project_id: int,
    data: ImpactUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Update project impact."""

    impact = get_impact(db, project_id)

    if not impact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Impact record not found",
        )

    return update_impact(db, impact, data)