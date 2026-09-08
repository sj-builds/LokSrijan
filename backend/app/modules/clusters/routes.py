"""Challenge cluster API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.cluster import ChallengeCluster
from app.models.user import User
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.permissions import require_roles
from app.modules.clusters import service
from app.schemas.cluster import (
    ClusterCreate,
    ClusterResponse,
    ClusterSuggestResponse,
)

router = APIRouter()


@router.post(
    "/suggest",
    response_model=ClusterSuggestResponse,
)
def suggest_clusters_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ClusterSuggestResponse:
    """Suggest candidate clusters from the current citizen reports."""

    return service.suggest_clusters(db)


@router.get(
    "/",
    response_model=list[ClusterResponse],
)
def list_clusters_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ClusterResponse]:
    """List all challenge clusters."""

    return service.list_clusters(db)


@router.get(
    "/{cluster_id}",
    response_model=ClusterResponse,
)
def get_cluster_endpoint(
    cluster_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ClusterResponse:
    """Return one cluster with its member reports."""

    cluster = service.get_cluster(db, cluster_id)

    if cluster is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cluster not found",
        )

    return cluster


@router.post(
    "/",
    response_model=ClusterResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("government"))],
)
def create_cluster_endpoint(
    data: ClusterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ClusterResponse:
    """Create a cluster from selected reports. Government only."""

    try:
        cluster = service.create_cluster(
            db,
            data,
            current_user,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    response = service.get_cluster(db, cluster.id)

    if response is None:  # pragma: no cover - just created
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cluster could not be loaded after creation",
        )

    return response


@router.patch(
    "/{cluster_id}/validate",
    response_model=ClusterResponse,
    dependencies=[Depends(require_roles("government"))],
)
def validate_cluster_endpoint(
    cluster_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ClusterResponse:
    """Mark a suggested cluster as validated. Government only."""

    cluster = db.get(ChallengeCluster, cluster_id)

    if cluster is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cluster not found",
        )

    if cluster.status == "VALIDATED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cluster is already validated",
        )

    service.set_cluster_status(db, cluster, "VALIDATED")

    response = service.get_cluster(db, cluster.id)

    if response is None:  # pragma: no cover
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cluster could not be loaded",
        )

    return response


@router.patch(
    "/{cluster_id}/reject",
    response_model=ClusterResponse,
    dependencies=[Depends(require_roles("government"))],
)
def reject_cluster_endpoint(
    cluster_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ClusterResponse:
    """Reject a suggested cluster. Government only."""

    cluster = db.get(ChallengeCluster, cluster_id)

    if cluster is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cluster not found",
        )

    service.set_cluster_status(db, cluster, "REJECTED")

    response = service.get_cluster(db, cluster.id)

    if response is None:  # pragma: no cover
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cluster could not be loaded",
        )

    return response