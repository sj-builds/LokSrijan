import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  DashboardShell,
  Panel,
  StatTile,
} from "@/components/loksrijan/dashboard-shell";
import { StatusBadge } from "@/components/loksrijan/problem-explorer";
import { challengeService } from "@/services/challenge.service";
import { projectService } from "@/services/project.service";
import { intelligenceService } from "@/services/intelligence.service";
import { clusterService } from "@/services/cluster.service";
import { impactService } from "@/services/impact.service";

import type {
  ChallengeCreate,
  ChallengeStatus,
} from "@/types/challenge";
import type { ProjectStatus } from "@/types/project";
import type { ChallengePrioritySummary } from "@/types/intelligence";
import type {
  ClusterResponse,
  ClusterSuggestResponse,
} from "@/types/cluster";

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

const CLUSTER_STATUS_LABELS: Record<string, string> = {
  SUGGESTED: "Suggested",
  VALIDATED: "Validated",
  REJECTED: "Rejected",
};

function ClusterStatusBadge({ status }: { status: string }) {
  const tone =
    status === "VALIDATED"
      ? "bg-field text-primary-foreground"
      : status === "REJECTED"
        ? "bg-muted text-muted-foreground"
        : "bg-saffron-soft text-foreground";

  return (
    <span className={cn("label-caps rounded-sm px-2 py-1", tone)}>
      {CLUSTER_STATUS_LABELS[status] ?? status}
    </span>
  );
}

