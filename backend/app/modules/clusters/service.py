"""Challenge cluster business logic.

The suggestion engine groups many citizen reports into candidate systemic
challenges. Suggestions are explicit and explainable; an authorised
government user decides whether a suggestion becomes a real cluster.
"""

import secrets
import string
from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.challenge import Challenge
from app.models.cluster import ChallengeCluster, ChallengeClusterMember
from app.models.user import User
from app.modules.intelligence.service import challenge_similarity
from app.schemas.cluster import (
    ClusterCreate,
    ClusterMemberOut,
    ClusterResponse,
    ClusterSuggestResponse,
    SuggestedCluster,
)


def _category_prefix(category: str) -> str:
    """Derive a short code prefix from a category name."""

    words = [
        word
        for word in category.replace("&", " ").replace("/", " ").split()
        if word
    ]

    prefix = "".join(word[0] for word in words[:3]).upper()[:3]

    return prefix or "GEN"


def _generate_cluster_code(db: Session, category: str) -> str:
    """Generate a unique, category-flavoured cluster code."""

    prefix = _category_prefix(category)
    digits = string.digits

    while True:
        code = f"CL-{prefix}-{''.join(secrets.choice(digits) for _ in range(3))}"

        existing = db.scalar(
            select(ChallengeCluster).where(
                ChallengeCluster.code == code
            )
        )

        if existing is None:
            return code


def _challenges_in_validated_clusters(db: Session) -> set[int]:
    """Return challenge IDs already inside a VALIDATED cluster."""

    rows = db.execute(
        select(ChallengeClusterMember.challenge_id).join(
            ChallengeCluster,
            ChallengeCluster.id
            == ChallengeClusterMember.cluster_id,
        ).where(
            ChallengeCluster.status == "VALIDATED"
        )
    ).all()

    return {row[0] for row in rows}


def suggest_clusters(db: Session) -> ClusterSuggestResponse:
    """Group related citizen reports into candidate systemic challenges.

    Uses union-find over a similarity graph: two challenges are connected
    when they share a domain and nearby location, or their blended
    similarity clears the platform threshold. Every suggestion is
    explainable via `rationale`.
    """

    challenges = list(
        db.scalars(
            select(Challenge).order_by(Challenge.created_at.desc())
        ).all()
    )

    excluded = _challenges_in_validated_clusters(db)

    # Union-find over challenge ids.
    parent: dict[int, int] = {}

    def find(node: int) -> int:
        while parent.get(node, node) != node:
            parent[node] = parent.get(parent[node], parent[node])
            node = parent[node]
        return node

    def union(left: int, right: int) -> None:
        root_left = find(left)
        root_right = find(right)
        if root_left != root_right:
            parent[root_right] = root_left

    edges: dict[tuple[int, int], float] = {}

    for challenge in challenges:
        if challenge.id in excluded:
            continue

        for other in challenges:
            if other.id <= challenge.id or other.id in excluded:
                continue

            score, _signals, _label, category_match, location_match = (
                challenge_similarity(challenge, other)
            )

            if (
                score >= 0.60
                or (category_match and location_match)
            ):
                union(challenge.id, other.id)
                edges[(challenge.id, other.id)] = score

    # Collect groups.
    groups: dict[int, list[Challenge]] = defaultdict(list)

    for challenge in challenges:
        if challenge.id in excluded:
            continue
        groups[find(challenge.id)].append(challenge)

    suggested: list[SuggestedCluster] = []

    for root_id, members in groups.items():
        if len(members) < 2:
            continue

        members.sort(key=lambda item: item.created_at)

        category = members[0].category
        locations = sorted(
            {member.location for member in members}
        )

        average_similarity = 0.0
        pair_count = 0

        for left in members:
            for right in members:
                if right.id <= left.id:
                    continue
                key = (left.id, right.id)
                if key in edges:
                    average_similarity += edges[key]
                    pair_count += 1

        if pair_count:
            average_similarity = round(
                average_similarity / pair_count,
                3,
            )

        first = members[0]
        area = locations[0] if locations else first.location

        suggested.append(
            SuggestedCluster(
                code=_generate_cluster_code(db, category),
                title=(
                    f"{first.category} issue across {area}"
                ),
                description=(
                    f"{len(members)} citizen reports describe a shared "
                    f"{first.category.lower()} problem in {', '.join(locations)}."
                ),
                rationale=(
                    f"{len(members)} reports share the domain "
                    f"'{category}' and nearby locations "
                    f"({', '.join(locations)}), with an average "
                    f"similarity of {round(average_similarity * 100)}%."
                ),
                member_count=len(members),
                locations=locations,
                categories=sorted(
                    {member.category for member in members}
                ),
                average_similarity=average_similarity,
                member_challenge_ids=[member.id for member in members],
                member_titles=[member.title for member in members],
            )
        )

    suggested.sort(
        key=lambda item: item.member_count,
        reverse=True,
    )

    return ClusterSuggestResponse(
        suggested_clusters=suggested[:8],
    )


