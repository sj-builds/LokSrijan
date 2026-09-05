import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, Panel, StatTile } from "@/components/loksrijan/dashboard-shell";
import { ProblemCard } from "@/components/loksrijan/problem-explorer";
import { PROBLEMS, TEAMS } from "@/lib/loksrijan-data";

export const Route = createFileRoute("/industry")({
  head: () => ({
    meta: [
      { title: "Industry workspace — LokSrijan" },
      {
        name: "description",
        content: "Mentor student teams, fund pilots and adopt working civic prototypes.",
      },
      { property: "og:title", content: "Industry workspace — LokSrijan" },
      {
        property: "og:description",
        content: "Mentorship hours, pilot funding and adoption pipeline in one view.",
      },
    ],
  }),
  component: IndustryDashboard,
});

const NAV = [
  { to: "/industry", label: "Overview" },
  { to: "/problems", label: "Problem explorer" },
];

function IndustryDashboard() {
  const mentored = TEAMS.filter((t) => t.status === "Building" || t.status === "Pilot review");

  return (
    <DashboardShell
      role="industry"
      nav={NAV}
      title="Tata Elxsi CSR — civic partnerships"
      subtitle="Three teams mentored this semester, two pilots part-funded, one prototype ready for adoption review."
      primaryAction={{ label: "Sponsor a pilot" }}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Teams mentored" value={String(mentored.length)} />
        <StatTile
          label="Mentor hours logged"
          value="164"
          tone="saffron"
          note="Across 9 engineers"
        />
        <StatTile label="Pilot funding committed" value="₹18.5L" tone="field" />
        <StatTile label="Ready for adoption" value="1" note="ColdBox Collective, Barmer" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Panel title="Teams you mentor">
          <div className="space-y-5">
            {mentored.map((t) => (
              <div key={t.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">{t.name}</p>
                  <span className="label-caps text-muted-foreground">{t.status}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{t.department}</p>
                <div className="mt-2 h-1.5 w-full bg-muted">
                  <div className="h-full bg-foreground" style={{ width: `${t.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Technical review queue">
          <ul className="space-y-4 text-sm">
            <li className="border-l-2 border-saffron pl-3">
              <p className="text-foreground">ColdBox thermal log — 41-day dataset</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Due 12 Sep · assigned to R. Menon
              </p>
            </li>
            <li className="border-l-2 border-border pl-3">
              <p className="text-foreground">Squall Watch telemetry parser</p>
              <p className="mt-1 text-xs text-muted-foreground">Due 21 Sep · unassigned</p>
            </li>
          </ul>
        </Panel>
      </div>

      <h2 className="mt-10 text-lg font-semibold text-foreground">
        Problems matching your capability areas
      </h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {PROBLEMS.slice(1, 3).map((p) => (
          <ProblemCard key={p.id} problem={p} />
        ))}
      </div>
    </DashboardShell>
  );
}
