import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, Panel, StatTile } from "@/components/loksrijan/dashboard-shell";
import { StageBadge } from "@/components/loksrijan/problem-explorer";
import { PROBLEMS } from "@/lib/loksrijan-data";

export const Route = createFileRoute("/government")({
  head: () => ({
    meta: [
      { title: "Government workspace — LokSrijan" },
      {
        name: "description",
        content: "Prioritise verified problems, review pilot evidence and sanction what works.",
      },
      { property: "og:title", content: "Government workspace — LokSrijan" },
      {
        property: "og:description",
        content: "District priority list, pilot evidence and sanction decisions.",
      },
    ],
  }),
  component: GovernmentDashboard,
});

const NAV = [
  { to: "/government", label: "Priority list" },
  { to: "/problems", label: "Problem explorer" },
];

function GovernmentDashboard() {
  const ranked = [...PROBLEMS].sort((a, b) => b.endorsements - a.endorsements);

  return (
    <DashboardShell
      role="government"
      nav={NAV}
      title="Dept. of Urban Development — adoption desk"
      subtitle="Ranked by verified citizen endorsement, not by complaint volume. One pilot is awaiting your sanction."
      primaryAction={{ label: "Sanction a pilot" }}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Verified problems" value="5" />
        <StatTile label="Pilots running" value="2" tone="saffron" />
        <StatTile
          label="Awaiting sanction"
          value="1"
          tone="field"
          note="Barmer cold chain, ₹42L rollout"
        />
        <StatTile label="Adopted this year" value="1" note="Sriperumbudur night shuttle" />
      </div>

      <Panel title="Priority list" className="mt-8">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                {["ID", "Problem", "District", "Endorsements", "Stage"].map((h) => (
                  <th key={h} className="label-caps pb-3 text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ranked.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">{p.id}</td>
                  <td className="max-w-sm py-3 pr-4 text-foreground">{p.title}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{p.district}</td>
                  <td className="py-3 pr-4 font-medium text-foreground">{p.endorsements}</td>
                  <td className="py-3">
                    <StageBadge stage={p.stage} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Evidence awaiting your decision">
          <p className="text-sm text-foreground">ColdBox Collective — solar-buffered cold chain</p>
          <p className="mt-2 text-sm text-muted-foreground">
            41 days without spoilage across 6 centres, NGO-verified, industry technical review
            cleared. Rollout to 21 centres estimated at ₹42 lakh.
          </p>
        </Panel>
        <Panel title="Departmental commitments">
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>Sriperumbudur shuttle — 6 vehicles funded, running since 05 Aug.</li>
            <li>Kamla Nagar drains — desilting schedule to shift to sensor triggers from Oct.</li>
          </ul>
        </Panel>
      </div>
    </DashboardShell>
  );
}
