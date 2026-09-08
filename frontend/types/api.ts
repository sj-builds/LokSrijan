/**
 * Shared API response types.
 *
 * These mirror the Pydantic schemas in `backend/app/schemas/`. The backend
 * is the source of truth — when an endpoint changes, update this file in
 * the same pull request (see docs/team-workflow.md).
 */

/** `GET /health` — API liveness. */
export interface HealthResponse {
  status: string;
  service: string;
}

/**
 * `GET /health/db` — PostgreSQL reachability.
 * Always returns HTTP 200; inspect `connected`.
 */
export interface DatabaseHealthResponse {
  connected: boolean;
  detail: string;
}
