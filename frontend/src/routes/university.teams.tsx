import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, Panel } from "@/components/loksrijan/dashboard-shell";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { challengeService } from "@/services/challenge.service";
import { teamService } from "@/services/team.service";
import type { TeamCreate } from "@/types/team";
import { ChallengeCard } from "@/components/loksrijan/problem-explorer";
import { UNIVERSITY_NAV } from "./university.index";

export const Route = createFileRoute("/university/teams")({
  head: () => ({
    meta: [
      { title: "Student teams — LokSrijan university workspace" },
      {
        name: "description",
        content:
          "Manage student teams, mentors, members and the civic problem each team owns.",
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
  const queryClient = useQueryClient();

  const [selected, setSelected] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [newDept, setNewDept] = useState("");
  const [newChallengeId, setNewChallengeId] = useState<number | null>(null);

  const teamsQuery = useQuery({
    queryKey: ["teams"],
    queryFn: teamService.listTeams,
  });

  const challengesQuery = useQuery({
    queryKey: ["challenges"],
    queryFn: challengeService.listChallenges,
  });

  const createMutation = useMutation({
    mutationFn: (data: TeamCreate) => teamService.createTeam(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      setSelected(created.id);
      setNewName("");
      setNewDept("");
      setNewChallengeId(null);
    },
  });

  const teams = teamsQuery.data ?? [];

  const validatedChallenges = useMemo(
    () =>
      (challengesQuery.data ?? []).filter(
        (challenge) => challenge.status === "VALIDATED",
      ),
    [challengesQuery.data],
  );

  useEffect(() => {
    if (selected === null && teams.length > 0) {
      const first = teams[0];
      if (first) {
        setSelected(first.id);
      }
    }
  }, [selected, teams]);

  const filtered = useMemo(
    () =>
      teams.filter(
        (team) =>
          team.name.toLowerCase().includes(query.toLowerCase()) ||
          team.department.toLowerCase().includes(query.toLowerCase()),
      ),
    [teams, query],
  );

  const team =
    teams.find((item) => item.id === selected) ?? filtered[0] ?? teams[0];

  const challenge = team?.challenge_id
    ? (challengesQuery.data ?? []).find(
        (item) => item.id === team.challenge_id,
      )
    : undefined;

  const addTeam = () => {
    if (!newName.trim() || !newDept.trim() || createMutation.isPending) {
      return;
    }

    createMutation.mutate({
      name: newName.trim(),
      department: newDept.trim(),
      mentor: "Unassigned",
      members: 0,
      challenge_id: newChallengeId,
    });
  };

  return (
    <DashboardShell
      role="university"
      nav={UNIVERSITY_NAV}
      title="Student teams"
      subtitle="Every team owns exactly one problem at a time, with a named faculty mentor."
      primaryAction={{
        label: createMutation.isPending ? "Registering…" : "Register a team",
        onClick: addTeam,
      }}
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

              <select
                value={newChallengeId ?? ""}
                onChange={(e) =>
                  setNewChallengeId(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                className="h-11 w-full rounded-sm border border-border bg-background px-3 text-sm text-foreground"
                aria-label="Assign civic challenge"
              >
                <option value="">Select validated challenge</option>
                {validatedChallenges.map((item) => (
                  <option key={item.id} value={item.id}>
                    CH-{item.id} — {item.title}
                  </option>
                ))}
              </select>

              <p className="text-xs text-muted-foreground">
                Use the primary action above to confirm. A team code is issued
                automatically.
              </p>

              {createMutation.isError && (
                <p className="text-xs text-destructive">
                  Unable to register the team. Please try again.
                </p>
              )}
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
              {teamsQuery.isLoading && (
                <li className="px-4 py-4 text-sm text-muted-foreground">
                  Loading teams…
                </li>
              )}

              {!teamsQuery.isLoading && filtered.length === 0 && (
                <li className="px-4 py-4 text-sm text-muted-foreground">
                  No teams found.
                </li>
              )}

              {filtered.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(item.id)}
                    className={cn(
                      "w-full border-b border-border px-4 py-3 text-left last:border-0 transition-colors",
                      item.id === selected
                        ? "bg-muted"
                        : "hover:bg-muted/60",
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {item.name}
                      </span>
                      <span className="label-caps text-muted-foreground">
                        {item.progress}%
                      </span>
                    </span>

                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {item.department}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          {team ? (
            <>
              <Panel title={team.name}>
                <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  {[
                    ["Team code", team.code],
                    ["Department", team.department],
                    ["Faculty mentor", team.mentor],
                    ["Members", `${team.members} students`],
                    ["Status", team.status],
                    ["Progress", `${team.progress}%`],
                  ].map(([key, value]) => (
                    <div key={key}>
                      <dt className="label-caps text-muted-foreground">
                        {key}
                      </dt>
                      <dd
                        className={cn(
                          "mt-1 text-sm",
                          value === "Unassigned"
                            ? "text-saffron"
                            : "text-foreground",
                        )}
                      >
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-6 h-1.5 w-full bg-muted">
                  <div
                    className="h-full bg-saffron"
                    style={{ width: `${team.progress}%` }}
                  />
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  {team.last_update}
                </p>
              </Panel>

              {challenge ? (
                <Panel title="Problem owned by this team" className="mt-6">
                  <ChallengeCard challenge={challenge} />
                </Panel>
              ) : (
                <Panel title="Problem owned by this team" className="mt-6">
                  <p className="text-sm text-muted-foreground">
                    No civic challenge has been assigned to this team yet.
                  </p>
                </Panel>
              )}
            </>
          ) : (
            <Panel title="Student teams">
              <p className="text-sm text-muted-foreground">
                No student teams have been registered yet.
              </p>
            </Panel>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}