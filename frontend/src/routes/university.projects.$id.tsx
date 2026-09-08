import { useEffect, useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Send,
} from "lucide-react";
import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";

import {
  DashboardShell,
  Panel,
} from "@/components/loksrijan/dashboard-shell";
import { cn } from "@/lib/utils";
import { challengeService } from "@/services/challenge.service";
import { impactService } from "@/services/impact.service";
import { projectService } from "@/services/project.service";
import { solutionService } from "@/services/solution.service";
import type {
  ImpactCreate,
  ImpactUpdate,
} from "@/types/impact";
import type { SolutionPassportResponse } from "@/types/solution";
import type { ProjectStatus } from "@/types/project";
import {
  PROJECT_STATUS_LABELS,
} from "@/types/project";
import { UNIVERSITY_NAV } from "./university.index";

export const Route = createFileRoute("/university/projects/$id")({
  head: () => ({
    meta: [
      {
        title: "Project workspace — LokSrijan university workspace",
      },
      {
        name: "description",
        content:
          "Track and advance a LokSrijan solution project through its delivery lifecycle.",
      },
      {
        property: "og:title",
        content: "Project workspace — LokSrijan",
      },
      {
        property: "og:description",
        content:
          "Manage project progress from draft through implementation.",
      },
    ],
  }),
  component: ProjectWorkspace,
});

const PROJECT_STEPS: ProjectStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "IN_PROGRESS",
  "COMPLETED",
];

