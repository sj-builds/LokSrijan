import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { SiteShell } from "@/components/loksrijan/site-shell";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { challengeService } from "@/services/challenge.service";
import type { ChallengeStatus } from "@/types/challenge";

export const Route = createFileRoute("/challenges/$id")({
  head: () => ({
    meta: [
      { title: "Challenge — LokSrijan" },
      {
        name: "description",
        content: "View details of a civic challenge tracked by LokSrijan.",
      },
    ],
  }),
  component: ChallengeDetailPage,
});

const STATUS_LABELS: Record<ChallengeStatus, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  VALIDATED: "Validated",
  REJECTED: "Rejected",
  TEAM_FORMED: "Team Formed",
  IN_PROGRESS: "In Progress",
  SOLUTION_PROPOSED: "Solution Proposed",
  IMPLEMENTED: "Implemented",
  RESOLVED: "Resolved",
};

function StatusBadge({ status }: { status: ChallengeStatus }) {
  const tone =
    status === "RESOLVED" || status === "IMPLEMENTED"
      ? "bg-field text-primary-foreground"
      : status === "VALIDATED"
        ? "bg-field-soft text-accent-foreground"
        : status === "IN_PROGRESS" || status === "SOLUTION_PROPOSED"
          ? "bg-saffron text-primary-foreground"
          : status === "REJECTED"
            ? "bg-muted text-muted-foreground"
            : "bg-saffron-soft text-foreground";

  return (
    <span className={cn("label-caps rounded-sm px-2 py-1", tone)}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function ChallengeDetailPage() {
  const { id } = Route.useParams();

  const challengeQuery = useQuery({
    queryKey: ["challenge", id],
    queryFn: () => challengeService.getChallenge(Number(id)),
  });

  if (challengeQuery.isPending) {
    return (
      <SiteShell>
        <main className="mx-auto w-full max-w-5xl px-6 py-12 lg:px-8">
          <div className="h-8 w-32 animate-pulse bg-muted" />
          <div className="mt-8 h-10 w-3/4 animate-pulse bg-muted" />
          <div className="mt-4 h-24 w-full animate-pulse bg-muted" />
        </main>
      </SiteShell>
    );
  }

  if (challengeQuery.isError || !challengeQuery.data) {
    return (
      <SiteShell>
        <main className="mx-auto w-full max-w-5xl px-6 py-12 lg:px-8">
          <Link
            to="/challenges"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to challenges
          </Link>

          <div className="mt-10 border border-dashed border-border bg-card p-10 text-center">
            <h1 className="text-lg font-semibold text-foreground">
              Challenge not found
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The requested challenge could not be loaded.
            </p>

            <button
              type="button"
              onClick={() => challengeQuery.refetch()}
              className="mt-4 text-sm font-medium text-saffron hover:underline"
            >
              Try again
            </button>
          </div>
        </main>
      </SiteShell>
    );
  }

  const challenge = challengeQuery.data;

  return (
    <SiteShell>
      <main className="mx-auto w-full max-w-5xl px-6 py-12 lg:px-8">
        <Link
          to="/challenges"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to challenges
        </Link>

        <article className="mt-8 border border-border bg-card p-6 lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="label-caps text-muted-foreground">
              CH-{challenge.id}
            </span>

            <StatusBadge status={challenge.status} />
          </div>

          <h1 className="mt-5 max-w-4xl text-3xl font-bold leading-tight tracking-tight text-foreground lg:text-4xl">
            {challenge.title}
          </h1>

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <MapPin className="size-4" />
              {challenge.location}
            </span>

            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="size-4" />
              {challenge.category}
            </span>

            <Badge variant="outline" className="rounded-sm font-normal">
              {challenge.severity}
            </Badge>
          </div>

          <div className="mt-8 border-t border-border pt-8">
            <h2 className="text-lg font-semibold text-foreground">
              Challenge description
            </h2>

            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">
              {challenge.description}
            </p>
          </div>

          <div className="mt-8 grid gap-4 border-t border-border pt-8 sm:grid-cols-2">
            <div>
              <p className="label-caps text-muted-foreground">Created</p>
              <p className="mt-1 text-sm text-foreground">
                {new Date(challenge.created_at).toLocaleDateString()}
              </p>
            </div>

            <div>
              <p className="label-caps text-muted-foreground">Last updated</p>
              <p className="mt-1 text-sm text-foreground">
                {new Date(challenge.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </article>
      </main>
    </SiteShell>
  );
}