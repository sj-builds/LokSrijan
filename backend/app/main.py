"""LokSrijan API — application entrypoint.

Run locally with:

    uvicorn app.main:app --reload --port 8000

Interactive docs: http://localhost:8000/docs
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models
from app.api import health
from app.api.router import api_router
from app.core.config import settings
from app.core.database import Base, engine
from app.core.schema_updates import apply_additive_updates

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize application resources."""

    Base.metadata.create_all(bind=engine)
    apply_additive_updates(engine)

    yield

app = FastAPI(
    title="LokSrijan API",
    description=(
        "Backend for LokSrijan — an AI-assisted societal innovation "
        "collaboration platform. SIH / internal hackathon MVP."
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url=None,
    lifespan=lifespan,
)

# CORS — allows the Next.js dev server to call this API from the browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health probes live at the root so they stay stable across API versions.
app.include_router(health.router)

# All feature endpoints live under /api.
app.include_router(api_router, prefix=settings.api_prefix)


@app.get("/", tags=["meta"])
def root() -> dict[str, str]:
    """Point developers at the docs."""
    return {
        "service": settings.app_name,
        "environment": settings.environment,
        "docs": "/docs",
        "health": "/health",
    }
