"""Aggregate router for all `/api` endpoints."""

from fastapi import APIRouter

from app.modules.auth.routes import router as auth_router
from app.modules.challenges.routes import router as challenges_router
from app.modules.projects.routes import router as projects_router
from app.modules.intelligence.routes import router as intelligence_router
from app.modules.institutions.routes import router as institutions_router
from app.modules.impact.routes import router as impact_router
from app.modules.analytics.routes import router as analytics_router
from app.modules.teams.routes import router as teams_router
from app.modules.clusters.routes import router as clusters_router
from app.modules.solutions.routes import router as solutions_router

api_router = APIRouter()


api_router.include_router(
    auth_router,
    prefix="/auth",
    tags=["auth"],
)

api_router.include_router(
    challenges_router,
    prefix="/challenges",
    tags=["challenges"],
)

api_router.include_router(
    projects_router,
    prefix="/projects",
    tags=["projects"],
)

api_router.include_router(
    intelligence_router,
    prefix="/intelligence",
    tags=["intelligence"],
)

api_router.include_router(
    institutions_router,
    prefix="/institutions",
    tags=["institutions"],
)

api_router.include_router(
    impact_router,
    prefix="/impact",
    tags=["impact"],
)

api_router.include_router(
    analytics_router,
    prefix="/analytics",
    tags=["analytics"],
)

api_router.include_router(
    teams_router,
    prefix="/teams",
    tags=["teams"],
)

api_router.include_router(
    clusters_router,
    prefix="/clusters",
    tags=["clusters"],
)

api_router.include_router(
    solutions_router,
    prefix="/solutions",
    tags=["solutions"],
)