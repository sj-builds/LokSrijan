import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/loksrijan/site-shell";
import { ProblemExplorer } from "@/components/loksrijan/problem-explorer";

export const Route = createFileRoute("/problems/")({
  head: () => ({
    meta: [
      { title: "Live civic problems — LokSrijan" },
      {
        name: "description",
        content:
          "Search verified civic problems by district, sector and stage — from first report to department adoption.",
      },
      { property: "og:title", content: "Live civic problems — LokSrijan" },
      {
        property: "og:description",
        content: "Every problem carries named evidence, a stage and an owner.",
      },
    ],
  }),
  component: ProblemsPage,
});

function ProblemsPage() {
  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-6xl px-5 py-14">
        <ProblemExplorer />
      </div>
    </SiteShell>
  );
}
