import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { SiteShell } from "@/components/loksrijan/site-shell";
import { StageBadge } from "@/components/loksrijan/problem-explorer";
import { problemById, TEAMS } from "@/lib/loksrijan-data";

export const Route = createFileRoute("/problems/$problemId")({
  loader: ({ params }) => {
    const problem = problemById(params.problemId);
    if (!problem) throw notFound();
    return { problem };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Problem not found — LokSrijan" }, { name: "robots", content: "noindex" }],
      };
    }
    const { problem } = loaderData;
    return {
      meta: [
        { title: `${problem.id}: ${problem.title.slice(0, 48)} — LokSrijan` },
        { name: "description", content: problem.summary },
        { property: "og:title", content: problem.title },
        { property: "og:description", content: problem.summary },
      ],
    };
  },
  notFoundComponent: ProblemNotFound,
  component: ProblemDetail,
});

function ProblemNotFound() {
  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-2xl px-5 py-24 text-center">
        <h1 className="text-3xl font-semibold">That problem ID doesn't exist</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          It may have been merged into another report.
        </p>
        <Link
          to="/challenges"
          className="mt-6 inline-flex h-11 items-center rounded-sm bg-saffron px-6 text-sm font-medium text-primary-foreground"
        >
          Back to all problems
        </Link>
      </div>
    </SiteShell>
  );
}

function ProblemDetail() {
  const { problem } = Route.useLoaderData();
  const teams = TEAMS.filter((t) => t.problemId === problem.id);

  return (
    <SiteShell>
      <article className="mx-auto w-full max-w-6xl px-5 py-12">
        <Link
          to="/challenges"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> All problems
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="label-caps text-muted-foreground">{problem.id}</span>
              <StageBadge stage={problem.stage} />
              {problem.ngoValidated && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-field">
                  <ShieldCheck className="size-3.5" /> NGO validated
                </span>
              )}
            </div>
            <h1 className="mt-4 text-3xl font-bold leading-tight text-foreground md:text-4xl">
              {problem.title}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">{problem.detail}</p>

            <h2 className="mt-10 text-lg font-semibold text-foreground">Evidence on file</h2>
            <ul className="mt-3 space-y-2 border-l-2 border-saffron pl-4">
              {problem.evidence.map((e) => (
                <li key={e} className="text-sm text-muted-foreground">
                  {e}
                </li>
              ))}
            </ul>

            <h2 className="mt-10 text-lg font-semibold text-foreground">
              What has happened so far
            </h2>
            <ol className="mt-4 space-y-5">
              {problem.timeline.map((t) => (
                <li
                  key={t.label}
                  className="grid gap-1 border-b border-border pb-5 sm:grid-cols-[140px_1fr]"
                >
                  <div>
                    <p className="label-caps text-saffron">{t.label}</p>
                    <p className="text-xs text-muted-foreground">{t.date}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{t.note}</p>
                </li>
              ))}
            </ol>

            {teams.length > 0 && (
              <>
                <h2 className="mt-10 text-lg font-semibold text-foreground">
                  Teams on this problem
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {teams.map((t) => (
                    <div key={t.id} className="border border-border bg-card p-4">
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{t.department}</p>
                      <div className="mt-3 h-1.5 w-full bg-muted">
                        <div className="h-full bg-field" style={{ width: `${t.progress}%` }} />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {t.status} · {t.progress}%
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <aside className="h-fit lg:sticky lg:top-24">
            <div className="border border-border bg-card">
              <dl className="divide-y divide-border">
                {[
                  ["Sector", problem.sector],
                  ["Location", `${problem.district}, ${problem.state}`],
                  ["Severity", problem.severity],
                  ["People affected", problem.affected.toLocaleString("en-IN")],
                  ["Citizen endorsements", String(problem.endorsements)],
                  ["Reported by", problem.reportedBy],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-start justify-between gap-4 px-5 py-3.5">
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="text-right text-sm font-medium text-foreground">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="border-t border-border p-5">
                <Link
                  to="/join"
                  className="inline-flex h-11 w-full items-center justify-center rounded-sm bg-saffron text-sm font-medium text-primary-foreground hover:bg-saffron/90"
                >
                  Take this problem on
                </Link>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  Sign in as a student team, NGO or industry partner to claim a role on this
                  problem.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </article>
    </SiteShell>
  );
}
