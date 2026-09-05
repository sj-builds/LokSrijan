import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, Panel, StatTile } from "@/components/loksrijan/dashboard-shell";
import { ProblemCard } from "@/components/loksrijan/problem-explorer";
import { PROBLEMS, TEAMS } from "@/lib/loksrijan-data";

export const Route = createFileRoute("/university/")({
  head: () => ({
    meta: [
      { title: "University workspace — LokSrijan" },
      {
        name: "description",
        content:
          "Assign verified civic problems to student teams and track mentor coverage and delivery.",
      },
      { property: "og:title", content: "University workspace — LokSrijan" },
      {
        property: "og:description",
        content: "Route live problems to student teams and keep every build accountable.",
      },
    ],
  }),
  component: UniversityDashboard,
});

export const UNIVERSITY_NAV = [
  { to: "/university", label: "Overview" },
  { to: "/university/teams", label: "Student teams" },
  { to: "/problems", label: "Problem explorer" },
];

function UniversityDashboard() {
  const open = PROBLEMS.filter((p) => p.teams === 0);
  const active = TEAMS.filter((t) => t.status !== "Submitted");

  return (
    <DashboardShell
      role="university"
      nav={UNIVERSITY_NAV}
      title="MANIT Bhopal — nodal cell"
      subtitle="Five teams registered this semester. Two problems in your district still have no takers."
      primaryAction={{ label: "Assign a problem to a team", to: "/university/teams" }}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Registered teams" value="5" note="Across 4 departments" />
        <StatTile label="Active builds" value={String(active.length)} tone="saffron" />
        <StatTile label="Mentor gaps" value="1" note="Baler Bandhu has no mentor" />
        <StatTile
          label="Adopted this year"
          value="1"
          tone="field"
          note="Setu Mobility, Sriperumbudur"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Team progress">
          <div className="space-y-5">
            {active.map((t) => (
              <div key={t.id}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">{t.name}</p>
                  <span className="label-caps text-muted-foreground">{t.status}</span>
                </div>
                <div className="mt-2 h-1.5 w-full bg-muted">
                  <div className="h-full bg-saffron" style={{ width: `${t.progress}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">{t.lastUpdate}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Semester checkpoints">
          <ul className="space-y-4 text-sm">
            {[
              ["15 Sep", "Mid-semester demo for all building teams"],
              ["28 Sep", "NGO field validation window closes"],
              ["10 Oct", "Industry mentor review panel"],
            ].map(([d, l]) => (
              <li key={d} className="flex gap-3 border-b border-border pb-3 last:border-0">
                <span className="label-caps w-16 shrink-0 text-field">{d}</span>
                <span className="text-muted-foreground">{l}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <h2 className="mt-10 text-lg font-semibold text-foreground">
        Unclaimed problems you can assign
      </h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {open.map((p) => (
          <ProblemCard key={p.id} problem={p} />
        ))}
      </div>
    </DashboardShell>
  );
}