function ProjectWorkspace() {
  const { id } = Route.useParams();
  const projectId = Number(id);
  const queryClient = useQueryClient();

  const [beneficiaries, setBeneficiaries] = useState("");
  const [outcome, setOutcome] = useState("");
  const [impactScore, setImpactScore] = useState("");
  const [evidence, setEvidence] = useState("");
  const [metricName, setMetricName] = useState("");
  const [baselineValue, setBaselineValue] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [actualValue, setActualValue] = useState("");
  const [unit, setUnit] = useState("");
  const [direction, setDirection] = useState<"down" | "up">("down");

  // ---------------------------------------------------------------------------
  // Project
  // ---------------------------------------------------------------------------

  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectService.getProject(projectId),
    enabled:
      Number.isInteger(projectId) &&
      projectId > 0,
  });

  const project = projectQuery.data;

  // ---------------------------------------------------------------------------
  // Challenge
  // ---------------------------------------------------------------------------

  const challengeId = project?.challenge_id;

  const challengeQuery = useQuery({
    queryKey: ["challenge", challengeId],
    queryFn: () =>
      challengeService.getChallenge(challengeId!),
    enabled: Boolean(challengeId),
  });

  const challenge = challengeQuery.data;

  // ---------------------------------------------------------------------------
  // Impact
  // ---------------------------------------------------------------------------

  const impactQuery = useQuery({
    queryKey: ["impact", projectId],
    queryFn: () =>
      impactService.getImpact(projectId),
    enabled:
      Boolean(project) &&
      project?.status === "COMPLETED",
    retry: false,
  });

  // Populate the form when an existing impact record is available.
  useEffect(() => {
    if (!impactQuery.data) {
      return;
    }

    setBeneficiaries(
      String(
        impactQuery.data.beneficiaries ?? "",
      ),
    );

    setOutcome(
      impactQuery.data.outcome ?? "",
    );

    setImpactScore(
      String(
        impactQuery.data.impact_score ?? "",
      ),
    );

    setEvidence(
      impactQuery.data.evidence ?? "",
    );

    setMetricName(
      impactQuery.data.metric_name ?? "",
    );

    setBaselineValue(
      impactQuery.data.baseline_value !== null &&
        impactQuery.data.baseline_value !== undefined
        ? String(impactQuery.data.baseline_value)
        : "",
    );

    setTargetValue(
      impactQuery.data.target_value !== null &&
        impactQuery.data.target_value !== undefined
        ? String(impactQuery.data.target_value)
        : "",
    );

    setActualValue(
      impactQuery.data.actual_value !== null &&
        impactQuery.data.actual_value !== undefined
        ? String(impactQuery.data.actual_value)
        : "",
    );

    setUnit(impactQuery.data.unit ?? "");
    setDirection(
      impactQuery.data.improvement_direction === "up" ? "up" : "down",
    );
  }, [impactQuery.data]);

  // ---------------------------------------------------------------------------
  // Project lifecycle mutation
  // ---------------------------------------------------------------------------

  const statusMutation = useMutation({
    mutationFn: (
      newStatus: ProjectStatus,
    ) =>
      projectService.updateProjectStatus(
        projectId,
        newStatus,
      ),

    onSuccess: (updatedProject) => {
      queryClient.setQueryData(
        ["project", projectId],
        updatedProject,
      );

      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });
    },
  });

  // ---------------------------------------------------------------------------
  // Impact mutation
  // ---------------------------------------------------------------------------

  const impactMutation = useMutation({
    mutationFn: async () => {
      const payload: ImpactCreate = {
        project_id: projectId,
        outcome: outcome.trim(),
        evidence: evidence.trim() || null,
        metric_name: metricName.trim() || null,
        baseline_value: baselineValue
          ? Number(baselineValue)
          : null,
        target_value: targetValue ? Number(targetValue) : null,
        actual_value: actualValue ? Number(actualValue) : null,
        unit: unit.trim() || null,
        improvement_direction: direction,
      };

      if (beneficiaries) {
        payload.beneficiaries = Number(beneficiaries);
      }

      if (impactScore) {
        payload.impact_score = Number(impactScore);
      }

      // If an impact record already exists,
      // update it instead of creating another one.
      if (impactQuery.data) {
        const updatePayload: ImpactUpdate = {
          beneficiaries: beneficiaries
            ? Number(beneficiaries)
            : null,
          outcome: outcome.trim(),
          impact_score: impactScore
            ? Number(impactScore)
            : null,
          evidence: evidence.trim() || null,
          metric_name: metricName.trim() || null,
          baseline_value: baselineValue
            ? Number(baselineValue)
            : null,
          target_value: targetValue ? Number(targetValue) : null,
          actual_value: actualValue ? Number(actualValue) : null,
          unit: unit.trim() || null,
          improvement_direction: direction,
        };

        return impactService.updateImpact(
          projectId,
          updatePayload,
        );
      }

      return impactService.createImpact(
        payload,
      );
    },

    onSuccess: (savedImpact) => {
      queryClient.setQueryData(
        ["impact", projectId],
        savedImpact,
      );
    },
  });

  // ---------------------------------------------------------------------------
  // Solution passport
  // ---------------------------------------------------------------------------

  const passportsQuery = useQuery({
    queryKey: ["passports"],
    queryFn: () => solutionService.listPassports(),
    enabled: Boolean(project) && project?.status === "COMPLETED",
    retry: false,
  });

  const passport = (passportsQuery.data ?? []).find(
    (item: SolutionPassportResponse) => item.project_id === projectId,
  );

  const passportMutation = useMutation({
    mutationFn: () => solutionService.generatePassport(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passports"] });
    },
  });

  const publishPassportMutation = useMutation({
    mutationFn: (passportId: number) =>
      solutionService.publishPassport(passportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passports"] });
    },
  });

  // ---------------------------------------------------------------------------
  // Next project status
  // ---------------------------------------------------------------------------

  const nextStatus = useMemo(() => {
    if (!project) {
      return null;
    }

    if (project.status === "DRAFT") {
      return "SUBMITTED" as ProjectStatus;
    }

    if (project.status === "APPROVED") {
      return "IN_PROGRESS" as ProjectStatus;
    }

    if (project.status === "IN_PROGRESS") {
      return "COMPLETED" as ProjectStatus;
    }

    return null;
  }, [project]);

  const actionLabel =
    nextStatus === "SUBMITTED"
      ? "Submit for government review"
      : nextStatus === "IN_PROGRESS"
        ? "Start implementation"
        : nextStatus === "COMPLETED"
          ? "Mark project completed"
          : null;

  const handleStatusUpdate = () => {
    if (
      !nextStatus ||
      statusMutation.isPending
    ) {
      return;
    }

    statusMutation.mutate(nextStatus);
  };

  const currentStepIndex = project
    ? PROJECT_STEPS.indexOf(project.status)
    : -1;

  // Client-side mirror of the backend improvement formula, purely for
  // live preview — the stored value always comes from the server.
  const baselineNum = baselineValue ? Number(baselineValue) : null;
  const targetNum = targetValue ? Number(targetValue) : null;
  const actualNum = actualValue ? Number(actualValue) : null;
  const previewImprovement =
    baselineNum !== null &&
    actualNum !== null &&
    baselineNum !== 0
      ? (() => {
          const raw =
            ((baselineNum - actualNum) / Math.abs(baselineNum)) *
            100;
          const value = direction === "up" ? -raw : raw;
          return Math.round(value * 10) / 10;
        })()
      : null;

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  if (projectQuery.isPending) {
    return (
      <DashboardShell
        role="university"
        nav={UNIVERSITY_NAV}
        title="Project workspace"
        subtitle="Loading project details and current lifecycle status."
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="h-[520px] animate-pulse border border-border bg-card" />
          <div className="h-80 animate-pulse border border-border bg-card" />
        </div>
      </DashboardShell>
    );
  }

  // ---------------------------------------------------------------------------
  // Project not found / invalid ID
  // ---------------------------------------------------------------------------

  if (
    projectQuery.isError ||
    !project ||
    !Number.isInteger(projectId) ||
    projectId <= 0
  ) {
    return (
      <DashboardShell
        role="university"
        nav={UNIVERSITY_NAV}
        title="Project workspace"
        subtitle="The requested project could not be loaded."
      >
        <Panel title="Project not found">
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Unable to load this project from the LokSrijan server.
            </p>

            <Link
              to="/university"
              className="mt-4 inline-block text-sm font-medium text-saffron hover:underline"
            >
              Return to university workspace →
            </Link>
          </div>
        </Panel>
      </DashboardShell>
    );
  }

  // ---------------------------------------------------------------------------
  // Main workspace
  // ---------------------------------------------------------------------------

  return (
    <DashboardShell
      role="university"
      nav={UNIVERSITY_NAV}
      title="Project workspace"
      subtitle="Track the solution project from draft through implementation."
      primaryAction={
        actionLabel
          ? {
              label: statusMutation.isPending
                ? "Updating…"
                : actionLabel,
              onClick: handleStatusUpdate,
            }
          : undefined
      }
    >
      <div className="mb-6">
        <Link
          to="/university"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to university workspace
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* ================================================================= */}
        {/* LEFT COLUMN                                                       */}
        {/* ================================================================= */}

        <div className="space-y-6">
          {/* ----------------------------------------------------------------- */}
          {/* Project information                                              */}
          {/* ----------------------------------------------------------------- */}

          <Panel title={project.title}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="label-caps rounded-sm bg-saffron-soft px-2 py-1 text-foreground">
                PROJECT #{project.id}
              </span>

              <span
                className={cn(
                  "label-caps rounded-sm px-2 py-1",
                  project.status === "COMPLETED"
                    ? "bg-field text-primary-foreground"
                    : project.status === "APPROVED" ||
                        project.status === "IN_PROGRESS"
                      ? "bg-field-soft text-accent-foreground"
                      : project.status === "REJECTED"
                        ? "bg-muted text-muted-foreground"
                        : "bg-saffron-soft text-foreground",
                )}
              >
                {
                  PROJECT_STATUS_LABELS[
                    project.status
                  ]
                }
              </span>
            </div>

            <div className="mt-6">
              <p className="label-caps text-muted-foreground">
                Project description
              </p>

              <p className="mt-2 text-sm leading-relaxed text-foreground">
                {project.description}
              </p>
            </div>

            <div className="mt-6">
              <p className="label-caps text-muted-foreground">
                Solution summary
              </p>

              <p className="mt-2 text-sm leading-relaxed text-foreground">
                {project.solution_summary}
              </p>
            </div>

            <div className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
              <div>
                <p className="label-caps text-muted-foreground">
                  Category
                </p>

                <p className="mt-1 text-sm text-foreground">
                  {project.category}
                </p>
              </div>

              <div>
                <p className="label-caps text-muted-foreground">
                  Challenge
                </p>

                <Link
                  to="/challenges/$id"
                  params={{
                    id: String(
                      project.challenge_id,
                    ),
                  }}
                  className="mt-1 inline-block text-sm font-medium text-saffron hover:underline"
                >
                  CH-{project.challenge_id} →
                </Link>
              </div>
            </div>

            {/* Project lifecycle error */}
            {statusMutation.isError && (
              <div className="mt-6 border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm font-medium text-destructive">
                  Unable to update the project status.
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  The server rejected this lifecycle transition. Please
                  refresh and try again.
                </p>
              </div>
            )}

            {/* Rejected project */}
            {project.status === "REJECTED" && (
              <div className="mt-6 border border-border bg-muted/40 p-4">
                <p className="text-sm font-medium text-foreground">
                  Project rejected
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  This project cannot move forward through the current
                  lifecycle.
                </p>
              </div>
            )}

            {/* Completed project */}
            {project.status === "COMPLETED" && (
              <div className="mt-6 border border-field/30 bg-field-soft p-4">
                <p className="text-sm font-medium text-foreground">
                  Project completed
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  The next stage is to record measurable project impact.
                </p>
              </div>
            )}
          </Panel>

          {/* ----------------------------------------------------------------- */}
          {/* Source challenge                                                  */}
          {/* ----------------------------------------------------------------- */}

          {challenge && (
            <Panel title="Source challenge">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-field-soft">
                  <CheckCircle2 className="size-4 text-accent-foreground" />
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground">
                    CH-{challenge.id} ·{" "}
                    {challenge.title}
                  </p>

                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {challenge.description}
                  </p>
                </div>
              </div>
            </Panel>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* Impact tracking                                                   */}
          {/* ----------------------------------------------------------------- */}

          {project.status === "COMPLETED" && (
            <Panel
              title="Project impact"
              action={
                impactQuery.data ? (
                  <span
                    className={cn(
                      "label-caps rounded-sm px-2 py-1",
                      impactQuery.data.verification_status === "VERIFIED"
                        ? "bg-field text-primary-foreground"
                        : "bg-amber-100 text-amber-800",
                    )}
                  >
                    {impactQuery.data.verification_status === "VERIFIED"
                      ? "Verified impact"
                      : "Verification pending"}
                  </span>
                ) : undefined
              }
            >
              <div className="space-y-5">
                <div>
                  <p className="label-caps text-muted-foreground">
                    Measurable outcome
                  </p>

                  <textarea
                    value={outcome}
                    onChange={(event) =>
                      setOutcome(
                        event.target.value,
                      )
                    }
                    placeholder="Describe the measurable outcome achieved by this project."
                    rows={4}
                    className="mt-2 w-full resize-none border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-saffron"
                  />
                </div>

                <div>
                  <p className="label-caps text-muted-foreground">
                    What is being measured?
                  </p>

                  <input
                    value={metricName}
                    onChange={(event) =>
                      setMetricName(event.target.value)
                    }
                    placeholder="e.g. Water testing turnaround"
                    className="mt-2 w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-saffron"
                  />
                </div>

                <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
                  <div>
                    <p className="label-caps text-muted-foreground">
                      Baseline
                    </p>

                    <input
                      type="number"
                      value={baselineValue}
                      onChange={(event) =>
                        setBaselineValue(event.target.value)
                      }
                      placeholder="e.g. 5"
                      className="mt-2 w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-saffron"
                    />
                  </div>

                  <div>
                    <p className="label-caps text-muted-foreground">
                      Target
                    </p>

                    <input
                      type="number"
                      value={targetValue}
                      onChange={(event) =>
                        setTargetValue(event.target.value)
                      }
                      placeholder="e.g. 1"
                      className="mt-2 w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-saffron"
                    />
                  </div>

                  <div>
                    <p className="label-caps text-muted-foreground">
                      Actual
                    </p>

                    <input
                      type="number"
                      value={actualValue}
                      onChange={(event) =>
                        setActualValue(event.target.value)
                      }
                      placeholder="e.g. 1.3"
                      className="mt-2 w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-saffron"
                    />
                  </div>

                  <div>
                    <p className="label-caps text-muted-foreground">
                      Unit
                    </p>

                    <input
                      value={unit}
                      onChange={(event) =>
                        setUnit(event.target.value)
                      }
                      placeholder="e.g. days"
                      className="mt-2 w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-saffron"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="radio"
                      checked={direction === "down"}
                      onChange={() => setDirection("down")}
                      className="accent-saffron"
                    />
                    Lower is better
                  </label>

                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="radio"
                      checked={direction === "up"}
                      onChange={() => setDirection("up")}
                      className="accent-saffron"
                    />
                    Higher is better
                  </label>

                  {previewImprovement !== null && (
                    <span className="label-caps rounded-sm bg-field-soft px-2 py-1 text-accent-foreground">
                      Improvement: {previewImprovement}%
                    </span>
                  )}
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <p className="label-caps text-muted-foreground">
                      Beneficiaries
                    </p>

                    <input
                      type="number"
                      min="0"
                      value={beneficiaries}
                      onChange={(event) =>
                        setBeneficiaries(
                          event.target.value,
                        )
                      }
                      placeholder="e.g. 250"
                      className="mt-2 w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-saffron"
                    />
                  </div>

                  <div>
                    <p className="label-caps text-muted-foreground">
                      Impact score
                    </p>

                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={impactScore}
                      onChange={(event) =>
                        setImpactScore(
                          event.target.value,
                        )
                      }
                      placeholder="0–100"
                      className="mt-2 w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-saffron"
                    />
                  </div>
                </div>

                <div>
                  <p className="label-caps text-muted-foreground">
                    Evidence
                  </p>

                  <textarea
                    value={evidence}
                    onChange={(event) =>
                      setEvidence(
                        event.target.value,
                      )
                    }
                    placeholder="Add evidence, measurements, references, or implementation notes."
                    rows={3}
                    className="mt-2 w-full resize-none border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-saffron"
                  />
                </div>

                {impactQuery.data?.verification_note && (
                  <div className="border border-border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Verification note:
                    </span>{" "}
                    {impactQuery.data.verification_note}
                  </div>
                )}

                {/* Impact loading */}
                {impactQuery.isPending && (
                  <p className="text-xs text-muted-foreground">
                    Checking for an existing impact record…
                  </p>
                )}

                {/* Impact save error */}
                {impactMutation.isError && (
                  <div className="border border-destructive/30 bg-destructive/5 p-4">
                    <p className="text-sm font-medium text-destructive">
                      Unable to save project impact.
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      The server rejected the impact record. Please verify
                      the values and try again.
                    </p>
                  </div>
                )}

                {/* Impact saved */}
                {impactMutation.isSuccess && (
                  <div className="border border-field/30 bg-field-soft p-4">
                    <p className="text-sm font-medium text-foreground">
                      Impact recorded successfully
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      The measurable outcome for this completed project
                      has been saved.
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  disabled={
                    impactMutation.isPending ||
                    !outcome.trim()
                  }
                  onClick={() =>
                    impactMutation.mutate()
                  }
                  className="border border-saffron bg-saffron px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {impactMutation.isPending
                    ? "Saving impact…"
                    : impactQuery.data
                      ? "Update impact"
                      : "Record impact"}
                </button>
              </div>
            </Panel>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* Solution passport                                                  */}
          {/* ----------------------------------------------------------------- */}

          {project.status === "COMPLETED" && (
            <Panel
              title="Solution passport"
              action={
                passport ? (
                  <span
                    className={cn(
                      "label-caps rounded-sm px-2 py-1",
                      passport.status === "PUBLISHED"
                        ? "bg-field text-primary-foreground"
                        : "bg-saffron-soft text-foreground",
                    )}
                  >
                    {passport.status === "PUBLISHED"
                      ? "Published"
                      : "Draft"}
                  </span>
                ) : undefined
              }
            >
              {passportsQuery.isPending ? (
                <p className="text-xs text-muted-foreground">
                  Checking for an existing passport…
                </p>
              ) : passport ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={cn(
                        "label-caps rounded-sm px-2 py-1",
                        passport.impact_verification_status === "VERIFIED"
                          ? "bg-field text-primary-foreground"
                          : "bg-amber-100 text-amber-800",
                      )}
                    >
                      Impact:{" "}
                      {passport.impact_verification_status === "VERIFIED"
                        ? "Verified"
                        : "Verification pending"}
                    </span>

                    {passport.is_demo && (
                      <span className="label-caps rounded-sm border border-border px-2 py-1 text-muted-foreground">
                        Demo record
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="label-caps text-muted-foreground">
                      Measured impact
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {passport.metric_name ?? "Outcome"}:{" "}
                      {passport.baseline_value ?? "—"}
                      {passport.unit ? ` ${passport.unit}` : ""} →{" "}
                      {passport.actual_value ?? "—"}
                      {passport.unit ? ` ${passport.unit}` : ""}
                      {passport.improvement_pct !== null &&
                        ` · ${passport.improvement_pct}% improvement`}
                    </p>
                  </div>

                  <div>
                    <p className="label-caps text-muted-foreground">
                      Solution
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-foreground">
                      {passport.solution}
                    </p>
                  </div>

                  {passport.technology && (
                    <div>
                      <p className="label-caps text-muted-foreground">
                        Technology
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {passport.technology}
                      </p>
                    </div>
                  )}

                  {passport.replication_suitability && (
                    <div>
                      <p className="label-caps text-muted-foreground">
                        Replication suitability
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {passport.replication_suitability}
                      </p>
                    </div>
                  )}

                  {passport.status === "DRAFT" && (
                    <button
                      type="button"
                      disabled={publishPassportMutation.isPending}
                      onClick={() =>
                        publishPassportMutation.mutate(passport.id)
                      }
                      className="border border-field bg-field px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {publishPassportMutation.isPending
                        ? "Publishing…"
                        : "Publish for replication"}
                    </button>
                  )}

                  {publishPassportMutation.isError && (
                    <p className="text-xs text-destructive">
                      Unable to publish the passport. Please try again.
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Distill this completed project and its measured impact
                    into a reusable solution document. Published passports
                    feed replication matching for future challenges.
                  </p>

                  <button
                    type="button"
                    disabled={
                      passportMutation.isPending ||
                      !impactQuery.data
                    }
                    onClick={() => passportMutation.mutate()}
                    className="mt-4 border border-saffron bg-saffron px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {passportMutation.isPending
                      ? "Generating…"
                      : "Generate passport"}
                  </button>

                  {!impactQuery.data && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Record measurable impact first — the passport is built
                      from the impact ledger.
                    </p>
                  )}

                  {passportMutation.isError && (
                    <p className="mt-2 text-xs text-destructive">
                      Unable to generate the passport. Please try again.
                    </p>
                  )}
                </div>
              )}
            </Panel>
          )}
        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN                                                      */}
        {/* ================================================================= */}

        <div className="space-y-6">
          {/* ----------------------------------------------------------------- */}
          {/* Project lifecycle                                                 */}
          {/* ----------------------------------------------------------------- */}

          <Panel title="Project lifecycle">
            <div className="space-y-1">
              {PROJECT_STEPS.map(
                (step, index) => {
                  const isCurrent =
                    step === project.status;

                  const isComplete =
                    currentStepIndex >= 0 &&
                    index < currentStepIndex;

                  return (
                    <div
                      key={step}
                      className="flex items-start gap-3"
                    >
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "flex size-8 items-center justify-center rounded-full border",
                            isCurrent
                              ? "border-saffron bg-saffron text-primary-foreground"
                              : isComplete
                                ? "border-field bg-field text-primary-foreground"
                                : "border-border bg-muted text-muted-foreground",
                          )}
                        >
                          {isComplete ? (
                            <CheckCircle2 className="size-4" />
                          ) : isCurrent ? (
                            <Clock3 className="size-4" />
                          ) : (
                            <span className="text-xs font-semibold">
                              {index + 1}
                            </span>
                          )}
                        </div>

                        {index <
                          PROJECT_STEPS.length -
                            1 && (
                          <div
                            className={cn(
                              "my-1 h-6 w-px",
                              isComplete
                                ? "bg-field"
                                : "bg-border",
                            )}
                          />
                        )}
                      </div>

                      <div className="pt-1">
                        <p
                          className={cn(
                            "text-sm",
                            isCurrent ||
                              isComplete
                              ? "font-medium text-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          {
                            PROJECT_STATUS_LABELS[
                              step
                            ]
                          }
                        </p>

                        {isCurrent && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Current project stage
                          </p>
                        )}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </Panel>

          {/* ----------------------------------------------------------------- */}
          {/* Next action                                                       */}
          {/* ----------------------------------------------------------------- */}

          <Panel title="Next action">
            {actionLabel ? (
              <div>
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-saffron-soft">
                    <Send className="size-4 text-foreground" />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {actionLabel}
                    </p>

                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {nextStatus ===
                      "SUBMITTED"
                        ? "Send this project to the government review queue."
                        : nextStatus ===
                            "IN_PROGRESS"
                          ? "Begin implementation after government approval."
                          : "Mark the solution as delivered and ready for impact measurement."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={
                    handleStatusUpdate
                  }
                  disabled={
                    statusMutation.isPending
                  }
                  className="mt-5 w-full border border-saffron bg-saffron px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {statusMutation.isPending
                    ? "Updating…"
                    : actionLabel}
                </button>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {project.status ===
                "SUBMITTED"
                  ? "This project is waiting for government review."
                  : project.status ===
                      "UNDER_REVIEW"
                    ? "Government is currently reviewing this project."
                    : project.status ===
                        "REJECTED"
                      ? "No further lifecycle action is available."
                      : project.status ===
                          "COMPLETED"
                        ? "Project delivery is complete. Record its measurable impact next."
                        : "No action is currently required."}
              </p>
            )}
          </Panel>

          {/* ----------------------------------------------------------------- */}
          {/* Lifecycle note                                                    */}
          {/* ----------------------------------------------------------------- */}

          <div className="border border-border bg-card p-4">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Project #{project.id} is
              linked to challenge #
              {project.challenge_id}.
              Lifecycle changes are
              validated by the LokSrijan
              backend state machine.
            </p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}