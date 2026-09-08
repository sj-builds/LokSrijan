"use client";

import { useEffect, useState } from "react";

import { API_BASE_URL, ApiError, api } from "@/lib/api";
import type { DatabaseHealthResponse, HealthResponse } from "@/types/api";

type Probe<T> =
  | { state: "loading" }
  | { state: "ok"; data: T }
  | { state: "error"; message: string };

function toMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

/**
 * Development-only connectivity check.
 *
 * Proves the pipeline end to end: browser -> Next.js -> FastAPI -> response.
 * This is a temporary diagnostic, not final UI.
 */
export function ApiStatus() {
  const [health, setHealth] = useState<Probe<HealthResponse>>({
    state: "loading",
  });
  const [database, setDatabase] = useState<Probe<DatabaseHealthResponse>>({
    state: "loading",
  });

  useEffect(() => {
    let cancelled = false;

    api
      .health()
      .then((data) => {
        if (!cancelled) setHealth({ state: "ok", data });
      })
      .catch((error: unknown) => {
        if (!cancelled)
          setHealth({ state: "error", message: toMessage(error) });
      });

    api
      .databaseHealth()
      .then((data) => {
        if (!cancelled) setDatabase({ state: "ok", data });
      })
      .catch((error: unknown) => {
        if (!cancelled)
          setDatabase({ state: "error", message: toMessage(error) });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Target API:{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          {API_BASE_URL}
        </code>
      </p>

      <dl className="divide-y divide-border rounded-lg border border-border">
        <Row label="GET /health" aria-label="API liveness">
          {health.state === "loading" ? (
            <Pending />
          ) : health.state === "error" ? (
            <Bad>{health.message}</Bad>
          ) : (
            <Good>
              {health.data.status} · {health.data.service}
            </Good>
          )}
        </Row>

        <Row label="GET /health/db">
          {database.state === "loading" ? (
            <Pending />
          ) : database.state === "error" ? (
            <Bad>{database.message}</Bad>
          ) : database.data.connected ? (
            <Good>{database.data.detail}</Good>
          ) : (
            <Bad>{database.data.detail}</Bad>
          )}
        </Row>
      </dl>

      <p className="text-xs text-muted-foreground">
        A failing database check is expected until PostgreSQL is running. The
        API itself stays healthy without it.
      </p>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <dt className="font-mono text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

function Pending() {
  return <span className="text-muted-foreground">Checking…</span>;
}

function Good({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-medium text-emerald-600 dark:text-emerald-400">
      {children}
    </span>
  );
}

function Bad({ children }: { children: React.ReactNode }) {
  return <span className="font-medium text-destructive">{children}</span>;
}
