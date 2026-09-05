import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Wordmark, CivicRule } from "./brand";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/challenges", label: "Problems" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/join", label: "Roles" },
] as const;

export function SiteShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CivicRule />
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <Wordmark />
          <nav className="hidden items-center gap-7 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground font-medium" }}
              >
                {n.label}
              </Link>
            ))}
            <Link
              to="/join"
              className="inline-flex h-10 items-center rounded-sm bg-saffron px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-saffron/90"
            >
              Sign in
            </Link>
          </nav>
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex size-10 items-center justify-center rounded-sm border border-border md:hidden"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
        <div className={cn("border-t border-border md:hidden", open ? "block" : "hidden")}>
          <div className="mx-auto flex w-full max-w-6xl flex-col px-5 py-3">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="py-2.5 text-sm text-foreground"
              >
                {n.label}
              </Link>
            ))}
            <Link
              to="/join"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex h-11 items-center justify-center rounded-sm bg-saffron text-sm font-medium text-primary-foreground"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              A civic problem pipeline: citizens report, NGOs verify, student teams build, industry
              mentors, and government adopts what works.
            </p>
          </div>
          <div>
            <p className="label-caps text-muted-foreground">Explore</p>
            <ul className="mt-3 space-y-2 text-sm">
              {NAV.map((n) => (
                <li key={n.to}>
                  <Link to={n.to} className="text-foreground hover:text-saffron">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="label-caps text-muted-foreground">Participants</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Citizens &amp; collectives</li>
              <li>Universities &amp; student teams</li>
              <li>Industry &amp; NGOs</li>
              <li>District &amp; state departments</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border">
          <div className="mx-auto w-full max-w-6xl px-5 py-5 text-xs text-muted-foreground">
            LokSrijan — prototype built for Smart India Hackathon 2026. Data shown is illustrative.
          </div>
        </div>
      </footer>
    </div>
  );
}
