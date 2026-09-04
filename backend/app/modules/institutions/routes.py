"""Institution API routes."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.permissions import require_roles
from app.modules.institutions.service import (
    create_institution,
    delete_institution,
    get_institution,
    get_institutions,
    update_institution,
)
from app.schemas.institution import (
    InstitutionCreate,
    InstitutionResponse,
    InstitutionType,
    InstitutionUpdate,
)
from app.modules.institutions.matching import (
    match_institutions_to_challenge,
)
from app.schemas.matching import ChallengeMatchingResponse
from app.models.challenge import Challenge

router = APIRouter()

@router.post(
    "",
    response_model=InstitutionResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("government"))],
)
def create_institution_endpoint(
    data: InstitutionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Create an institution. Government users only."""

    return create_institution(db, data)


@router.get(
    "",
    response_model=list[InstitutionResponse],
)
def list_institutions(
    institution_type: InstitutionType | None = Query(default=None),
    active_only: bool = Query(default=True),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List institutions with optional type filtering."""

    return get_institutions(
        db,
        institution_type=institution_type.value if institution_type else None,
        active_only=active_only,
    )

@router.post(
    "/match/{challenge_id}",
    response_model=ChallengeMatchingResponse,
)
def match_institutions_endpoint(
    challenge_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Find institutions that match a challenge's capabilities."""

    challenge = db.get(Challenge, challenge_id)

    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found",
        )

    return match_institutions_to_challenge(
        db,
        challenge,
    )

@router.get(
    "/{institution_id}",
    response_model=InstitutionResponse,
)
def get_institution_endpoint(
    institution_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get a single institution."""

    institution = get_institution(db, institution_id)

    if not institution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Institution not found",
        )

    return institution


@router.patch(
    "/{institution_id}",
    response_model=InstitutionResponse,
    dependencies=[Depends(require_roles("government"))],
)
def update_institution_endpoint(
    institution_id: int,
    data: InstitutionUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Update an institution. Government users only."""

    institution = get_institution(db, institution_id)

    if not institution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Institution not found",
        )

    return update_institution(db, institution, data)


@router.delete(
    "/{institution_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles("government"))],
)
def delete_institution_endpoint(
    institution_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Deactivate an institution. Government users only."""

    institution = get_institution(db, institution_id)

    if not institution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Institution not found",
        )

    delete_institution(db, institution)