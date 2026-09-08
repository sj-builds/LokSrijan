# LokSrijan

**From Citizen Signal to Verified Societal Impact.**

An AI-assisted societal innovation collaboration platform for Jharkhand.

> ### SIH / Internal Hackathon MVP
>
> This is a hackathon prototype, **not a production system**.
>
> - It is **not deployed** and has no official status.
> - It has **no integration with any government system**, real or simulated.
> - It is **not affiliated with, endorsed by, or partnered with** any
>   government body, university, NGO, or company.
> - All data in the application is **demo data**, labelled as such.
>
> ### Current state: functional prototype
>
> The core loop works end to end: citizens submit problems, AI suggests
> structure, related reports and explainable priority scores, reports are
> grouped into challenge clusters that government validates, institutions
> are matched by capability, teams form, projects run their lifecycle, and
> impact is recorded as a Baseline → Target → Actual → Evidence →
> Verification ledger. See the [Demo data](#demo-data) section to load a
> coherent dataset and walk the whole journey.

---

## The problem

Local problems in Jharkhand — a contaminated handpump, a broken irrigation
channel, a school without safe drinking water — are usually reported one at a
time, in free text, through channels that lose them.

Three failures follow:

1. **Signal is lost.** Fifty reports of the same failing water source arrive as
   fifty unrelated complaints, so the underlying problem never looks urgent.
2. **Capability is disconnected.** Universities, NGOs, and industry partners in
   the same district have the skills to help, but no reliable way to find out
   which problems need them.
3. **Impact is unmeasured.** Even when something is fixed, there is rarely a
   recorded before-and-after, so nothing is learned and nothing is reusable.

## The solution

LokSrijan connects the signal to the capability, and then measures what changed.

```
Citizen problem
   → AI structuring          extract, classify, score quality
   → Duplicate detection     recognise the same problem reported twice
   → Challenge clustering    group many reports into one real challenge
   → Human validation        a person confirms it — always
   → Matching                universities, NGOs, industry — with reasons
   → Project execution
   → Pilot
   → Impact measurement      baseline, target, actual, verified
   → Solution knowledge base
```

Two rules shape the whole design:

- **AI suggests; humans validate.** No AI output changes an important record
  without a person approving it.
- **Every recommendation is explainable.** A score always arrives with the
  reasons behind it. A bare number is not an acceptable output.

---

## Architecture overview

A **modular monolith** on each side, communicating over HTTP/JSON only.

```
Browser
  │  fetch (JSON)
  ▼
TanStack Start ── frontend/  localhost:8080
  │  src/lib/api.ts
  ▼
FastAPI        ── backend/   localhost:8000
  │  SQLAlchemy
  ▼
PostgreSQL                 (local Docker or hosted dev DB)
```

Full detail: **[docs/architecture.md](docs/architecture.md)**.

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | TanStack Start (Vite), TypeScript (strict), Tailwind CSS v4, shadcn/ui |
| Backend | FastAPI, Python 3.11, SQLAlchemy 2 (sync), Pydantic 2 |
| Database | PostgreSQL 16 (local Docker or hosted dev DB) |
| AI | Provider-agnostic (`mock` or `gemini` via `AI_PROVIDER`) |

Deliberately **not** included yet: authentication, Redis, PostGIS, pgvector,
Alembic, microservices, CI/CD. Each is added when it is actually needed, and
[docs/architecture.md](docs/architecture.md#4-database-direction) records why.

## Repository structure

```
Loksrijan/
├── frontend/            TanStack Start application (Vite, port 8080)
│   ├── src/routes/      /, /citizen, /government, /university, /challenges,
│   │                    /ngo, /industry, /auth/$role, /team …
│   ├── src/components/  loksrijan/ (shells, explorer) · ui/ (shadcn)
│   ├── src/services/    API clients mirroring backend routes
│   ├── src/lib/         api.ts · session.ts · roles.ts · utils.ts
│   └── src/types/       API types mirroring backend schemas
├── backend/             FastAPI application
│   ├── app/
│   │   ├── main.py      app, CORS, routers, additive schema updates
│   │   ├── core/        config.py · database.py · schema_updates.py
│   │   ├── api/         health.py · router.py
│   │   ├── models/      SQLAlchemy ORM models (one file per entity)
│   │   ├── schemas/     Pydantic request/response models
│   │   ├── modules/     auth challenges intelligence institutions
│   │   │                matching projects teams impact analytics clusters
│   │   └── seed_demo.py idempotent demo dataset loader
│   └── requirements.txt
├── docs/                architecture · api-contract · team-workflow
├── docker-compose.yml   local PostgreSQL
├── .env.example         every environment variable, documented
└── README.md
```

---

## Local setup

### Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | 20.9+ | Next 16 minimum; 22.x verified |
| Python | 3.11 | 3.11.9 verified |
| Docker Desktop | any recent | optional — see the fallback below |
| Git | any recent | |

Clone the repository, then run the three steps below. **The frontend and backend
each need their own terminal.**

### 1. Database

```bash
docker compose up -d
```

Verify it is running:

```bash
docker compose ps
```

> **Docker Desktop must actually be running**, not just installed. If you see
> `failed to connect to the docker API`, start Docker Desktop and try again.
>
> **No Docker?** Install PostgreSQL 16 natively, create a database and user both
> named `loksrijan` with password `loksrijan`, and keep `DATABASE_URL` as it is.
> Nothing else changes. The API also runs fine with **no database at all** —
> `/health` stays healthy and `/health/db` reports `connected: false`.

### 2. Backend

```bash
cd backend
python -m venv .venv
```

Activate it:

```bash
source .venv/Scripts/activate
```

On macOS or Linux use `source .venv/bin/activate`; in PowerShell use
`.venv\Scripts\Activate.ps1`.

Then install and run:

```bash
pip install -r requirements.txt
```

```bash
cp .env.example .env
```

```bash
uvicorn app.main:app --reload --port 8000
```

- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

### 3. Frontend

In a second terminal:

```bash
cd frontend
npm install
```

```bash
cp .env.example .env.local
```

```bash
npm run dev
```

Open http://localhost:8080.

### 4. Confirm everything is connected

The frontend home page and `/challenges` call the API from the browser, so
the connection is visible immediately. The backend exposes
`/health` and `/health/db` for direct checks.

### Useful commands

| Where | Command | What it does |
| --- | --- | --- |
| `frontend/` | `npm run dev` | dev server |
| `frontend/` | `npm run typecheck` | `next typegen && tsc --noEmit` — use this, not bare `tsc` |
| `frontend/` | `npm run lint` | ESLint (`next lint` was removed in Next 16) |
| `frontend/` | `npm run build` | production build |
| `backend/` | `uvicorn app.main:app --reload --port 8000` | dev server |
| root | `docker compose up -d` / `down` | start / stop PostgreSQL |
| root | `docker compose down -v` | stop **and delete all data** |

---

## Environment variables

Never commit a `.env` file. `.env.example` is the documented reference; copy it.

| Variable | Used by | Status |
| --- | --- | --- |
| `DATABASE_URL` | backend | required |
| `CORS_ORIGINS` | backend | required |
| `VITE_API_BASE_URL` (in `frontend/.env.local`) | frontend | required |
| `POSTGRES_USER` / `_PASSWORD` / `_DB` / `_PORT` | docker-compose | required |
| `APP_NAME`, `ENVIRONMENT`, `DEBUG` | backend | optional, defaults exist |
| `AI_PROVIDER`, `AI_API_KEY` | backend | used — `mock` (default, no key) or `gemini` |
| `REDIS_URL`, `ENABLE_POSTGIS`, `ENABLE_PGVECTOR` | — | **reserved — not configured** |
| `JWT_SECRET_KEY` | backend | used — set a long random value in non-dev environments |

`NEXT_PUBLIC_*` variables are compiled into the browser bundle and are publicly
visible. Never put a secret in one.

---

## Team workflow

Six developers, one repository, `main` always working.

```
main
├── frontend/<thing>
├── backend/<thing>
└── feature/<thing>
```

Branch from a freshly pulled `main`, merge `main` into your branch daily, keep
pull requests small, and never `git add .` from the repository root.

There is a **file ownership map** and a defined procedure for changing a shared
endpoint — read **[docs/team-workflow.md](docs/team-workflow.md)** before your
first commit. The API contract lives in
**[docs/api-contract.md](docs/api-contract.md)**; the running backend's `/docs`
is always the authority.

---

## MVP scope

Priority order. Anything outside this list waits.

| # | Feature | Status |
| --- | --- | --- |
| # | Feature | Status |
| --- | --- | --- |
| 1 | Citizen problem submission | implemented |
| 2 | AI problem structuring | implemented (mock + Gemini) |
| 3 | Related report detection | implemented, explainable signals |
| 4 | Challenge clustering | implemented (suggest → validate) |
| 5 | Human validation | implemented (state machine + RBAC) |
| 6 | University / institution matching | implemented, capability-based |
| 7 | Explainable priority | implemented (configurable scoring model) |
| 8 | Project lifecycle | implemented |
| 9 | Impact ledger | implemented (baseline → verified) |
| 10 | Government analytics dashboard | implemented |

Monorepo under git, both applications running, environment-driven
configuration, verified browser → frontend → backend → database
connectivity.

---

## Demo data

Run once, from the `backend/` directory (the backend must have started once
so the tables exist):

```bash
python -m app.seed_demo
```

The script is **idempotent** — running it again skips records that already
exist and never modifies non-demo records. Everything it creates is flagged
`is_demo=True` and is clearly illustrative, not official Jharkhand
government data. The seeded impact record is deliberately left with
`verification_status=PENDING`; nothing is presented as verified unless an
officer records that decision.

Demo sign-in (all roles, password `demo1234`):

| Role | Email |
| --- | --- |
| Citizen | `citizen@demo.loksrijan.in` |
| Government | `government@demo.loksrijan.in` |
| University | `university@demo.loksrijan.in` |
| NGO | `ngo@demo.loksrijan.in` |
| Industry | `industry@demo.loksrijan.in` |

Suggested demo path: sign in as **Citizen** and file a problem → the AI
structuring panel suggests fields → **Government** reviews priority, runs
"Suggest clusters" and validates one → open any challenge to see related
reports, priority factors and capability matches → **University** forms a
team / project → the project workspace records baseline→target→actual→
evidence → **Government** verifies the impact.

The AI layer is provider-agnostic: `AI_PROVIDER=mock` (deterministic,
no key) or `gemini` (needs `AI_API_KEY`). If the live provider fails, the
backend degrades gracefully to the deterministic mock so the demo keeps
working.

## Project rules

These are constraints, not preferences. They exist because this platform makes
claims about real places and real organisations.

- **No fake integration with any government system**, real or simulated.
- **Never claim production deployment** or an official partnership.
- **Demo data is always labelled as demo data**, never mixed silently with real
  records.
- **AI suggests; humans validate.** No AI output changes an important record
  without a person approving it.
- **AI recommendations must be explainable.** Every score ships with the reasons
  behind it. A bare number is not acceptable output.
- **Secrets stay out of the repository.** Use `.env.example`; never hardcode a
  key, password, token, or database credential.
- **Do not change unrelated files.**
