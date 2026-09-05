import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteShell } from "@/components/loksrijan/site-shell";
import { ROLES } from "@/lib/loksrijan-data";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Choose your role — LokSrijan sign in" },
      {
        name: "description",
        content:
          "Sign in to LokSrijan as a citizen, university, student team, industry partner, NGO or government officer.",
      },
      { property: "og:title", content: "Choose your role — LokSrijan" },
      { property: "og:description", content: "Six roles, six verification paths, six workspaces." },
    ],
  }),
  component: Join,
});

function Join() {
  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-5xl px-5 py-16">
        <p className="label-caps text-saffron">Sign in</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight text-foreground">
          Which side of the problem are you on?
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground">
          Each role is verified differently and lands in a different workspace. Pick the one that
          matches how you'll actually contribute.
        </p>

        <div className="mt-10 grid gap-px bg-border sm:grid-cols-2">
          {ROLES.map((r) => (
            <Link
              key={r.key}
              to="/auth/$role"
              params={{ role: r.key }}
              className="group flex flex-col bg-card p-7 transition-colors hover:bg-muted"
            >
              <span
                className={
                  r.accent === "green"
                    ? "h-1 w-10 bg-field"
                    : r.accent === "ink"
                      ? "h-1 w-10 bg-foreground"
                      : "h-1 w-10 bg-saffron"
                }
              />
              <h2 className="mt-5 text-xl font-semibold text-foreground">{r.label}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.tagline}</p>
              <p className="mt-4 text-xs text-muted-foreground">{r.authNote}</p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-foreground group-hover:text-saffron">
                Continue <ArrowRight className="size-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </SiteShell>
  );
}