function GovernmentDashboard() {
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [form, setForm] = useState<ChallengeCreate>({
    title: "",
    description: "",
    category: "",
    location: "",
    severity: "MEDIUM",
    urgency: "MEDIUM",
  });

  const challengesQuery = useQuery({
    queryKey: ["challenges"],
    queryFn: () => challengeService.listChallenges(),
  });

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectService.listProjects(),
  });

  const prioritiesQuery = useQuery({
    queryKey: ["intelligence", "priorities"],
    queryFn: () => intelligenceService.listPriorities(),
    retry: false,
  });

  const clustersQuery = useQuery({
    queryKey: ["clusters"],
    queryFn: () => clusterService.listClusters(),
    retry: false,
  });

  const impactsQuery = useQuery({
    queryKey: ["impacts"],
    queryFn: () => impactService.listImpacts(),
    retry: false,
  });

  const [verifyNotes, setVerifyNotes] = useState<Record<number, string>>(
    {},
  );

  const [suggested, setSuggested] = useState<
    ClusterSuggestResponse | null
  >(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);

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
        urgency: "MEDIUM",
      });

      setShowCreateForm(false);
    },
  });

  const createClusterMutation = useMutation({
    mutationFn: (data: {
      title: string;
      description: string;
      rationale: string;
      challenge_ids: number[];
    }) => clusterService.createCluster(data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clusters"] });
      setSuggested(null);
    },
  });

  const validateClusterMutation = useMutation({
    mutationFn: (id: number) => clusterService.validateCluster(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clusters"] });
    },
  });

  const verifyImpactMutation = useMutation({
    mutationFn: ({
      projectId,
      note,
    }: {
      projectId: number;
      note: string;
    }) =>
      impactService.verifyImpact(projectId, {
        verification_note: note,
        verified: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["impacts"] });
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

  const priorityByChallenge = new Map<number, ChallengePrioritySummary>();
  for (const item of prioritiesQuery.data ?? []) {
    priorityByChallenge.set(item.challenge_id, item);
  }

  const runSuggestClusters = async () => {
    setSuggestLoading(true);
    setSuggestError(null);

    try {
      const result = await clusterService.suggestClusters();
      setSuggested(result);
    } catch {
      setSuggested(null);
      setSuggestError(
        "Clustering is temporarily unavailable. The reports are safe; try again in a moment.",
      );
    } finally {
      setSuggestLoading(false);
    }
  };

  const clusters = clustersQuery.data ?? [];

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

            <label className="grid gap-2 md:col-span-2">
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

            <label className="grid gap-2">
              <span className="text-sm font-medium text-foreground">
                Urgency
              </span>

              <select
                value={form.urgency ?? "MEDIUM"}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    urgency: event.target.value as NonNullable<ChallengeCreate["urgency"]>,
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
                {["ID", "Problem", "Location", "Severity", "Priority", "Status"].map(
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
                    colSpan={6}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    Loading current challenges...
                  </td>
                </tr>
              ) : challengesQuery.isError ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    Unable to load current challenges.
                  </td>
                </tr>
              ) : challenges.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
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

                    <td className="py-3 pr-4">
                      {priorityByChallenge.has(challenge.id) ? (
                        <span
                          className="inline-flex items-center gap-2"
                          title={(
                            priorityByChallenge.get(challenge.id)?.top_factors ??
                            []
                          ).join(", ")}
                        >
                          <span className="h-1.5 w-12 bg-muted">
                            <span
                              className="block h-full bg-saffron"
                              style={{
                                width: `${priorityByChallenge.get(challenge.id)?.priority_score ?? 0}%`,
                              }}
                            />
                          </span>
                          <span className="text-xs font-semibold text-foreground">
                            {priorityByChallenge.get(challenge.id)
                              ?.priority_score ?? "—"}
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {prioritiesQuery.isPending
                            ? "Scoring…"
                            : "—"}
                        </span>
                      )}
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

      {/* ============================================================= */}
      {/* Impact verification                                           */}
      {/* ============================================================= */}

      <Panel title="Impact verification" className="mt-8">
        <p className="text-sm text-muted-foreground">
          Impact is only called verified when an officer records that
          decision here — never by the system automatically.
        </p>

        {impactsQuery.isPending ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Loading impact records…
          </p>
        ) : impactsQuery.isError ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Unable to load impact records.
          </p>
        ) : (impactsQuery.data ?? []).length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No impact records have been submitted yet.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {(impactsQuery.data ?? []).map((impact) => {
              const projectTitle =
                projects.find(
                  (project) => project.id === impact.project_id,
                )?.title ?? `Project #${impact.project_id}`;

              return (
                <div
                  key={impact.id}
                  className="border border-border p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {projectTitle}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {impact.metric_name ?? "Outcome"} · baseline{" "}
                        {impact.baseline_value ?? "—"}
                        {impact.unit ? ` ${impact.unit}` : ""} → actual{" "}
                        {impact.actual_value ?? "—"}
                        {impact.unit ? ` ${impact.unit}` : ""}
                        {impact.improvement_pct !== null &&
                          ` · ${impact.improvement_pct}% improvement`}
                      </p>

                      {impact.verification_note && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {impact.verification_note}
                        </p>
                      )}
                    </div>

                    <span
                      className={cn(
                        "label-caps shrink-0 rounded-sm px-2 py-1",
                        impact.verification_status === "VERIFIED"
                          ? "bg-field text-primary-foreground"
                          : "bg-amber-100 text-amber-800",
                      )}
                    >
                      {impact.verification_status === "VERIFIED"
                        ? "Verified"
                        : "Pending"}
                    </span>
                  </div>

                  {impact.verification_status === "PENDING" && (
                    <>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <input
                        value={verifyNotes[impact.project_id] ?? ""}
                        onChange={(event) =>
                          setVerifyNotes((current) => ({
                            ...current,
                            [impact.project_id]: event.target.value,
                          }))
                        }
                        placeholder="Verification note (required)"
                        className="h-9 flex-1 border border-border bg-background px-3 text-sm outline-none focus:border-saffron"
                      />

                      <button
                        type="button"
                        disabled={
                          verifyImpactMutation.isPending ||
                          !(verifyNotes[impact.project_id] ?? "")
                            .trim()
                        }
                        onClick={() =>
                          verifyImpactMutation.mutate({
                            projectId: impact.project_id,
                            note: (verifyNotes[impact.project_id] ?? "").trim(),
                          })
                        }
                        className="inline-flex h-9 items-center justify-center rounded-sm border border-field bg-field px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Verify impact
                      </button>
                    </div>

                    {verifyImpactMutation.isError && (
                      <p className="mt-2 text-xs text-destructive">
                        Unable to verify impact. The verification note must be
                        at least 5 characters — please try again.
                      </p>
                    )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* ============================================================= */}
      {/* Challenge clustering                                          */}
      {/* ============================================================= */}

      <div className="mt-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Challenge clustering
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Many citizen reports can become one systemic challenge.
              Suggestions are AI-assisted; validation is a human decision.
            </p>
          </div>

          <button
            type="button"
            onClick={runSuggestClusters}
            disabled={suggestLoading}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-sm bg-saffron px-4 text-sm font-medium text-primary-foreground hover:bg-saffron/90 disabled:opacity-50"
          >
            <Sparkles className="size-4" />
            {suggestLoading ? "Grouping reports…" : "Suggest clusters"}
          </button>
        </div>

        {suggestError && (
          <div className="mt-4 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {suggestError}
          </div>
        )}

        {suggested && suggested.suggested_clusters.length === 0 && (
          <div className="mt-4 border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No candidate clusters found. Add more reports in the same domain
            and nearby area to see suggestions.
          </div>
        )}

        {suggested && suggested.suggested_clusters.length > 0 && (
          <div className="mt-4 space-y-4">
            <p className="text-xs leading-relaxed text-muted-foreground">
              {suggested.methodology_note}
            </p>

            {suggested.suggested_clusters.map((cluster) => (
              <div key={cluster.code} className="border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="label-caps text-muted-foreground">
                        {cluster.code}
                      </span>
                      <span className="label-caps rounded-sm bg-saffron-soft px-2 py-1 text-foreground">
                        SUGGESTED
                      </span>
                    </div>

                    <h3 className="mt-2 text-base font-semibold text-foreground">
                      {cluster.title}
                    </h3>

                    <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                      {cluster.description}
                    </p>

                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      <span className="font-medium text-foreground">
                        Why?
                      </span>{" "}
                      {cluster.rationale}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={createClusterMutation.isPending}
                    onClick={() =>
                      createClusterMutation.mutate({
                        title: cluster.title,
                        description: cluster.description,
                        rationale: cluster.rationale,
                        challenge_ids: cluster.member_challenge_ids,
                      })
                    }
                    className="inline-flex h-10 shrink-0 items-center rounded-sm border border-saffron bg-saffron px-4 text-sm font-medium text-primary-foreground hover:bg-saffron/90 disabled:opacity-50"
                  >
                    Create cluster
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-3 text-xs text-muted-foreground">
                  <span>
                    <strong className="text-foreground">
                      {cluster.member_count}
                    </strong>{" "}
                    reports
                  </span>
                  <span>
                    <strong className="text-foreground">
                      {cluster.locations.length}
                    </strong>{" "}
                    locations
                  </span>
                  <span>
                    {Math.round(cluster.average_similarity * 100)}% avg
                    similarity
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {clusters.length > 0 && (
          <div className="mt-6">
            <p className="label-caps text-muted-foreground">
              Existing clusters
            </p>

            <div className="mt-2 space-y-3">
              {clusters.map((cluster: ClusterResponse) => (
                <div
                  key={cluster.id}
                  className="flex flex-col gap-3 border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="label-caps text-muted-foreground">
                        {cluster.code}
                      </span>
                      <ClusterStatusBadge status={cluster.status} />
                    </div>
                    <p className="mt-1.5 text-sm font-medium text-foreground">
                      {cluster.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {cluster.members.length} reports ·{" "}
                      {Array.from(
                        new Set(cluster.members.map((member) => member.location)),
                      ).join(", ")}
                    </p>
                  </div>

                  {cluster.status === "SUGGESTED" && (
                    <button
                      type="button"
                      disabled={validateClusterMutation.isPending}
                      onClick={() =>
                        validateClusterMutation.mutate(cluster.id)
                      }
                      className="inline-flex h-9 shrink-0 items-center rounded-sm border border-field bg-field px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                    >
                      Validate cluster
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}