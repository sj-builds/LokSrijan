import { createFileRoute } from "@tanstack/react-router";
import { ProblemExplorer } from "@/components/loksrijan/problem-explorer";
import { SiteShell } from "@/components/loksrijan/site-shell";

export const Route = createFileRoute("/challenges/")({
  head: () => ({
    meta: [
      { title: "Challenges — LokSrijan" },
      {
        name: "description",
        content:
          "Explore real-world challenges currently tracked by LokSrijan.",
      },
    ],
  }),
  component: ChallengesPage,
});

function ChallengesPage() {
  return (
    <SiteShell>
      <main className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-8">
        <ProblemExplorer
          heading="Challenge explorer"
          description="Explore real-world challenges currently tracked by the platform."
        />
      </main>
    </SiteShell>
  );
}