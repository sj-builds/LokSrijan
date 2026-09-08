import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, ShieldAlert, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Wordmark, CivicRule } from "./brand";
import { cn } from "@/lib/utils";
import { useAuth, logout } from "@/lib/session";
import { roleByKey, type RoleKey } from "@/lib/loksrijan-data";
import { getRoleMetadata, getDashboardForRole } from "@/lib/roles";
import type { BackendRole } from "@/types/auth";

type NavItem = { to: string; label: string };

export function DashboardShell({
  role,
  nav,
  title,
  subtitle,
  primaryAction,
  allowedRoles,
  children,
}: {
  role: RoleKey;
  nav: NavItem[];
  title: string;
  subtitle: string;
  primaryAction?: { label: string; onClick?: () => void; to?: string } | undefined;
  allowedRoles?: BackendRole[];
  children: React.ReactNode;
}) {
  const {
    session,
    isAuthenticated,
    role: userRole,
    name: userName,
    email: userEmail,
    isLoading,
    isError,
    error,
  } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Team workspace is a sub-feature of University in the backend model
  const effectiveTargetRole: BackendRole = role === "team" ? "university" : (role as BackendRole);

  const roleMeta = roleByKey(role)!;
  const accentBar =
    roleMeta.accent === "green"
      ? "bg-field"
      : roleMeta.accent === "ink"
        ? "bg-foreground"
        : "bg-saffron";

  const handleSignOut = () => {
    logout(queryClient);
    toast.success("Signed out successfully");
    navigate({ to: "/join" });
  };

  // 1. Prevent auth flash: never render dashboard while mounting or verifying session
  if (!mounted || isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-5">
        <Wordmark />
        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
          <div className="size-4 animate-spin rounded-full border-2 border-saffron border-t-transparent" />
          <span>Verifying authorization...</span>
        </div>
      </div>
    );
  }

  // 2. Network or server error reaching /api/auth/me
  if (isError && !isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-5 text-center">
        <Wordmark />
        <div className="max-w-md">
          <div className="inline-flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-3">
            <AlertCircle className="size-6" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Backend Connection Error</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {error instanceof Error
              ? error.message
              : "Unable to reach the LokSrijan backend server. Please verify it is running."}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex h-10 items-center rounded-sm bg-saffron px-5 text-sm font-medium text-primary-foreground hover:bg-saffron/90"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex h-10 items-center rounded-sm border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-muted"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  // 3. User is unauthenticated (no session token)
  if (!isAuthenticated || !session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-5 text-center">
        <Wordmark />
        <div className="max-w-sm">
          <h1 className="text-2xl font-semibold">This is the {roleMeta.label} workspace</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with a {roleMeta.label.toLowerCase()} account to access this workspace.
          </p>
        </div>
        <Link
          to="/auth/$role"
          params={{ role }}
          className="inline-flex h-11 items-center rounded-sm bg-saffron px-6 text-sm font-medium text-primary-foreground hover:bg-saffron/90"
        >
          Sign in as {roleMeta.label}
        </Link>
      </div>
    );
  }

  // 4. Authenticated, but has wrong role for this dashboard
  const isRoleAllowed =
    userRole === effectiveTargetRole ||
    (userRole !== undefined &&
      allowedRoles?.includes(userRole as BackendRole));

  if (!isRoleAllowed) {
    const activeRoleMeta = userRole ? getRoleMetadata(userRole) : undefined;
    const activeDashboard = userRole ? getDashboardForRole(userRole) : "/join";

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-5 text-center">
        <Wordmark />
        <div className="max-w-md">
          <div className="inline-flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-3">
            <ShieldAlert className="size-6" />
          </div>
          <span className="label-caps text-destructive">Unauthorized Workspace</span>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">Access Restricted</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            You are currently signed in as <strong className="text-foreground">{userName}</strong>{" "}
            with the{" "}
            <span className="font-semibold text-foreground uppercase text-xs tracking-wider">
              {activeRoleMeta?.label || userRole}
            </span>{" "}
            role. You do not have permission to access the {roleMeta.label.toLowerCase()} workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to={activeDashboard}
            className="inline-flex h-11 items-center rounded-sm bg-saffron px-6 text-sm font-medium text-primary-foreground hover:bg-saffron/90"
          >
            Go to your {activeRoleMeta?.label || userRole} workspace
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex h-11 items-center rounded-sm border border-border bg-card px-5 text-sm font-medium text-foreground hover:bg-muted"
          >
            Sign in with another account
          </button>
        </div>
      </div>
    );
  }

  // 5. Authorized: render the dashboard
  return (
    <div className="min-h-screen bg-background">
      <CivicRule />
      <div className="mx-auto flex w-full max-w-7xl flex-col lg:flex-row">
        <aside className="border-b border-border px-5 py-5 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r lg:py-7">
          <Wordmark compact />
          <div className="mt-5 flex items-center gap-2">
            <span className={cn("h-4 w-1", accentBar)} />
            <span className="label-caps text-muted-foreground">{roleMeta.label} workspace</span>
          </div>
          <nav className="mt-6 flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="whitespace-nowrap rounded-sm px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                activeProps={{ className: "bg-muted text-foreground font-medium" }}
                activeOptions={{ exact: true }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 hidden border-t border-border pt-5 lg:block">
            <p className="text-sm font-medium text-foreground truncate">
              {userName || session.name}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {userEmail || session.email}
            </p>
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="size-3.5" /> Sign out
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1 px-5 py-7 lg:px-9">
          <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground md:text-3xl">{title}</h1>
              <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
            </div>
            {primaryAction &&
              (primaryAction.to ? (
                <Link
                  to={primaryAction.to}
                  className="inline-flex h-11 shrink-0 items-center justify-center rounded-sm bg-saffron px-5 text-sm font-medium text-primary-foreground hover:bg-saffron/90"
                >
                  {primaryAction.label}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={primaryAction.onClick}
                  className="inline-flex h-11 shrink-0 items-center justify-center rounded-sm bg-saffron px-5 text-sm font-medium text-primary-foreground hover:bg-saffron/90"
                >
                  {primaryAction.label}
                </button>
              ))}
          </div>
          <div className="py-7">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function StatTile({
  label,
  value,
  note,
  tone = "default",
}: {
  label: string;
  value: string;
  note?: string;
  tone?: "default" | "saffron" | "field";
}) {
  return (
    <div className="border border-border bg-card p-5">
      <p className="label-caps text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-2 font-display text-3xl font-bold tracking-tight",
          tone === "saffron" ? "text-saffron" : tone === "field" ? "text-field" : "text-foreground",
        )}
      >
        {value}
      </p>
      {note && <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{note}</p>}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border border-border bg-card", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
