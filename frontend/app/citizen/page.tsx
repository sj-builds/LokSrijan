import type { Metadata } from "next";

import { PageShell } from "@/components/shared/page-shell";

export const metadata: Metadata = {
  title: "Citizen",
  description: "Report a local problem.",
};

export default function CitizenPage() {
  return (
    <PageShell
      badge="Placeholder"
      title="Report a problem"
      description="Mobile-first problem submission for citizens. Not implemented yet."
    >
      <p className="max-w-2xl text-sm text-muted-foreground">
        This route will hold the citizen submission flow: a short description,
        an optional photo, and location — then AI-assisted structuring of that
        report into a reviewable problem record.
      </p>
    </PageShell>
  );
}
