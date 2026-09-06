"""Team API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.auth.dependencies import get_current_user
from app.models.challenge import Challenge
from app.modules.challenges.state_machine import can_transition
from app.modules.teams import service
from app.schemas.team import TeamCreate, TeamResponse, TeamUpdate

router = APIRouter(tags=["Teams"])

@router.get("/", response_model=list[TeamResponse])
def list_teams(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List all student teams."""
    return service.list_teams(db)


@router.get("/{team_id}", response_model=TeamResponse)
def get_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get a student team."""
    team = service.get_team(db, team_id)

    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )

    return team


@router.post(
    "/",
    response_model=TeamResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_team(
    team_data: TeamCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Create a student team and form the linked challenge team."""

    if current_user.role != "university":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only university users can create teams",
        )

    # If a challenge is selected, it must be validated first.
    if team_data.challenge_id is not None:
        challenge = (
            db.query(Challenge)
            .filter(Challenge.id == team_data.challenge_id)
            .first()
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
                    "A team can only be formed for a validated challenge"
                ),
            )

        if not can_transition(
            challenge.status,
            "TEAM_FORMED",
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid challenge transition to TEAM_FORMED",
            )

    team = service.create_team(
        db=db,
        team_data=team_data,
        created_by=current_user.id,
    )

    # Move the linked challenge into TEAM_FORMED.
    if team_data.challenge_id is not None:
        challenge.status = "TEAM_FORMED"

        db.commit()
        db.refresh(team)

    return team

@router.patch("/{team_id}", response_model=TeamResponse)
def update_team(
    team_id: int,
    team_data: TeamUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Update a student team."""
    team = service.get_team(db, team_id)

    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )

    if (
        current_user.role != "university"
        or team.created_by != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update this team",
        )

    return service.update_team(
        db=db,
        team=team,
        team_data=team_data,
    )


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Delete a student team."""
    team = service.get_team(db, team_id)

    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )

    if (
        current_user.role != "university"
        or team.created_by != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this team",
        )

    service.delete_team(db, team)