"""Project management business logic."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate


def create_project(
    db: Session,
    project_data: ProjectCreate,
    user_id: int,
) -> Project:
    """Create and store a new solution project."""

    project = Project(
        title=project_data.title,
        description=project_data.description,
        solution_summary=project_data.solution_summary,
        category=project_data.category,
        challenge_id=project_data.challenge_id,
        created_by=user_id,
        status="DRAFT",
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    return project


def get_projects(
    db: Session,
) -> list[Project]:
    """Return all projects."""

    statement = select(Project).order_by(
        Project.created_at.desc(),
    )

    return list(db.scalars(statement).all())


def get_projects_by_challenge(
    db: Session,
    challenge_id: int,
) -> list[Project]:
    """Return all projects belonging to a challenge."""

    statement = (
        select(Project)
        .where(Project.challenge_id == challenge_id)
        .order_by(Project.created_at.desc())
    )

    return list(db.scalars(statement).all())


def get_project_by_id(
    db: Session,
    project_id: int,
) -> Project | None:
    """Return a project by ID."""

    return db.get(
        Project,
        project_id,
    )


def update_project(
    db: Session,
    project: Project,
    project_data: ProjectUpdate,
) -> Project:
    """Update an existing project."""

    update_data = project_data.model_dump(
        exclude_unset=True,
    )

    for field, value in update_data.items():
        setattr(
            project,
            field,
            value,
        )

    db.commit()
    db.refresh(project)

    return project


def delete_project(
    db: Session,
    project: Project,
) -> None:
    """Delete a project."""

    db.delete(project)
    db.commit()