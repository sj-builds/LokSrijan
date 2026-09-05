import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  DashboardShell,
  Panel,
  StatTile,
} from "@/components/loksrijan/dashboard-shell";
import {
  ChallengeCard,
  StatusBadge,
} from "@/components/loksrijan/problem-explorer";
import { challengeService } from "@/services/challenge.service";
import { projectService } from "@/services/project.service";
import { teamService } from "@/services/team.service";
import type { ChallengeStatus } from "@/types/challenge";
import type { ProjectStatus } from "@/types/project";

export const Route = createFileRoute("/university/")({
  head: () => ({
    meta: [
      { title: "University workspace — LokSrijan" },
      {
        name: "description",
        content:
          "Track verified civic challenges and student project progress through the LokSrijan pipeline.",
      },
      { property: "og:title", content: "University workspace — LokSrijan" },
      {
        property: "og:description",
        content:
          "Track civic challenges and student project delivery through the LokSrijan pipeline.",
      },
    ],
  }),
  component: UniversityDashboard,
});

export const UNIVERSITY_NAV = [
  { to: "/university", label: "Overview" },
  { to: "/university/teams", label: "Student teams" },
  { to: "/challenges", label: "Problem explorer" },
];

const ACTIVE_PROJECT_STATUSES: ProjectStatus[] = [
  "APPROVED",
  "IN_PROGRESS",
];

const REVIEW_PROJECT_STATUSES: ProjectStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
];

const ACTIVE_CHALLENGE_STATUSES: ChallengeStatus[] = [
  "TEAM_FORMED",
  "IN_PROGRESS",
  "SOLUTION_PROPOSED",
  "IMPLEMENTED",
];

