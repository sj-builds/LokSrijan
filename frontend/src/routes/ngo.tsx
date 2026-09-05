import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, Panel, StatTile } from "@/components/loksrijan/dashboard-shell";
import { StageBadge } from "@/components/loksrijan/problem-explorer";
import { PROBLEMS } from "@/lib/loksrijan-data";

export const Route = createFileRoute("/ngo")({
  head: () => ({
    meta: [
      { title: "NGO workspace — LokSrijan" },
      {
        name: "description",
        content: "Verify reported problems on the ground and sign off field pilots.",
      },
      { property: "og:title", content: "NGO workspace — LokSrijan" },
      {
        property: "og:description",
        content: "Ground-truth verification queue and pilot sign-offs.",
      },
    ],
  }),
  component: NgoDashboard,
});

const NAV = [
  { to: "/ngo", label: "Verification queue" },
  { to: "/problems", label: "Problem explorer" },
];

function NgoDashboard() {
  const pending = PROBLEMS.filter((p) => !p.ngoValidated);
  const verified = PROBLEMS.filter((p) => p.ngoValidated);

  return (
    <DashboardShell
      role="ngo"
      nav={NAV}
      title="Jal Sathi Foundation"
      subtitle="You are the verifying body for 4 districts. One report is waiting on a field visit."
      primaryAction={{ label: "Schedule a field visit" }}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Awaiting verification" value={String(pending.length)} tone="saffron" />
        <StatTile label="Verified by you" value={String(verified.length)} tone="field" />
        <StatTile
          label="Pilots under watch"
          value="2"
          note="Barmer cold chain, Kamla Nagar drains"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Panel title="Needs a field visit">
          <div className="space-y-4">
            {pending.map((p) => (
              <div key={p.id} className="border border-dashed border-saffron p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="label-caps text-muted-foreground">{p.id}</span>
                  <StageBadge stage={p.stage} />
                </div>
                <p className="mt-2 text-sm font-semibold text-foreground">{p.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {p.district}, {p.state} · reported by {p.reportedBy}
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Pilot sign-offs due">
          <ul className="space-y-4 text-sm">
            <li className="border-l-2 border-field pl-3">
              <p className="text-foreground">ColdBox Collective — 6 anganwadi centres</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Spoilage log verified for 41 days. Sign-off due 14 Sep.
              </p>
            </li>
            <li className="border-l-2 border-border pl-3">
              <p className="text-foreground">Drain Sentinels — node placement review</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Joint visit with shopkeepers' association on 14 Sep.
              </p>
            </li>
          </ul>
        </Panel>
      </div>

      <Panel title="Your verification record" className="mt-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {verified.map((p) => (
            <div key={p.id} className="border border-border p-4">
              <span className="label-caps text-muted-foreground">{p.id}</span>
              <p className="mt-1.5 text-sm text-foreground">{p.summary}</p>
            </div>
          ))}
        </div>
      </Panel>
    </DashboardShell>
  );
}
