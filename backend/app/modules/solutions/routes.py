"""Solution passport API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.challenge import Challenge
from app.models.user import User
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.permissions import require_roles
from app.modules.solutions import service
from app.schemas.solution import (
    PassportGenerate,
    PassportUpdate,
    ReplicationResponse,
    SolutionPassportResponse,
)

router = APIRouter()


@router.post(
    "/passports",
    response_model=SolutionPassportResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("university"))],
)
def generate_passport_endpoint(
    data: PassportGenerate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SolutionPassportResponse:
    """Generate a passport draft from a completed project. University only."""

    try:
        passport = service.generate_passport(
            db,
            data.project_id,
            current_user,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    return service.to_response(passport)


@router.get(
    "/passports",
    response_model=list[SolutionPassportResponse],
)
def list_passports_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[SolutionPassportResponse]:
    """Return all solution passports."""

    return [
        service.to_response(passport)
        for passport in service.list_passports(db)
    ]


@router.get(
    "/passports/{passport_id}",
    response_model=SolutionPassportResponse,
)
def get_passport_endpoint(
    passport_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SolutionPassportResponse:
    """Return one solution passport."""

    passport = service.get_passport(db, passport_id)

    if passport is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Passport not found",
        )

    return service.to_response(passport)


@router.patch(
    "/passports/{passport_id}",
    response_model=SolutionPassportResponse,
    dependencies=[Depends(require_roles("university"))],
)
def update_passport_endpoint(
    passport_id: int,
    data: PassportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SolutionPassportResponse:
    """Edit a passport's guidance fields. University only."""

    passport = service.get_passport(db, passport_id)

    if passport is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Passport not found",
        )

    return service.to_response(
        service.update_passport(db, passport, data)
    )


@router.post(
    "/passports/{passport_id}/publish",
    response_model=SolutionPassportResponse,
    dependencies=[Depends(require_roles("university"))],
)
def publish_passport_endpoint(
    passport_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SolutionPassportResponse:
    """Publish a passport for replication. University only."""

    passport = service.get_passport(db, passport_id)

    if passport is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Passport not found",
        )

    try:
        published = service.publish_passport(db, passport)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    return service.to_response(published)


@router.get(
    "/similar",
    response_model=ReplicationResponse,
)
def similar_passports_endpoint(
    challenge_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReplicationResponse:
    """Score published passports against a challenge (replication)."""

    challenge = db.get(Challenge, challenge_id)

    if challenge is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found",
        )

    return service.similar_passports(db, challenge)