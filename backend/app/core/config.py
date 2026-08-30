"""Application configuration.

All configuration is environment-driven. Nothing is hardcoded.
Copy `.env.example` to `.env` and adjust values for local development.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Environment-backed application settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # ── Application ──────────────────────────────────────────
    app_name: str = "loksrijan-api"
    environment: str = "development"
    debug: bool = True
    api_prefix: str = "/api"

    # ── Database ─────────────────────────────────────────────
    # SQLAlchemy URL. Uses the psycopg (v3) driver.
    database_url: str = (
        "postgresql+psycopg://loksrijan:loksrijan@localhost:5432/loksrijan"
    )

    # ── CORS ─────────────────────────────────────────────────
    # Comma-separated list of allowed origins (frontend dev servers).
    # Stored as a plain string so a malformed env var cannot crash startup.
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    # ── Authentication ────────────────────────────────────────
    jwt_secret_key: str = "change-this-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # ── AI provider (RESERVED — not used yet) ────────────────
    # Wired in a later task via the AIService abstraction.
    # Left empty so no provider is implied or required today.
    ai_provider: str = ""
    ai_api_key: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        """Parse `cors_origins` into a clean list of origins."""
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    """Return cached settings so the .env file is read only once."""
    return Settings()


settings = get_settings()
