import type { ReactNode } from "react";

interface PageShellProps {
  title: string;
  description?: string;
  /** Small uppercase label above the title, e.g. "Placeholder". */
  badge?: string;
  children?: ReactNode;
}

/**
 * Standard page wrapper: consistent width, spacing, and heading order.
 *
 * Every route should render exactly one `PageShell` so that page structure
 * and the `h1` stay consistent across the app.
 */
export function PageShell({
  title,
  description,
  badge,
  children,
}: PageShellProps) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <div className="mb-8">
        {badge ? (
          <p className="mb-3 inline-block rounded border border-border px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {badge}
          </p>
        ) : null}

        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>

        {description ? (
          <p className="mt-3 max-w-2xl text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {children}
    </main>
  );
}
