import { createFileRoute } from "@tanstack/react-router";
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

export const Route = createFileRoute("/industry")({
  head: () => ({
    meta: [
      { title: "Industry workspace — LokSrijan" },
      {
        name: "description",
        content:
          "Review civic challenges, track projects and support solutions through the LokSrijan pipeline.",
      },
      {
        property: "og:title",
        content: "Industry workspace — LokSrijan",
      },
      {
        property: "og:description",
        content:
          "Industry view of civic challenges and solution projects.",
      },
    ],
  }),
  component: IndustryDashboard,
});

const NAV = [
  { to: "/industry", label: "Overview" },
  { to: "/challenges", label: "Problem explorer" },
];

function IndustryDashboard() {
  const challengesQuery = useQuery({
    queryKey: ["challenges"],
    queryFn: () => challengeService.listChallenges(),
  });

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectService.listProjects(),
  });

  const challenges = challengesQuery.data ?? [];
  const projects = projectsQuery.data ?? [];

  const validatedChallenges = challenges.filter(
    (challenge) => challenge.status === "VALIDATED",
  );

  const activeProjects = projects.filter(
    (project) =>
      project.status === "APPROVED" ||
      project.status === "IN_PROGRESS",
  );

  const projectsUnderReview = projects.filter(
    (project) =>
      project.status === "SUBMITTED" ||
      project.status === "UNDER_REVIEW",
  );

  const completedProjects = projects.filter(
    (project) => project.status === "COMPLETED",
  );

  return (
    <DashboardShell
      role="industry"
      nav={NAV}
      title="Industry workspace — civic partnerships"
      subtitle="Review validated civic challenges, follow solution projects and identify opportunities to support implementation."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Validated challenges"
          value={String(validatedChallenges.length)}
          note="Challenges ready for solution teams"
        />

        <StatTile
          label="Active projects"
          value={String(activeProjects.length)}
          tone="saffron"
          note="Approved or currently in progress"
        />

        <StatTile
          label="Projects under review"
          value={String(projectsUnderReview.length)}
          tone="field"
          note="Projects awaiting review"
        />

        <StatTile
          label="Completed projects"
          value={String(completedProjects.length)}
          note="Projects that reached completion"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Panel title="Solution project pipeline">
          {projectsQuery.isPending ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-24 animate-pulse border border-border bg-muted"
                />
              ))}
            </div>
          ) : projectsQuery.isError ? (
            <div className="border border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Unable to load projects.
              </p>
              <button
                type="button"
                onClick={() => projectsQuery.refetch()}
                className="mt-3 text-sm font-medium text-saffron hover:underline"
              >
                Try again
              </button>
            </div>
          ) : projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No solution projects have been created yet.
            </p>
          ) : (
            <div className="space-y-5">
              {projects.slice(0, 5).map((project) => (
                <div
                  key={project.id}
                  className="border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">
                      {project.title}
                    </p>

                    <span className="label-caps text-muted-foreground">
                      PR-{project.id}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {project.category}
                    {project.challenge_id
                      ? ` · Challenge CH-${project.challenge_id}`
                      : ""}
                  </p>

                  <div className="mt-2">
                    <span className="label-caps text-muted-foreground">
                      {project.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Industry opportunities">
          <div className="space-y-4 text-sm">
            <div className="border-l-2 border-saffron pl-3">
              <p className="font-medium text-foreground">
                Support validated challenges
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Review validated civic problems and identify where industry
                expertise can contribute.
              </p>
            </div>

            <div className="border-l-2 border-field pl-3">
              <p className="font-medium text-foreground">
                Review solution projects
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Follow projects as they move from submission through
                implementation.
              </p>
            </div>

            <div className="border-l-2 border-border pl-3">
              <p className="font-medium text-foreground">
                Support implementation
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Completed and progressing projects provide opportunities for
                technical and implementation support.
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-10 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Validated challenges
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Real challenges that have passed the validation stage.
          </p>
        </div>

        <a
          href="/challenges"
          className="text-sm font-medium text-foreground underline underline-offset-4"
        >
          Browse all
        </a>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {challengesQuery.isPending ? (
          [1, 2].map((item) => (
            <div
              key={item}
              className="h-56 animate-pulse border border-border bg-card"
            />
          ))
        ) : challengesQuery.isError ? (
          <div className="border border-dashed border-border p-6 text-sm text-muted-foreground md:col-span-2">
            Unable to load current challenges.
          </div>
        ) : validatedChallenges.length === 0 ? (
          <div className="border border-dashed border-border p-6 text-sm text-muted-foreground md:col-span-2">
            No validated challenges are currently available.
          </div>
        ) : (
          validatedChallenges.slice(0, 4).map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
            />
          ))
        )}
      </div>

      <div className="mt-8">
        <Panel title="Challenge status overview">
          {challenges.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No challenges are currently available.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                "SUBMITTED",
                "UNDER_REVIEW",
                "VALIDATED",
                "IN_PROGRESS",
              ].map((status) => {
                const count = challenges.filter(
                  (challenge) => challenge.status === status,
                ).length;

                const challenge = challenges.find(
                  (item) => item.status === status,
                );

                return (
                  <div
                    key={status}
                    className="border border-border p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="label-caps text-muted-foreground">
                        {status}
                      </span>

                      {challenge && (
                        <StatusBadge status={challenge.status} />
                      )}
                    </div>

                    <p className="mt-3 font-display text-2xl font-bold text-foreground">
                      {count}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>
    </DashboardShell>
  );
}