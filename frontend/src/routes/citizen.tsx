import { createFileRoute } from "@tanstack/react-router";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";

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
import { intelligenceService } from "@/services/intelligence.service";
import type { ProblemAnalysisResponse } from "@/types/intelligence";
import { Sparkles, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/citizen")({
  head: () => ({
    meta: [
      { title: "Citizen workspace — LokSrijan" },
      {
        name: "description",
        content:
          "Browse civic challenges and follow their progress through the LokSrijan pipeline.",
      },
      {
        property: "og:title",
        content: "Citizen workspace — LokSrijan",
      },
      {
        property: "og:description",
        content:
          "Browse civic challenges and follow their progress through the LokSrijan pipeline.",
      },
    ],
  }),
  component: CitizenDashboard,
});

const NAV = [
  { to: "/citizen", label: "Civic challenges" },
  { to: "/challenges", label: "Problem explorer" },
  { to: "/how-it-works", label: "How it works" },
];

type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

const DOMAIN_TO_CATEGORY: Record<string, string> = {
  water: "Water & Sanitation",
  sanitation: "Water & Sanitation",
  education: "Education",
  healthcare: "Healthcare",
  health: "Healthcare",
  agriculture: "Agriculture",
  environment: "Environment",
  roads: "Roads & Infrastructure",
  safety: "Public Safety",
};

