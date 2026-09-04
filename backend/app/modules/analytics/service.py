"""Analytics business logic."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.challenge import Challenge
from app.models.impact import Impact
from app.models.institution import Institution
from app.models.project import Project
from app.models.user import User
from app.schemas.analytics import AnalyticsOverview


def get_platform_overview(db: Session) -> AnalyticsOverview:
    """Return high-level platform statistics."""

    total_users = db.scalar(
        select(func.count(User.id))
    ) or 0

    total_challenges = db.scalar(
        select(func.count(Challenge.id))
    ) or 0

    validated_challenges = db.scalar(
        select(func.count(Challenge.id)).where(
            Challenge.status == "VALIDATED"
        )
    ) or 0

    total_projects = db.scalar(
        select(func.count(Project.id))
    ) or 0

    completed_projects = db.scalar(
        select(func.count(Project.id)).where(
            Project.status == "COMPLETED"
        )
    ) or 0

    total_institutions = db.scalar(
        select(func.count(Institution.id)).where(
            Institution.is_active.is_(True)
        )
    ) or 0

    universities = db.scalar(
        select(func.count(Institution.id)).where(
            Institution.institution_type == "UNIVERSITY",
            Institution.is_active.is_(True),
        )
    ) or 0

    ngos = db.scalar(
        select(func.count(Institution.id)).where(
            Institution.institution_type == "NGO",
            Institution.is_active.is_(True),
        )
    ) or 0

    industries = db.scalar(
        select(func.count(Institution.id)).where(
            Institution.institution_type == "INDUSTRY",
            Institution.is_active.is_(True),
        )
    ) or 0

    total_beneficiaries = db.scalar(
        select(func.coalesce(func.sum(Impact.beneficiaries), 0))
    ) or 0

    average_impact_score = db.scalar(
        select(func.coalesce(func.avg(Impact.impact_score), 0))
    ) or 0.0

    return AnalyticsOverview(
        total_users=total_users,
        total_challenges=total_challenges,
        validated_challenges=validated_challenges,
        total_projects=total_projects,
        completed_projects=completed_projects,
        total_institutions=total_institutions,
        universities=universities,
        ngos=ngos,
        industries=industries,
        total_beneficiaries=total_beneficiaries,
        average_impact_score=round(float(average_impact_score), 2),
    )