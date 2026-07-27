import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, Check, CheckCircle2, Clock3, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  TASK_TYPES,
  fmtDate,
  isOverdue,
  type FollowUpTask,
  type Lead,
  type SalesAgent,
  type TaskType,
} from "@/lib/crm";
import { completeFollowUpTask, createFollowUpTask } from "@/lib/crm.functions";
import { AdviserAvatar, CrmPageHeader, EmptyState } from "@/components/crm/CrmUi";
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

export const Route = createFileRoute("/_authenticated/crm/tasks")({
  component: TasksWorkspace,
});

type TaskView = "all" | "overdue" | "today" | "upcoming" | "completed";

function TasksWorkspace() {
  const [tasks, setTasks] = useState<FollowUpTask[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<SalesAgent[]>([]);
  const [view, setView] = useState<TaskView>("all");
  const [query, setQuery] = useState("");
  const [agent, setAgent] = useState("all");
  const [loading, setLoading] = useState(true);
  const complete = useServerFn(completeFollowUpTask);

  const refresh = useCallback(async () => {
    const [taskResult, leadResult, agentResult] = await Promise.all([
      supabase.from("follow_up_tasks").select("*").order("due_at", { ascending: true }).limit(1000),
      supabase.from("leads").select("*").order("captured_at", { ascending: false }).limit(1000),
      supabase.from("sales_agents").select("*").eq("active", true).order("full_name"),
    ]);
    setTasks((taskResult.data ?? []) as unknown as FollowUpTask[]);
    setLeads((leadResult.data ?? []) as unknown as Lead[]);
    setAgents((agentResult.data ?? []) as unknown as SalesAgent[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return tasks.filter((task) => {
      const due = new Date(task.due_at);
      if (view === "overdue" && !isOverdue(task)) return false;
      if (view === "today" && !(task.status === "open" && due >= start && due < end)) return false;
      if (view === "upcoming" && !(task.status === "open" && due >= end)) return false;
      if (view === "completed" && task.status !== "completed") return false;
      if (view === "all" && task.status === "completed") return false;
      if (agent !== "all" && task.assigned_to !== agent) return false;
      const lead = leads.find((item) => item.id === task.lead_id);
      if (
        normalized &&
        ![task.title, task.notes, lead?.full_name, lead?.property_name]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalized))
      )
        return false;
      return true;
    });
  }, [agent, leads, query, tasks, view]);

  async function markComplete(task: FollowUpTask) {
    try {
      await complete({ data: { taskId: task.id, completed: task.status !== "completed" } });
      toast.success(task.status === "completed" ? "Task reopened." : "Task completed.");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Task could not be updated.");
    }
  }

  const overdue = tasks.filter(isOverdue).length;
  const open = tasks.filter((task) => task.status === "open").length;
  const completed = tasks.filter((task) => task.status === "completed").length;

  return (
    <div className="space-y-5">
      <CrmPageHeader
        eyebrow="Follow-up discipline"
        title="Tasks and reminders"
        description="Calls, WhatsApp messages, inspections, document requests and payment reminders with clear ownership and due times."
        actions={<NewTaskDialog leads={leads} agents={agents} onCreated={refresh} />}
      />

      <div className="grid grid-cols-3 gap-3">
        <Summary label="Open" value={open} icon={Clock3} />
        <Summary label="Overdue" value={overdue} icon={CalendarClock} attention={overdue > 0} />
        <Summary label="Completed" value={completed} icon={CheckCircle2} />
      </div>

      <div className="border border-[#dfe4df] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#e5e9e6] p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-1 overflow-x-auto">
            {(["all", "overdue", "today", "upcoming", "completed"] as TaskView[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setView(item)}
                className={`whitespace-nowrap rounded-md px-3 py-2 text-[11px] font-semibold capitalize ${view === item ? "bg-[#0b5748] text-white" : "text-[#64716c] hover:bg-[#f1f4f2]"}`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1 lg:w-64">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#87928d]" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tasks"
                className="h-9 pl-9 text-xs"
              />
            </div>
            <Select value={agent} onValueChange={setAgent}>
              <SelectTrigger className="h-9 w-40 text-xs">
                <SelectValue placeholder="All advisers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All advisers</SelectItem>
                {agents.map((item) => (
                  <SelectItem key={item.user_id} value={item.user_id}>
                    {item.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-[#74817b]">Loading tasks...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No tasks in this view"
            body="Change the filter or create a follow-up task for a lead."
          />
        ) : (
          <div className="divide-y divide-[#e7ebe8]">
            {filtered.map((task) => {
              const lead = leads.find((item) => item.id === task.lead_id);
              const adviser = agents.find((item) => item.user_id === task.assigned_to);
              const late = isOverdue(task);
              return (
                <div
                  key={task.id}
                  className="grid gap-3 px-4 py-3.5 md:grid-cols-[36px_minmax(180px,1.5fr)_minmax(150px,1fr)_150px_110px] md:items-center"
                >
                  <button
                    type="button"
                    onClick={() => void markComplete(task)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border ${task.status === "completed" ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-[#cfd8d3] bg-white text-transparent hover:text-[#0b5748]"}`}
                    aria-label={task.status === "completed" ? "Reopen task" : "Complete task"}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <div>
                    <p
                      className={`text-xs font-semibold ${task.status === "completed" ? "text-[#85908b] line-through" : "text-[#304940]"}`}
                    >
                      {task.title}
                    </p>
                    <p className="mt-1 text-[10px] capitalize text-[#7d8883]">
                      {TASK_TYPES.find((item) => item.key === task.task_type)?.label ??
                        task.task_type.replaceAll("_", " ")}{" "}
                      · {task.priority}
                    </p>
                  </div>
                  <div>
                    {lead ? (
                      <>
                        <Link
                          to="/crm/leads/$leadId"
                          params={{ leadId: lead.id }}
                          className="text-xs font-medium text-[#0b5748] hover:underline"
                        >
                          {lead.full_name}
                        </Link>
                        <p className="mt-0.5 text-[10px] text-[#818c87]">
                          {lead.property_name ?? "No property selected"}
                        </p>
                      </>
                    ) : (
                      <span className="text-xs text-[#8a948f]">Unknown lead</span>
                    )}
                  </div>
                  <div>
                    {adviser ? (
                      <AdviserAvatar name={adviser.full_name} compact />
                    ) : (
                      <span className="text-[10px] text-amber-700">Unassigned</span>
                    )}
                  </div>
                  <div
                    className={`text-[10px] font-semibold ${late ? "text-rose-700" : "text-[#66736d]"}`}
                  >
                    {late ? "Overdue · " : ""}
                    {fmtDate(task.due_at)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function NewTaskDialog({
  leads,
  agents,
  onCreated,
}: {
  leads: Lead[];
  agents: SalesAgent[];
  onCreated: () => void;
}) {
  const create = useServerFn(createFollowUpTask);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [leadId, setLeadId] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TaskType>("call");
  const [dueAt, setDueAt] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");
  const [notes, setNotes] = useState("");
  async function submit() {
    if (!leadId || !title || !dueAt || !assignedTo)
      return toast.error("Lead, title, due time and adviser are required.");
    setBusy(true);
    try {
      await create({
        data: {
          leadId,
          title,
          taskType: type,
          dueAt: new Date(dueAt).toISOString(),
          assignedTo,
          priority,
          notes,
        },
      });
      toast.success("Task created.");
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
        <Button className="bg-[#0b5748] text-white hover:bg-[#08483c]">
          <Plus className="mr-2 h-4 w-4" /> New task
        </Button>
      </DialogTrigger>
      <DialogContent className="border-[#dce2de] bg-white text-[#263f38]">
        <DialogHeader>
          <DialogTitle>New follow-up task</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <Field label="Lead">
            <Select
              value={leadId}
              onValueChange={(value) => {
                setLeadId(value);
                const lead = leads.find((item) => item.id === value);
                if (lead?.assigned_to) setAssignedTo(lead.assigned_to);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select lead" />
              </SelectTrigger>
              <SelectContent>
                {leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.full_name} · {lead.property_name ?? "No property"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Task title">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
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
            disabled={busy}
            onClick={submit}
            className="bg-[#0b5748] text-white hover:bg-[#08483c]"
          >
            {busy ? "Creating..." : "Create task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Summary({
  label,
  value,
  icon: Icon,
  attention = false,
}: {
  label: string;
  value: number;
  icon: typeof Clock3;
  attention?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 border bg-white p-4 ${attention ? "border-amber-300" : "border-[#dfe4df]"}`}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-md ${attention ? "bg-amber-50 text-amber-700" : "bg-[#edf4f1] text-[#0b5748]"}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-xl font-semibold text-[#173f36]">{value}</p>
        <p className="text-[10px] uppercase tracking-wider text-[#7a8580]">{label}</p>
      </div>
    </div>
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