function UniversityDashboard() {
  const challengesQuery = useQuery({
    queryKey: ["challenges"],
    queryFn: () => challengeService.listChallenges(),
  });

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectService.listProjects(),
  });

  const teamsQuery = useQuery({
    queryKey: ["teams"],
    queryFn: () => teamService.listTeams(),
  });

  const challenges = challengesQuery.data ?? [];
  const projects = projectsQuery.data ?? [];
  const teams = teamsQuery.data ?? [];

  const validatedChallenges = challenges.filter(
    (challenge) => challenge.status === "VALIDATED",
  );

  const activeChallenges = challenges.filter((challenge) =>
    ACTIVE_CHALLENGE_STATUSES.includes(challenge.status),
  );

  const activeProjects = projects.filter((project) =>
    ACTIVE_PROJECT_STATUSES.includes(project.status),
  );

  const projectsUnderReview = projects.filter((project) =>
    REVIEW_PROJECT_STATUSES.includes(project.status),
  );

  const completedProjects = projects.filter(
    (project) => project.status === "COMPLETED",
  );

  const activeTeams = teams.filter(
    (team) => team.status === "ACTIVE",
  );

  const isLoading =
    challengesQuery.isPending ||
    projectsQuery.isPending ||
    teamsQuery.isPending;

  const isError =
    challengesQuery.isError || projectsQuery.isError;

  if (isLoading) {
    return (
      <DashboardShell
        role="university"
        nav={UNIVERSITY_NAV}
        title="University workspace"
        subtitle="Loading the current LokSrijan challenge and project pipeline."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse border border-border bg-card"
            />
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="h-64 animate-pulse border border-border bg-card" />
          <div className="h-64 animate-pulse border border-border bg-card" />
        </div>
      </DashboardShell>
    );
  }

  if (isError) {
    return (
      <DashboardShell
        role="university"
        nav={UNIVERSITY_NAV}
        title="University workspace"
        subtitle="Unable to load the current platform data."
      >
        <div className="border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Unable to connect to the LokSrijan server.
          </p>

          <button
            type="button"
            onClick={() => {
              challengesQuery.refetch();
              projectsQuery.refetch();
              teamsQuery.refetch();
            }}
            className="mt-4 text-sm font-medium text-saffron hover:underline"
          >
            Try again
          </button>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      role="university"
      nav={UNIVERSITY_NAV}
      title="University workspace"
      subtitle="Track verified civic challenges and student project progress through the LokSrijan pipeline."
      primaryAction={{
        label: "Manage student teams",
        to: "/university/teams",
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Registered teams"
          value={String(teams.length)}
          note="Student teams in workspace"
        />

        <StatTile
          label="Active teams"
          value={String(activeTeams.length)}
          tone="saffron"
          note="Teams actively working"
        />

        <StatTile
          label="Validated challenges"
          value={String(validatedChallenges.length)}
          note="Ready for solution development"
        />

        <StatTile
          label="Active projects"
          value={String(activeProjects.length)}
          tone="field"
          note="Approved or in progress"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Project progress">
          {projects.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No projects have been registered yet.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Validated challenges can move into the project pipeline.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {projects.slice(0, 5).map((project) => {
                const progress =
                  project.status === "COMPLETED"
                    ? 100
                    : project.status === "IN_PROGRESS"
                      ? 70
                      : project.status === "APPROVED"
                        ? 50
                        : project.status === "UNDER_REVIEW"
                          ? 30
                          : project.status === "SUBMITTED"
                            ? 15
                            : 0;

                return (
                  <div key={project.id}>
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        to="/university/projects/$id"
                        params={{ id: String(project.id) }}
                        className="text-sm font-medium text-foreground hover:text-saffron hover:underline"
                      >
                        {project.title}
                      </Link>

                      <span className="label-caps text-muted-foreground">
                        {project.status.replaceAll("_", " ")}
                      </span>
                    </div>

                    <div className="mt-2 h-1.5 w-full bg-muted">
                      <div
                        className="h-full bg-saffron"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Challenge #{project.challenge_id} · {project.category}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel title="Challenge pipeline">
          <div className="space-y-4">
            {[
              ["Validated", validatedChallenges.length],
              ["Team formed / active", activeChallenges.length],
              ["Solution proposed", challenges.filter(
                (challenge) => challenge.status === "SOLUTION_PROPOSED",
              ).length],
              ["Implemented", challenges.filter(
                (challenge) => challenge.status === "IMPLEMENTED",
              ).length],
              ["Resolved", challenges.filter(
                (challenge) => challenge.status === "RESOLVED",
              ).length],
            ].map(([label, count]) => (
              <div
                key={String(label)}
                className="flex items-center justify-between border-b border-border pb-3 last:border-0"
              >
                <span className="text-sm text-muted-foreground">
                  {label}
                </span>

                <span className="text-sm font-semibold text-foreground">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-8">
        <Panel title="Student team workspace">
          {teams.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">
                No student teams have been registered yet.
              </p>

              <a
                href="/university/teams"
                className="mt-2 inline-block text-sm font-medium text-saffron hover:underline"
              >
                Register the first team →
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {teams.slice(0, 5).map((team) => (
                <div
                  key={team.id}
                  className="flex flex-col gap-3 border-b border-border pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {team.name}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {team.department} · {team.members} students · {team.code}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="label-caps text-muted-foreground">
                      {team.progress}%
                    </span>

                    <StatusBadge status={team.status} />
                  </div>
                </div>
              ))}

              <a
                href="/university/teams"
                className="inline-block pt-1 text-sm font-medium text-saffron hover:underline"
              >
                Manage student teams →
              </a>
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-10 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Validated challenges
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Verified civic problems available for solution development.
          </p>
        </div>

        <a
          href="/challenges"
          className="hidden text-sm font-medium text-saffron hover:underline sm:block"
        >
          View all challenges →
        </a>
      </div>

      {validatedChallenges.length > 0 ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {validatedChallenges.slice(0, 4).map((challenge) => (
            <div key={challenge.id}>
              <ChallengeCard challenge={challenge} />

              <Link
                to="/university/projects/new"
                search={{ challengeId: challenge.id }}
                className="mt-2 block border border-border bg-card px-4 py-2.5 text-center text-sm font-medium text-foreground transition-colors hover:border-saffron hover:text-saffron"
              >
                Start project for this challenge →
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No validated challenges are currently available.
          </p>
        </div>
      )}

      {activeChallenges.length > 0 && (
        <>
          <h2 className="mt-10 text-lg font-semibold text-foreground">
            Active civic work
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">
            {activeChallenges.slice(0, 8).map((challenge) => (
              <div
                key={challenge.id}
                className="flex items-center gap-2 border border-border bg-card px-3 py-2"
              >
                <span className="text-xs font-medium text-foreground">
                  CH-{challenge.id}
                </span>

                <StatusBadge status={challenge.status} />
              </div>
            ))}
          </div>
        </>
      )}
    </DashboardShell>
  );
}