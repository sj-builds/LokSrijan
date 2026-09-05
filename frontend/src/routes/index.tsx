import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Hammer, Landmark, Megaphone } from "lucide-react";
import { SiteShell } from "@/components/loksrijan/site-shell";
import { ProblemCard } from "@/components/loksrijan/problem-explorer";
import { PROBLEMS, ROLES } from "@/lib/loksrijan-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LokSrijan — Citizen problems, student solutions, public adoption" },
      {
        name: "description",
        content:
          "LokSrijan turns verified citizen problems into student-built, NGO-validated prototypes that industry mentors and government departments adopt.",
      },
      { property: "og:title", content: "LokSrijan — Citizen problems, student solutions" },
      {
        property: "og:description",
        content:
          "A civic pipeline from reported problem to adopted solution, open to every stakeholder.",
      },
    ],
  }),
  component: Home,
});

const STEPS = [
  {
    icon: Megaphone,
    title: "Citizens report",
    body: "A named person or collective files the problem with evidence, not a complaint form.",
  },
  {
    icon: ShieldCheck,
    title: "NGOs verify",
    body: "Field organisations confirm the situation on the ground before any build starts.",
  },
  {
    icon: Hammer,
    title: "Students build",
    body: "University teams take ownership, with mentors from industry and a public build log.",
  },
  {
    icon: Landmark,
    title: "Government adopts",
    body: "Departments see pilot evidence and sanction what already works in the field.",
  },
];

function Home() {
  const featured = PROBLEMS.slice(0, 4);

  return (
    <SiteShell>
      <section className="border-b border-border">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[1.25fr_1fr] lg:py-24">
          <div>
            <span className="label-caps inline-flex items-center gap-2 border border-border bg-card px-3 py-1.5 text-muted-foreground">
              <span className="size-1.5 bg-field" /> 6 states · 1,842 problems filed
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              The problem is local.
              <br />
              <span className="text-saffron">So are the people</span> who can fix it.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              LokSrijan is a public pipeline. A citizen files a problem with evidence. An NGO
              verifies it. A student team builds against it in the open. Industry mentors it,
              government adopts it. Nothing disappears into an inbox.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Link
                to="/join"
                className="inline-flex h-12 items-center gap-2 rounded-sm bg-saffron px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-saffron/90"
              >
                Choose your role <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/problems"
                className="text-sm font-medium text-foreground underline underline-offset-4"
              >
                Browse live problems
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px self-start border border-border bg-border">
            {[
              { k: "1,842", v: "problems filed by citizens" },
              { k: "1,109", v: "verified by NGOs on the ground" },
              { k: "417", v: "student teams building now" },
              { k: "63", v: "solutions adopted by departments" },
            ].map((s) => (
              <div key={s.k} className="bg-card p-6">
                <p className="font-display text-3xl font-bold tracking-tight text-foreground">
                  {s.k}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-6xl px-5 py-16">
          <h2 className="text-3xl font-semibold text-foreground">Four hands on every problem</h2>
          <div className="mt-10 grid gap-px bg-border md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="bg-card p-6">
                <div className="flex items-center gap-3">
                  <s.icon className={i % 2 === 0 ? "size-5 text-saffron" : "size-5 text-field"} />
                  <span className="label-caps text-muted-foreground">Step {i + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 py-16">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-3xl font-semibold text-foreground">Open right now</h2>
            <Link
              to="/problems"
              className="text-sm font-medium text-foreground underline underline-offset-4"
            >
              All problems
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {featured.map((p) => (
              <ProblemCard key={p.id} problem={p} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-card">
        <div className="mx-auto w-full max-w-6xl px-5 py-16">
          <h2 className="text-3xl font-semibold text-foreground">Six ways in</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Each role gets its own verification, its own workspace and its own responsibilities.
          </p>
          <div className="mt-8 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
            {ROLES.map((r) => (
              <Link
                key={r.key}
                to="/auth/$role"
                params={{ role: r.key }}
                className="group bg-card p-6 transition-colors hover:bg-muted"
              >
                <span
                  className={
                    r.accent === "green"
                      ? "block h-1 w-8 bg-field"
                      : r.accent === "ink"
                        ? "block h-1 w-8 bg-foreground"
                        : "block h-1 w-8 bg-saffron"
                  }
                />
                <h3 className="mt-4 text-lg font-semibold text-foreground">{r.label}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{r.tagline}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-foreground group-hover:text-saffron">
                  Sign in <ArrowRight className="size-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
