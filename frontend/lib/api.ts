/**
 * API client for the LokSrijan backend.
 *
 * Every network call from the frontend goes through this module. Nothing
 * else should call `fetch` directly — that keeps the base URL, error
 * handling, and headers in one place.
 *
 * The base URL comes from NEXT_PUBLIC_API_URL (see frontend/.env.example).
 */

import type { DatabaseHealthResponse, HealthResponse } from "@/types/api";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** Thrown for any failed API call. `status` is 0 when the API is unreachable. */
export class ApiError extends Error {
  readonly status: number;
  readonly url: string;

  constructor(message: string, status: number, url: string, cause?: unknown) {
    super(message, { cause });
    this.name = "ApiError";
    this.status = status;
    this.url = url;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      // Health and dashboard data must never be served stale.
      cache: "no-store",
    });
  } catch (cause) {
    throw new ApiError(
      `Cannot reach the LokSrijan API at ${API_BASE_URL}. Is the backend running?`,
      0,
      url,
      cause,
    );
  }

  if (!response.ok) {
    throw new ApiError(
      `Request failed with status ${response.status}`,
      response.status,
      url,
    );
  }

  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string): Promise<T> => request<T>(path),

  post: <T>(path: string, body: unknown): Promise<T> =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),

  /** `GET /health` — is the API process up? */
  health: (): Promise<HealthResponse> => request<HealthResponse>("/health"),

  /** `GET /health/db` — is PostgreSQL reachable? */
  databaseHealth: (): Promise<DatabaseHealthResponse> =>
    request<DatabaseHealthResponse>("/health/db"),
};
