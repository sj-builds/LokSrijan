"""Analytics API routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.analytics.service import get_platform_overview
from app.modules.auth.dependencies import get_current_user
from app.schemas.analytics import AnalyticsOverview

router = APIRouter()


@router.get(
    "/overview",
    response_model=AnalyticsOverview,
)
def platform_overview(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Return high-level platform analytics."""

    return get_platform_overview(db)