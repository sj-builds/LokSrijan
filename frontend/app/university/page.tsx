import type { Metadata } from "next";

import { PageShell } from "@/components/shared/page-shell";

export const metadata: Metadata = {
  title: "University",
  description: "Adopt challenges as student and faculty projects.",
};

export default function UniversityPage() {
  return (
    <PageShell
      badge="Placeholder"
      title="University dashboard"
      description="Challenge discovery and project adoption for departments. Not implemented yet."
    >
      <p className="max-w-2xl text-sm text-muted-foreground">
        This route will show challenges recommended to a department based on its
        declared capabilities, along with the reasons behind each
        recommendation, and the projects it has taken on.
      </p>
    </PageShell>
  );
}
