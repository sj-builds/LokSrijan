import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  DashboardShell,
  Panel,
  StatTile,
} from "@/components/loksrijan/dashboard-shell";
import { StatusBadge } from "@/components/loksrijan/problem-explorer";
import { challengeService } from "@/services/challenge.service";
import { projectService } from "@/services/project.service";

import type {
  ChallengeCreate,
  ChallengeStatus,
} from "@/types/challenge";
import type { ProjectStatus } from "@/types/project";

export const Route = createFileRoute("/government")({
  head: () => ({
    meta: [
      { title: "Government workspace — LokSrijan" },
      {
        name: "description",
        content:
          "Review civic challenges, validate problems and track solution progress.",
      },
      {
        property: "og:title",
        content: "Government workspace — LokSrijan",
      },
      {
        property: "og:description",
        content:
          "Government workspace for reviewing civic challenges and tracking solution progress.",
      },
    ],
  }),
  component: GovernmentDashboard,
});

const NAV = [
  { to: "/government", label: "Priority list" },
  { to: "/challenges", label: "Problem explorer" },
];

const NEXT_STATUSES: Record<ChallengeStatus, ChallengeStatus[]> = {
  SUBMITTED: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["VALIDATED", "REJECTED"],
  VALIDATED: [],
  REJECTED: [],
  TEAM_FORMED: [],
  IN_PROGRESS: [],
  SOLUTION_PROPOSED: [],
  IMPLEMENTED: [],
  RESOLVED: [],
};

const NEXT_PROJECT_STATUSES: Record<
  ProjectStatus,
  ProjectStatus[]
> = {
  DRAFT: [],
  SUBMITTED: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: [],
  REJECTED: [],
  IN_PROGRESS: [],
  COMPLETED: [],
};

