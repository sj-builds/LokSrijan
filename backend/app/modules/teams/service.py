"""Team service layer."""

import secrets
import string

from sqlalchemy.orm import Session

from app.models.team import Team
from app.schemas.team import TeamCreate, TeamUpdate


def _generate_team_code(db: Session) -> str:
    """Generate a unique team code."""
    alphabet = string.ascii_uppercase + string.digits

    while True:
        code = "TEAM-" + "".join(secrets.choice(alphabet) for _ in range(6))

        existing = db.query(Team).filter(Team.code == code).first()
        if not existing:
            return code


def list_teams(db: Session) -> list[Team]:
    """Return all student teams."""
    return db.query(Team).order_by(Team.created_at.desc()).all()


def get_team(db: Session, team_id: int) -> Team | None:
    """Return a team by ID."""
    return db.query(Team).filter(Team.id == team_id).first()


def create_team(
    db: Session,
    team_data: TeamCreate,
    created_by: int,
) -> Team:
    """Create a new student team."""
    team = Team(
        code=_generate_team_code(db),
        name=team_data.name,
        department=team_data.department,
        mentor=team_data.mentor,
        members=team_data.members,
        challenge_id=team_data.challenge_id,
        created_by=created_by,
        status="FORMING",
        progress=0,
        last_update="Team created, awaiting members",
    )

    db.add(team)
    db.commit()
    db.refresh(team)

    return team


def update_team(
    db: Session,
    team: Team,
    team_data: TeamUpdate,
) -> Team:
    """Update an existing student team."""
    update_data = team_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(team, field, value)

    db.commit()
    db.refresh(team)

    return team


def delete_team(db: Session, team: Team) -> None:
    """Delete a student team."""
    db.delete(team)
    db.commit()