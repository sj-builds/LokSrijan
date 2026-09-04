"""Impact business logic."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.impact import Impact
from app.schemas.impact import ImpactCreate, ImpactUpdate


def create_impact(
    db: Session,
    data: ImpactCreate,
) -> Impact:
    """Create impact record for a project."""

    impact = Impact(
        project_id=data.project_id,
        beneficiaries=data.beneficiaries,
        outcome=data.outcome,
        impact_score=data.impact_score,
        evidence=data.evidence,
    )

    db.add(impact)
    db.commit()
    db.refresh(impact)

    return impact


def get_impact(
    db: Session,
    project_id: int,
) -> Impact | None:
    """Get impact by project ID."""

    return db.scalar(
        select(Impact).where(
            Impact.project_id == project_id
        )
    )


def update_impact(
    db: Session,
    impact: Impact,
    data: ImpactUpdate,
) -> Impact:
    """Update an impact record."""

    updates = data.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(impact, field, value)

    db.commit()
    db.refresh(impact)

    return impact