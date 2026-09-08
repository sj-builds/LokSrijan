"""Impact ORM model."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Impact(Base):
    """Records measurable impact produced by a project.

    The Impact Ledger tracks Baseline -> Target -> Actual -> Evidence ->
    Verification. `improvement_pct` is computed from baseline/actual when
    both are present; it is never entered by hand. `verification_status`
    starts PENDING and only becomes VERIFIED through the explicit
    verification workflow.
    """

    __tablename__ = "impacts"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    beneficiaries: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    outcome: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    impact_score: Mapped[float] = mapped_column(
        nullable=False,
        default=0.0,
    )

    # ── Impact Ledger ────────────────────────────────────────────────
    # What is being measured, the before/after numbers, and the unit.
    metric_name: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    baseline_value: Mapped[float | None] = mapped_column(
        nullable=True,
    )

    target_value: Mapped[float | None] = mapped_column(
        nullable=True,
    )

    actual_value: Mapped[float | None] = mapped_column(
        nullable=True,
    )

    unit: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    # "down" means lower is better (e.g. turnaround days),
    # "up" means higher is better (e.g. water tested).
    improvement_direction: Mapped[str | None] = mapped_column(
        String(10),
        nullable=True,
        default="down",
    )

    # Computed, never hand-entered: how much baseline improved to actual.
    improvement_pct: Mapped[float | None] = mapped_column(
        nullable=True,
    )

    # PENDING until an authorised user verifies the evidence.
    verification_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="PENDING",
    )

    verification_note: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    evidence: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    project = relationship(
        "Project",
        back_populates="impact",
    )