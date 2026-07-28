import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, Download, Target, TrendingUp, UsersRound, WalletCards } from "lucide-react";
import { supabase as _supabaseTyped } from "@/integrations/supabase/client";
// CRM schema is not fully wired; cast to any to bypass generated types.
const supabase: any = _supabaseTyped;
import {
  fmtNaira,
  investmentLabel,
  pipelineStageForStatus,
  sourceLabel,
  type Lead,
} from "@/lib/crm";
import { CrmPageHeader, MetricCard, Panel } from "@/components/crm/CrmUi";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/crm/reports")({
  component: ReportsWorkspace,
});

type Campaign = {
  id: string;
  name: string;
  ad: string;
  spend: number;
  leads: number;
  qualified: number;
  inspections: number;
  applications: number;
  payments: number;
  value: number;
};

function ReportsWorkspace() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [leadResult, campaignResult] = await Promise.all([
        supabase.from("leads").select("*").order("captured_at", { ascending: false }).limit(5000),
        supabase.from("fb_campaigns").select("*").order("spend", { ascending: false }),
      ]);
      const leadRows = (leadResult.data ?? []) as unknown as Lead[];
      setLeads(leadRows);
      setCampaigns(
        (campaignResult.data ?? []).map((campaign) => {
          const rows = leadRows.filter((lead) => lead.campaign_id === campaign.campaign_id);
          return {
            id: campaign.campaign_id,
            name: campaign.campaign_name,
            ad: "Multiple adverts",
            spend: campaign.spend ?? 0,
            leads: rows.length,
            qualified: rows.filter((lead) =>
              [
                "qualified",
                "property_information_sent",
                "investment_pack_sent",
                "inspection_booked",
                "inspection_completed",
                "kyc_pending",
                "payment_pending",
                "payment_submitted",
                "payment_approved",
                "converted",
              ].includes(pipelineStageForStatus(lead.status)),
            ).length,
            inspections: rows.filter((lead) =>
              ["inspection_booked", "inspection_completed"].includes(
                pipelineStageForStatus(lead.status),
              ),
            ).length,
            applications: rows.filter((lead) =>
              [
                "kyc_pending",
                "payment_pending",
                "payment_submitted",
                "payment_approved",
                "converted",
              ].includes(pipelineStageForStatus(lead.status)),
            ).length,
            payments: rows.filter((lead) =>
              ["payment_approved", "converted"].includes(pipelineStageForStatus(lead.status)),
            ).length,
            value: rows
              .filter((lead) =>
                ["payment_approved", "converted"].includes(pipelineStageForStatus(lead.status)),
              )
              .reduce((sum, lead) => sum + (lead.budget_min ?? 0), 0),
          };
        }),
      );
      setLoading(false);
    })();
  }, []);

  const totalSpend = campaigns.reduce((sum, item) => sum + item.spend, 0);
  const campaignLeads = campaigns.reduce((sum, item) => sum + item.leads, 0);
  const campaignPayments = campaigns.reduce((sum, item) => sum + item.payments, 0);
  const campaignValue = campaigns.reduce((sum, item) => sum + item.value, 0);
  const costPerLead = campaignLeads ? totalSpend / campaignLeads : 0;
  const overallConversion = leads.length
    ? Math.round(
        (leads.filter((lead) => pipelineStageForStatus(lead.status) === "converted").length /
          leads.length) *
          100,
      )
    : 0;

  const dimensions = useMemo(
    () => ({
      source: aggregate(leads, (lead) => sourceLabel(lead.lead_source)),
      grade: aggregate(leads, (lead) => `Grade ${lead.lead_grade}`),
      property: aggregate(leads, (lead) => lead.property_name ?? "Not selected"),
      location: aggregate(
        leads,
        (lead) => lead.preferred_location ?? lead.location ?? "Not provided",
      ),
      investment: aggregate(leads, (lead) => investmentLabel(lead.investment_type)),
    }),
    [leads],
  );

  function exportCampaigns() {
    const cell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const rows = [
      [
        "Campaign",
        "Advert",
        "Spend",
        "Leads",
        "Cost per lead",
        "Qualified",
        "Inspections",
        "Applications",
        "Payments",
        "Value",
        "Conversion rate",
      ],
      ...campaigns.map((item) => [
        item.name,
        item.ad,
        item.spend,
        item.leads,
        item.leads ? Math.round(item.spend / item.leads) : 0,
        item.qualified,
        item.inspections,
        item.applications,
        item.payments,
        item.value,
        item.leads ? Math.round((item.payments / item.leads) * 100) : 0,
      ]),
    ];
    const url = URL.createObjectURL(
      new Blob([rows.map((row) => row.map(cell).join(",")).join("\n")], { type: "text/csv" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `kaysteph-campaign-report-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (loading)
    return <div className="py-20 text-center text-sm text-[#718079]">Loading CRM reports...</div>;

  return (
    <div className="space-y-5">
      <CrmPageHeader
        eyebrow="Performance intelligence"
        title="Measure buyers, not only form submissions"
        description="Compare lead quality, adviser activity and campaign outcomes from first touch through inspection, application and approved payment."
        actions={
          <Button
            variant="outline"
            className="border-[#ccd6d1] bg-white text-[#315149]"
            onClick={exportCampaigns}
          >
            <Download className="mr-2 h-4 w-4" /> Export report
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <MetricCard label="CRM leads" value={leads.length.toString()} icon={UsersRound} />
        <MetricCard label="Meta spend" value={fmtNaira(totalSpend)} icon={WalletCards} />
        <MetricCard label="Cost per lead" value={fmtNaira(costPerLead)} icon={Target} />
        <MetricCard
          label="Approved payments"
          value={campaignPayments.toString()}
          icon={TrendingUp}
        />
        <MetricCard label="Lead conversion" value={`${overallConversion}%`} icon={BarChart3} />
      </div>

      <Panel
        title="Facebook campaign performance"
        description="Campaign-to-payment attribution based on retained campaign IDs."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left">
            <thead className="bg-[#f7f9f7] text-[9px] uppercase tracking-[0.14em] text-[#77837e]">
              <tr>
                <th className="px-4 py-2.5">Campaign</th>
                <th className="px-4 py-2.5">Spend</th>
                <th className="px-4 py-2.5">Leads</th>
                <th className="px-4 py-2.5">CPL</th>
                <th className="px-4 py-2.5">Qualified</th>
                <th className="px-4 py-2.5">Inspections</th>
                <th className="px-4 py-2.5">Applications</th>
                <th className="px-4 py-2.5">Payments</th>
                <th className="px-4 py-2.5">Value</th>
                <th className="px-4 py-2.5">Conversion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7ebe8]">
              {campaigns.map((campaign) => (
                <tr key={campaign.id}>
                  <td className="px-4 py-3">
                    <p className="text-xs font-semibold text-[#304940]">{campaign.name}</p>
                    <p className="mt-0.5 text-[10px] text-[#818c87]">{campaign.ad}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#52615b]">{fmtNaira(campaign.spend)}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-[#304940]">
                    {campaign.leads}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#52615b]">
                    {fmtNaira(campaign.leads ? campaign.spend / campaign.leads : 0)}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#52615b]">{campaign.qualified}</td>
                  <td className="px-4 py-3 text-xs text-[#52615b]">{campaign.inspections}</td>
                  <td className="px-4 py-3 text-xs text-[#52615b]">{campaign.applications}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-emerald-700">
                    {campaign.payments}
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-[#b07824]">
                    {fmtNaira(campaign.value)}
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-[#0b5748]">
                    {campaign.leads ? Math.round((campaign.payments / campaign.leads) * 100) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#f7f9f7] text-xs font-semibold text-[#304940]">
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3">{fmtNaira(totalSpend)}</td>
                <td className="px-4 py-3">{campaignLeads}</td>
                <td className="px-4 py-3">{fmtNaira(costPerLead)}</td>
                <td colSpan={4} />
                <td className="px-4 py-3">{fmtNaira(campaignValue)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <DimensionPanel title="Leads by source" items={dimensions.source} />
        <DimensionPanel title="Leads by grade" items={dimensions.grade} />
        <DimensionPanel title="Leads by investment preference" items={dimensions.investment} />
        <DimensionPanel title="Leads by property" items={dimensions.property} />
        <DimensionPanel title="Leads by location" items={dimensions.location} />
        <Panel title="Reporting principle" description="How Kay-Steph should read these numbers.">
          <div className="space-y-3 p-4 text-xs leading-5 text-[#65726c]">
            <p>
              Campaign quality is measured by qualified leads, inspections, applications and
              approved payments.
            </p>
            <p>Lead budget is indicative and must not be treated as booked revenue.</p>
            <p>
              Original source attribution remains unchanged when a later enquiry is merged into the
              same profile.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function aggregate(leads: Lead[], key: (lead: Lead) => string) {
  const counts = new Map<string, number>();
  for (const lead of leads) counts.set(key(lead), (counts.get(key(lead)) ?? 0) + 1);
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);
}
function DimensionPanel({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; value: number }>;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <Panel title={title}>
      <div className="space-y-3 p-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex justify-between text-[11px]">
              <span className="truncate text-[#5d6a65]">{item.label}</span>
              <span className="font-semibold text-[#304940]">{item.value}</span>
            </div>
            <div className="h-1.5 bg-[#edf0ee]">
              <div
                className="h-full bg-[#0f6856]"
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
