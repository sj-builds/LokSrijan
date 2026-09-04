"""Impact ORM model."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Impact(Base):
    """Records measurable impact produced by a project."""

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