import type { Metadata } from "next";

import { PageShell } from "@/components/shared/page-shell";

export const metadata: Metadata = {
  title: "NGO",
  description: "Field partnership and ground validation.",
};

export default function NgoPage() {
  return (
    <PageShell
      badge="Placeholder"
      title="NGO dashboard"
      description="Field partnership, ground validation, and community context. Not implemented yet."
    >
      <p className="max-w-2xl text-sm text-muted-foreground">
        This route will let partner organisations confirm what is actually
        happening on the ground, add local context to a challenge, and
        collaborate on pilots.
      </p>
    </PageShell>
  );
}
