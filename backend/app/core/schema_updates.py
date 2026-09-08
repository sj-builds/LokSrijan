"""Additive schema updates for databases created before new columns existed.

`Base.metadata.create_all` only creates missing tables — it never adds
columns to tables that already exist. The team intentionally defers Alembic
(see docs/architecture.md), so this shim applies the small set of additive
column changes safely, once, at startup.

Rules for this file:

- Only ADD columns. Never drop, rename, or change the type of a column.
- Every statement uses `ADD COLUMN IF NOT EXISTS` so it is idempotent.
- Keep it small; when Alembic arrives this file goes away.
"""

from sqlalchemy import text
from sqlalchemy.engine import Engine

ADDITIVE_UPDATES: list[str] = [
    # Impact Ledger columns on the pre-existing `impacts` table.
    "ALTER TABLE impacts ADD COLUMN IF NOT EXISTS metric_name VARCHAR(200)",
    "ALTER TABLE impacts ADD COLUMN IF NOT EXISTS baseline_value FLOAT",
    "ALTER TABLE impacts ADD COLUMN IF NOT EXISTS target_value FLOAT",
    "ALTER TABLE impacts ADD COLUMN IF NOT EXISTS actual_value FLOAT",
    "ALTER TABLE impacts ADD COLUMN IF NOT EXISTS unit VARCHAR(50)",
    "ALTER TABLE impacts ADD COLUMN IF NOT EXISTS improvement_direction VARCHAR(10) DEFAULT 'down'",
    "ALTER TABLE impacts ADD COLUMN IF NOT EXISTS improvement_pct FLOAT",
    "ALTER TABLE impacts ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'PENDING'",
    "ALTER TABLE impacts ADD COLUMN IF NOT EXISTS verification_note TEXT",
    # Urgency reported by the citizen (NULL for pre-existing records;
    # the priority model falls back to severity for those).
    "ALTER TABLE challenges ADD COLUMN IF NOT EXISTS urgency VARCHAR(50)",
    # Demo flag on challenges and institutions.
    "ALTER TABLE challenges ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE",
    "ALTER TABLE institutions ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE",
]


def apply_additive_updates(engine: Engine) -> None:
    """Apply the additive column updates, ignoring databases that are down."""

    try:
        with engine.begin() as connection:
            for statement in ADDITIVE_UPDATES:
                connection.execute(text(statement))
    except Exception:  # noqa: BLE001 - startup must not fail on a missing DB
        # PostgreSQL not running (or not reachable) — the health endpoint
        # reports it; the API keeps serving stateless routes.
        return