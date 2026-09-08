import type { Metadata } from "next";

import { ApiStatus } from "@/components/shared/api-status";
import { PageShell } from "@/components/shared/page-shell";

export const metadata: Metadata = {
  title: "Dev status",
  description: "Local development connectivity check.",
};

export default function DevPage() {
  return (
    <PageShell
      badge="Development only"
      title="Connectivity check"
      description="Verifies that the browser can reach the FastAPI backend and that the backend can reach PostgreSQL. Delete this route once real features exist."
    >
      <ApiStatus />
    </PageShell>
  );
}
