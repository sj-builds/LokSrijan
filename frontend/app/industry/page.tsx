import type { Metadata } from "next";

import { PageShell } from "@/components/shared/page-shell";

export const metadata: Metadata = {
  title: "Industry",
  description: "Sponsor pilots and scale proven solutions.",
};

export default function IndustryPage() {
  return (
    <PageShell
      badge="Placeholder"
      title="Industry dashboard"
      description="Sponsorship, pilot support, and scaling of proven solutions. Not implemented yet."
    >
      <p className="max-w-2xl text-sm text-muted-foreground">
        This route will surface challenges and validated pilots where an
        industry partner can contribute funding, equipment, or technical
        capability.
      </p>
    </PageShell>
  );
}
