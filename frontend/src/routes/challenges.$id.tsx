import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  MapPin,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  Building2,
} from "lucide-react";

import { SiteShell } from "@/components/loksrijan/site-shell";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api";
import { challengeService } from "@/services/challenge.service";
import { intelligenceService } from "@/services/intelligence.service";
import { matchingService } from "@/services/matching.service";
import { solutionService } from "@/services/solution.service";
import type { ChallengeStatus } from "@/types/challenge";
import type { DuplicateChallenge } from "@/types/intelligence";

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

function ConfidenceBadge({ label }: { label: string }) {
  const tone =
    label === "HIGH"
      ? "bg-field-soft text-accent-foreground"
      : label === "MEDIUM"
        ? "bg-amber-100 text-amber-800"
        : "bg-muted text-muted-foreground";

  return (
    <span className={cn("label-caps rounded-sm px-2 py-1", tone)}>
      {label} confidence
    </span>
  );
}

function PanelHeader({
  icon,
  title,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        {icon}
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>
      {badge}
    </div>
  );
}

function AiErrorState({
  isAuth,
  onRetry,
}: {
  isAuth: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="mt-3 border border-dashed border-border bg-muted/30 p-5">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium text-foreground">
            {isAuth
              ? "AI analysis is temporarily unavailable."
              : "Sign in to unlock AI analysis for this challenge."}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {isAuth
              ? "The report itself is safe and can be analysed later. Try again in a moment."
              : "Citizen, government and university accounts can see AI structuring, related reports, priority and capability matches."}
          </p>
          {isAuth && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 text-xs font-medium text-saffron hover:underline"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Skeleton() {
  return <div className="mt-3 h-24 animate-pulse border border-border bg-muted" />;
}

function ChallengeDetailPage() {
  const { id } = Route.useParams();
  const challengeId = Number(id);

  const challengeQuery = useQuery({
    queryKey: ["challenge", id],
    queryFn: () => challengeService.getChallenge(challengeId),
  });

  const challenge = challengeQuery.data;

  // AI analysis of this challenge + likely related reports.
  const intelligenceQuery = useQuery({
    queryKey: ["challenge-intelligence", challengeId],
    queryFn: () => intelligenceService.analyzeChallenge(challengeId),
    enabled: Boolean(challenge),
    retry: false,
  });

  // Explainable priority assessment.
  const priorityQuery = useQuery({
    queryKey: ["challenge-priority", challengeId],
    queryFn: () => intelligenceService.getPriority(challengeId),
    enabled: Boolean(challenge),
    retry: false,
  });

  // Capability-based institution matching.
  const matchingQuery = useQuery({
    queryKey: ["challenge-matches", challengeId],
    queryFn: () => matchingService.matchInstitutions(challengeId),
    enabled: Boolean(challenge),
    retry: false,
  });

  // Replication: similar published solution passports.
  const replicationQuery = useQuery({
    queryKey: ["challenge-replication", challengeId],
    queryFn: () => solutionService.similarForChallenge(challengeId),
    enabled: Boolean(challenge),
    retry: false,
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

  if (challengeQuery.isError || !challenge) {
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

  const intelligence = intelligenceQuery.data;
  const priority = priorityQuery.data;
  const matching = matchingQuery.data;

  const intelligenceAuthError =
    intelligenceQuery.isError &&
    intelligenceQuery.error instanceof ApiError &&
    intelligenceQuery.error.isAuthError;
  const priorityAuthError =
    priorityQuery.isError &&
    priorityQuery.error instanceof ApiError &&
    priorityQuery.error.isAuthError;
  const matchingAuthError =
    matchingQuery.isError &&
    matchingQuery.error instanceof ApiError &&
    matchingQuery.error.isAuthError;
  const replicationAuthError =
    replicationQuery.isError &&
    replicationQuery.error instanceof ApiError &&
    replicationQuery.error.isAuthError;

  const analysis = intelligence?.analysis;
  const related = intelligence?.possible_duplicates ?? [];
  const replication = replicationQuery.data;
  const aiNeedsVerification =
    analysis !== undefined &&
    (analysis.human_verification_required || analysis.confidence < 0.8);

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
            <div className="flex items-center gap-3">
              <span className="label-caps text-muted-foreground">
                CH-{challenge.id}
              </span>
              {challenge.is_demo && (
                <span className="label-caps rounded-sm border border-border px-2 py-1 text-muted-foreground">
                  Demo record
                </span>
              )}
            </div>

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
              {challenge.severity} severity
            </Badge>

            {challenge.urgency && (
              <Badge variant="outline" className="rounded-sm font-normal">
                {challenge.urgency} urgency
              </Badge>
            )}
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

        {/* AI UNDERSTANDING */}
        <section className="mt-8 border border-border bg-card p-6 lg:p-8">
          <PanelHeader
            icon={<Sparkles className="size-5 text-saffron" />}
            title="AI understanding"
            badge={
              analysis ? (
                <div className="flex items-center gap-2">
                  {aiNeedsVerification && (
                    <span className="label-caps rounded-sm bg-amber-100 px-2 py-1 text-amber-800">
                      Needs Verification
                    </span>
                  )}
                  <span className="label-caps rounded-sm bg-saffron-soft px-2 py-1 text-foreground">
                    AI Suggested
                  </span>
                </div>
              ) : undefined
            }
          />

          {intelligenceQuery.isPending && <Skeleton />}

          {intelligenceQuery.isError && (
            <AiErrorState
              isAuth={!intelligenceAuthError}
              onRetry={() => intelligenceQuery.refetch()}
            />
          )}

          {analysis && (
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="label-caps text-muted-foreground">
                  Domain / subdomain
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {analysis.domain} · {analysis.subdomain}
                </p>
              </div>

              <div>
                <p className="label-caps text-muted-foreground">
                  Severity / urgency
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {analysis.severity} severity · {analysis.urgency} urgency
                </p>
              </div>

              <div>
                <p className="label-caps text-muted-foreground">
                  Affected population
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {analysis.affected_population}
                </p>
              </div>

              <div>
                <p className="label-caps text-muted-foreground">
                  AI confidence
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {Math.round(analysis.confidence * 100)}%
                </p>
              </div>

              {analysis.required_capabilities.length > 0 && (
                <div className="sm:col-span-2">
                  <p className="label-caps text-muted-foreground">
                    Required capabilities
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {analysis.required_capabilities.map((capability) => (
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

              {analysis.potential_causes.length > 0 && (
                <div className="sm:col-span-2">
                  <p className="label-caps text-muted-foreground">
                    Possible causes (AI inferred — not confirmed)
                  </p>
                  <ul className="mt-1.5 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    {analysis.potential_causes.map((cause) => (
                      <li key={cause}>{cause}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs leading-relaxed text-muted-foreground sm:col-span-2">
                {analysis.reason}
              </p>
            </div>
          )}
        </section>

        {/* LIKELY RELATED REPORTS */}
        <section className="mt-6 border border-border bg-card p-6 lg:p-8">
          <PanelHeader
            icon={<ShieldCheck className="size-5 text-field" />}
            title="Likely related reports"
            badge={
              intelligence ? (
                <span className="label-caps text-muted-foreground">
                  {intelligence.duplicate_count} found
                </span>
              ) : undefined
            }
          />

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Semantic similarity alone is never treated as proof of
            duplication. Each link below shows the evidence signals behind
            it and an honest confidence label.
          </p>

          {intelligenceQuery.isPending && <Skeleton />}

          {intelligenceQuery.isError && (
            <AiErrorState
              isAuth={!intelligenceAuthError}
              onRetry={() => intelligenceQuery.refetch()}
            />
          )}

          {intelligence && related.length === 0 && (
            <div className="mt-4 border border-dashed border-border p-5 text-sm text-muted-foreground">
              No closely related reports found yet. New reports in the same
              domain and nearby area will appear here.
            </div>
          )}

          {related.length > 0 && (
            <ul className="mt-4 divide-y divide-border border border-border">
              {related.map((item: DuplicateChallenge) => (
                <li
                  key={item.challenge_id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0">
                    <Link
                      to="/challenges/$id"
                      params={{ id: String(item.challenge_id) }}
                      className="text-sm font-medium text-foreground hover:text-saffron hover:underline"
                    >
                      CH-{item.challenge_id} · {item.title}
                    </Link>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.signals.map((signal) => (
                        <span
                          key={signal}
                          className="border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground"
                        >
                          {signal}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">
                      {Math.round(item.similarity_score * 100)}%
                    </span>
                    <ConfidenceBadge label={item.confidence_label} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* PRIORITY ASSESSMENT */}
        <section className="mt-6 border border-border bg-card p-6 lg:p-8">
          <PanelHeader
            icon={<AlertTriangle className="size-5 text-saffron" />}
            title="Priority assessment"
            badge={
              priority ? (
                <span
                  className={cn(
                    "label-caps rounded-sm px-2 py-1",
                    priority.priority_level === "CRITICAL"
                      ? "bg-destructive text-destructive-foreground"
                      : priority.priority_level === "HIGH"
                        ? "bg-saffron text-primary-foreground"
                        : priority.priority_level === "MEDIUM"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-muted text-muted-foreground",
                  )}
                >
                  {priority.priority_level} · {priority.priority_score}/100
                </span>
              ) : undefined
            }
          />

          {priorityQuery.isPending && <Skeleton />}

          {priorityQuery.isError && (
            <AiErrorState
              isAuth={!priorityAuthError}
              onRetry={() => priorityQuery.refetch()}
            />
          )}

          {priority && (
            <div className="mt-5">
              <div className="flex items-center gap-4">
                <div className="h-2.5 w-full max-w-md bg-muted">
                  <div
                    className="h-full bg-saffron"
                    style={{ width: `${priority.priority_score}%` }}
                  />
                </div>
                <span className="text-2xl font-bold text-foreground">
                  {priority.priority_score}
                </span>
              </div>

              <p className="mt-5 label-caps text-muted-foreground">
                Why this score?
              </p>

              <ul className="mt-2 space-y-2">
                {priority.factors.map((factor) => (
                  <li
                    key={factor.label}
                    className="flex items-start justify-between gap-4 border-b border-border pb-2 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {factor.label}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {factor.detail}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-foreground">
                      {factor.weight > 0 ? `+${factor.weight}` : "—"}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                {priority.methodology_note}
              </p>
            </div>
          )}
        </section>

        {/* CAPABILITY MATCHES */}
        <section className="mt-6 border border-border bg-card p-6 lg:p-8">
          <PanelHeader
            icon={<Building2 className="size-5 text-field" />}
            title="Capability matches"
            badge={
              matching && matching.matches.length > 0 ? (
                <span className="label-caps text-muted-foreground">
                  {matching.matches.length} institution
                  {matching.matches.length === 1 ? "" : "s"}
                </span>
              ) : undefined
            }
          />

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            The system matches required capabilities, not simply the nearest
            organisation. Every score is a capability match score — not a
            prediction of success.
          </p>

          {matchingQuery.isPending && <Skeleton />}

          {matchingQuery.isError && (
            <AiErrorState
              isAuth={!matchingAuthError}
              onRetry={() => matchingQuery.refetch()}
            />
          )}

          {matching && matching.matches.length === 0 && (
            <div className="mt-4 border border-dashed border-border p-5 text-sm text-muted-foreground">
              No institution currently covers this challenge's required
              capabilities.
            </div>
          )}

          {matching && matching.matches.length > 0 && (
            <div className="mt-5 space-y-4">
              {matching.matches.slice(0, 5).map((match) => (
                <div key={match.institution_id} className="border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {match.institution_name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {match.institution_type} · {match.location}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-28 bg-muted">
                        <div
                          className="h-full bg-field"
                          style={{ width: `${match.match_score}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {match.match_score}%
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 label-caps text-muted-foreground">
                    Why this match?
                  </p>

                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {match.matched_capabilities.map((capability) => (
                      <span
                        key={capability}
                        className="border border-field/40 bg-field-soft px-2 py-0.5 text-[11px] text-accent-foreground"
                      >
                        ✓ {capability}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* REPLICATION */}
        <section className="mt-6 border border-border bg-card p-6 lg:p-8">
          <PanelHeader
            icon={<Sparkles className="size-5 text-field" />}
            title="Replication"
            badge={
              replication && replication.matches.length > 0 ? (
                <span className="label-caps text-muted-foreground">
                  {replication.matches.length} similar solution
                  {replication.matches.length === 1 ? "" : "s"}
                </span>
              ) : undefined
            }
          />

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Before starting a new project, the platform checks published
            solution passports for a similar problem that could be adapted.
            A match is a suitability score — not a prediction of success —
            and the passport's verification status is always shown.
          </p>

          {replicationQuery.isPending && <Skeleton />}

          {replicationQuery.isError && (
            <AiErrorState
              isAuth={!replicationAuthError}
              onRetry={() => replicationQuery.refetch()}
            />
          )}

          {replication && replication.matches.length === 0 && (
            <div className="mt-4 border border-dashed border-border p-5 text-sm text-muted-foreground">
              No published solution passports closely match this challenge
              yet. As verified solutions are published, adapt-and-replicate
              suggestions will appear here.
            </div>
          )}

          {replication && replication.matches.length > 0 && (
            <div className="mt-5 space-y-4">
              {replication.matches.map((match) => (
                <div
                  key={match.passport_id}
                  className="border border-border p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {match.passport_title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {match.challenge_title} ·{" "}
                        {match.impact_verification_status === "VERIFIED"
                          ? "verified impact"
                          : "verification pending"}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <div className="h-1.5 w-28 bg-muted">
                        <div
                          className="h-full bg-field"
                          style={{ width: `${match.match_score}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {match.match_score}% match
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 label-caps text-muted-foreground">
                    Why adapt this solution?
                  </p>

                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {match.reasons.map((reason) => (
                      <span
                        key={reason}
                        className="border border-field/40 bg-field-soft px-2 py-0.5 text-[11px] text-accent-foreground"
                      >
                        ✓ {reason}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              <p className="text-xs leading-relaxed text-muted-foreground">
                {replication.methodology_note}
              </p>
            </div>
          )}
        </section>
      </main>
    </SiteShell>
  );
}