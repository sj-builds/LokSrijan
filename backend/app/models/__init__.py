"""SQLAlchemy ORM models.

One file per entity, e.g. ``user.py``, ``challenge.py``, ``evidence.py``.
Import every model here so that a single ``from app import models`` sees the
full metadata — foreign keys need to resolve against each other, and Alembic
autogenerate needs one import point to detect the whole schema.

Models are kept centrally rather than inside each feature module because the
core entities reference one another heavily (a Challenge has a Location, an
Organization, Evidence, and belongs to a ChallengeCluster). Splitting them
across modules would mean circular imports on day one.

Nothing is implemented yet. Planned entities:
    User · Organization · Challenge · Evidence · Location · ChallengeCluster
"""

"""SQLAlchemy ORM models."""

from app.core.database import Base
from app.models.challenge import Challenge
from app.models.project import Project
from app.models.user import User
from app.models.institution import Institution
from app.models.impact import Impact

__all__ = [
    "Base",
    "User",
    "Challenge",
    "Project",
    "Institution",
    "Impact",
]
