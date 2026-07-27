import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Send,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  LEAD_GRADES,
  LEAD_STATUSES,
  TASK_TYPES,
  fmtDate,
  fmtNaira,
  gradeMeta,
  investmentLabel,
  sourceLabel,
  type FollowUpTask,
  type Lead,
  type LeadGrade,
  type LeadStatus,
  type SalesAgent,
  type TaskType,
} from "@/lib/crm";
import {
  addLeadNote,
  assignLead,
  createFollowUpTask,
  updateLeadGrade,
  updateLeadStatus,
} from "@/lib/crm.functions";
import {
  AdviserAvatar,
  CrmPageHeader,
  EmptyState,
  GradeBadge,
  Panel,
  SourceBadge,
  StatusBadge,
} from "@/components/crm/CrmUi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/crm/leads/$leadId")({
  component: LeadProfile,
});

type ActivityItem = {
  id: string;
  activity_type?: string;
  type?: string;
  body: string | null;
  created_at: string;
};

type DeliveryItem = {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  opened_at: string | null;
};

function LeadProfile() {
  const { leadId } = Route.useParams();
  const [lead, setLead] = useState<Lead | null>(
    null,
  );
  const [agents, setAgents] = useState<SalesAgent[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>(
    [],
  );
  const [tasks, setTasks] = useState<FollowUpTask[]>(
    [],
  );
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const changeStatus = useServerFn(updateLeadStatus);
  const changeGrade = useServerFn(updateLeadGrade);
  const assign = useServerFn(assignLead);
  const addNote = useServerFn(addLeadNote);

  const refresh = useCallback(async () => {
    const [leadResult, agentResult, activityResult, taskResult, deliveryResult] = await Promise.all(
      [
        supabase.from("leads").select("*").eq("id", leadId).maybeSingle(),
        supabase.from("sales_agents").select("*").eq("active", true).order("full_name"),
        supabase
          .from("lead_activities")
          .select("*")
          .eq("lead_id", leadId)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("follow_up_tasks")
          .select("*")
          .eq("lead_id", leadId)
          .order("due_at", { ascending: true }),
        supabase
          .from("email_deliveries")
          .select("id, subject, status, created_at, opened_at")
          .eq("lead_id", leadId)
          .order("created_at", { ascending: false })
          .limit(50),
      ],
    );
    setLead(leadResult.data as unknown as Lead | null);
    setAgents((agentResult.data ?? []) as unknown as SalesAgent[]);
    setActivities((activityResult.data ?? []) as unknown as ActivityItem[]);
    setTasks((taskResult.data ?? []) as unknown as FollowUpTask[]);
    setDeliveries((deliveryResult.data ?? []) as DeliveryItem[]);
    setLoading(false);
  }, [leadId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const adviser = agents.find((item) => item.user_id === lead?.assigned_to);
  const openTasks = tasks.filter((task) => task.status === "open" && !task.completed_at);
  const gradeRecommendation = lead ? gradeMeta(lead.recommended_grade) : null;

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    try {
      await action();
      toast.success(success);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The change could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  if (loading)
    return <div className="py-20 text-center text-sm text-[#718079]">Loading lead profile...</div>;
  if (!lead)
    return (
      <EmptyState
        title="Lead not found"
        body="This lead may have been removed or is outside your access scope."
        action={
          <Button asChild variant="outline">
            <Link to="/crm/leads">Back to leads</Link>
          </Button>
        }
      />
    );

  return (
    <div className="space-y-5">
      <Link
        to="/crm/leads"
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#557069] hover:text-[#0b5748]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to all leads
      </Link>
      <CrmPageHeader
        eyebrow={`${sourceLabel(lead.lead_source)} · Captured ${fmtDate(lead.captured_at)}`}
        title={lead.full_name}
        description={`${lead.property_name ?? "No property selected"} · ${investmentLabel(lead.investment_type)}`}
        actions={
          <>
            {lead.phone && (
              <Button
                asChild
                variant="outline"
                className="border-[#ccd6d1] bg-white text-[#315149]"
              >
                <a href={`tel:${lead.phone}`}>
                  <Phone className="mr-2 h-4 w-4" /> Call
                </a>
              </Button>
            )}
            {(lead.whatsapp_number || lead.phone) && (
              <Button
                asChild
                variant="outline"
                className="border-[#ccd6d1] bg-white text-[#315149]"
              >
                <a
                  href={`https://wa.me/${(lead.whatsapp_number || lead.phone || "").replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                </a>
              </Button>
            )}
            {lead.email && (
              <Button asChild className="bg-[#0b5748] text-white hover:bg-[#08483c]">
                <a href={`mailto:${lead.email}`}>
                  <Mail className="mr-2 h-4 w-4" /> Email
                </a>
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
        <div className="space-y-4">
          <Panel
            title="Qualification and ownership"
            description="Update the stage, grade and accountable adviser."
          >
            <div className="grid gap-4 p-4 sm:grid-cols-3">
              <Field label="Pipeline stage">
                <Select
                  value={lead.status}
                  onValueChange={(status) =>
                    run(
                      () =>
                        changeStatus({ data: { leadId: lead.id, status: status as LeadStatus } }),
                      "Lead stage updated.",
                    )
                  }
                  disabled={busy}
                >
                  <SelectTrigger>
                    <SelectValue>
                      <StatusBadge status={lead.status} compact />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUSES.map((item) => (
                      <SelectItem key={item.key} value={item.key}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Lead grade">
                <Select
                  value={lead.lead_grade}
                  onValueChange={(grade) =>
                    run(
                      () => changeGrade({ data: { leadId: lead.id, grade: grade as LeadGrade } }),
                      "Lead grade updated.",
                    )
                  }
                  disabled={busy}
                >
                  <SelectTrigger>
                    <SelectValue>
                      <GradeBadge grade={lead.lead_grade} compact />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_GRADES.map((item) => (
                      <SelectItem key={item.key} value={item.key}>
                        Grade {item.key} · {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Assigned adviser">
                <Select
                  value={lead.assigned_to ?? ""}
                  onValueChange={(agentId) =>
                    run(() => assign({ data: { leadId: lead.id, agentId } }), "Lead assigned.")
                  }
                  disabled={busy}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((item) => (
                      <SelectItem key={item.user_id} value={item.user_id}>
                        {item.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            {lead.recommended_grade !== lead.lead_grade && gradeRecommendation && (
              <div className="flex flex-col gap-3 border-t border-[#e7ebe8] bg-amber-50 px-4 py-3 text-xs text-amber-900 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Recommended: Grade {lead.recommended_grade} · {gradeRecommendation.label}.{" "}
                  {lead.grade_reason}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-300 bg-white text-amber-900"
                  onClick={() =>
                    run(
                      () =>
                        changeGrade({
                          data: {
                            leadId: lead.id,
                            grade: lead.recommended_grade,
                            reason: lead.grade_reason ?? undefined,
                          },
                        }),
                      "Recommended grade applied.",
                    )
                  }
                >
                  Apply recommendation
                </Button>
              </div>
            )}
          </Panel>

          <Panel
            title="Lead details"
            description="Contact, buying preference and first-touch information."
          >
            <div className="grid gap-x-8 gap-y-5 p-4 sm:grid-cols-2 lg:grid-cols-3">
              <Detail label="Email" value={lead.email} />
              <Detail label="Phone" value={lead.phone} />
              <Detail label="WhatsApp" value={lead.whatsapp_number} />
              <Detail label="Location" value={lead.location} />
              <Detail label="Country of residence" value={lead.country_of_residence} />
              <Detail label="Preferred contact" value={lead.preferred_contact_method} />
              <Detail label="Property" value={lead.property_name} />
              <Detail label="Property type" value={lead.property_type} />
              <Detail label="Preferred location" value={lead.preferred_location} />
              <Detail label="Budget minimum" value={fmtNaira(lead.budget_min)} />
              <Detail label="Budget maximum" value={fmtNaira(lead.budget_max)} />
              <Detail
                label="Expected timeline"
                value={lead.expected_timeline?.replaceAll("_", " ")}
              />
            </div>
          </Panel>

          <Panel
            title="Activity timeline"
            description="Calls, messages, stage changes, documents and automation activity."
          >
            <div className="border-b border-[#e7ebe8] p-4">
              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                placeholder="Add a call note, WhatsApp summary or next-step context..."
              />
              <div className="mt-2 flex justify-end">
                <Button
                  size="sm"
                  disabled={!note.trim() || busy}
                  onClick={() =>
                    run(async () => {
                      await addNote({ data: { leadId: lead.id, body: note } });
                      setNote("");
                    }, "Note added.")
                  }
                  className="bg-[#0b5748] text-white hover:bg-[#08483c]"
                >
                  <Send className="mr-2 h-3.5 w-3.5" /> Add note
                </Button>
              </div>
            </div>
            <div className="divide-y divide-[#e7ebe8]">
              {activities.map((activity) => (
                <div key={activity.id} className="flex gap-3 px-4 py-3.5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#edf4f1] text-[#0b5748]">
                    <FileText className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-xs leading-5 text-[#3d5049]">{activity.body}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-[#8a948f]">
                      {(activity.activity_type ?? activity.type ?? "activity").replaceAll("_", " ")}{" "}
                      · {fmtDate(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="px-4 py-10 text-center text-xs text-[#7a8580]">
                  No activity recorded yet.
                </p>
              )}
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel
            title="Next actions"
            description={`${openTasks.length} open task${openTasks.length === 1 ? "" : "s"}`}
            action={<AddTaskDialog lead={lead} agents={agents} onCreated={refresh} />}
          >
            <div className="divide-y divide-[#e7ebe8]">
              {tasks.slice(0, 6).map((task) => (
                <div key={task.id} className="flex gap-3 px-4 py-3">
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${task.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                  >
                    {task.status === "completed" ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Clock3 className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#3c5048]">{task.title}</p>
                    <p className="mt-0.5 text-[10px] text-[#818c87]">
                      {fmtDate(task.due_at)} · {task.priority}
                    </p>
                  </div>
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="px-4 py-8 text-center text-xs text-[#7a8580]">
                  No tasks for this lead.
                </p>
              )}
            </div>
          </Panel>

          <Panel title="Contact owner">
            <div className="p-4">
              {adviser ? (
                <>
                  <AdviserAvatar name={adviser.full_name} />
                  <div className="mt-3 space-y-1 text-xs text-[#68746f]">
                    <p>{adviser.email}</p>
                    <p>{adviser.phone ?? "No phone recorded"}</p>
                  </div>
                </>
              ) : (
                <p className="text-xs text-amber-700">This lead is unassigned.</p>
              )}
            </div>
          </Panel>

          <Panel title="Source attribution">
            <div className="space-y-4 p-4">
              <SourceBadge source={lead.lead_source} />
              <Detail label="Campaign" value={lead.campaign_name} />
              <Detail label="Ad set" value={lead.facebook_adset_name} />
              <Detail label="Advert" value={lead.ad_name} />
              <Detail label="Lead form" value={lead.form_name} />
              <Detail
                label="Cost per lead"
                value={lead.cost_per_lead ? fmtNaira(lead.cost_per_lead) : null}
              />
            </div>
          </Panel>

          <Panel title="Consent and communication">
            <div className="space-y-3 p-4 text-xs">
              <div className="flex items-start gap-2">
                <ShieldCheck
                  className={`mt-0.5 h-4 w-4 shrink-0 ${lead.consent_given ? "text-emerald-700" : "text-amber-700"}`}
                />
                <div>
                  <p className="font-medium text-[#3b4f47]">
                    {lead.consent_given ? "Consent recorded" : "Consent not recorded"}
                  </p>
                  <p className="mt-0.5 text-[10px] text-[#828d88]">
                    {lead.consent_at
                      ? fmtDate(lead.consent_at)
                      : "Marketing automation must remain off."}
                  </p>
                </div>
              </div>
              {lead.unsubscribed_at && (
                <p className="border border-rose-200 bg-rose-50 p-2 text-rose-800">
                  Unsubscribed {fmtDate(lead.unsubscribed_at)}. Promotional messages are stopped.
                </p>
              )}
            </div>
          </Panel>

          <Panel title="Email history" description={`${deliveries.length} recorded messages`}>
            <div className="divide-y divide-[#e7ebe8]">
              {deliveries.slice(0, 5).map((delivery) => (
                <div key={delivery.id} className="flex gap-3 px-4 py-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#0b5748]" />
                  <div>
                    <p className="text-xs font-medium text-[#3d5049]">{delivery.subject}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-[#818c87]">
                      {delivery.status} · {fmtDate(delivery.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              {deliveries.length === 0 && (
                <p className="px-4 py-8 text-center text-xs text-[#7a8580]">
                  No email delivery recorded.
                </p>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function AddTaskDialog({
  lead,
  agents,
  onCreated,
}: {
  lead: Lead;
  agents: SalesAgent[];
  onCreated: () => void;
}) {
  const createTask = useServerFn(createFollowUpTask);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TaskType>("call");
  const [dueAt, setDueAt] = useState("");
  const [assignedTo, setAssignedTo] = useState(lead.assigned_to ?? "");
  const [priority, setPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");
  const [notes, setNotes] = useState("");

  async function submit() {
    if (!title || !dueAt || !assignedTo)
      return toast.error("Title, due time and adviser are required.");
    setBusy(true);
    try {
      await createTask({
        data: {
          leadId: lead.id,
          title,
          taskType: type,
          dueAt: new Date(dueAt).toISOString(),
          assignedTo,
          priority,
          notes,
        },
      });
      toast.success("Follow-up task created.");
      setOpen(false);
      onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Task could not be created.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-[#0b5748]">
          <Plus className="mr-1 h-3.5 w-3.5" /> Add
        </Button>
      </DialogTrigger>
      <DialogContent className="border-[#dce2de] bg-white text-[#263f38]">
        <DialogHeader>
          <DialogTitle>Create follow-up task</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <Field label="Task title">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Task type">
              <Select value={type} onValueChange={(value) => setType(value as TaskType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((item) => (
                    <SelectItem key={item.key} value={item.key}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Priority">
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as typeof priority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["low", "normal", "high", "urgent"].map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Due date and time">
            <Input
              type="datetime-local"
              value={dueAt}
              onChange={(event) => setDueAt(event.target.value)}
            />
          </Field>
          <Field label="Assigned adviser">
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger>
                <SelectValue placeholder="Select adviser" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((item) => (
                  <SelectItem key={item.user_id} value={item.user_id}>
                    {item.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Notes">
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={busy}
            className="bg-[#0b5748] text-white hover:bg-[#08483c]"
          >
            {busy ? "Creating..." : "Create task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6f7c76]">
        {label}
      </Label>
      {children}
    </div>
  );
}
function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#8a948f]">{label}</p>
      <p className="mt-1 break-words text-xs font-medium capitalize text-[#3c5048]">
        {value || "Not set"}
      </p>
    </div>
  );
}
