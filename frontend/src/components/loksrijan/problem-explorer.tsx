import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MapPin, ShieldCheck, Users2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PROBLEMS, SECTORS, STAGES, type Problem, type ProblemStage } from "@/lib/loksrijan-data";

export function StageBadge({ stage }: { stage: ProblemStage }) {
  const tone =
    stage === "Adopted"
      ? "bg-field text-primary-foreground"
      : stage === "Piloting"
        ? "bg-field-soft text-accent-foreground"
        : stage === "In build"
          ? "bg-saffron text-primary-foreground"
          : stage === "Verified"
            ? "bg-saffron-soft text-foreground"
            : "bg-muted text-muted-foreground";
  return <span className={cn("label-caps rounded-sm px-2 py-1", tone)}>{stage}</span>;
}

export function ProblemCard({ problem, to }: { problem: Problem; to?: string }) {
  return (
    <Link
      to="/problems/$problemId"
      params={{ problemId: problem.id }}
      className="group block border border-border bg-card p-5 transition-colors hover:border-saffron"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="label-caps text-muted-foreground">{problem.id}</span>
        <StageBadge stage={problem.stage} />
      </div>
      <h3 className="mt-3 text-lg font-semibold leading-snug text-foreground group-hover:text-saffron">
        {problem.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{problem.summary}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-3.5" /> {problem.district}, {problem.state}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Users2 className="size-3.5" /> {problem.affected.toLocaleString("en-IN")} affected
        </span>
        {problem.ngoValidated && (
          <span className="inline-flex items-center gap-1.5 text-field">
            <ShieldCheck className="size-3.5" /> NGO validated
          </span>
        )}
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Badge variant="outline" className="rounded-sm border-border font-normal">
          {problem.sector}
        </Badge>
        <Badge variant="outline" className="rounded-sm border-border font-normal">
          {problem.teams} team{problem.teams === 1 ? "" : "s"}
        </Badge>
        {to && <span className="ml-auto text-xs text-muted-foreground">{to}</span>}
      </div>
    </Link>
  );
}

export function ProblemExplorer({
  heading = "Problem explorer",
  description = "Every entry is a real, reported situation with named evidence behind it.",
  initialStage,
  compact,
}: {
  heading?: string;
  description?: string;
  initialStage?: ProblemStage | "All";
  compact?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState<string>("All");
  const [stage, setStage] = useState<ProblemStage | "All">(initialStage ?? "All");

  const results = useMemo(
    () =>
      PROBLEMS.filter((p) => {
        const q = query.trim().toLowerCase();
        const matchesQuery =
          !q ||
          p.title.toLowerCase().includes(q) ||
          p.district.toLowerCase().includes(q) ||
          p.state.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q);
        return (
          matchesQuery &&
          (sector === "All" || p.sector === sector) &&
          (stage === "All" || p.stage === stage)
        );
      }),
    [query, sector, stage],
  );

  return (
    <section className="w-full">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className={cn("font-semibold text-foreground", compact ? "text-xl" : "text-3xl")}>
            {heading}
          </h2>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">{description}</p>
        </div>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by district, sector or problem ID"
          className="h-11 rounded-sm border-border bg-card md:w-80"
          aria-label="Search problems"
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <FilterChip
          active={stage === "All" && sector === "All"}
          onClick={() => {
            setStage("All");
            setSector("All");
          }}
        >
          All
        </FilterChip>
        {STAGES.map((s) => (
          <FilterChip
            key={s}
            active={stage === s}
            onClick={() => setStage(stage === s ? "All" : s)}
          >
            {s}
          </FilterChip>
        ))}
        <span className="mx-1 hidden w-px bg-border sm:block" />
        {SECTORS.map((s) => (
          <FilterChip
            key={s}
            active={sector === s}
            tone="field"
            onClick={() => setSector(sector === s ? "All" : s)}
          >
            {s}
          </FilterChip>
        ))}
      </div>

      <p className="label-caps mt-5 text-muted-foreground">
        {results.length} problem{results.length === 1 ? "" : "s"}
      </p>

      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {results.map((p) => (
          <ProblemCard key={p.id} problem={p} />
        ))}
      </div>

      {results.length === 0 && (
        <div className="mt-3 border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nothing matches that filter yet. Clear the filters or widen your search.
          </p>
        </div>
      )}
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  children,
  tone = "saffron",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tone?: "saffron" | "field";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "label-caps rounded-sm border px-3 py-1.5 transition-colors",
        active
          ? tone === "field"
            ? "border-field bg-field text-primary-foreground"
            : "border-saffron bg-saffron text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
