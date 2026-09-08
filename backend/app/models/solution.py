"""Solution passport ORM model.

A Solution Passport distills a completed project + its impact ledger into
a reusable, documented solution. Published passports feed the replication
engine. `impact_verification_status` is copied from the impact record and
displayed honestly — a passport never claims verified impact that the
impact ledger has not verified.
"""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class SolutionPassport(Base):
    """A reusable solution document distilled from a completed project."""

    __tablename__ = "solution_passports"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id"),
        unique=True,
        nullable=False,
        index=True,
    )

    # Denormalized so the replication engine can match a new challenge
    # against passports without extra joins.
    challenge_id: Mapped[int] = mapped_column(
        ForeignKey("challenges.id"),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    category: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    location: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    # ── Core passport fields (all editable after generation) ───────────
    problem: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    root_cause: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    solution: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    technology: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    cost_estimate: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    implementation_time: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    required_skills: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    infrastructure: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    pilot_conditions: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # ── Measured impact snapshot (copied from the impact ledger) ────────
    metric_name: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    baseline_value: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    actual_value: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    unit: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    improvement_pct: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    evidence: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # Copied from the impact record; displayed honestly.
    impact_verification_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="PENDING",
    )

    impact_verification_note: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # ── Replication guidance (editable) ────────────────────────────────
    limitations: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    failure_conditions: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    replication_suitability: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # DRAFT -> PUBLISHED (only published passports feed replication).
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="DRAFT",
    )

    created_by: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    # True when the record comes from the seeded demo dataset.
    is_demo: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
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

    project = relationship("Project")
    challenge = relationship("Challenge")
    creator = relationship("User")