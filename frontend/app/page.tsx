import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";
import { ROLE_ROUTES } from "@/lib/navigation";

export default function HomePage() {
  return (
    <PageShell
      badge="SIH / internal hackathon MVP"
      title="From Citizen Signal to Verified Societal Impact"
      description="LokSrijan turns local problem reports into structured, clustered challenges, then matches them with universities, NGOs, and industry partners who can solve them. AI assists; people decide."
    >
      <section aria-labelledby="roles-heading" className="mt-2">
        <h2 id="roles-heading" className="text-lg font-medium">
          Entry points
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Placeholder routes. No features are implemented yet.
        </p>

        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ROLE_ROUTES.map((route) => (
            <li key={route.href}>
              <Link
                href={route.href}
                className="block h-full rounded-lg border border-border p-4 transition-colors hover:bg-muted"
              >
                <span className="font-medium">{route.label}</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {route.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="status-heading" className="mt-12">
        <h2 id="status-heading" className="text-lg font-medium">
          Project status
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          This is the development foundation only: routing, shared layout, API
          client, and a verified frontend-to-backend connection. See the{" "}
          <Link href="/dev" className="underline underline-offset-4">
            connectivity check
          </Link>{" "}
          to confirm your local environment works.
        </p>
      </section>
    </PageShell>
  );
}
