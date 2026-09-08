"""Seed coherent demo data for the LokSrijan prototype.

Run from the backend directory:

    python -m app.seed_demo

What it does
------------

Creates clearly-labelled DEMO records (is_demo=True) that exercise the full
product journey:

    citizen reports -> AI understanding -> related reports -> challenge
    cluster -> government validation -> priority -> capability matching ->
    team formation -> project -> pilot -> measured impact

The script is idempotent: it skips records that already exist (users by
email, challenges by title, institutions by name, teams by code, projects
by title, impacts by project). Existing records are never modified.

Honesty rules
-------------

- Every record this script creates is demo data, flagged is_demo=True.
- Passwords are demo-only and documented in the README.
- No record claims to be official Jharkhand government data, a real
  partnership, or verified real-world impact. The seeded impact record is
  explicitly left with verification_status=PENDING.

Usage example (after starting the backend once so tables exist):

    python -m app.seed_demo
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import Base, SessionLocal, engine
from app.core.schema_updates import apply_additive_updates
from app.models.challenge import Challenge
from app.models.cluster import ChallengeCluster, ChallengeClusterMember
from app.models.impact import Impact
from app.models.institution import Institution
from app.models.project import Project
from app.models.solution import SolutionPassport
from app.models.team import Team
from app.models.user import User
from app.modules.auth.security import hash_password

DEMO_PASSWORD = "demo1234"

DEMO_USERS = [
    ("Citizen Anil", "citizen@demo.loksrijan.in", "citizen"),
    ("Officer Meena Kumari", "government@demo.loksrijan.in", "government"),
    ("Prof. Sanjay Sinha", "university@demo.loksrijan.in", "university"),
    ("Reema Tirkey", "ngo@demo.loksrijan.in", "ngo"),
    ("Amit Verma", "industry@demo.loksrijan.in", "industry"),
]

# (title, description, category, location, severity, status, created_days_ago)
DEMO_CHALLENGES = [
    (
        "Yellow discoloured water from handpump in Dhurwa",
        "Hamare area ke handpump ka paani peela aa raha hai. Residents of Dhurwa "
        "colony report yellow discoloured water from the community handpump for "
        "the past three weeks. Children are refusing to drink the water and "
        "families are buying bottled water at high cost. The handpump serves "
        "around 120 households.",
        "Water & Sanitation",
        "Dhurwa, Ranchi",
        "HIGH",
        "HIGH",
        "SUBMITTED",
        12,
    ),
    (
        "Handpump water smells and tastes metallic in Harmu",
        "The handpump near Harmu market supplies water that smells and tastes "
        "metallic, especially after rain. Around 80 households depend on this "
        "pump for drinking water. Boiling does not remove the smell. Residents "
        "suspect contamination from nearby drainage.",
        "Water & Sanitation",
        "Harmu, Ranchi",
        "HIGH",
        "HIGH",
        "SUBMITTED",
        9,
    ),
    (
        "Children falling sick after drinking handpump water in Morabadi",
        "Seven children from Morabadi slum were admitted with stomach infections "
        "last week. Parents link the illness to the shared handpump, whose water "
        "looks cloudy and smells foul. The nearest tested water source is 2 km "
        "away. The community wants a quality test and a safe alternative source.",
        "Water & Sanitation",
        "Morabadi, Ranchi",
        "CRITICAL",
        "CRITICAL",
        "SUBMITTED",
        6,
    ),
    (
        "Handpump supply irregular in Kokar",
        "The handpump in Kokar bazaar works only a few hours a day and the water "
        "has a strong earthy smell. Women queue for hours. Some households have "
        "started using open wells despite safety concerns. Supply is most "
        "unreliable during peak summer months.",
        "Water & Sanitation",
        "Kokar, Ranchi",
        "MEDIUM",
        "MEDIUM",
        "SUBMITTED",
        4,
    ),
    (
        "Drinking water quality in Ranchi slums deteriorating",
        "Systemic challenge: multiple neighbourhoods across Ranchi report "
        "degrading handpump water quality — discolouration, odour and repeated "
        "childhood illness. Individual complaints have been filed separately but "
        "share a common pattern: unmonitored shallow handpumps near drainage, no "
        "community-level testing, and no regular maintenance cycle. A coordinated "
        "testing, monitoring and remediation programme is required.",
        "Water & Sanitation",
        "Ranchi district",
        "CRITICAL",
        "CRITICAL",
        "IN_PROGRESS",
        25,
    ),
    (
        "Anganwadi cold chain fails for supplementary nutrition in Khunti",
        "Fortified nutrition at 9 of 21 anganwadi centres in Khunti block spoils "
        "before distribution because power cuts of 5-7 hours make refrigerators "
        "unreliable. There is no temperature logging, so spoilage is discovered "
        "only when children fall ill. Centres have improvised with earthen pots.",
        "Health & Nutrition",
        "Khunti block, Khunti",
        "HIGH",
        "HIGH",
        "RESOLVED",
        40,
    ),
    (
        "Mid-day meal kitchens in Gumla lack clean water",
        "Kitchens preparing mid-day meals in three Gumla schools draw water from "
        "unprotected wells during the dry season. Two schools reported food-"
        "borne illness last term. Teachers want storage tanks, filters and a "
        "simple testing routine before the next term.",
        "Health & Nutrition",
        "Gumla district",
        "MEDIUM",
        "MEDIUM",
        "UNDER_REVIEW",
        15,
    ),
    (
        "Farmers burn paddy stubble because balers arrive late in Latehar",
        "Custom hiring centre balers reach Latehar farms three weeks after the "
        "harvest, so small holdings burn stubble to clear fields for the next "
        "crop. Smoke affects two villages and a nearby school. Farmers request an "
        "online booking system with priority for small holdings.",
        "Agriculture",
        "Latehar district",
        "MEDIUM",
        "HIGH",
        "SUBMITTED",
        8,
    ),
    (
        "Silted irrigation canal cuts water supply to Khunti fields",
        "The 6 km irrigation canal serving Kolebira fields is heavily silted and "
        "breached in two places. Water reaches only 30% of the commanded area. "
        "Farmers cleared the canal manually last season but the silt returns "
        "every monsoon.",
        "Agriculture",
        "Kolebira, Khunti",
        "HIGH",
        "HIGH",
        "UNDER_REVIEW",
        11,
    ),
    (
        "Street lights out on NH-33 stretch near Tatisilwai",
        "Twelve street lights on the NH-33 service road near Tatisilwai have been "
        "out for a month. Night commuters, including students returning from "
        "coaching, report near-misses. The stretch has no emergency lighting "
        "during outages.",
        "Roads & Infrastructure",
        "Tatisilwai, Ranchi",
        "MEDIUM",
        "MEDIUM",
        "SUBMITTED",
        5,
    ),
    (
        "Unsafe school crossing on Kanke Road, Ranchi",
        "Around 400 schoolchildren cross the Kanke Road junction every morning "
        "without signals or a crossing guard. Two minor accidents were reported "
        "this term. Parents and teachers propose a signal, speed bumps and a "
        "guarded crossing during school hours.",
        "Roads & Infrastructure",
        "Kanke Road, Ranchi",
        "HIGH",
        "HIGH",
        "SUBMITTED",
        7,
    ),
    (
        "Underpass floods after every rain near RIMS, Ranchi",
        "The pedestrian underpass near RIMS hospital fills with knee-deep water "
        "after every moderate rainfall, forcing elderly patients to cross the "
        "road above. Drains are choked with silt. No maintenance crew is "
        "assigned to the underpass.",
        "Roads & Infrastructure",
        "RIMS, Ranchi",
        "HIGH",
        "HIGH",
        "SUBMITTED",
        3,
    ),
]

DEMO_INSTITUTIONS = [
    (
        "Birla Institute of Technology, Mesra",
        "UNIVERSITY",
        "Engineering and technology institute with active water-quality and IoT "
        "research groups in Ranchi.",
        "Mesra, Ranchi",
        "Water Quality Testing, Environmental Engineering, IoT Sensors, Data "
        "Analytics, GIS, Community Engagement",
        "https://bitmesra.ac.in",
    ),
    (
        "National Institute of Technology, Jamshedpur",
        "UNIVERSITY",
        "NIT with civil and environmental engineering programmes and a "
        "water-infrastructure lab.",
        "Jamshedpur",
        "Civil Engineering, Water Infrastructure, Maintenance, Monitoring, "
        "Structural Analysis",
        "https://nitjsr.ac.in",
    ),
    (
        "IIT (ISM) Dhanbad",
        "UNIVERSITY",
        "Institute with groundwater, geochemistry and environmental engineering "
        "expertise.",
        "Dhanbad",
        "Environmental Engineering, Groundwater Studies, Geochemistry, Data "
        "Analytics, GIS",
        "https://iitism.ac.in",
    ),
    (
        "Ranchi University",
        "UNIVERSITY",
        "State university with public health, social work and community "
        "development departments.",
        "Ranchi",
        "Public Health, Social Work, Community Engagement, Education, Nutrition",
        "https://ranchiuniversity.ac.in",
    ),
    (
        "Jal Sathi Foundation",
        "NGO",
        "Field organisation running water-quality campaigns and community "
        "awareness in Ranchi and Khunti.",
        "Ranchi",
        "Field Surveys, Community Engagement, Water Quality Campaigns, "
        "Training",
        None,
    ),
    (
        "Marusthal Seva Samiti",
        "NGO",
        "Rural health and nutrition organisation with anganwadi field pilots.",
        "Khunti",
        "Rural Health, Nutrition, Field Pilots, Community Health Workers",
        None,
    ),
    (
        "JUSCO",
        "INDUSTRY",
        "Utility and smart-city technology company with metering and SCADA "
        "expertise.",
        "Jamshedpur",
        "Smart Water Meters, IoT, SCADA, Asset Maintenance, Data Platforms",
        "https://jus.co.in",
    ),
    (
        "Tata Steel Foundation",
        "INDUSTRY",
        "CSR foundation funding rural development, solar power and community "
        "infrastructure.",
        "Ranchi",
        "Rural Development, Solar Power, Community Infrastructure, Funding",
        "https://tatasteelfoundation.org",
    ),
]

DEMO_TEAMS = [
    (
        "TEAM-JAL01",
        "Jal Rakshak",
        "Civil Engineering, BIT Mesra",
        "Dr. S. Sinha",
        5,
        5,  # challenge id resolved at runtime
        "ACTIVE",
        55,
        "Sensor node 3 calibrated; community testing camp planned for Saturday",
    ),
    (
        "TEAM-COLD01",
        "ColdBox Collective",
        "Mechanical Engineering, NIT Jamshedpur",
        "Dr. R. Sharma",
        4,
        6,
        "COMPLETED",
        100,
        "41-day spoilage-free run submitted for NGO sign-off",
    ),
]

DEMO_PROJECTS = [
    (
        "Ranchi Handpump Water Quality Monitoring Pilot",
        "Deploy low-cost sensor and community-testing programme across the four "
        "reported Ranchi neighbourhoods, with a ward-office alert dashboard and "
        "a monthly community testing camp.",
        "Install pH/TDS sensors on selected handpumps, run monthly community "
        "testing camps with Jal Sathi Foundation, and publish a ward-level "
        "dashboard so maintenance crews act before complaints arrive.",
        "Water & Sanitation",
        5,  # challenge id
        "IN_PROGRESS",
    ),
    (
        "Solar-Buffered Cold Box for Anganwadi Nutrition",
        "Build and pilot a solar-buffered cold box that keeps fortified "
        "nutrition within safe temperature during 5-7 hour power cuts at "
        "anganwadi centres.",
        "A phase-change-material cold box charged by a small solar panel, "
        "temperature logging, and a 6-centre field pilot with a spoilage log.",
        "Health & Nutrition",
        6,
        "COMPLETED",
    ),
]

DEMO_IMPACTS = [
    (
        2,  # project id resolved at runtime
        5600,
        "Fortified nutrition delivered without spoilage at 9 anganwadi centres "
        "across a 41-day pilot. Spoilage incidents fell from 9 to 3 per month "
        "and no child fell ill from spoiled nutrition during the pilot.",
        82.0,
        "Cold-chain spoilage incidents per month",
        9.0,
        2.0,
        3.0,
        "incidents / month",
        "down",
        "PENDING",
        "41-day spoilage-free pilot log; block CDPO countersign; awaiting "
        "district nutrition cell review",
        "Demo measurement from the seeded pilot — verification pending.",
    ),
]

# One published passport so the replication engine has a demo target.
# The impact snapshot is copied from the seeded impact record at seed
# time; verification is deliberately left PENDING (no claim of verified
# impact without an officer decision).
DEMO_PASSPORTS = [
    (
        2,  # project index -> Solar-Buffered Cold Box project
        "Reusable solution: Solar-Buffered Cold Box for Anganwadi Nutrition",
        "Fortified nutrition at anganwadi centres spoils before distribution "
        "because 5-7 hour power cuts make refrigerators unreliable, and there "
        "is no temperature logging.",
        "Unreliable grid power with no thermal buffer; single-point cold "
        "storage with no temperature logging.",
        "A phase-change-material cold box charged by a small solar panel, with "
        "temperature logging, piloted across 6 anganwadi centres.",
        "Phase-change material, small solar PV, temperature logging",
        "~1.2 lakh per 10 centres (prototype estimate)",
        "6 weeks per cluster of centres",
        "Mechanical engineering, solar power, IoT logging, community health "
        "workers",
        "Anganwadi centre with roof space for a small solar panel; no grid "
        "dependency required",
        "6 anganwadi centres in Khunti block, 41-day pilot, daily 5-7 hour "
        "power cuts",
        "Pilot covered 6 of 21 centres; dry-season performance not yet "
        "measured; PCM material supply chain unverified",
        "Extreme humidity affecting PCM performance; panel theft or vandalism; "
        "outages beyond 12 continuous hours",
        "Suitable for anganwadi centres with 4-8 hour daily outages and roof "
        "space; capacity should be sized to centre enrolment",
    ),
]

DEMO_CLUSTERS = [
    (
        "CL-WTR-001",
        "Drinking water quality from community handpumps in Ranchi",
        "Four citizen reports from Dhurwa, Harmu, Morabadi and Kokar describe "
        "degrading handpump water — discolouration, odour, metallic taste and "
        "repeated childhood illness. Together they form one systemic challenge "
        "requiring coordinated testing, monitoring and remediation.",
        "4 reports share the 'Water & Sanitation' domain and nearby Ranchi "
        "locations, with an average similarity of 71%.",
        "VALIDATED",
        [1, 2, 3, 4],  # challenge ids
    ),
    (
        "CL-RD-002",
        "Road safety and street infrastructure around Ranchi",
        "Three reports describe separate but related road-infrastructure gaps: "
        "street lighting outages on NH-33, an unsafe school crossing on Kanke "
        "Road, and a repeatedly flooded underpass near RIMS.",
        "3 reports share the 'Roads & Infrastructure' domain and the Ranchi "
        "area, suggesting one coordinated ward-level infrastructure review.",
        "SUGGESTED",
        [10, 11, 12],
    ),
]


def _staggered_created(days_ago: int) -> datetime:
    """Return a UTC timestamp `days_ago` days in the past."""

    return datetime.now(timezone.utc) - timedelta(days=days_ago)


def _get_or_create_user(
    db: Session,
    name: str,
    email: str,
    role: str,
) -> User:
    """Return an existing user by email, or create a demo user."""

    user = db.scalar(
        select(User).where(User.email == email)
    )

    if user is not None:
        return user

    user = User(
        name=name,
        email=email,
        hashed_password=hash_password(DEMO_PASSWORD),
        role=role,
    )

    db.add(user)
    db.flush()

    return user


def _seed_users(db: Session) -> dict[str, User]:
    """Create demo users; return {role: user}."""

    users: dict[str, User] = {}

    for name, email, role in DEMO_USERS:
        user = _get_or_create_user(db, name, email, role)
        users[role] = user

    db.commit()

    return users


def _seed_challenges(
    db: Session,
    citizen_user: User,
) -> dict[int, Challenge]:
    """Create demo challenges; return {seed_index: challenge}."""

    challenges: dict[int, Challenge] = {}

    for index, (
        title,
        description,
        category,
        location,
        severity,
        urgency,
        status,
        days_ago,
    ) in enumerate(DEMO_CHALLENGES, start=1):
        existing = db.scalar(
            select(Challenge).where(Challenge.title == title)
        )

        if existing is not None:
            challenges[index] = existing
            continue

        challenge = Challenge(
            title=title,
            description=description,
            category=category,
            location=location,
            severity=severity,
            urgency=urgency,
            status=status,
            created_by=citizen_user.id,
            is_demo=True,
            created_at=_staggered_created(days_ago),
            updated_at=_staggered_created(days_ago),
        )

        db.add(challenge)
        db.flush()

        challenges[index] = challenge

    db.commit()

    return challenges


def _seed_institutions(db: Session) -> None:
    """Create demo institutions."""

    for (
        name,
        institution_type,
        description,
        location,
        capabilities,
        website,
    ) in DEMO_INSTITUTIONS:
        existing = db.scalar(
            select(Institution).where(Institution.name == name)
        )

        if existing is not None:
            continue

        db.add(
            Institution(
                name=name,
                institution_type=institution_type,
                description=description,
                location=location,
                capabilities=capabilities,
                website=website,
                is_active=True,
                is_demo=True,
            )
        )

    db.commit()


def _seed_teams(
    db: Session,
    university_user: User,
    challenges: dict[int, Challenge],
) -> dict[str, Team]:
    """Create demo teams; return {seed_index: team}."""

    teams: dict[str, Team] = {}

    for (
        code,
        name,
        department,
        mentor,
        members,
        challenge_index,
        status,
        progress,
        last_update,
    ) in DEMO_TEAMS:
        existing = db.scalar(
            select(Team).where(Team.code == code)
        )

        if existing is not None:
            teams[code] = existing
            continue

        team = Team(
            code=code,
            name=name,
            department=department,
            mentor=mentor,
            members=members,
            challenge_id=challenges[challenge_index].id,
            created_by=university_user.id,
            status=status,
            progress=progress,
            last_update=last_update,
            created_at=_staggered_created(30),
        )

        db.add(team)
        db.flush()

        teams[code] = team

    db.commit()

    return teams


def _seed_projects(
    db: Session,
    university_user: User,
    challenges: dict[int, Challenge],
) -> dict[int, Project]:
    """Create demo projects; return {seed_index: project}."""

    projects: dict[int, Project] = {}

    for index, (
        title,
        description,
        solution_summary,
        category,
        challenge_index,
        status,
    ) in enumerate(DEMO_PROJECTS, start=1):
        existing = db.scalar(
            select(Project).where(Project.title == title)
        )

        if existing is not None:
            projects[index] = existing
            continue

        project = Project(
            title=title,
            description=description,
            solution_summary=solution_summary,
            category=category,
            challenge_id=challenges[challenge_index].id,
            created_by=university_user.id,
            status=status,
            created_at=_staggered_created(28),
        )

        db.add(project)
        db.flush()

        projects[index] = project

    db.commit()

    return projects


def _seed_impacts(
    db: Session,
    projects: dict[int, Project],
) -> None:
    """Create demo impact records (verification left PENDING)."""

    for (
        project_index,
        beneficiaries,
        outcome,
        impact_score,
        metric_name,
        baseline_value,
        target_value,
        actual_value,
        unit,
        direction,
        verification_status,
        verification_note,
        evidence,
    ) in DEMO_IMPACTS:
        project = projects[project_index]

        existing = db.scalar(
            select(Impact).where(Impact.project_id == project.id)
        )

        if existing is not None:
            continue

        delta = (baseline_value - actual_value) / abs(baseline_value) * 100
        improvement_pct = round(delta if direction != "up" else -delta, 1)

        db.add(
            Impact(
                project_id=project.id,
                beneficiaries=beneficiaries,
                outcome=outcome,
                impact_score=impact_score,
                evidence=evidence,
                metric_name=metric_name,
                baseline_value=baseline_value,
                target_value=target_value,
                actual_value=actual_value,
                unit=unit,
                improvement_direction=direction,
                improvement_pct=improvement_pct,
                verification_status=verification_status,
                verification_note=verification_note,
            )
        )

    db.commit()


def _seed_passports(
    db: Session,
    university_user: User,
    projects: dict[int, Project],
) -> None:
    """Create demo solution passports (verification shown as PENDING)."""

    for (
        project_index,
        title,
        problem,
        root_cause,
        solution,
        technology,
        cost_estimate,
        implementation_time,
        required_skills,
        infrastructure,
        pilot_conditions,
        limitations,
        failure_conditions,
        replication_suitability,
    ) in DEMO_PASSPORTS:
        project = projects[project_index]

        existing = db.scalar(
            select(SolutionPassport).where(
                SolutionPassport.project_id == project.id
            )
        )

        if existing is not None:
            continue

        challenge = db.get(Challenge, project.challenge_id)
        impact = db.scalar(
            select(Impact).where(Impact.project_id == project.id)
        )

        db.add(
            SolutionPassport(
                project_id=project.id,
                challenge_id=project.challenge_id,
                title=title,
                category=project.category,
                location=challenge.location if challenge else project.category,
                problem=problem,
                root_cause=root_cause,
                solution=solution,
                technology=technology,
                cost_estimate=cost_estimate,
                implementation_time=implementation_time,
                required_skills=required_skills,
                infrastructure=infrastructure,
                pilot_conditions=pilot_conditions,
                metric_name=impact.metric_name if impact else None,
                baseline_value=impact.baseline_value if impact else None,
                actual_value=impact.actual_value if impact else None,
                unit=impact.unit if impact else None,
                improvement_pct=impact.improvement_pct if impact else None,
                evidence=impact.evidence if impact else None,
                impact_verification_status=(
                    impact.verification_status if impact else "PENDING"
                ),
                impact_verification_note=(
                    impact.verification_note if impact else None
                ),
                limitations=limitations,
                failure_conditions=failure_conditions,
                replication_suitability=replication_suitability,
                status="PUBLISHED",
                created_by=university_user.id,
                is_demo=True,
            )
        )

    db.commit()


def _seed_clusters(
    db: Session,
    government_user: User,
    challenges: dict[int, Challenge],
) -> None:
    """Create demo clusters (one validated, one suggested)."""

    for (
        code,
        title,
        description,
        rationale,
        status,
        member_indexes,
    ) in DEMO_CLUSTERS:
        existing = db.scalar(
            select(ChallengeCluster).where(
                ChallengeCluster.code == code
            )
        )

        if existing is not None:
            continue

        cluster = ChallengeCluster(
            code=code,
            title=title,
            description=description,
            rationale=rationale,
            status=status,
            created_by=government_user.id,
            created_at=_staggered_created(10),
        )

        db.add(cluster)
        db.flush()

        for index in member_indexes:
            db.add(
                ChallengeClusterMember(
                    cluster_id=cluster.id,
                    challenge_id=challenges[index].id,
                    similarity_score=0.71,
                )
            )

    db.commit()


def run() -> None:
    """Seed all demo data. Safe to run repeatedly."""

    Base.metadata.create_all(bind=engine)
    apply_additive_updates(engine)

    db: Session = SessionLocal()

    try:
        users = _seed_users(db)

        challenges = _seed_challenges(
            db,
            users["citizen"],
        )

        _seed_institutions(db)

        _seed_teams(
            db,
            users["university"],
            challenges,
        )

        projects = _seed_projects(
            db,
            users["university"],
            challenges,
        )

        _seed_impacts(db, projects)

        _seed_passports(
            db,
            users["university"],
            projects,
        )

        _seed_clusters(
            db,
            users["government"],
            challenges,
        )

        print("Demo data ready. Demo sign-in password for all roles: demo1234")
        print("  citizen@demo.loksrijan.in / government@demo.loksrijan.in")
        print("  university@demo.loksrijan.in / ngo@demo.loksrijan.in")
        print("  industry@demo.loksrijan.in")
    finally:
        db.close()


if __name__ == "__main__":
    run()