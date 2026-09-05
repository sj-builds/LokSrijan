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

function CitizenDashboard() {
  const challengesQuery = useQuery({
    queryKey: ["challenges"],
    queryFn: () => challengeService.listChallenges(),
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