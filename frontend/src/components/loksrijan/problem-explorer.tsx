import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { challengeService } from "@/services/challenge.service";
import type { ChallengeResponse, ChallengeStatus } from "@/types/challenge";
import type { Problem, ProblemStage } from "@/lib/loksrijan-data";

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

function SeverityBadge({ severity }: { severity: ChallengeResponse["severity"] }) {
  return (
    <Badge variant="outline" className="rounded-sm border-border font-normal">
      {severity}
    </Badge>
  );
}

export function ChallengeCard({
  challenge,
}: {
  challenge: ChallengeResponse;
}) {
  return (
    <Link
      to="/challenges/$id"
      params={{ id: String(challenge.id) }}
      className="group block border border-border bg-card p-5 transition-colors hover:border-saffron"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="label-caps text-muted-foreground">
          CH-{challenge.id}
        </span>

        <StatusBadge status={challenge.status} />
      </div>

      <h3 className="mt-3 text-lg font-semibold leading-snug text-foreground group-hover:text-saffron">
        {challenge.title}
      </h3>

      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
        {challenge.description}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-3.5" />
          {challenge.location}
        </span>

        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="size-3.5" />
          {challenge.category}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <SeverityBadge severity={challenge.severity} />

        <span className="ml-auto text-xs text-muted-foreground">
          View challenge →
        </span>
      </div>
    </Link>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "label-caps rounded-sm border px-3 py-1.5 transition-colors",
        active
          ? "border-saffron bg-saffron text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function ProblemExplorer({
  heading = "Challenge explorer",
  description = "Explore real challenges currently tracked by the platform.",
  initialStatus,
  compact,
}: {
  heading?: string;
  description?: string;
  initialStatus?: ChallengeStatus | "All";
  compact?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState<ChallengeStatus | "All">(
    initialStatus ?? "All",
  );

  const challengesQuery = useQuery({
    queryKey: ["challenges"],
    queryFn: () => challengeService.listChallenges(),
  });

  const challenges = challengesQuery.data ?? [];

  const categories = useMemo(() => {
    return Array.from(
      new Set(challenges.map((challenge) => challenge.category)),
    ).sort();
  }, [challenges]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

    return challenges.filter((challenge) => {
      const matchesQuery =
        !q ||
        challenge.title.toLowerCase().includes(q) ||
        challenge.description.toLowerCase().includes(q) ||
        challenge.location.toLowerCase().includes(q) ||
        challenge.category.toLowerCase().includes(q) ||
        String(challenge.id).includes(q);

      const matchesCategory =
        category === "All" || challenge.category === category;

      const matchesStatus =
        status === "All" || challenge.status === status;

      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [challenges, query, category, status]);

  if (challengesQuery.isPending) {
    return (
      <section className="w-full">
        <div>
          <h2
            className={cn(
              "font-semibold text-foreground",
              compact ? "text-xl" : "text-3xl",
            )}
          >
            {heading}
          </h2>

          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-48 animate-pulse border border-border bg-card"
            />
          ))}
        </div>
      </section>
    );
  }

  if (challengesQuery.isError) {
    return (
      <section className="w-full">
        <h2
          className={cn(
            "font-semibold text-foreground",
            compact ? "text-xl" : "text-3xl",
          )}
        >
          {heading}
        </h2>

        <p className="mt-1.5 text-sm text-muted-foreground">
          {description}
        </p>

        <div className="mt-6 border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Unable to connect to the LokSrijan server.
          </p>

          <button
            type="button"
            onClick={() => challengesQuery.refetch()}
            className="mt-4 text-sm font-medium text-saffron hover:underline"
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2
            className={cn(
              "font-semibold text-foreground",
              compact ? "text-xl" : "text-3xl",
            )}
          >
            {heading}
          </h2>

          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
            {description}
          </p>
        </div>

        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by location, category or challenge"
          className="h-11 rounded-sm border-border bg-card md:w-80"
          aria-label="Search challenges"
        />
      </div>

      {challenges.length > 0 && (
        <>
          <div className="mt-5 flex flex-wrap gap-2">
            <FilterChip
              active={status === "All" && category === "All"}
              onClick={() => {
                setStatus("All");
                setCategory("All");
              }}
            >
              All
            </FilterChip>

            {(
              [
                "SUBMITTED",
                "UNDER_REVIEW",
                "VALIDATED",
                "IN_PROGRESS",
                "SOLUTION_PROPOSED",
                "IMPLEMENTED",
                "RESOLVED",
              ] as ChallengeStatus[]
            ).map((value) => (
              <FilterChip
                key={value}
                active={status === value}
                onClick={() => setStatus(status === value ? "All" : value)}
              >
                {STATUS_LABELS[value]}
              </FilterChip>
            ))}

            {categories.length > 0 && (
              <>
                <span className="mx-1 hidden w-px bg-border sm:block" />

                {categories.map((value) => (
                  <FilterChip
                    key={value}
                    active={category === value}
                    onClick={() =>
                      setCategory(category === value ? "All" : value)
                    }
                  >
                    {value}
                  </FilterChip>
                ))}
              </>
            )}
          </div>
        </>
      )}

      <p className="label-caps mt-5 text-muted-foreground">
        {results.length} challenge{results.length === 1 ? "" : "s"}
      </p>

      {results.length > 0 ? (
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {results.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
      ) : (
        <div className="mt-3 border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {challenges.length === 0
              ? "No challenges are available yet."
              : "Nothing matches your search or filters."}
          </p>
        </div>
      )}
    </section>
  );
}

export function StageBadge({ stage }: { stage: ProblemStage }) {
  const tone =
    stage === "Adopted"
      ? "bg-field text-primary-foreground"
      : stage === "Piloting"
        ? "bg-saffron text-primary-foreground"
        : stage === "In build"
          ? "bg-saffron-soft text-foreground"
          : stage === "Verified"
            ? "bg-field-soft text-accent-foreground"
            : "bg-muted text-muted-foreground";

  return (
    <span className={cn("label-caps rounded-sm px-2 py-1", tone)}>
      {stage}
    </span>
  );
}

export function ProblemCard({ problem }: { problem: Problem }) {
  return (
    <Link
      to="/problems/$problemId"
      params={{ problemId: problem.id }}
      className="group block border border-border bg-card p-5 transition-colors hover:border-saffron"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="label-caps text-muted-foreground">
          {problem.id}
        </span>

        <StageBadge stage={problem.stage} />
      </div>

      <h3 className="mt-3 text-lg font-semibold leading-snug text-foreground group-hover:text-saffron">
        {problem.title}
      </h3>

      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
        {problem.summary}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span>
          {problem.district}, {problem.state}
        </span>

        <span>{problem.sector}</span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className="label-caps rounded-sm border border-border px-2 py-1 text-muted-foreground">
          {problem.severity}
        </span>

        <span className="ml-auto text-xs text-muted-foreground">
          View problem →
        </span>
      </div>
    </Link>
  );
}

export { StatusBadge };