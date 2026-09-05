import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, Panel } from "@/components/loksrijan/dashboard-shell";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PROBLEMS, TEAMS, problemById, type StudentTeam } from "@/lib/loksrijan-data";
import { UNIVERSITY_NAV } from "./university.index";

export const Route = createFileRoute("/university/teams")({
  head: () => ({
    meta: [
      { title: "Student teams — LokSrijan university workspace" },
      {
        name: "description",
        content: "Manage student teams, mentors, members and the civic problem each team owns.",
      },
      { property: "og:title", content: "Student teams — LokSrijan" },
      {
        property: "og:description",
        content: "Create teams, assign mentors and route problems to them.",
      },
    ],
  }),
  component: TeamsPage,
});

function TeamsPage() {
  const [teams, setTeams] = useState<StudentTeam[]>(TEAMS);
  const [selected, setSelected] = useState<string>(TEAMS[0]!.id);
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [newDept, setNewDept] = useState("");

  const filtered = useMemo(
    () =>
      teams.filter(
        (t) =>
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.department.toLowerCase().includes(query.toLowerCase()),
      ),
    [teams, query],
  );
  const team = teams.find((t) => t.id === selected) ?? teams[0]!;
  const problem = problemById(team.problemId);

  const addTeam = () => {
    if (!newName.trim()) return;
    const created: StudentTeam = {
      id: `LS-TEAM-${1240 + teams.length + 1}`,
      name: newName.trim(),
      department: newDept.trim() || "Department pending",
      mentor: "Unassigned",
      members: 0,
      problemId: PROBLEMS[4]!.id,
      status: "Forming",
      progress: 0,
      lastUpdate: "Team created, awaiting members",
    };
    setTeams([created, ...teams]);
    setSelected(created.id);
    setNewName("");
    setNewDept("");
  };

  return (
    <DashboardShell
      role="university"
      nav={UNIVERSITY_NAV}
      title="Student teams"
      subtitle="Every team owns exactly one problem at a time, with a named faculty mentor."
      primaryAction={{ label: "Register a team", onClick: addTeam }}
    >
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div>
          <Panel title="Register a new team">
            <div className="space-y-3">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Team name"
                className="h-11 rounded-sm"
                aria-label="Team name"
              />
              <Input
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                placeholder="Department"
                className="h-11 rounded-sm"
                aria-label="Department"
              />
              <p className="text-xs text-muted-foreground">
                Use the primary action above to confirm. A team code is issued automatically.
              </p>
            </div>
          </Panel>

          <div className="mt-6">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search teams"
              className="h-11 rounded-sm"
              aria-label="Search teams"
            />
            <ul className="mt-3 border border-border bg-card">
              {filtered.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(t.id)}
                    className={cn(
                      "w-full border-b border-border px-4 py-3 text-left last:border-0 transition-colors",
                      t.id === selected ? "bg-muted" : "hover:bg-muted/60",
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">{t.name}</span>
                      <span className="label-caps text-muted-foreground">{t.progress}%</span>
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {t.department}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <Panel title={team.name}>
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                ["Team code", team.id],
                ["Department", team.department],
                ["Faculty mentor", team.mentor],
                ["Members", `${team.members} students`],
                ["Status", team.status],
                ["Progress", `${team.progress}%`],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="label-caps text-muted-foreground">{k}</dt>
                  <dd
                    className={cn(
                      "mt-1 text-sm",
                      v === "Unassigned" ? "text-saffron" : "text-foreground",
                    )}
                  >
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 h-1.5 w-full bg-muted">
              <div className="h-full bg-saffron" style={{ width: `${team.progress}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{team.lastUpdate}</p>
          </Panel>

          {problem && (
            <Panel title="Problem owned by this team" className="mt-6">
              <p className="label-caps text-muted-foreground">{problem.id}</p>
              <p className="mt-2 text-base font-semibold text-foreground">{problem.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{problem.summary}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {[
                  ["District", `${problem.district}, ${problem.state}`],
                  ["Severity", problem.severity],
                  ["Affected", problem.affected.toLocaleString("en-IN")],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="label-caps text-muted-foreground">{k}</p>
                    <p className="mt-1 text-sm text-foreground">{v}</p>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
