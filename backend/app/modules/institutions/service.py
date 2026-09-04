"""Institution business logic."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.institution import Institution
from app.schemas.institution import InstitutionCreate, InstitutionUpdate


def create_institution(
    db: Session,
    data: InstitutionCreate,
) -> Institution:
    """Create a new institution."""

    institution = Institution(
        name=data.name,
        institution_type=data.institution_type.value,
        description=data.description,
        location=data.location,
        capabilities=data.capabilities,
        website=data.website,
        contact_email=data.contact_email,
    )

    db.add(institution)
    db.commit()
    db.refresh(institution)

    return institution


def get_institution(
    db: Session,
    institution_id: int,
) -> Institution | None:
    """Get an institution by ID."""

    return db.get(Institution, institution_id)


def get_institutions(
    db: Session,
    institution_type: str | None = None,
    active_only: bool = True,
) -> list[Institution]:
    """Get institutions with optional filtering."""

    statement = select(Institution)

    if active_only:
        statement = statement.where(Institution.is_active.is_(True))

    if institution_type:
        statement = statement.where(
            Institution.institution_type == institution_type
        )

    statement = statement.order_by(Institution.name)

    return list(db.scalars(statement).all())


def update_institution(
    db: Session,
    institution: Institution,
    data: InstitutionUpdate,
) -> Institution:
    """Update an existing institution."""

    updates = data.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(institution, field, value)

    db.commit()
    db.refresh(institution)

    return institution


def delete_institution(
    db: Session,
    institution: Institution,
) -> None:
    """Deactivate an institution."""

    institution.is_active = False

    db.commit()