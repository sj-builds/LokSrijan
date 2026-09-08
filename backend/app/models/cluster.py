"""Challenge cluster ORM models.

A cluster groups many citizen reports (challenges) into one systemic
challenge. Clusters are AI-suggested and human-validated — an authorised
government user decides when a suggestion becomes a real cluster.
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ChallengeCluster(Base):
    """A systemic challenge assembled from related citizen reports."""

    __tablename__ = "challenge_clusters"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    code: Mapped[str] = mapped_column(
        String(30),
        unique=True,
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # SUGGESTED -> VALIDATED / REJECTED
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="SUGGESTED",
    )

    # Short explanation of why these reports were grouped together.
    rationale: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="",
    )

    created_by: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
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

    members = relationship(
        "ChallengeClusterMember",
        back_populates="cluster",
        cascade="all, delete-orphan",
    )

    creator = relationship("User")


class ChallengeClusterMember(Base):
    """Links one challenge to a cluster."""

    __tablename__ = "challenge_cluster_members"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    cluster_id: Mapped[int] = mapped_column(
        ForeignKey("challenge_clusters.id"),
        nullable=False,
        index=True,
    )

    challenge_id: Mapped[int] = mapped_column(
        ForeignKey("challenges.id"),
        nullable=False,
        index=True,
    )

    # Similarity evidence captured when the member was added, e.g. 0.92
    similarity_score: Mapped[float | None] = mapped_column(
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    cluster = relationship(
        "ChallengeCluster",
        back_populates="members",
    )

    challenge = relationship("Challenge")