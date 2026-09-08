import Link from "next/link";

import { ROLE_ROUTES } from "@/lib/navigation";

/** Global site header. Rendered once by the root layout. */
export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="font-semibold tracking-tight">
          LokSrijan
        </Link>

        <nav aria-label="Main navigation">
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {ROLE_ROUTES.map((route) => (
              <li key={route.href}>
                <Link
                  href={route.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {route.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link
          href="/dev"
          className="ml-auto text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Dev status
        </Link>
      </div>
    </header>
  );
}
