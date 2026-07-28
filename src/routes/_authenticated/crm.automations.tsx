import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Edit3, MailCheck, Plus, Send, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase as _supabaseTyped } from "@/integrations/supabase/client";
// CRM schema is not fully wired; cast to any to bypass generated types.
const supabase: any = _supabaseTyped;
import {
  LEAD_SOURCES,
  fmtDate,
  sourceLabel,
  type AutomationSequence,
  type EmailTemplate,
} from "@/lib/crm";
import {
  createAutomationSequence,
  saveEmailTemplate,
  toggleAutomationSequence,
} from "@/lib/crm.functions";
import { CrmPageHeader, EmptyState, Panel } from "@/components/crm/CrmUi";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/crm/automations")({
  component: AutomationsWorkspace,
});

type AutomationStep = {
  id: string;
  sequence_id: string;
  step_order: number;
  delay_minutes: number;
  action_type: string;
  task_title: string | null;
  template_id: string | null;
};
type Enrollment = { sequence_id: string; status: string };
type Delivery = {
  id: string;
  recipient_email: string;
  subject: string;
  status: string;
  created_at: string;
};

function AutomationsWorkspace() {
  const [sequences, setSequences] = useState<AutomationSequence[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [steps, setSteps] = useState<AutomationStep[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const toggle = useServerFn(toggleAutomationSequence);

  const refresh = useCallback(async () => {
    const [sequenceResult, templateResult, stepResult, enrollmentResult, deliveryResult] =
      await Promise.all([
        supabase.from("automation_sequences").select("*").order("created_at", { ascending: false }),
        supabase.from("email_templates").select("*").order("updated_at", { ascending: false }),
        supabase.from("automation_steps").select("*").order("step_order"),
        supabase.from("automation_enrollments").select("sequence_id, status"),
        supabase
          .from("email_deliveries")
          .select("id, recipient_email, subject, status, created_at")
          .order("created_at", { ascending: false })
          .limit(100),
      ]);
    const enrollmentRows = (enrollmentResult.data ?? []) as Enrollment[];
    setEnrollments(enrollmentRows);
    setSequences(
      ((sequenceResult.data ?? []) as unknown as AutomationSequence[]).map((sequence) => ({
        ...sequence,
        enrolled_count: enrollmentRows.filter((item) => item.sequence_id === sequence.id).length,
        completed_count: enrollmentRows.filter(
          (item) => item.sequence_id === sequence.id && item.status === "completed",
        ).length,
      })),
    );
    setTemplates((templateResult.data ?? []) as unknown as EmailTemplate[]);
    setSteps((stepResult.data ?? []) as AutomationStep[]);
    setDeliveries((deliveryResult.data ?? []) as Delivery[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function setActive(sequence: AutomationSequence, active: boolean) {
    try {
      await toggle({ data: { sequenceId: sequence.id, active } });
      toast.success(active ? "Automation activated." : "Automation paused.");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Automation could not be updated.");
    }
  }

  const deliveryStats = useMemo(() => {
    return {
      sent: deliveries.filter((item) =>
        ["sent", "delivered", "opened", "clicked"].includes(item.status),
      ).length,
      delivered: deliveries.filter((item) =>
        ["delivered", "opened", "clicked"].includes(item.status),
      ).length,
      opened: deliveries.filter((item) => ["opened", "clicked"].includes(item.status)).length,
      clicked: deliveries.filter((item) => item.status === "clicked").length,
      bounced: deliveries.filter((item) => item.status === "bounced").length,
    };
  }, [deliveries]);

  return (
    <div className="space-y-5">
      <CrmPageHeader
        eyebrow="Email templates and automations"
        title="Responsive follow-up, with human control"
        description="Acknowledge every enquiry immediately, coordinate adviser tasks and stop promotional sequences when a lead replies, converts, opts out or is closed."
        actions={<NewSequenceDialog templates={templates} onCreated={refresh} />}
      />

      <Tabs defaultValue="sequences" className="space-y-4">
        <TabsList className="h-auto border border-[#dfe4df] bg-white p-1">
          <TabsTrigger
            value="sequences"
            className="rounded-md px-4 py-2 text-xs data-[state=active]:bg-[#0b5748] data-[state=active]:text-white"
          >
            Sequences
          </TabsTrigger>
          <TabsTrigger
            value="templates"
            className="rounded-md px-4 py-2 text-xs data-[state=active]:bg-[#0b5748] data-[state=active]:text-white"
          >
            Email templates
          </TabsTrigger>
          <TabsTrigger
            value="delivery"
            className="rounded-md px-4 py-2 text-xs data-[state=active]:bg-[#0b5748] data-[state=active]:text-white"
          >
            Delivery activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sequences" className="space-y-4">
          {loading ? (
            <div className="py-20 text-center text-sm text-[#718079]">Loading automations...</div>
          ) : sequences.length === 0 ? (
            <div className="border border-[#dfe4df] bg-white">
              <EmptyState
                title="No automation sequences"
                body="Create a sequence for a form, campaign, event or investment preference."
              />
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {sequences.map((sequence) => {
                const sequenceSteps = steps.filter((item) => item.sequence_id === sequence.id);
                return (
                  <article key={sequence.id} className="border border-[#dfe4df] bg-white">
                    <div className="flex items-start justify-between gap-4 border-b border-[#e7ebe8] p-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded px-2 py-1 text-[9px] font-semibold uppercase tracking-wider ${sequence.active ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"}`}
                          >
                            {sequence.active ? "Active" : "Paused"}
                          </span>
                          {sequence.trigger_source && (
                            <span className="text-[10px] text-[#7a8580]">
                              Trigger: {sourceLabel(sequence.trigger_source)}
                            </span>
                          )}
                        </div>
                        <h2 className="mt-3 text-base font-semibold text-[#173f36]">
                          {sequence.name}
                        </h2>
                        <p className="mt-1 text-xs leading-5 text-[#6d7974]">
                          {sequence.description}
                        </p>
                      </div>
                      <Switch
                        checked={sequence.active}
                        onCheckedChange={(active) => void setActive(sequence, active)}
                        aria-label={`${sequence.active ? "Pause" : "Activate"} ${sequence.name}`}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-px bg-[#e4e9e6] text-center">
                      <Stat
                        label="Enrolled"
                        value={
                          sequence.enrolled_count ??
                          enrollments.filter((item) => item.sequence_id === sequence.id).length
                        }
                      />
                      <Stat label="Completed" value={sequence.completed_count ?? 0} />
                      <Stat label="Steps" value={sequenceSteps.length} />
                    </div>
                    <div className="p-4">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#8a948f]">
                        Sequence timing
                      </p>
                      <div className="mt-3 flex items-center gap-1 overflow-x-auto pb-1">
                        {sequenceSteps.map((step, index) => (
                          <div key={step.id} className="flex shrink-0 items-center">
                            <div className="min-w-24 border border-[#dce2de] bg-[#f8faf8] px-2 py-2 text-center">
                              <p className="text-[9px] font-semibold text-[#0b5748]">
                                {formatDelay(step.delay_minutes)}
                              </p>
                              <p className="mt-0.5 text-[9px] capitalize text-[#75817c]">
                                {step.action_type.replaceAll("_", " ")}
                              </p>
                            </div>
                            {index < sequenceSteps.length - 1 && (
                              <span className="h-px w-3 bg-[#bdc9c3]" />
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="mt-3 text-[10px] text-[#7c8782]">
                        Stops on reply, conversion, unsubscribe, not interested or manual pause.
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-end">
            <TemplateDialog onSaved={refresh} />
          </div>
          <Panel
            title="Template library"
            description="Brand-safe content with reusable Kay-Steph dynamic fields."
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left">
                <thead className="bg-[#f7f9f7] text-[9px] uppercase tracking-[0.15em] text-[#7b8681]">
                  <tr>
                    <th className="px-4 py-2.5">Template</th>
                    <th className="px-4 py-2.5">Subject</th>
                    <th className="px-4 py-2.5">Category</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Updated</th>
                    <th />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7ebe8]">
                  {templates.map((template) => (
                    <tr key={template.id}>
                      <td className="px-4 py-3 text-xs font-semibold text-[#304940]">
                        {template.name}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#607069]">{template.subject}</td>
                      <td className="px-4 py-3 text-[10px] capitalize text-[#7a8580]">
                        {template.category}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded px-2 py-1 text-[9px] font-semibold uppercase ${template.active ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"}`}
                        >
                          {template.active ? "Active" : "Paused"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[10px] text-[#7c8782]">
                        {fmtDate(template.updated_at)}
                      </td>
                      <td className="px-4 py-3">
                        <TemplateDialog template={template} onSaved={refresh} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <Panel
            title="Supported dynamic fields"
            description="Fields are resolved by the secure server delivery worker."
          >
            <div className="flex flex-wrap gap-2 p-4">
              {[
                "first_name",
                "full_name",
                "property_name",
                "property_location",
                "property_price",
                "investment_model",
                "adviser_name",
                "adviser_phone",
                "event_name",
                "event_date",
                "event_venue",
                "registration_link",
                "property_details_link",
              ].map((field) => (
                <code
                  key={field}
                  className="rounded bg-[#edf4f1] px-2 py-1 text-[10px] text-[#0b5748]"
                >{`{{${field}}}`}</code>
              ))}
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="delivery" className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <DeliveryStat label="Sent" value={deliveryStats.sent} icon={Send} />
            <DeliveryStat label="Delivered" value={deliveryStats.delivered} icon={MailCheck} />
            <DeliveryStat label="Opened" value={deliveryStats.opened} icon={CheckCircle2} />
            <DeliveryStat label="Clicked" value={deliveryStats.clicked} icon={Clock3} />
            <DeliveryStat label="Bounced" value={deliveryStats.bounced} icon={XCircle} attention />
          </div>
          <Panel
            title="Recent delivery activity"
            description="Provider status, recipient and message subject."
          >
            {deliveries.length === 0 ? (
              <EmptyState
                title="No delivery activity"
                body="Messages will appear after an email provider is configured and a sequence is activated."
              />
            ) : (
              <div className="divide-y divide-[#e7ebe8]">
                {deliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="grid gap-2 px-4 py-3 text-xs sm:grid-cols-[1.3fr_1fr_100px_150px]"
                  >
                    <span className="font-medium text-[#304940]">{delivery.subject}</span>
                    <span className="text-[#718079]">{delivery.recipient_email}</span>
                    <span
                      className={
                        delivery.status === "failed" || delivery.status === "bounced"
                          ? "text-rose-700"
                          : "text-emerald-700"
                      }
                    >
                      {delivery.status}
                    </span>
                    <span className="text-[#818c87]">{fmtDate(delivery.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TemplateDialog({ template, onSaved }: { template?: EmailTemplate; onSaved: () => void }) {
  const save = useServerFn(saveEmailTemplate);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: template?.name ?? "",
    category: template?.category ?? "follow_up",
    subject: template?.subject ?? "",
    previewText: template?.preview_text ?? "",
    htmlBody:
      template?.html_body ??
      "<p>Hello {{first_name}},</p>\n<p></p>\n<p>Kind regards,<br><strong>Kay-Steph Group</strong></p>",
    textBody: "",
    active: template?.active ?? true,
  });
  const set = (field: keyof typeof form, value: string | boolean) =>
    setForm((previous) => ({ ...previous, [field]: value }));
  async function submit() {
    if (!form.name || !form.subject || form.htmlBody.length < 10)
      return toast.error("Name, subject and message content are required.");
    setBusy(true);
    try {
      await save({ data: { id: template?.id, ...form } });
      toast.success(template ? "Template updated." : "Template created.");
      setOpen(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Template could not be saved.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {template ? (
          <Button size="icon" variant="ghost" className="h-8 w-8 text-[#0b5748]">
            <Edit3 className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="bg-[#0b5748] text-white hover:bg-[#08483c]">
            <Plus className="mr-2 h-4 w-4" /> New template
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto border-[#dce2de] bg-white text-[#263f38]">
        <DialogHeader>
          <DialogTitle>{template ? "Edit email template" : "New email template"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <Field label="Template name">
            <Input value={form.name} onChange={(event) => set("name", event.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <Input
                value={form.category}
                onChange={(event) => set("category", event.target.value)}
              />
            </Field>
            <Field label="Status">
              <Select
                value={form.active ? "active" : "paused"}
                onValueChange={(value) => set("active", value === "active")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Email subject">
            <Input value={form.subject} onChange={(event) => set("subject", event.target.value)} />
          </Field>
          <Field label="Preview text">
            <Input
              value={form.previewText}
              onChange={(event) => set("previewText", event.target.value)}
            />
          </Field>
          <Field label="HTML message">
            <Textarea
              rows={10}
              value={form.htmlBody}
              onChange={(event) => set("htmlBody", event.target.value)}
              className="font-mono text-xs"
            />
          </Field>
          <Field label="Plain-text fallback">
            <Textarea
              rows={5}
              value={form.textBody}
              onChange={(event) => set("textBody", event.target.value)}
            />
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
            {busy ? "Saving..." : "Save template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewSequenceDialog({
  templates,
  onCreated,
}: {
  templates: EmailTemplate[];
  onCreated: () => void;
}) {
  const create = useServerFn(createAutomationSequence);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState("");
  const [templateId, setTemplateId] = useState("");
  async function submit() {
    if (!name) return toast.error("Sequence name is required.");
    setBusy(true);
    try {
      await create({
        data: {
          name,
          description,
          triggerSource: source || undefined,
          immediateTemplateId: templateId || undefined,
          active: false,
        },
      });
      toast.success("Automation sequence created in paused mode.");
      setOpen(false);
      onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sequence could not be created.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#0b5748] text-white hover:bg-[#08483c]">
          <Plus className="mr-2 h-4 w-4" /> New sequence
        </Button>
      </DialogTrigger>
      <DialogContent className="border-[#dce2de] bg-white text-[#263f38]">
        <DialogHeader>
          <DialogTitle>Create automation sequence</DialogTitle>
          <p className="text-xs leading-5 text-[#74817b]">
            New sequences stay paused until reviewed and activated.
          </p>
        </DialogHeader>
        <div className="grid gap-4">
          <Field label="Sequence name">
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Description">
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </Field>
          <Field label="Trigger source">
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a source" />
              </SelectTrigger>
              <SelectContent>
                {LEAD_SOURCES.map((item) => (
                  <SelectItem key={item.key} value={item.key}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Immediate email template">
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            {busy ? "Creating..." : "Create paused sequence"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatDelay(minutes: number) {
  if (minutes === 0) return "Immediately";
  if (minutes % 1440 === 0) return `Day ${minutes / 1440}`;
  if (minutes % 60 === 0) return `${minutes / 60} hours`;
  return `${minutes} minutes`;
}
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[#f8faf8] p-3">
      <p className="text-lg font-semibold text-[#173f36]">{value}</p>
      <p className="text-[9px] uppercase tracking-wider text-[#7a8580]">{label}</p>
    </div>
  );
}
function DeliveryStat({
  label,
  value,
  icon: Icon,
  attention = false,
}: {
  label: string;
  value: number;
  icon: typeof Send;
  attention?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 border bg-white p-4 ${attention && value > 0 ? "border-rose-200" : "border-[#dfe4df]"}`}
    >
      <Icon className={`h-4 w-4 ${attention && value > 0 ? "text-rose-700" : "text-[#0b5748]"}`} />
      <div>
        <p className="text-xl font-semibold text-[#173f36]">{value}</p>
        <p className="text-[9px] uppercase tracking-wider text-[#7a8580]">{label}</p>
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
