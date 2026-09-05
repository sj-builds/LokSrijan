import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { CheckCircle2, Circle } from "lucide-react";
import { DashboardShell, Panel, StatTile } from "@/components/loksrijan/dashboard-shell";
import { cn } from "@/lib/utils";
import { problemById, teamById } from "@/lib/loksrijan-data";

export const Route = createFileRoute("/team")({
  beforeLoad: () => {
    throw redirect({ to: "/university/teams" });
  },
  head: () => ({
    meta: [
      { title: "Team workspace — LokSrijan" },
      {
        name: "description",
        content: "One problem, one build log, one submission deadline for your student team.",
      },
      { property: "og:title", content: "Team workspace — LokSrijan" },
      { property: "og:description", content: "Focused workspace for the problem your team owns." },
    ],
  }),
  component: TeamWorkspace,
});

const NAV = [
  { to: "/team", label: "Our build" },
  { to: "/problems", label: "Problem explorer" },
];

const INITIAL_TASKS = [
  { id: 1, label: "Install ultrasonic level sensors at 4 drain nodes", done: true },
  { id: 2, label: "Calibrate against manual gauge readings for 10 days", done: true },
  { id: 3, label: "Build ward-office alert dashboard", done: false },
  { id: 4, label: "Run a full monsoon-day stress test", done: false },
  { id: 5, label: "Submit pilot pack for NGO sign-off", done: false },
];

function TeamWorkspace() {
  const team = teamById("LS-TEAM-1187")!;
  const problem = problemById(team.problemId)!;
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const done = tasks.filter((t) => t.done).length;

  return (
    <DashboardShell
      role="team"
      nav={NAV}
      title={team.name}
      subtitle={`${team.department} · mentored by ${team.mentor}. One problem until it ships.`}
      primaryAction={{ label: "Post a build update" }}
    >
      <div className="border-l-4 border-saffron bg-card p-6">
        <p className="label-caps text-muted-foreground">{problem.id} · your problem</p>
        <h2 className="mt-2 text-xl font-semibold leading-snug text-foreground">{problem.title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {problem.detail}
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatTile label="Milestones done" value={`${done}/${tasks.length}`} tone="saffron" />
        <StatTile label="Days to pilot review" value="19" note="NGO field window closes 28 Sep" />
        <StatTile
          label="Members"
          value={String(team.members)}
          tone="field"
          note="Civil + Electronics"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Panel title="Build checklist">
          <ul className="space-y-1">
            {tasks.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() =>
                    setTasks(tasks.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))
                  }
                  className="flex w-full items-start gap-3 rounded-sm px-2 py-2.5 text-left hover:bg-muted"
                >
                  {t.done ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-field" />
                  ) : (
                    <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  )}
                  <span
                    className={cn(
                      "text-sm",
                      t.done ? "text-muted-foreground line-through" : "text-foreground",
                    )}
                  >
                    {t.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-6">
          <Panel title="Mentor notes">
            <ul className="space-y-4 text-sm">
              <li className="border-l-2 border-field pl-3">
                <p className="text-foreground">
                  Log raw sensor drift, not just the smoothed value.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Prof. A. Deshmukh · 2 days ago</p>
              </li>
              <li className="border-l-2 border-border pl-3">
                <p className="text-foreground">Ward office wants SMS, not an app. Plan for both.</p>
                <p className="mt-1 text-xs text-muted-foreground">Tata Elxsi CSR · 6 days ago</p>
              </li>
            </ul>
          </Panel>

          <Panel title="Reporter contact">
            <p className="text-sm text-foreground">{problem.reportedBy}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Field visits must be logged here before the pilot review. Last visit: 24 Aug 2026.
            </p>
          </Panel>
        </div>
      </div>
    </DashboardShell>
  );
}