function CitizenDashboard() {
  const queryClient = useQueryClient();

  const [showReportForm, setShowReportForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Water & Sanitation");
  const [location, setLocation] = useState("");
  const [severity, setSeverity] = useState<Severity>("MEDIUM");
  const [urgency, setUrgency] = useState<Severity>("MEDIUM");

  // AI problem structuring state.
  const [aiAnalysis, setAiAnalysis] = useState<ProblemAnalysisResponse | null>(
    null,
  );
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const challengesQuery = useQuery({
    queryKey: ["challenges"],
    queryFn: () => challengeService.listChallenges(),
  });

  const createChallengeMutation = useMutation({
    mutationFn: () =>
      challengeService.createChallenge({
        title,
        description,
        category,
        location,
        severity,
        urgency,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["challenges"],
      });

      setShowReportForm(false);
      setTitle("");
      setDescription("");
      setCategory("Water & Sanitation");
      setLocation("");
      setSeverity("MEDIUM");
      setUrgency("MEDIUM");
      setAiAnalysis(null);
      setAiError(null);
    },
  });

  const runAiAnalysis = async () => {
    if (description.trim().length < 10) {
      setAiError(
        "Add at least a few sentences so the AI has something to structure.",
      );
      return;
    }

    setAiLoading(true);
    setAiError(null);

    try {
      const analysis = await intelligenceService.analyzeProblem(
        description.trim(),
      );
      setAiAnalysis(analysis);
    } catch {
      setAiAnalysis(null);
      setAiError(
        "AI analysis is temporarily unavailable. Your report is saved as-is and can be processed later.",
      );
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiSuggestions = () => {
    if (!aiAnalysis) {
      return;
    }

    const mappedCategory = DOMAIN_TO_CATEGORY[
      aiAnalysis.domain.toLowerCase()
    ];

    if (
      aiAnalysis.problem &&
      aiAnalysis.problem !== "Problem requires manual analysis"
    ) {
      // Backend ChallengeCreate caps the title at 200 characters;
      // truncate so an overly verbose AI suggestion cannot silently
      // fail the submit with a 422.
      setTitle(aiAnalysis.problem.slice(0, 200));
    }

    if (mappedCategory) {
      setCategory(mappedCategory);
    }

    setSeverity(aiAnalysis.severity);
    setUrgency(aiAnalysis.urgency);
  };

  const aiNeedsVerification =
    aiAnalysis !== null &&
    (aiAnalysis.human_verification_required ||
      aiAnalysis.confidence < 0.8);

  const challenges = challengesQuery.data ?? [];

  const validatedCount = challenges.filter(
    (challenge) => challenge.status === "VALIDATED",
  ).length;

  const activeCount = challenges.filter(
    (challenge) =>
      challenge.status === "TEAM_FORMED" ||
      challenge.status === "IN_PROGRESS" ||
      challenge.status === "SOLUTION_PROPOSED",
  ).length;

  const resolvedCount = challenges.filter(
    (challenge) => challenge.status === "RESOLVED",
  ).length;

  return (
    <DashboardShell
      role="citizen"
      nav={NAV}
      title="Civic challenges"
      subtitle="Browse civic challenges and follow their progress through the LokSrijan pipeline."
    >
      {/* Report Problem Action */}
      <div className="mb-6 flex justify-end">
        <button
          type="button"
          onClick={() => setShowReportForm((value) => !value)}
          className="bg-saffron px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
        >
          {showReportForm
            ? "Close report form"
            : "+ Report a Problem"}
        </button>
      </div>

      {/* Report Problem Form */}
      {showReportForm && (
        <Panel title="Report a Civic Problem">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              createChallengeMutation.mutate();
            }}
            className="grid gap-4 md:grid-cols-2"
          >
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-foreground">
                Problem title
              </label>

              <input
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Irregular water supply in Rohini"
                className="mt-2 w-full border border-border bg-background px-3 py-3 text-sm outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-foreground">
                Describe the problem
              </label>

              <textarea
                required
                minLength={10}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe what is happening and how it affects the community. Example: Hamare area ke handpump ka paani peela aa raha hai aur bachchon ko problem ho rahi hai."
                rows={4}
                className="mt-2 w-full border border-border bg-background px-3 py-3 text-sm outline-none"
              />

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={runAiAnalysis}
                  disabled={aiLoading}
                  className="inline-flex h-9 items-center gap-2 border border-saffron bg-saffron-soft px-3 text-xs font-medium text-foreground hover:bg-saffron/20 disabled:opacity-50"
                >
                  <Sparkles className="size-3.5" />
                  {aiLoading ? "Analyzing…" : "Analyze with AI"}
                </button>

                <span className="text-xs text-muted-foreground">
                  AI suggests structure; you stay in control of what is
                  submitted.
                </span>
              </div>
            </div>

            {aiError && (
              <div className="md:col-span-2 flex items-start gap-2.5 border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                <span>{aiError}</span>
              </div>
            )}

            {aiAnalysis && (
              <div className="md:col-span-2 border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="label-caps rounded-sm bg-saffron-soft px-2 py-1 text-foreground">
                      AI Suggested
                    </span>

                    {aiNeedsVerification && (
                      <span className="label-caps rounded-sm bg-amber-100 px-2 py-1 text-amber-800">
                        Needs Verification
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={applyAiSuggestions}
                      className="inline-flex h-8 items-center border border-saffron bg-saffron px-3 text-xs font-medium text-primary-foreground hover:bg-saffron/90"
                    >
                      Apply suggestions
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAiAnalysis(null);
                        setAiError(null);
                      }}
                      className="inline-flex h-8 items-center border border-border px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="label-caps text-muted-foreground">
                      Suggested title
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {aiAnalysis.problem}
                    </p>
                  </div>

                  <div>
                    <p className="label-caps text-muted-foreground">
                      Domain / subdomain
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {aiAnalysis.domain} · {aiAnalysis.subdomain}
                    </p>
                  </div>

                  <div>
                    <p className="label-caps text-muted-foreground">
                      Affected population
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {aiAnalysis.affected_population}
                    </p>
                  </div>

                  <div>
                    <p className="label-caps text-muted-foreground">
                      Severity / urgency
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {aiAnalysis.severity} · {aiAnalysis.urgency}
                    </p>
                  </div>
                </div>

                {aiAnalysis.required_capabilities.length > 0 && (
                  <div className="mt-4">
                    <p className="label-caps text-muted-foreground">
                      Required capabilities
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {aiAnalysis.required_capabilities.map((capability) => (
                        <span
                          key={capability}
                          className="border border-border bg-background px-2 py-1 text-xs text-foreground"
                        >
                          {capability}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {aiAnalysis.potential_causes.length > 0 && (
                  <div className="mt-4">
                    <p className="label-caps text-muted-foreground">
                      Possible causes (not confirmed)
                    </p>
                    <ul className="mt-1.5 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                      {aiAnalysis.potential_causes.map((cause) => (
                        <li key={cause}>{cause}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-3 text-xs text-muted-foreground">
                  <span>
                    AI confidence:{" "}
                    <strong className="text-foreground">
                      {Math.round(aiAnalysis.confidence * 100)}%
                    </strong>
                  </span>
                  <span className="max-w-md">{aiAnalysis.reason}</span>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground">
                Category
              </label>

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="mt-2 w-full border border-border bg-background px-3 py-3 text-sm"
              >
                <option>Water & Sanitation</option>
                <option>Waste Management</option>
                <option>Roads & Infrastructure</option>
                <option>Street Lighting</option>
                <option>Education</option>
                <option>Healthcare</option>
                <option>Environment</option>
                <option>Public Safety</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                Severity
              </label>

              <select
                value={severity}
                onChange={(event) =>
                  setSeverity(event.target.value as Severity)
                }
                className="mt-2 w-full border border-border bg-background px-3 py-3 text-sm"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                Urgency
              </label>

              <select
                value={urgency}
                onChange={(event) =>
                  setUrgency(event.target.value as Severity)
                }
                className="mt-2 w-full border border-border bg-background px-3 py-3 text-sm"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                Location
              </label>

              <input
                required
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="e.g. Rohini, Delhi"
                className="mt-2 w-full border border-border bg-background px-3 py-3 text-sm outline-none"
              />
            </div>

            {createChallengeMutation.isError && (
              <div className="md:col-span-2 border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                Unable to submit the problem. Please try again.
              </div>
            )}

            {createChallengeMutation.isSuccess && (
              <div className="md:col-span-2 border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                Problem submitted successfully.
              </div>
            )}

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={createChallengeMutation.isPending}
                className="bg-field px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {createChallengeMutation.isPending
                  ? "Submitting..."
                  : "Submit Problem"}
              </button>
            </div>
          </form>
        </Panel>
      )}

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Challenges available"
          value={String(challenges.length)}
          note="Current civic challenges on LokSrijan"
        />

        <StatTile
          label="Validated"
          value={String(validatedCount)}
          tone="saffron"
          note="Challenges ready for solution teams"
        />

        <StatTile
          label="In progress"
          value={String(activeCount)}
          tone="field"
          note="Challenges currently moving toward solutions"
        />
      </div>

      {/* Current Challenges + Pipeline */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Panel title="Current civic challenges">
          {challengesQuery.isPending ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-28 animate-pulse border border-border bg-muted"
                />
              ))}
            </div>
          ) : challengesQuery.isError ? (
            <div className="border border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Unable to load current challenges.
              </p>

              <button
                type="button"
                onClick={() => challengesQuery.refetch()}
                className="mt-3 text-sm font-medium text-saffron hover:underline"
              >
                Try again
              </button>
            </div>
          ) : challenges.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No civic challenges are currently available.
            </p>
          ) : (
            <div className="space-y-4">
              {challenges.slice(0, 4).map((challenge) => (
                <div
                  key={challenge.id}
                  className="border border-border p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="label-caps text-muted-foreground">
                      CH-{challenge.id}
                    </span>

                    <StatusBadge status={challenge.status} />
                  </div>

                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {challenge.title}
                  </p>

                  <p className="mt-1.5 text-xs text-muted-foreground">
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

        <Panel title="Challenge pipeline">
          <div className="space-y-4 text-sm">
            <div className="border-l-2 border-saffron pl-3">
              <p className="font-medium text-foreground">Submitted</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Problems enter the platform and await government review.
              </p>
            </div>

            <div className="border-l-2 border-field pl-3">
              <p className="font-medium text-foreground">Validated</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Validated challenges can move toward team formation and
                implementation.
              </p>
            </div>

            <div className="border-l-2 border-border pl-3">
              <p className="font-medium text-foreground">Resolved</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Completed civic solutions reach the final resolution stage.
              </p>
            </div>
          </div>
        </Panel>
      </div>

      {/* Challenges Worth Following */}
      <div className="mt-10 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Challenges worth following
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Explore real challenges and see where they are in the civic
            pipeline.
          </p>
        </div>

        <a
          href="/challenges"
          className="text-sm font-medium text-foreground underline underline-offset-4"
        >
          Browse all
        </a>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {challengesQuery.isPending ? (
          [1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-56 animate-pulse border border-border bg-card"
            />
          ))
        ) : challengesQuery.isError ? (
          <div className="border border-dashed border-border p-6 text-sm text-muted-foreground md:col-span-3">
            Unable to load challenges.
          </div>
        ) : challenges.length === 0 ? (
          <div className="border border-dashed border-border p-6 text-sm text-muted-foreground md:col-span-3">
            No challenges are currently available.
          </div>
        ) : (
          challenges.slice(0, 3).map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
            />
          ))
        )}
      </div>

      <div className="mt-8 text-xs text-muted-foreground">
        {resolvedCount > 0
          ? `${resolvedCount} challenge${resolvedCount === 1 ? "" : "s"} resolved on the platform.`
          : "Follow challenges from submission through implementation and resolution."}
      </div>
    </DashboardShell>
  );
}