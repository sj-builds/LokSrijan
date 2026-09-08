"""Impact business logic."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.impact import Impact
from app.schemas.impact import (
    ImpactCreate,
    ImpactUpdate,
    ImpactVerify,
)


def _compute_improvement(
    baseline: float | None,
    actual: float | None,
    direction: str | None,
) -> float | None:
    """Compute improvement percentage from baseline and actual values.

    improvement_pct is always derived, never hand-entered. With
    direction "down", a drop from 5 days to 1 day is an improvement of
    80%. With direction "up", a rise from 100 to 200 tests is +100%.
    """

    if baseline is None or actual is None or baseline == 0:
        return None

    delta = (baseline - actual) / abs(baseline) * 100

    if direction == "up":
        delta = -delta

    return round(delta, 1)


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
        metric_name=data.metric_name,
        baseline_value=data.baseline_value,
        target_value=data.target_value,
        actual_value=data.actual_value,
        unit=data.unit,
        improvement_direction=data.improvement_direction,
        improvement_pct=_compute_improvement(
            data.baseline_value,
            data.actual_value,
            data.improvement_direction,
        ),
        verification_status="PENDING",
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


def list_impacts(db: Session) -> list[Impact]:
    """Return all impact records, most recently updated first."""

    return list(
        db.scalars(
            select(Impact).order_by(Impact.updated_at.desc())
        ).all()
    )


# Fields that make up the measured evidence. When any of them change,
# a previously VERIFIED result is no longer verified against the current
# data, so it falls back to PENDING until an authorised user re-verifies.
MEASUREMENT_FIELDS = {
    "beneficiaries",
    "outcome",
    "impact_score",
    "evidence",
    "metric_name",
    "baseline_value",
    "target_value",
    "actual_value",
    "unit",
    "improvement_direction",
}


def update_impact(
    db: Session,
    impact: Impact,
    data: ImpactUpdate,
) -> Impact:
    """Update an impact record."""

    updates = data.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(impact, field, value)

    # Recompute improvement whenever baseline/actual/direction changes.
    impact.improvement_pct = _compute_improvement(
        impact.baseline_value,
        impact.actual_value,
        impact.improvement_direction,
    )

    # Edited measurements invalidate any prior verification.
    if (
        updates.keys() & MEASUREMENT_FIELDS
        and impact.verification_status == "VERIFIED"
    ):
        impact.verification_status = "PENDING"
        impact.verification_note = None

    db.commit()
    db.refresh(impact)

    return impact


def verify_impact(
    db: Session,
    impact: Impact,
    data: ImpactVerify,
) -> Impact:
    """Mark impact evidence as verified by an authorised user.

    A result is only called "verified" when an authorised user records
    that decision here — never by the system automatically.
    """

    impact.verification_status = (
        "VERIFIED" if data.verified else "PENDING"
    )
    impact.verification_note = data.verification_note

    db.commit()
    db.refresh(impact)

    return impact