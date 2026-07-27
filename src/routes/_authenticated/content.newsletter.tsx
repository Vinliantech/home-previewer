import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, MailCheck, Search, Send, TrendingUp, UserCheck, UsersRound } from "lucide-react";
import { useContentWorkspace } from "@/components/content/ContentWorkspaceContext";
import {
  ContentEmpty,
  ContentPageHeader,
  ContentPanel,
  ContentStat,
} from "@/components/content/ContentUi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatContentDate, NEWSLETTER_INTERESTS } from "@/lib/content";

export const Route = createFileRoute("/_authenticated/content/newsletter")({
  component: ContentNewsletter,
});

function ContentNewsletter() {
  const { subscribers } = useContentWorkspace();
  const [query, setQuery] = useState("");
  const [interest, setInterest] = useState("all");
  const [status, setStatus] = useState("all");
  const active = subscribers.filter((item) => item.status === "active");
  const filtered = useMemo(
    () =>
      subscribers.filter((item) => {
        if (status !== "all" && item.status !== status) return false;
        if (interest !== "all" && !item.interests.includes(interest)) return false;
        const needle = query.toLowerCase();
        return (
          !needle || `${item.fullName} ${item.email} ${item.source}`.toLowerCase().includes(needle)
        );
      }),
    [interest, query, status, subscribers],
  );
  const interestCounts = NEWSLETTER_INTERESTS.map((name) => ({
    name,
    value: active.filter((item) => item.interests.includes(name)).length,
  })).sort((a, b) => b.value - a.value);
  const sourceCounts = Array.from(
    new Map(
      subscribers.map((item) => [
        item.source,
        subscribers.filter((value) => value.source === item.source).length,
      ]),
    ).entries(),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const monthCount = subscribers.filter((item) => {
    const date = new Date(item.subscribedAt);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="space-y-6">
      <ContentPageHeader
        eyebrow="Consent-led audience"
        title="Newsletter"
        description="Understand subscriber interests, article attribution and CRM linkage without separating content engagement from the customer journey."
        actions={
          <>
            <Button
              variant="outline"
              className="rounded-none border-[#ced9d4] bg-white"
              onClick={() => exportSubscribers(filtered)}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button asChild className="rounded-none bg-[#0e5949]">
              <Link to="/content/editor">
                <Send className="mr-2 h-4 w-4" />
                Create newsletter story
              </Link>
            </Button>
          </>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ContentStat
          icon={UsersRound}
          label="Total subscribers"
          value={subscribers.length}
          detail="Consent history retained"
        />
        <ContentStat
          icon={UserCheck}
          label="Active audience"
          value={active.length}
          detail={`${subscribers.filter((item) => item.status === "unsubscribed").length} unsubscribed`}
          tone="green"
        />
        <ContentStat
          icon={TrendingUp}
          label="Added this month"
          value={monthCount}
          detail="Attributed to source content"
          tone="gold"
        />
        <ContentStat
          icon={MailCheck}
          label="CRM-linked"
          value={subscribers.filter((item) => item.leadId).length}
          detail="Lead activity is synchronized"
          tone="blue"
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <ContentPanel
          title="Audience interests"
          description="Preferences selected at newsletter signup"
        >
          <div className="space-y-4 p-5">
            {interestCounts.map((item) => (
              <AudienceBar
                key={item.name}
                label={item.name}
                value={item.value}
                max={Math.max(...interestCounts.map((value) => value.value), 1)}
              />
            ))}
          </div>
        </ContentPanel>
        <ContentPanel
          title="Top acquisition sources"
          description="The article, category or page that captured each subscriber"
        >
          <div className="divide-y divide-[#e9edeb]">
            {sourceCounts.map(([source, value], index) => (
              <div key={source} className="flex items-center gap-3 px-5 py-4">
                <span className="font-serif text-lg text-[#b18333]">0{index + 1}</span>
                <p className="line-clamp-2 flex-1 text-xs font-medium text-[#415a52]">{source}</p>
                <strong className="font-serif text-lg text-[#21483e]">{value}</strong>
              </div>
            ))}
          </div>
        </ContentPanel>
      </div>
      <ContentPanel title="Subscribers" description="Consent, interests and CRM attribution">
        <div className="grid gap-3 border-b border-[#e5ebe8] p-4 lg:grid-cols-[1fr_230px_190px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#89958f]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, email or source"
              className="rounded-none pl-9"
            />
          </label>
          <Select value={interest} onValueChange={setInterest}>
            <SelectTrigger className="rounded-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All interests</SelectItem>
              {NEWSLETTER_INTERESTS.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="rounded-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
              <SelectItem value="bounced">Bounced</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-left">
              <thead className="border-b border-[#e7ebe9] bg-[#fafbf9] text-[9px] font-bold uppercase tracking-[0.13em] text-[#87918d]">
                <tr>
                  <th className="px-5 py-3">Subscriber</th>
                  <th className="px-4 py-3">Interests</th>
                  <th className="px-4 py-3">Acquisition source</th>
                  <th className="px-4 py-3">CRM</th>
                  <th className="px-4 py-3">Subscribed</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf0ee]">
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4">
                      <p className="text-xs font-semibold text-[#315047]">{item.fullName}</p>
                      <p className="mt-1 text-[10px] text-[#83908a]">{item.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex max-w-sm flex-wrap gap-1">
                        {item.interests.map((value) => (
                          <span
                            key={value}
                            className="bg-[#eef4f1] px-2 py-1 text-[9px] text-[#47675e]"
                          >
                            {value}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[10px] leading-4 text-[#6e7d76]">
                      {item.source}
                    </td>
                    <td className="px-4 py-4">
                      {item.leadId ? (
                        <Link
                          to="/crm/leads"
                          className="text-[10px] font-semibold text-[#9c7025] hover:underline"
                        >
                          Linked lead
                        </Link>
                      ) : (
                        <span className="text-[10px] text-[#9ba49f]">Not linked</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-[10px] text-[#738079]">
                      {formatContentDate(item.subscribedAt, true)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2 py-1 text-[9px] font-bold uppercase ${item.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <ContentEmpty
            title="No subscribers match this view"
            body="Change the interest, status or search filters."
          />
        )}
      </ContentPanel>
      <div className="border border-[#dce4e0] bg-white p-4 text-[11px] leading-5 text-[#687870]">
        <strong className="text-[#315047]">CRM integration:</strong> each signup creates or merges a
        lead, records consent and source content, stores selected interests, assigns the lead
        through the CRM workflow and adds a timeline activity for adviser context.
      </div>
    </div>
  );
}

function AudienceBar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[10px]">
        <span className="font-medium text-[#52675f]">{label}</span>
        <strong className="text-[#21483e]">{value}</strong>
      </div>
      <div className="h-2 bg-[#e8eeeb]">
        <div
          className="h-full bg-[#b48735]"
          style={{ width: `${Math.max(3, (value / max) * 100)}%` }}
        />
      </div>
    </div>
  );
}
function exportSubscribers(rows: ReturnType<typeof useContentWorkspace>["subscribers"]) {
  const header = [
    "Full name",
    "Email",
    "Interests",
    "Source",
    "Status",
    "Subscribed at",
    "CRM lead ID",
  ];
  const lines = [
    header,
    ...rows.map((item) => [
      item.fullName,
      item.email,
      item.interests.join("; "),
      item.source,
      item.status,
      item.subscribedAt,
      item.leadId ?? "",
    ]),
  ]
    .map((row) => row.map(csvCell).join(","))
    .join("\n");
  const blob = new Blob([lines], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `kay-steph-newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}
