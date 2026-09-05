import { useState } from "react";
import { createFileRoute, Link, notFound, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, AlertCircle, CheckCircle2, Lock, Mail, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { CivicRule, Wordmark } from "@/components/loksrijan/brand";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { roleByKey, ROLES } from "@/lib/loksrijan-data";
import { writeSession, AUTH_QUERY_KEY } from "@/lib/session";
import { authService } from "@/services/auth.service";
import { getDashboardForRole } from "@/lib/roles";
import { ApiError } from "@/lib/api";

export const Route = createFileRoute("/auth/$role")({
  loader: ({ params }) => {
    // "team" maps to university nodal workspace in the backend model
    if (params.role === "team") {
      throw redirect({ to: "/auth/$role", params: { role: "university" } });
    }
    const role = roleByKey(params.role);
    if (!role) throw notFound();
    return { roleKey: role.key };
  },
  head: ({ loaderData }) => {
    const role = loaderData ? roleByKey(loaderData.roleKey) : undefined;
    if (!role) {
      return {
        meta: [{ title: "Sign in — LokSrijan" }, { name: "robots", content: "noindex" }],
      };
    }
    return {
      meta: [
        { title: `${role.authTitle} — LokSrijan` },
        { name: "description", content: `${role.tagline} ${role.authNote}` },
        { property: "og:title", content: `${role.authTitle} — LokSrijan` },
        { property: "og:description", content: role.tagline },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center px-5 text-center">
      <div>
        <h1 className="text-2xl font-semibold">That role doesn't exist</h1>
        <Link to="/join" className="mt-4 inline-block text-sm underline underline-offset-4">
          Back to role picker
        </Link>
      </div>
    </div>
  ),
  component: AuthPage,
});

function AuthPage() {
  const { roleKey } = Route.useLoaderData();
  const role = roleByKey(roleKey)!;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const accentText =
    role.accent === "green"
      ? "text-field"
      : role.accent === "ink"
        ? "text-foreground"
        : "text-saffron";
  const accentBar =
    role.accent === "green" ? "bg-field" : role.accent === "ink" ? "bg-foreground" : "bg-saffron";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (mode === "register") {
      if (!name.trim()) {
        setErrorMessage("Please enter your full name.");
        return;
      }
      if (password.length < 8) {
        setErrorMessage("Password must be at least 8 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage("Passwords do not match.");
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await authService.register({
          name: name.trim(),
          email: email.trim(),
          password,
        });

        // Store session with real backend user details and JWT
        writeSession({
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          role: res.user.role,
          token: res.token.access_token,
        });

        queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
        toast.success(`Account created! Welcome to LokSrijan, ${res.user.name}.`);

        // Navigate strictly according to authoritative backend role
        const targetPath = getDashboardForRole(res.user.role);
        navigate({ to: targetPath });
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? err.message
            : "Registration failed. Please check your details and try again.";
        setErrorMessage(msg);
        toast.error(msg);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Login mode
      setIsSubmitting(true);
      try {
        const res = await authService.login({
          email: email.trim(),
          password,
        });

        // Store session with real backend user details and JWT
        writeSession({
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          role: res.user.role,
          token: res.token.access_token,
        });

        queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
        toast.success(`Welcome back, ${res.user.name}!`);

        // Authoritative backend role determines target destination
        const targetPath = getDashboardForRole(res.user.role);

        if (role.key !== "team" && res.user.role !== role.key) {
          toast.info(`Signed in with ${res.user.role} account. Redirecting to your workspace.`);
        }

        navigate({ to: targetPath });
      } catch (err) {
        const msg =
          err instanceof ApiError && err.status === 401
            ? "Invalid email or password. Please verify your credentials."
            : err instanceof ApiError
              ? err.message
              : "Unable to sign in. Please ensure the backend server is running.";
        setErrorMessage(msg);
        toast.error(msg);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <CivicRule />
      <div className="grid min-h-[calc(100vh-4px)] lg:grid-cols-[1fr_1.1fr]">
        <aside className="hidden flex-col justify-between border-r border-border bg-card p-12 lg:flex">
          <Wordmark />
          <div>
            <span className={`block h-1 w-12 ${accentBar}`} />
            <h2 className="mt-6 max-w-sm text-3xl font-bold leading-tight text-foreground">
              {role.tagline}
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {role.authNote}
            </p>
          </div>
          <div>
            <p className="label-caps text-muted-foreground">Other roles</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {ROLES.filter((r) => r.key !== role.key && r.key !== "team").map((r) => (
                <Link
                  key={r.key}
                  to="/auth/$role"
                  params={{ role: r.key }}
                  className="rounded-sm border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                >
                  {r.label}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex items-center justify-center px-5 py-14">
          <div className="w-full max-w-md">
            <Link
              to="/join"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" /> Role picker
            </Link>

            <p className={`label-caps mt-8 ${accentText}`}>{role.label} access</p>
            <h1 className="mt-2 text-3xl font-bold text-foreground">
              {mode === "login" ? role.authTitle : "Create a Citizen Account"}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground lg:hidden">{role.authNote}</p>

            {/* Mode switcher tabs */}
            <div className="mt-6 flex border-b border-border">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMessage(null);
                }}
                className={`pb-3 text-sm font-medium border-b-2 px-4 transition-colors ${
                  mode === "login"
                    ? "border-saffron text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setErrorMessage(null);
                }}
                className={`pb-3 text-sm font-medium border-b-2 px-4 transition-colors ${
                  mode === "register"
                    ? "border-saffron text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Create account
              </button>
            </div>

            {/* Role context notice for registration */}
            {mode === "register" && (
              <div className="mt-4 rounded-sm border border-border bg-card p-3 text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Note:</strong> Public registration creates a{" "}
                <span className="font-semibold text-foreground">Citizen</span> account. Organization
                accounts (Government, University, NGO, Industry) are provisioned by platform
                administrators.
              </div>
            )}

            {/* Error display */}
            {errorMessage && (
              <div className="mt-4 flex items-start gap-2.5 rounded-sm border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              {mode === "register" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-medium">
                    Full Name
                  </Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Sunita Patel"
                      className="h-11 rounded-sm border-border bg-card pl-10 text-sm"
                      required
                      autoComplete="name"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      role.key === "government"
                        ? "officer@nic.in"
                        : role.key === "university"
                          ? "nodal@univ.ac.in"
                          : "you@example.com"
                    }
                    className="h-11 rounded-sm border-border bg-card pl-10 text-sm"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "register" ? "At least 8 characters" : "••••••••"}
                    className="h-11 rounded-sm border-border bg-card pl-10 text-sm"
                    required
                    minLength={mode === "register" ? 8 : undefined}
                    autoComplete={mode === "register" ? "new-password" : "current-password"}
                  />
                </div>
              </div>

              {mode === "register" && (
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-medium">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      className="h-11 rounded-sm border-border bg-card pl-10 text-sm"
                      required
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-saffron text-sm font-medium text-primary-foreground transition-colors hover:bg-saffron/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    <span>{mode === "login" ? "Signing in..." : "Creating account..."}</span>
                  </>
                ) : (
                  <span>
                    {mode === "login"
                      ? `Sign in to ${role.label} workspace`
                      : "Create citizen account"}
                  </span>
                )}
              </button>

              <div className="pt-2 text-center">
                {mode === "login" ? (
                  <p className="text-xs text-muted-foreground">
                    Don't have an account yet?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("register");
                        setErrorMessage(null);
                      }}
                      className="font-medium text-foreground underline underline-offset-4 hover:text-saffron"
                    >
                      Register as a Citizen
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Already registered?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setErrorMessage(null);
                      }}
                      className="font-medium text-foreground underline underline-offset-4 hover:text-saffron"
                    >
                      Sign in with your email
                    </button>
                  </p>
                )}
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
