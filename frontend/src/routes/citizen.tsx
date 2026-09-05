import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, Panel, StatTile } from "@/components/loksrijan/dashboard-shell";
import { ProblemCard, StageBadge } from "@/components/loksrijan/problem-explorer";
import { PROBLEMS } from "@/lib/loksrijan-data";

export const Route = createFileRoute("/citizen")({
  head: () => ({
    meta: [
      { title: "Citizen workspace — LokSrijan" },
      {
        name: "description",
        content:
          "Track the problems you reported, endorsements they gathered and who is building on them.",
      },
      { property: "og:title", content: "Citizen workspace — LokSrijan" },
      {
        property: "og:description",
        content: "Your reports, their stage, and the team working on them.",
      },
    ],
  }),
  component: CitizenDashboard,
});

const NAV = [
  { to: "/citizen", label: "My reports" },
  { to: "/problems", label: "Problem explorer" },
  { to: "/how-it-works", label: "How it works" },
];

function CitizenDashboard() {
  const mine = PROBLEMS.filter((p) => p.id === "LS-2411" || p.id === "LS-2466");
  const nearby = PROBLEMS.slice(1, 4);

  return (
    <DashboardShell
      role="citizen"
      nav={NAV}
      title="Your reports"
      subtitle="Two problems filed, both moving. You'll be asked to confirm any fix before it closes."
      primaryAction={{ label: "Report a new problem" }}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Filed by you" value="2" note="Both accepted by the district cell" />
        <StatTile
          label="Endorsements"
          value="414"
          tone="saffron"
          note="Neighbours who confirmed the same problem"
        />
        <StatTile label="In build" value="1" tone="field" note="Drain Sentinels, MANIT Bhopal" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Panel title="Problems you reported">
          <div className="space-y-4">
            {mine.map((p) => (
              <div key={p.id} className="border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="label-caps text-muted-foreground">{p.id}</span>
                  <StageBadge stage={p.stage} />
                </div>
                <p className="mt-2 text-sm font-semibold text-foreground">{p.title}</p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Last update: {p.timeline[p.timeline.length - 1]?.note}
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Waiting on you">
          <ul className="space-y-4 text-sm">
            <li className="border-l-2 border-saffron pl-3">
              <p className="font-medium text-foreground">Confirm sensor placement</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Drain Sentinels want to add a fifth node near the vegetable arcade.
              </p>
            </li>
            <li className="border-l-2 border-field pl-3">
              <p className="font-medium text-foreground">Field visit on 14 Sep</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Jal Sathi Foundation will collect shop loss figures.
              </p>
            </li>
          </ul>
        </Panel>
      </div>

      <h2 className="mt-10 text-lg font-semibold text-foreground">
        Problems near you worth endorsing
      </h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {nearby.map((p) => (
          <ProblemCard key={p.id} problem={p} />
        ))}
      </div>
    </DashboardShell>
  );
}