def validate_cluster_members(
    db: Session,
    challenge_ids: list[int],
) -> list[int]:
    """Validate member challenge IDs for cluster creation.

    Raises ValueError with a human-readable message when an ID does not
    exist or already belongs to a VALIDATED cluster. Returns the deduped,
    ordered list of valid IDs.
    """

    unique_ids = list(dict.fromkeys(challenge_ids))

    existing_ids = set(
        db.scalars(
            select(Challenge.id).where(
                Challenge.id.in_(unique_ids)
            )
        ).all()
    )

    missing = [
        challenge_id
        for challenge_id in unique_ids
        if challenge_id not in existing_ids
    ]

    if missing:
        raise ValueError(
            "Unknown challenge IDs: " + ", ".join(str(i) for i in missing)
        )

    validated_member_ids = _challenges_in_validated_clusters(db)
    already_used = [
        challenge_id
        for challenge_id in unique_ids
        if challenge_id in validated_member_ids
    ]

    if already_used:
        raise ValueError(
            "Challenges already in a validated cluster: "
            + ", ".join(str(i) for i in already_used)
        )

    return unique_ids


def create_cluster(
    db: Session,
    data: ClusterCreate,
    user: User,
) -> ChallengeCluster:
    """Create a cluster from explicit member challenge IDs."""

    member_ids = validate_cluster_members(
        db,
        data.challenge_ids,
    )

    code = _generate_cluster_code(
        db,
        data.title,
    )

    cluster = ChallengeCluster(
        code=code,
        title=data.title,
        description=data.description,
        rationale=data.rationale,
        status="SUGGESTED",
        created_by=user.id,
    )

    db.add(cluster)
    db.flush()

    for challenge_id in member_ids:
        db.add(
            ChallengeClusterMember(
                cluster_id=cluster.id,
                challenge_id=challenge_id,
            )
        )

    db.commit()
    db.refresh(cluster)

    return cluster


def _member_out(
    db: Session,
    cluster: ChallengeCluster,
) -> list[ClusterMemberOut]:
    """Build member summaries for a cluster."""

    members: list[ClusterMemberOut] = []

    for link in cluster.members:
        challenge = db.get(Challenge, link.challenge_id)

        if challenge is None:
            continue

        members.append(
            ClusterMemberOut(
                challenge_id=challenge.id,
                title=challenge.title,
                location=challenge.location,
                category=challenge.category,
                severity=challenge.severity,
                status=challenge.status,
                similarity_score=link.similarity_score,
            )
        )

    return members


def get_cluster(
    db: Session,
    cluster_id: int,
) -> ClusterResponse | None:
    """Return one cluster with its member summaries."""

    cluster = db.get(ChallengeCluster, cluster_id)

    if cluster is None:
        return None

    return ClusterResponse(
        id=cluster.id,
        code=cluster.code,
        title=cluster.title,
        description=cluster.description,
        status=cluster.status,  # type: ignore[arg-type]
        rationale=cluster.rationale,
        created_by=cluster.created_by,
        created_at=cluster.created_at,
        updated_at=cluster.updated_at,
        members=_member_out(db, cluster),
    )


def list_clusters(db: Session) -> list[ClusterResponse]:
    """Return all clusters with member summaries."""

    clusters = list(
        db.scalars(
            select(ChallengeCluster).order_by(
                ChallengeCluster.created_at.desc()
            )
        ).all()
    )

    return [
        ClusterResponse(
            id=cluster.id,
            code=cluster.code,
            title=cluster.title,
            description=cluster.description,
            status=cluster.status,  # type: ignore[arg-type]
            rationale=cluster.rationale,
            created_by=cluster.created_by,
            created_at=cluster.created_at,
            updated_at=cluster.updated_at,
            members=_member_out(db, cluster),
        )
        for cluster in clusters
    ]


def set_cluster_status(
    db: Session,
    cluster: ChallengeCluster,
    new_status: str,
) -> ChallengeCluster:
    """Set cluster status (VALIDATED / REJECTED). Government decision."""

    cluster.status = new_status

    db.commit()
    db.refresh(cluster)

    return cluster