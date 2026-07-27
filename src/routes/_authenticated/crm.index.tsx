import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Flame,
  MailCheck,
  Target,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  fmtDate,
  fmtNaira,
  isOverdue,
  pipelineStageForStatus,
  sourceLabel,
  type FollowUpTask,
  type Lead,
  type SalesAgent,
} from "@/lib/crm";
import {
  AdviserAvatar,
  CrmPageHeader,
  GradeBadge,
  MetricCard,
  Panel,
  SourceBadge,
  StatusBadge,
} from "@/components/crm/CrmUi";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/crm/")({
  component: CrmDashboard,
});

function CrmDashboard() {
  const { user } = Route.useRouteContext();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<FollowUpTask[]>([]);
  const [agents, setAgents] = useState<SalesAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [schemaReady, setSchemaReady] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const [leadResult, taskResult, agentResult] = await Promise.all([
        supabase.from("leads").select("*").order("captured_at", { ascending: false }).limit(500),
        supabase
          .from("follow_up_tasks")
          .select("*")
          .order("due_at", { ascending: true })
          .limit(250),
        supabase.from("sales_agents").select("*").eq("active", true),
      ]);
      if (!active) return;
      setLeads((leadResult.data ?? []) as unknown as Lead[]);
      setTasks((taskResult.data ?? []) as unknown as FollowUpTask[]);
      setAgents((agentResult.data ?? []) as unknown as SalesAgent[]);
      setSchemaReady(!leadResult.error && !taskResult.error && !agentResult.error);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const now = Date.now();
  const newToday = leads.filter(
    (lead) => now - new Date(lead.captured_at).getTime() < 24 * 60 * 60 * 1000,
  ).length;
  const qualified = leads.filter((lead) =>
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
    ].includes(pipelineStageForStatus(lead.status)),
  ).length;
  const converted = leads.filter(
    (lead) => pipelineStageForStatus(lead.status) === "converted",
  ).length;
  const overdueTasks = tasks.filter(isOverdue);
  // A lead nobody owns gets no follow-up task and no adviser chasing it. This
  // happens quietly whenever auto-assignment finds no active adviser, so it
  // needs to be on the dashboard rather than behind a filter.
  const unassigned = leads.filter((lead) => !lead.assigned_to).length;
  const noAdvisers = agents.length === 0;
  const inspections = leads.filter((lead) =>
    ["inspection_booked", "inspection_completed"].includes(pipelineStageForStatus(lead.status)),
  ).length;
  const conversionRate = leads.length ? Math.round((converted / leads.length) * 100) : 0;
  const firstName = user.user_metadata?.full_name?.split(" ")[0] ?? "team";

  const sources = useMemo(() => {
    const counts = new Map<string, number>();
    for (const lead of leads)
      counts.set(lead.lead_source || "other", (counts.get(lead.lead_source || "other") ?? 0) + 1);
    return [...counts.entries()]
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [leads]);
  const maxSource = Math.max(1, ...sources.map((item) => item.count));

  const agentLoad = useMemo(
    () =>
      agents
        .map((agent) => ({
          agent,
          active: leads.filter(
            (lead) =>
              lead.assigned_to === agent.user_id &&
              !["converted", "not_interested", "lost"].includes(
                pipelineStageForStatus(lead.status),
              ),
          ).length,
          hot: leads.filter((lead) => lead.assigned_to === agent.user_id && lead.lead_grade === "A")
            .length,
        }))
        .sort((a, b) => b.active - a.active),
    [agents, leads],
  );

  const priorityTasks = tasks
    .filter((task) => task.status === "open" && !task.completed_at)
    .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())
    .slice(0, 5);

  const openPipelineValue = leads
    .filter(
      (lead) =>
        !["converted", "not_interested", "lost"].includes(pipelineStageForStatus(lead.status)),
    )
    .reduce((total, lead) => total + (lead.budget_max ?? lead.budget_min ?? 0), 0);

  if (loading) {
    return <div className="py-20 text-center text-sm text-[#718079]">Loading CRM workspace...</div>;
  }

  return (
    <div className="space-y-5">
      <CrmPageHeader
        eyebrow="CRM workspace"
        title={`Good day, ${firstName}`}
        description="Monitor first-response performance, adviser workload and every prospect moving toward a property decision."
        actions={
          <>
            <Button asChild variant="outline" className="border-[#ccd6d1] bg-white text-[#315149]">
              <Link to="/crm/tasks">View tasks</Link>
            </Button>
            <Button asChild className="bg-[#0b5748] text-white hover:bg-[#08483c]">
              <Link to="/crm/leads">
                <UserPlus className="mr-2 h-4 w-4" /> Add lead
              </Link>
            </Button>
          </>
        }
      />

      {!schemaReady && (
        <div className="flex items-start gap-3 border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Apply the latest CRM workspace migration to enable grading, events, automations and
          delivery reporting in this environment.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="Total leads"
          value={leads.length.toString()}
          icon={UsersRound}
          change={12}
          changeLabel="vs last period"
        />
        <MetricCard
          label="New today"
          value={newToday.toString()}
          icon={UserPlus}
          change={8}
          changeLabel="24-hour intake"
        />
        <MetricCard
          label="Unassigned"
          value={unassigned.toString()}
          icon={UserPlus}
          attention={unassigned > 0}
          changeLabel={noAdvisers ? "no active advisers" : "nobody following up"}
        />
        <MetricCard
          label="Qualified"
          value={qualified.toString()}
          icon={Target}
          change={15}
          changeLabel="active prospects"
        />
        <MetricCard
          label="Overdue follow-ups"
          value={overdueTasks.length.toString()}
          icon={Clock3}
          attention={overdueTasks.length > 0}
          changeLabel="needs action"
        />
        <MetricCard
          label="Inspections"
          value={inspections.toString()}
          icon={CalendarCheck2}
          change={6}
          changeLabel="booked or done"
        />
        <MetricCard
          label="Conversion rate"
          value={`${conversionRate}%`}
          icon={CheckCircle2}
          change={3}
          changeLabel="lead to client"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <Panel
          title="Priority follow-ups"
          description="The most urgent open activities across the sales team."
          action={
            <Link to="/crm/tasks" className="text-xs font-semibold text-[#0b5748] hover:underline">
              All tasks
            </Link>
          }
        >
          <div className="divide-y divide-[#e7ebe8]">
            {priorityTasks.map((task) => {
              const lead = leads.find((item) => item.id === task.lead_id);
              const overdue = isOverdue(task);
              const adviser = agents.find((item) => item.user_id === task.assigned_to);
              return (
                <div key={task.id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${overdue ? "bg-rose-50 text-rose-700" : "bg-[#edf4f1] text-[#0b5748]"}`}
                  >
                    {overdue ? <Flame className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[#263f38]">{task.title}</p>
                    <p className="mt-0.5 truncate text-[11px] text-[#7a8580]">
                      {lead?.full_name ?? "Unknown lead"} · {fmtDate(task.due_at)}
                    </p>
                  </div>
                  {adviser && (
                    <div className="hidden sm:block">
                      <AdviserAvatar name={adviser.full_name} compact />
                    </div>
                  )}
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider ${overdue ? "text-rose-700" : "text-[#6f7b76]"}`}
                  >
                    {overdue ? "Overdue" : task.priority}
                  </span>
                </div>
              );
            })}
            {priorityTasks.length === 0 && (
              <p className="px-4 py-10 text-center text-xs text-[#7a8580]">No open follow-ups.</p>
            )}
          </div>
        </Panel>

        <Panel title="Pipeline value" description="Indicative budgets on open prospects.">
          <div className="p-4">
            <p className="text-3xl font-semibold text-[#173f36]">{fmtNaira(openPipelineValue)}</p>
            <p className="mt-1 text-xs text-[#7a8580]">
              Not a revenue forecast. Values reflect lead budget ranges.
            </p>
            <div className="mt-5 space-y-3">
              {[
                {
                  label: "Intake",
                  keys: ["new", "auto_response_sent", "assigned_to_adviser"],
                  color: "bg-slate-500",
                },
                {
                  label: "Engage",
                  keys: ["contact_attempted", "contacted"],
                  color: "bg-indigo-500",
                },
                {
                  label: "Evaluate",
                  keys: [
                    "qualified",
                    "property_information_sent",
                    "investment_pack_sent",
                    "inspection_booked",
                    "inspection_completed",
                  ],
                  color: "bg-amber-500",
                },
                {
                  label: "Close",
                  keys: ["kyc_pending", "payment_pending", "payment_submitted", "payment_approved"],
                  color: "bg-emerald-600",
                },
              ].map((phase) => {
                const count = leads.filter((lead) =>
                  phase.keys.includes(pipelineStageForStatus(lead.status)),
                ).length;
                const width = leads.length ? Math.max(4, (count / leads.length) * 100) : 0;
                return (
                  <div key={phase.label}>
                    <div className="mb-1 flex justify-between text-[11px]">
                      <span className="text-[#5e6b66]">{phase.label}</span>
                      <span className="font-semibold text-[#324a43]">{count}</span>
                    </div>
                    <div className="h-1.5 bg-[#edf0ee]">
                      <div className={`h-full ${phase.color}`} style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <Button
              asChild
              variant="outline"
              className="mt-5 w-full border-[#ccd6d1] text-[#0b5748]"
            >
              <Link to="/crm/pipeline">
                Open pipeline <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Panel title="Lead sources" description="First-touch attribution on current records.">
          <div className="space-y-3 p-4">
            {sources.map((item) => (
              <div key={item.source}>
                <div className="mb-1 flex justify-between text-[11px]">
                  <span className="text-[#52615b]">{sourceLabel(item.source)}</span>
                  <span className="font-semibold text-[#263f38]">{item.count}</span>
                </div>
                <div className="h-1.5 bg-[#edf0ee]">
                  <div
                    className="h-full bg-[#0f6856]"
                    style={{ width: `${(item.count / maxSource) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Adviser workload" description="Open leads and Grade A prospects by owner.">
          <div className="divide-y divide-[#e7ebe8]">
            {agentLoad.map(({ agent, active, hot }) => (
              <div key={agent.user_id} className="flex items-center gap-3 px-4 py-3">
                <AdviserAvatar name={agent.full_name} />
                <div className="ml-auto text-right">
                  <p className="text-xs font-semibold text-[#263f38]">{active} open</p>
                  <p className="text-[10px] text-[#b07824]">{hot} hot leads</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Automation health"
          description="Email delivery and active sequence readiness."
        >
          <div className="space-y-4 p-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#f5f8f6] p-3">
                <p className="text-lg font-semibold text-[#173f36]">{0}</p>
                <p className="text-[9px] uppercase tracking-wider text-[#7a8580]">Sent</p>
              </div>
              <div className="bg-[#f5f8f6] p-3">
                <p className="text-lg font-semibold text-[#173f36]">{0}</p>
                <p className="text-[9px] uppercase tracking-wider text-[#7a8580]">Opened</p>
              </div>
              <div className="bg-[#f5f8f6] p-3">
                <p className="text-lg font-semibold text-[#173f36]">{0}</p>
                <p className="text-[9px] uppercase tracking-wider text-[#7a8580]">Clicked</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-[#e7ebe8] pt-3 text-xs">
              <span className="flex items-center gap-2 text-[#5d6a65]">
                <MailCheck className="h-4 w-4 text-[#0b6855]" /> Active sequences
              </span>
              <span className="font-semibold text-[#173f36]">{0}</span>
            </div>
            <Button asChild variant="outline" className="w-full border-[#ccd6d1] text-[#0b5748]">
              <Link to="/crm/automations">Manage automations</Link>
            </Button>
          </div>
        </Panel>
      </div>

      <Panel
        title="Recent leads"
        description="Latest prospects across forms, campaigns, referrals and events."
        action={
          <Link to="/crm/leads" className="text-xs font-semibold text-[#0b5748] hover:underline">
            View all leads
          </Link>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-[#f7f9f7] text-[9px] uppercase tracking-[0.16em] text-[#74807b]">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Lead</th>
                <th className="px-4 py-2.5 font-semibold">Source</th>
                <th className="px-4 py-2.5 font-semibold">Property</th>
                <th className="px-4 py-2.5 font-semibold">Grade</th>
                <th className="px-4 py-2.5 font-semibold">Stage</th>
                <th className="px-4 py-2.5 font-semibold">Captured</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7ebe8]">
              {leads.slice(0, 6).map((lead) => (
                <tr key={lead.id} className="hover:bg-[#fafbf9]">
                  <td className="px-4 py-3">
                    <Link
                      to="/crm/leads/$leadId"
                      params={{ leadId: lead.id }}
                      className="text-xs font-semibold text-[#24443b] hover:text-[#0b5748]"
                    >
                      {lead.full_name}
                    </Link>
                    <p className="mt-0.5 text-[10px] text-[#84908b]">
                      {lead.email ?? lead.phone ?? "No contact detail"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <SourceBadge source={lead.lead_source} />
                  </td>
                  <td className="px-4 py-3 text-xs text-[#53615c]">
                    {lead.property_name ?? "Not selected"}
                  </td>
                  <td className="px-4 py-3">
                    <GradeBadge grade={lead.lead_grade} compact />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={lead.status} compact />
                  </td>
                  <td className="px-4 py-3 text-[10px] text-[#7c8782]">
                    {fmtDate(lead.captured_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