function GovernmentDashboard() {
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [form, setForm] = useState<ChallengeCreate>({
    title: "",
    description: "",
    category: "",
    location: "",
    severity: "MEDIUM",
  });

  const challengesQuery = useQuery({
    queryKey: ["challenges"],
    queryFn: () => challengeService.listChallenges(),
  });

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectService.listProjects(),
  });

  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number;
      status: ChallengeStatus;
    }) => challengeService.updateChallengeStatus(id, status),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["challenges"],
      });
    },
  });

  const projectStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number;
      status: ProjectStatus;
    }) => projectService.updateProjectStatus(id, status),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });
    },
  });

  const createChallengeMutation = useMutation({
    mutationFn: (data: ChallengeCreate) =>
      challengeService.createChallenge(data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["challenges"],
      });

      setForm({
        title: "",
        description: "",
        category: "",
        location: "",
        severity: "MEDIUM",
      });

      setShowCreateForm(false);
    },
  });

  const challenges = challengesQuery.data ?? [];
  const projects = projectsQuery.data ?? [];

  const validatedChallenges = challenges.filter(
    (challenge) => challenge.status === "VALIDATED",
  );

  const activeProjects = projects.filter(
    (project) => project.status === "IN_PROGRESS",
  );

  const projectsUnderReview = projects.filter(
    (project) => project.status === "UNDER_REVIEW",
  );

  const completedProjects = projects.filter(
    (project) => project.status === "COMPLETED",
  );

  return (
    <DashboardShell
      role="government"
      nav={NAV}
      title="Dept. of Urban Development — adoption desk"
      subtitle="Review validated civic challenges and track solution progress across the platform."
    >
      {/* Challenge management */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Challenge management
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a new civic challenge for review.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateForm((value) => !value)}
          className="inline-flex h-10 items-center rounded-sm bg-saffron px-4 text-sm font-medium text-primary-foreground hover:bg-saffron/90"
        >
          {showCreateForm ? "Close form" : "Create challenge"}
        </button>
      </div>

      {/* Create challenge form */}
      {showCreateForm && (
        <Panel title="Create civic challenge" className="mb-8">
          <form
            onSubmit={(event) => {
              event.preventDefault();

              createChallengeMutation.mutate(form);
            }}
            className="grid gap-5 md:grid-cols-2"
          >
            <label className="grid gap-2">
              <span className="text-sm font-medium text-foreground">
                Title
              </span>

              <input
                required
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                className="h-10 border border-border bg-card px-3 text-sm outline-none focus:border-saffron"
                placeholder="e.g. Flooding near Ward 12"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-foreground">
                Category
              </span>

              <input
                required
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    category: event.target.value,
                  }))
                }
                className="h-10 border border-border bg-card px-3 text-sm outline-none focus:border-saffron"
                placeholder="Infrastructure"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-foreground">
                Location
              </span>

              <input
                required
                value={form.location}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    location: event.target.value,
                  }))
                }
                className="h-10 border border-border bg-card px-3 text-sm outline-none focus:border-saffron"
                placeholder="Delhi, India"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-foreground">
                Severity
              </span>

              <select
                value={form.severity}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    severity: event.target.value as NonNullable<ChallengeCreate["severity"]>,
                  }))
                }
                className="h-10 border border-border bg-card px-3 text-sm outline-none focus:border-saffron"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </label>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-medium text-foreground">
                Description
              </span>

              <textarea
                required
                rows={4}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                className="border border-border bg-card px-3 py-2 text-sm outline-none focus:border-saffron"
                placeholder="Describe the civic problem, its impact, and affected community."
              />
            </label>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={createChallengeMutation.isPending}
                className="inline-flex h-10 items-center rounded-sm bg-foreground px-5 text-sm font-medium text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createChallengeMutation.isPending
                  ? "Creating..."
                  : "Create challenge"}
              </button>
            </div>

            {createChallengeMutation.isError && (
              <p className="text-sm text-destructive md:col-span-2">
                Unable to create the challenge. Please check the form and try
                again.
              </p>
            )}
          </form>
        </Panel>
      )}

      {/* Platform metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Validated challenges"
          value={String(validatedChallenges.length)}
        />

        <StatTile
          label="Active projects"
          value={String(activeProjects.length)}
          tone="saffron"
        />

        <StatTile
          label="Projects under review"
          value={String(projectsUnderReview.length)}
          tone="field"
        />

        <StatTile
          label="Completed projects"
          value={String(completedProjects.length)}
        />
      </div>

      {/* Priority list */}
      <Panel title="Priority list" className="mt-8">
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                {["ID", "Problem", "Location", "Severity", "Status"].map(
                  (header) => (
                    <th
                      key={header}
                      className="label-caps pb-3 text-muted-foreground"
                    >
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>

            <tbody>
              {challengesQuery.isPending ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    Loading current challenges...
                  </td>
                </tr>
              ) : challengesQuery.isError ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    Unable to load current challenges.
                  </td>
                </tr>
              ) : challenges.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    No challenges available.
                  </td>
                </tr>
              ) : (
                challenges.map((challenge) => (
                  <tr
                    key={challenge.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">
                      CH-{challenge.id}
                    </td>

                    <td className="max-w-sm py-3 pr-4 text-foreground">
                      {challenge.title}
                    </td>

                    <td className="py-3 pr-4 text-muted-foreground">
                      {challenge.location}
                    </td>

                    <td className="py-3 pr-4 font-medium text-foreground">
                      {challenge.severity}
                    </td>

                    <td className="py-3">
                      <select
                        value={challenge.status}
                        disabled={
                          statusMutation.isPending ||
                          NEXT_STATUSES[challenge.status].length === 0
                        }
                        onChange={(event) => {
                          const newStatus =
                            event.target.value as ChallengeStatus;

                          if (newStatus !== challenge.status) {
                            statusMutation.mutate({
                              id: challenge.id,
                              status: newStatus,
                            });
                          }
                        }}
                        className="border border-border bg-card px-2 py-1 text-xs font-medium text-foreground outline-none focus:border-saffron disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label={`Update status for ${challenge.title}`}
                      >
                        <option value={challenge.status}>
                          {challenge.status}
                        </option>

                        {NEXT_STATUSES[challenge.status].map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Validated challenges and project pipeline */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Validated challenges">
          {validatedChallenges.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No validated challenges are currently available.
            </p>
          ) : (
            <div className="space-y-4">
              {validatedChallenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <p className="text-sm font-medium text-foreground">
                    {challenge.title}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {challenge.location} · {challenge.category}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Severity: {challenge.severity}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Project pipeline">
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No projects have been created yet.
            </p>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {project.title}
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {project.category} · Challenge #{project.challenge_id}
                      </p>
                    </div>

                    <select
                      value={project.status}
                      disabled={
                        projectStatusMutation.isPending ||
                        NEXT_PROJECT_STATUSES[project.status].length === 0
                      }
                      onChange={(event) => {
                        const newStatus =
                          event.target.value as ProjectStatus;

                        if (newStatus !== project.status) {
                          projectStatusMutation.mutate({
                            id: project.id,
                            status: newStatus,
                          });
                        }
                      }}
                      className="border border-border bg-card px-2 py-1 text-xs font-medium text-foreground outline-none focus:border-saffron disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label={`Update status for ${project.title}`}
                    >
                      <option value={project.status}>
                        {project.status}
                      </option>

                      {NEXT_PROJECT_STATUSES[project.status].map(
                        (status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </DashboardShell>
  );
}