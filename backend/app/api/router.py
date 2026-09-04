"""Aggregate router for all `/api` endpoints."""

from fastapi import APIRouter

from app.modules.auth.routes import router as auth_router
from app.modules.challenges.routes import router as challenges_router
from app.modules.projects.routes import router as projects_router


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