import { useMemo, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { DashboardShell, Panel } from "@/components/loksrijan/dashboard-shell";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { challengeService } from "@/services/challenge.service";
import { projectService } from "@/services/project.service";
import type { ProjectCreate } from "@/types/project";
import { UNIVERSITY_NAV } from "./university.index";

export const Route = createFileRoute("/university/projects/new")({
  validateSearch: (search: Record<string, unknown>) => ({
    challengeId: Number(search["challengeId"]) || 0,
  }),

  head: () => ({
    meta: [
      { title: "Create project — LokSrijan university workspace" },
      {
        name: "description",
        content:
          "Create a solution project from a validated LokSrijan civic challenge.",
      },
      {
        property: "og:title",
        content: "Create project — LokSrijan",
      },
      {
        property: "og:description",
        content:
          "Turn a validated civic challenge into a structured student project.",
      },
    ],
  }),
  component: CreateProjectPage,
});

function CreateProjectPage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [solutionSummary, setSolutionSummary] = useState("");

  const search = Route.useSearch();

  const challengeId = Number(search.challengeId);

  const challengeQuery = useQuery({
    queryKey: ["challenge", challengeId],
    queryFn: () => challengeService.getChallenge(challengeId),
    enabled: Number.isInteger(challengeId) && challengeId > 0,
  });

  const challenge = challengeQuery.data;

  const createMutation = useMutation({
    mutationFn: (data: ProjectCreate) => projectService.createProject(data),
    onSuccess: (project) => {
      navigate({
        to: "/university",
      });

      console.log("Project created:", project);
    },
  });

  const category = useMemo(
    () => challenge?.category ?? "",
    [challenge?.category],
  );

  const canSubmit =
    Boolean(challenge) &&
    challenge?.status === "VALIDATED" &&
    title.trim().length >= 2 &&
    description.trim().length >= 10 &&
    solutionSummary.trim().length >= 10 &&
    !createMutation.isPending;

  const handleCreate = () => {
    if (!canSubmit || !challenge) {
      return;
    }

    createMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      solution_summary: solutionSummary.trim(),
      category: challenge.category,
      challenge_id: challenge.id,
    });
  };

  const isInvalidChallenge =
    !Number.isInteger(challengeId) ||
    challengeId <= 0 ||
    (!challengeQuery.isPending && !challengeQuery.data);

  return (
    <DashboardShell
      role="university"
      nav={UNIVERSITY_NAV}
      title="Create project"
      subtitle="Turn a validated civic challenge into a structured solution project."
      primaryAction={{
        label: createMutation.isPending ? "Creating…" : "Create project",
        onClick: handleCreate,
      }}
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

      {challengeQuery.isPending && (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="h-[480px] animate-pulse border border-border bg-card" />
          <div className="h-64 animate-pulse border border-border bg-card" />
        </div>
      )}

      {isInvalidChallenge && (
        <Panel title="Challenge not found">
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              The selected civic challenge could not be found.
            </p>

            <Link
              to="/challenges"
              className="mt-4 inline-block text-sm font-medium text-saffron hover:underline"
            >
              Browse challenges →
            </Link>
          </div>
        </Panel>
      )}

      {challenge && challenge.status !== "VALIDATED" && (
        <Panel title="Challenge is not available">
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Projects can only be created from validated civic challenges.
            </p>

            <p className="mt-2 text-xs text-muted-foreground">
              CH-{challenge.id} is currently {challenge.status.replaceAll("_", " ")}.
            </p>

            <Link
              to="/challenges/$id"
              params={{ id: String(challenge.id) }}
              className="mt-4 inline-block text-sm font-medium text-saffron hover:underline"
            >
              View challenge →
            </Link>
          </div>
        </Panel>
      )}

      {challenge && challenge.status === "VALIDATED" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <Panel title="Project details">
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="project-title"
                  className="label-caps text-muted-foreground"
                >
                  Project title
                </label>

                <Input
                  id="project-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Give your solution project a clear name"
                  className="mt-2 h-11 rounded-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="project-description"
                  className="label-caps text-muted-foreground"
                >
                  Project description
                </label>

                <textarea
                  id="project-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe what the project will build, who it serves and how it addresses the challenge."
                  rows={6}
                  className="mt-2 w-full resize-none rounded-sm border border-border bg-background px-3 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-saffron"
                />
              </div>

              <div>
                <label
                  htmlFor="solution-summary"
                  className="label-caps text-muted-foreground"
                >
                  Solution summary
                </label>

                <textarea
                  id="solution-summary"
                  value={solutionSummary}
                  onChange={(event) =>
                    setSolutionSummary(event.target.value)
                  }
                  placeholder="Summarize the proposed solution, approach and expected result."
                  rows={6}
                  className="mt-2 w-full resize-none rounded-sm border border-border bg-background px-3 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-saffron"
                />
              </div>

              {createMutation.isError && (
                <div className="border border-destructive/30 bg-destructive/5 p-4">
                  <p className="text-sm font-medium text-destructive">
                    Unable to create the project.
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Check the project details and make sure the backend is
                    running, then try again.
                  </p>
                </div>
              )}

              <div className="border-t border-border pt-4">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  A new project starts as <strong>DRAFT</strong>. You can
                  submit it for government review after creation.
                </p>
              </div>
            </div>
          </Panel>

          <div className="space-y-6">
            <Panel title="Source challenge">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="label-caps text-muted-foreground">
                    CH-{challenge.id}
                  </span>

                  <span className="label-caps rounded-sm bg-field-soft px-2 py-1 text-accent-foreground">
                    VALIDATED
                  </span>
                </div>

                <h2 className="mt-3 text-lg font-semibold leading-snug text-foreground">
                  {challenge.title}
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {challenge.description}
                </p>

                <div className="mt-4 space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">
                      Category:
                    </span>{" "}
                    {challenge.category}
                  </p>

                  <p>
                    <span className="font-medium text-foreground">
                      Location:
                    </span>{" "}
                    {challenge.location}
                  </p>

                  <p>
                    <span className="font-medium text-foreground">
                      Severity:
                    </span>{" "}
                    {challenge.severity}
                  </p>
                </div>
              </div>
            </Panel>

            <Panel title="Project pipeline">
              <div className="space-y-4">
                {[
                  ["1", "Draft", true],
                  ["2", "Submit for review", false],
                  ["3", "Government review", false],
                  ["4", "Approved / rejected", false],
                  ["5", "Implementation", false],
                ].map(([step, label, current]) => (
                  <div key={String(step)} className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                        current
                          ? "border-saffron bg-saffron text-primary-foreground"
                          : "border-border bg-muted text-muted-foreground",
                      )}
                    >
                      {current ? (
                        <CheckCircle2 className="size-3.5" />
                      ) : (
                        step
                      )}
                    </div>

                    <div>
                      <p
                        className={cn(
                          "text-sm",
                          current
                            ? "font-medium text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <div className="border border-border bg-card p-4">
              <p className="text-xs leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">
                  Category:
                </span>{" "}
                {category || "Inherited from challenge"}
              </p>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}