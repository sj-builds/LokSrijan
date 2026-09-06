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

function CitizenDashboard() {
  const queryClient = useQueryClient();

  const [showReportForm, setShowReportForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Water & Sanitation");
  const [location, setLocation] = useState("");
  const [severity, setSeverity] = useState<Severity>("MEDIUM");

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
    },
  });

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
                placeholder="Describe what is happening and how it affects the community."
                rows={4}
                className="mt-2 w-full border border-border bg-background px-3 py-3 text-sm outline-none"
              />
            </div>

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

            <div className="md:col-span-2">
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