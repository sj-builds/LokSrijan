"""Aggregate router for all `/api` endpoints."""

from fastapi import APIRouter

from app.modules.auth.routes import router as auth_router


api_router = APIRouter()

api_router.include_router(
    auth_router,
    prefix="/auth",
    tags=["auth"],
)
