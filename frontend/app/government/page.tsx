import type { Metadata } from "next";

import { PageShell } from "@/components/shared/page-shell";

export const metadata: Metadata = {
  title: "Government",
  description: "Validate and prioritise challenges.",
};

export default function GovernmentPage() {
  return (
    <PageShell
      badge="Placeholder"
      title="Government dashboard"
      description="Desktop-first validation and prioritisation workspace. Not implemented yet."
    >
      <p className="max-w-2xl text-sm text-muted-foreground">
        This route will hold clustered challenges awaiting human validation,
        district-level views, and progress tracking. Every AI suggestion shown
        here will carry its reasoning, and a person makes the final decision.
      </p>
    </PageShell>
  );
}
