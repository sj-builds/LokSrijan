import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/loksrijan/site-shell";
import { ROLES } from "@/lib/loksrijan-data";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How LokSrijan works — report, verify, build, adopt" },
      {
        name: "description",
        content:
          "The five stages of a LokSrijan problem and what each role — citizen, university, student team, industry, NGO, government — is accountable for.",
      },
      { property: "og:title", content: "How LokSrijan works" },
      {
        property: "og:description",
        content: "From a reported problem to a department-adopted solution, in five stages.",
      },
    ],
  }),
  component: HowItWorks,
});

const STAGES = [
  {
    n: "01",
    t: "Reported",
    d: "A citizen or collective files the problem with location, evidence and who is affected. No anonymous complaint dumps.",
  },
  {
    n: "02",
    t: "Verified",
    d: "An NGO with presence in that district checks the claim on the ground and signs it, or sends it back with notes.",
  },
  {
    n: "03",
    t: "In build",
    d: "A university assigns a student team. The build log, test data and failures are public on the problem page.",
  },
  {
    n: "04",
    t: "Piloting",
    d: "The prototype runs in the real setting with the original reporters. Industry mentors review technical fitness.",
  },
  {
    n: "05",
    t: "Adopted",
    d: "A department sanctions the solution, funds the rollout, and the problem closes with a public record.",
  },
];

function HowItWorks() {
  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-6xl px-5 py-14">
        <h1 className="max-w-2xl text-4xl font-bold leading-tight text-foreground">
          One problem, five stages, no dead ends.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          A problem only moves forward when the next role signs off. Nothing is closed silently, and
          every stage keeps the original reporter in the loop.
        </p>

        <ol className="mt-12 border-t border-border">
          {STAGES.map((s) => (
            <li
              key={s.n}
              className="grid gap-3 border-b border-border py-7 md:grid-cols-[80px_240px_1fr]"
            >
              <span className="font-display text-2xl font-bold text-saffron">{s.n}</span>
              <h2 className="text-lg font-semibold text-foreground">{s.t}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.d}</p>
            </li>
          ))}
        </ol>

        <h2 className="mt-14 text-2xl font-semibold text-foreground">
          Who is accountable for what
        </h2>
        <div className="mt-6 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
          {ROLES.map((r) => (
            <div key={r.key} className="bg-card p-6">
              <h3 className="text-base font-semibold text-foreground">{r.label}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{r.tagline}</p>
              <p className="mt-3 text-xs text-muted-foreground">{r.authNote}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 border border-border bg-card p-8 text-center">
          <p className="text-lg font-semibold text-foreground">
            Ready to take a place in the pipeline?
          </p>
          <Link
            to="/join"
            className="mt-5 inline-flex h-12 items-center rounded-sm bg-saffron px-7 text-sm font-medium text-primary-foreground hover:bg-saffron/90"
          >
            Choose your role
          </Link>
        </div>
      </div>
    </SiteShell>
  );
}
