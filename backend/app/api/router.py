"""Aggregate router for all `/api` endpoints."""

from fastapi import APIRouter

from app.modules.auth.routes import router as auth_router
from app.modules.challenges.routes import router as challenges_router
from app.modules.projects.routes import router as projects_router
from app.modules.intelligence.routes import router as intelligence_router
from app.modules.institutions.routes import router as institutions_router

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