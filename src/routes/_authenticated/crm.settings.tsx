import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Copy,
  Download,
  Facebook,
  Mail,
  MessageCircle,
  Plus,
  ShieldCheck,
  Trash2,
  UserRoundCog,
} from "lucide-react";
import { toast } from "sonner";
import { supabase as _supabaseTyped } from "@/integrations/supabase/client";
// CRM schema is not fully wired; cast to any to bypass generated types.
const supabase: any = _supabaseTyped;
import { INVESTMENT_TYPES, fmtDate, type InvestmentType, type SalesAgent } from "@/lib/crm";
import { getCrmIntegrationStatus, sendTestCrmEmail } from "@/lib/crm.functions";
import {
  importMetaFormLeads,
  listLeadCaptureFailures,
  retryLeadCapture,
  syncMetaCampaignInsights,
} from "@/lib/meta.functions";
import {
  getBrevoSettings,
  listWorkshopRegistrations,
  retryWorkshopConfirmation,
  saveBrevoApiKey,
  saveBrevoSettings,
} from "@/lib/brevo.functions";
import { CrmPageHeader, EmptyState, Panel } from "@/components/crm/CrmUi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/crm/settings")({
  component: SettingsPage,
});

type Rule = {
  id: string;
  name: string;
  priority: number;
  match_location: string | null;
  match_investment_type: InvestmentType | null;
  match_campaign_id: string | null;
  assign_agent_id: string | null;
  use_round_robin: boolean;
  active: boolean;
};
type IntegrationStatus = {
  meta: { configured: boolean; required: string[]; lastCaptureAt?: string | null };
  email: { configured: boolean; provider: string; required: string[] };
  whatsapp: { configured: boolean; required: string[]; built?: boolean };
};
type Audit = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  actor_id: string | null;
  created_at: string;
};

function SettingsPage() {
  const statusFn = useServerFn(getCrmIntegrationStatus);
  const testEmailFn = useServerFn(sendTestCrmEmail);
  const [integrations, setIntegrations] = useState<IntegrationStatus>({
    meta: { configured: false, required: [] },
    email: { configured: false, provider: "Resend", required: [] },
    whatsapp: { configured: false, required: [] },
  });
  const [agents, setAgents] = useState<SalesAgent[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [settings, setSettings] = useState({
    responseSla: "30",
    timezone: "Africa/Lagos",
    defaultCountry: "Nigeria",
    consentCopy:
      "I agree that Kay-Steph may use the information provided to contact me about properties, events and investment opportunities. I understand that I can unsubscribe at any time.",
  });
  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting] = useState(false);

  const refresh = useCallback(async () => {
    const [agentResult, ruleResult, settingsResult, auditResult, providerResult] =
      await Promise.all([
        supabase.from("sales_agents").select("*").order("full_name"),
        supabase.from("assignment_rules").select("*").order("priority"),
        supabase.from("crm_settings").select("*").eq("id", "default").maybeSingle(),
        supabase
          .from("crm_audit_logs")
          .select("id, action, entity_type, entity_id, actor_id, created_at")
          .order("created_at", { ascending: false })
          .limit(50),
        statusFn(),
      ]);
    setAgents((agentResult.data ?? []) as unknown as SalesAgent[]);
    setRules((ruleResult.data ?? []) as unknown as Rule[]);
    setAudits((auditResult.data ?? []) as Audit[]);
    if (settingsResult.data)
      setSettings({
        responseSla: String(settingsResult.data.response_sla_minutes),
        timezone: settingsResult.data.timezone,
        defaultCountry: settingsResult.data.default_country,
        consentCopy: settingsResult.data.consent_copy,
      });
    setIntegrations(providerResult as IntegrationStatus);
  }, [statusFn]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function saveGeneral() {
    const { error } = await supabase.from("crm_settings").upsert({
      id: "default",
      response_sla_minutes: Number(settings.responseSla),
      timezone: settings.timezone,
      default_country: settings.defaultCountry,
      consent_copy: settings.consentCopy,
    });
    if (error) toast.error(error.message);
    else toast.success("CRM settings saved.");
  }

  async function sendTest() {
    if (!testEmail) return toast.error("Enter a test recipient.");
    setTesting(true);
    try {
      await testEmailFn({ data: { email: testEmail } });
      toast.success("Test email sent.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Test email failed.");
    } finally {
      setTesting(false);
    }
  }

  const webhookUrl =
    typeof window === "undefined"
      ? "/api/public/meta/webhook"
      : `${window.location.origin}/api/public/meta/webhook`;

  return (
    <div className="space-y-5">
      <CrmPageHeader
        eyebrow="Administration"
        title="CRM settings"
        description="Manage secure integrations, response standards, adviser routing, data portability and audit visibility."
      />

      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList className="h-auto border border-[#dfe4df] bg-white p-1">
          <TabsTrigger
            value="integrations"
            className="rounded-md px-4 py-2 text-xs data-[state=active]:bg-[#0b5748] data-[state=active]:text-white"
          >
            Integrations
          </TabsTrigger>
          <TabsTrigger
            value="team"
            className="rounded-md px-4 py-2 text-xs data-[state=active]:bg-[#0b5748] data-[state=active]:text-white"
          >
            Team and routing
          </TabsTrigger>
          <TabsTrigger
            value="general"
            className="rounded-md px-4 py-2 text-xs data-[state=active]:bg-[#0b5748] data-[state=active]:text-white"
          >
            General and privacy
          </TabsTrigger>
          <TabsTrigger
            value="data"
            className="rounded-md px-4 py-2 text-xs data-[state=active]:bg-[#0b5748] data-[state=active]:text-white"
          >
            Data and audit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <IntegrationCard
              icon={Facebook}
              title="Meta Lead Ads"
              configured={integrations.meta.configured}
              description="Signed webhook capture, campaign attribution, duplicate merging and adviser assignment."
              fields={integrations.meta.required}
              lastActivity={integrations.meta.lastCaptureAt ?? null}
            />
            <IntegrationCard
              icon={Mail}
              title={`Transactional email · ${integrations.email.provider}`}
              configured={integrations.email.configured}
              description="Immediate acknowledgements, sequences and provider delivery events."
              fields={integrations.email.required}
            />
            <IntegrationCard
              icon={MessageCircle}
              title="WhatsApp Business"
              configured={integrations.whatsapp.configured}
              built={integrations.whatsapp.built ?? false}
              description="Not wired up yet. These variables are read only to render this card — no message is sent anywhere. Advisers use the WhatsApp link on the lead record in the meantime."
              fields={integrations.whatsapp.required}
            />
          </div>
          <Panel
            title="Meta webhook endpoint"
            description="Subscribe your Meta app Page webhook to the leadgen field."
          >
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <code className="min-w-0 flex-1 break-all border border-[#dce2de] bg-[#f7f9f7] px-3 py-2 text-xs text-[#315149]">
                {webhookUrl}
              </code>
              <Button
                variant="outline"
                className="border-[#ccd6d1] text-[#315149]"
                onClick={async () => {
                  await navigator.clipboard.writeText(webhookUrl);
                  toast.success("Webhook URL copied.");
                }}
              >
                <Copy className="mr-2 h-4 w-4" /> Copy
              </Button>
            </div>
          </Panel>
          <MetaRecoveryPanel configured={integrations.meta.configured} />
          <BrevoPanel />
          <WorkshopRegistrationsPanel />
          <Panel
            title="Test transactional email"
            description="The API key remains server-side and is never returned to this browser."
          >
            <div className="flex flex-col gap-3 p-4 sm:flex-row">
              <Input
                type="email"
                value={testEmail}
                onChange={(event) => setTestEmail(event.target.value)}
                placeholder="admin@kaystephgroup.com"
                className="max-w-md"
              />
              <Button
                onClick={sendTest}
                disabled={testing || !integrations.email.configured}
                className="bg-[#0b5748] text-white hover:bg-[#08483c]"
              >
                {testing ? "Sending..." : "Send provider test"}
              </Button>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Panel
            title="Sales advisers"
            description="Active advisers are eligible for assignment and notifications."
            action={<AddAgentForm onAdded={refresh} />}
          >
            <div className="divide-y divide-[#e7ebe8]">
              {agents.map((agent) => (
                <div key={agent.user_id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dcebe5] text-xs font-semibold text-[#0b5748]">
                    {agent.full_name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#304940]">{agent.full_name}</p>
                    <p className="mt-0.5 text-[10px] text-[#7d8883]">
                      {agent.email} ·{" "}
                      {(agent.assigned_locations ?? []).join(", ") || "All locations"}
                    </p>
                  </div>
                  <span
                    className={`rounded px-2 py-1 text-[9px] font-semibold uppercase ${agent.active !== false ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"}`}
                  >
                    {agent.active !== false ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel
            title="Assignment rules"
            description="Rules run from lowest priority number to highest, followed by round robin."
            action={<AddRuleForm agents={agents} onAdded={refresh} />}
          >
            <div className="divide-y divide-[#e7ebe8]">
              {rules.map((rule) => (
                <div key={rule.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
                  <span className="flex h-8 min-w-8 items-center justify-center rounded bg-[#edf4f1] px-2 text-xs font-bold text-[#0b5748]">
                    {rule.priority}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#304940]">{rule.name}</p>
                    <p className="mt-0.5 text-[10px] text-[#7d8883]">
                      {rule.match_location ? `Location contains ${rule.match_location} · ` : ""}
                      {rule.match_investment_type
                        ? `${rule.match_investment_type.replaceAll("_", " ")} · `
                        : ""}
                      {rule.use_round_robin
                        ? "Round robin"
                        : (agents.find((agent) => agent.user_id === rule.assign_agent_id)
                            ?.full_name ?? "Named adviser")}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-rose-700"
                    onClick={async () => {
                      await supabase.from("assignment_rules").delete().eq("id", rule.id);
                      await refresh();
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <Panel
            title="Response standard"
            description="Used for adviser reminders and overdue escalation."
          >
            <div className="grid gap-4 p-4 md:grid-cols-3">
              <Field label="First-response SLA (minutes)">
                <Input
                  type="number"
                  min="5"
                  max="1440"
                  value={settings.responseSla}
                  onChange={(event) =>
                    setSettings({ ...settings, responseSla: event.target.value })
                  }
                />
              </Field>
              <Field label="Timezone">
                <Input
                  value={settings.timezone}
                  onChange={(event) => setSettings({ ...settings, timezone: event.target.value })}
                />
              </Field>
              <Field label="Default country">
                <Input
                  value={settings.defaultCountry}
                  onChange={(event) =>
                    setSettings({ ...settings, defaultCountry: event.target.value })
                  }
                />
              </Field>
            </div>
          </Panel>
          <Panel
            title="Consent wording"
            description="Use the same clear language across website, event and investment forms."
          >
            <div className="p-4">
              <Textarea
                rows={5}
                value={settings.consentCopy}
                onChange={(event) => setSettings({ ...settings, consentCopy: event.target.value })}
              />
              <div className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-[#6f7c76]">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0b5748]" /> Promotional
                automation stops after unsubscribe. Necessary transactional messages can continue
                where legally permitted.
              </div>
              <Button
                onClick={saveGeneral}
                className="mt-4 bg-[#0b5748] text-white hover:bg-[#08483c]"
              >
                Save general settings
              </Button>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Panel
            title="Import and export"
            description="Use the template to preserve field names, consent and first-touch attribution."
          >
            <div className="flex flex-wrap gap-2 p-4">
              <Button
                variant="outline"
                className="border-[#ccd6d1] text-[#315149]"
                onClick={downloadTemplate}
              >
                <Download className="mr-2 h-4 w-4" /> Download CSV template
              </Button>
              <Button
                variant="outline"
                className="border-[#ccd6d1] text-[#315149]"
                onClick={() =>
                  toast.info(
                    "Validated CSV import is available from the All Leads workspace after the latest database migration.",
                  )
                }
              >
                Import leads
              </Button>
            </div>
          </Panel>
          <Panel
            title="CRM audit log"
            description="Recent changes to lead records. Full before and after values remain admin-only."
          >
            {audits.length === 0 ? (
              <EmptyState
                title="No audit events"
                body="Lead creates and updates will appear after the CRM migration is applied."
              />
            ) : (
              <div className="divide-y divide-[#e7ebe8]">
                {audits.map((audit) => (
                  <div
                    key={audit.id}
                    className="grid gap-2 px-4 py-3 text-xs sm:grid-cols-[100px_1fr_1fr_170px]"
                  >
                    <span className="font-semibold uppercase text-[#0b5748]">{audit.action}</span>
                    <span className="text-[#52615b]">
                      {audit.entity_type} · {audit.entity_id}
                    </span>
                    <span className="text-[#7b8782]">
                      Actor {audit.actor_id ?? "server automation"}
                    </span>
                    <span className="text-[#7b8782]">{fmtDate(audit.created_at)}</span>
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

function IntegrationCard({
  icon: Icon,
  title,
  configured,
  description,
  fields,
  /**
   * Whether the integration is actually implemented. Environment variables
   * being present says nothing about whether any code uses them — WhatsApp
   * has had its variables read only to render this badge, so a fully green
   * card was advertising a capability that does not exist.
   */
  built = true,
  lastActivity,
}: {
  icon: typeof Facebook;
  title: string;
  configured: boolean;
  description: string;
  fields: string[];
  built?: boolean;
  lastActivity?: string | null;
}) {
  const state = !built ? "unbuilt" : configured ? "connected" : "unconfigured";
  const badge = {
    unbuilt: { className: "bg-slate-100 text-slate-600", label: "Not available yet" },
    connected: { className: "bg-emerald-50 text-emerald-800", label: "Connected" },
    unconfigured: { className: "bg-amber-50 text-amber-800", label: "Not configured" },
  }[state];
  return (
    <article className="border border-[#dfe4df] bg-white p-4">
      <div className="flex items-start justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#edf4f1] text-[#0b5748]">
          <Icon className="h-4 w-4" />
        </span>
        <span
          className={`flex items-center gap-1 rounded px-2 py-1 text-[9px] font-semibold uppercase ${badge.className}`}
        >
          {state === "connected" && <CheckCircle2 className="h-3 w-3" />}
          {badge.label}
        </span>
      </div>
      <h2 className="mt-4 text-sm font-semibold text-[#173f36]">{title}</h2>
      <p className="mt-1 text-xs leading-5 text-[#6e7a75]">{description}</p>
      {built && lastActivity !== undefined && (
        <p className="mt-2 text-[11px] font-medium text-[#315149]">
          {lastActivity
            ? `Last lead captured ${fmtDate(lastActivity)}`
            : "No lead captured through this source yet"}
        </p>
      )}
      <div className="mt-4 border-t border-[#e7ebe8] pt-3">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-[#8a948f]">
          Server variables
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {fields.map((field) => (
            <code
              key={field}
              className="rounded bg-[#f1f4f2] px-1.5 py-1 text-[9px] text-[#53625c]"
            >
              {field}
            </code>
          ))}
        </div>
      </div>
    </article>
  );
}

/**
 * Advisers come from the staff directory.
 *
 * This used to ask for a raw auth user id typed by hand, alongside a name and
 * email that staff_members already held. A typo created an adviser pointing at
 * nobody — or worse, at the wrong person, who then silently started receiving
 * leads. One RPC now takes the identity from the chosen staff record and
 * grants the role in the same audited step.
 */
type AssignableStaff = {
  id: string;
  full_name: string;
  position: string | null;
  department: string | null;
};

function AddAgentForm({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [staff, setStaff] = useState<AssignableStaff[]>([]);
  const [staffId, setStaffId] = useState("");
  const [locations, setLocations] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- both RPCs enter the generated types after the migration runs.
      const { data, error } = await (supabase as any).rpc("list_assignable_staff");
      if (error) {
        toast.error(error.message);
        return;
      }
      setStaff((data ?? []) as AssignableStaff[]);
    })();
  }, [open]);

  async function save() {
    if (!staffId) return toast.error("Choose the staff member to make an adviser.");
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see above.
    const { error } = await (supabase as any).rpc("create_sales_agent_from_staff", {
      _staff_id: staffId,
      _assigned_locations: locations
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Sales adviser added.");
    setStaffId("");
    setLocations("");
    setOpen(false);
    onAdded();
  }

  return (
    <div>
      {open ? (
        <div className="flex flex-wrap items-end gap-2 p-3">
          <Field label="Staff member">
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger className="w-64" aria-label="Staff member">
                <SelectValue placeholder="Choose from the staff directory" />
              </SelectTrigger>
              <SelectContent>
                {staff.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name}
                    {member.position ? ` — ${member.position}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Locations">
            <Input
              value={locations}
              onChange={(event) => setLocations(event.target.value)}
              placeholder="Guzape, Jahi"
              className="w-48"
            />
          </Field>
          <Button size="sm" onClick={save} disabled={saving} className="bg-[#0b5748] text-white">
            {saving ? "Adding..." : "Save"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          {staff.length === 0 && (
            <p className="w-full text-xs text-[#8a948f]">
              No eligible staff. Someone must be in the staff directory, active, and have accepted
              their invite before they can receive leads.
            </p>
          )}
        </div>
      ) : (
        <Button size="sm" variant="ghost" className="text-[#0b5748]" onClick={() => setOpen(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Add adviser
        </Button>
      )}
    </div>
  );
}

function AddRuleForm({ agents, onAdded }: { agents: SalesAgent[]; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [priority, setPriority] = useState("100");
  const [location, setLocation] = useState("");
  const [investmentType, setInvestmentType] = useState<InvestmentType | "">("");
  const [agent, setAgent] = useState("");
  const [roundRobin, setRoundRobin] = useState(false);
  async function save() {
    if (!name) return toast.error("Rule name is required.");
    const { error } = await supabase.from("assignment_rules").insert({
      name,
      priority: Number(priority),
      match_location: location || null,
      match_investment_type: investmentType || null,
      assign_agent_id: roundRobin ? null : agent || null,
      use_round_robin: roundRobin,
    });
    if (error) return toast.error(error.message);
    toast.success("Assignment rule added.");
    setOpen(false);
    onAdded();
  }
  return (
    <div>
      {open ? (
        <div className="grid gap-2 p-3 md:grid-cols-3">
          <Field label="Rule name">
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Priority">
            <Input
              type="number"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
            />
          </Field>
          <Field label="Location contains">
            <Input value={location} onChange={(event) => setLocation(event.target.value)} />
          </Field>
          <Field label="Investment type">
            <Select
              value={investmentType}
              onValueChange={(value) => setInvestmentType(value as InvestmentType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                {INVESTMENT_TYPES.map((item) => (
                  <SelectItem key={item.key} value={item.key}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Assigned adviser">
            <Select value={agent} onValueChange={setAgent} disabled={roundRobin}>
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
          <label className="flex items-center gap-2 text-xs text-[#61706a]">
            <input
              type="checkbox"
              checked={roundRobin}
              onChange={(event) => setRoundRobin(event.target.checked)}
            />{" "}
            Use round robin
          </label>
          <div className="flex gap-2 md:col-span-3">
            <Button size="sm" onClick={save} className="bg-[#0b5748] text-white">
              Save rule
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="ghost" className="text-[#0b5748]" onClick={() => setOpen(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Add rule
        </Button>
      )}
    </div>
  );
}

function downloadTemplate() {
  const headers = [
    "full_name",
    "email",
    "phone",
    "whatsapp_number",
    "location",
    "country_of_residence",
    "preferred_location",
    "property_name",
    "property_type",
    "budget_min",
    "budget_max",
    "investment_type",
    "lead_source",
    "source_detail",
    "preferred_contact_method",
    "expected_timeline",
    "consent_given",
    "consent_at",
    "notes",
  ];
  const url = URL.createObjectURL(new Blob([headers.join(",") + "\n"], { type: "text/csv" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "kaysteph-crm-import-template.csv";
  anchor.click();
  URL.revokeObjectURL(url);
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

/**
 * Recovering Meta leads the webhook never got.
 *
 * Two distinct gaps, so two controls: replay a capture that threw, and pull
 * leads a form already holds (anything from before the subscription existed,
 * or during an outage — Meta never redelivers those on its own).
 */
type CaptureFailure = {
  id: string;
  source: string;
  submission_id: string | null;
  error: string;
  attempts: number;
  created_at: string;
  payload: { fullName?: string; email?: string | null; phone?: string | null } | null;
};

function MetaRecoveryPanel({ configured }: { configured: boolean }) {
  const listFn = useServerFn(listLeadCaptureFailures);
  const retryFn = useServerFn(retryLeadCapture);
  const importFn = useServerFn(importMetaFormLeads);
  const syncFn = useServerFn(syncMetaCampaignInsights);

  const [failures, setFailures] = useState<CaptureFailure[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [formId, setFormId] = useState("");
  const [importing, setImporting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await listFn();
      setFailures((result?.failures ?? []) as CaptureFailure[]);
    } catch {
      // Panel is additive; a load failure must not break the settings page.
      setFailures([]);
    }
  }, [listFn]);

  useEffect(() => {
    load();
  }, [load]);

  async function retry(id: string) {
    setBusyId(id);
    try {
      await retryFn({ data: { id } });
      toast.success("Lead captured.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Retry failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function runImport() {
    if (!formId.trim()) return toast.error("Enter the Meta lead form id.");
    setImporting(true);
    try {
      const result = await importFn({ data: { formId: formId.trim() } });
      toast.success(
        `${result.imported} new, ${result.alreadyPresent} already in the CRM` +
          (result.failed ? `, ${result.failed} queued for retry` : "") +
          (result.morePages ? " — more remain, run again to continue" : ""),
      );
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  async function runSync() {
    setSyncing(true);
    try {
      const result = await syncFn();
      toast.success(`${result.synced} campaign(s) synced.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Campaign sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Panel
      title="Meta lead recovery"
      description="Pull leads a form already holds, and replay any capture that failed. Both are matched on the Meta lead id, so re-running never duplicates a lead."
    >
      <div className="space-y-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={formId}
            onChange={(event) => setFormId(event.target.value)}
            placeholder="Meta lead form id"
            className="max-w-md"
            aria-label="Meta lead form id"
          />
          <Button
            onClick={runImport}
            disabled={importing || !configured}
            className="bg-[#0b5748] text-white hover:bg-[#08483c]"
          >
            {importing ? "Importing..." : "Import form leads"}
          </Button>
        </div>
        {!configured && (
          <p className="text-xs text-[#8a948f]">
            Set the Meta environment variables before importing.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-[#e7ebe8] pt-4">
          <Button
            variant="outline"
            className="border-[#ccd6d1] text-[#315149]"
            onClick={runSync}
            disabled={syncing || !configured}
          >
            {syncing ? "Syncing..." : "Sync campaign spend"}
          </Button>
          <p className="text-xs text-[#8a948f]">
            Fills the cost-per-lead and ROI figures on Reports. Needs
            <code className="mx-1 rounded bg-[#f1f4f2] px-1 py-0.5">META_AD_ACCOUNT_ID</code>
            and a token with ads_read.
          </p>
        </div>

        {failures.length === 0 ? (
          <p className="text-xs text-[#53625c]">
            No failed captures. Every inbound lead has reached the CRM.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#315149]">
              {failures.length} lead(s) failed to capture and are not in the CRM yet
            </p>
            {failures.map((failure) => (
              <div
                key={failure.id}
                className="flex flex-wrap items-center justify-between gap-3 border border-[#dce2de] bg-[#f7f9f7] px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-[#315149]">
                    {failure.payload?.fullName ?? "Unknown lead"}
                    {failure.payload?.email ? ` · ${failure.payload.email}` : ""}
                    {failure.payload?.phone ? ` · ${failure.payload.phone}` : ""}
                  </p>
                  <p className="truncate text-[11px] text-[#8a948f]">
                    {failure.source} · {failure.attempts} attempt(s) · {failure.error}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-[#ccd6d1] text-[#315149]"
                  disabled={busyId === failure.id}
                  onClick={() => retry(failure.id)}
                >
                  {busyId === failure.id ? "Retrying..." : "Retry"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}

/* ===================== BREVO ===================== */

type BrevoSettings = Awaited<ReturnType<typeof getBrevoSettings>>;

/**
 * The API key input is write-only on purpose. getBrevoSettings never returns
 * the value — only whether one is loaded and its last four characters — so
 * there is nothing here for a compromised admin session to read back.
 */
function BrevoPanel() {
  const loadFn = useServerFn(getBrevoSettings);
  const saveFn = useServerFn(saveBrevoSettings);
  const saveKeyFn = useServerFn(saveBrevoApiKey);

  const [settings, setSettings] = useState<BrevoSettings | null>(null);
  const [form, setForm] = useState({
    listId: "",
    templateId: "",
    senderName: "",
    senderEmail: "",
    adminEmail: "",
  });
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await loadFn();
      setSettings(result);
      setForm({
        listId: result.listId,
        templateId: result.templateId,
        senderName: result.senderName,
        senderEmail: result.senderEmail,
        adminEmail: result.adminEmail,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load Brevo settings.");
    }
  }, [loadFn]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    setSaving(true);
    try {
      await saveFn({ data: form });
      if (apiKey.trim()) {
        await saveKeyFn({ data: { apiKey: apiKey.trim() } });
        setApiKey("");
      }
      toast.success("Brevo settings saved.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save Brevo settings.");
    } finally {
      setSaving(false);
    }
  }

  const key = settings?.apiKey;

  return (
    <Panel title="Brevo" description="Workshop registration confirmations and event contact lists.">
      <div className="space-y-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded px-2 py-1 text-[9px] font-semibold uppercase ${
              key?.configured ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
            }`}
          >
            {key?.configured ? `Key loaded ••••${key.lastFour}` : "No API key"}
          </span>
          {!key?.configured && settings?.environmentFallback.apiKey && (
            <span className="text-xs text-[#8a948f]">
              Falling back to the BREVO_API_KEY environment variable.
            </span>
          )}
          {key?.updatedAt && (
            <span className="text-xs text-[#8a948f]">Updated {fmtDate(key.updatedAt)}</span>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Brevo API key">
            <Input
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder={key?.configured ? "Paste a new key to replace" : "xkeysib-..."}
              autoComplete="off"
            />
          </Field>
          <Field label="Contact list ID">
            <Input
              value={form.listId}
              onChange={(event) => setForm((f) => ({ ...f, listId: event.target.value }))}
              placeholder="e.g. 7"
              inputMode="numeric"
            />
          </Field>
          <Field label="Confirmation template ID">
            <Input
              value={form.templateId}
              onChange={(event) => setForm((f) => ({ ...f, templateId: event.target.value }))}
              placeholder="e.g. 3"
              inputMode="numeric"
            />
          </Field>
          <Field label="Sender name">
            <Input
              value={form.senderName}
              onChange={(event) => setForm((f) => ({ ...f, senderName: event.target.value }))}
              placeholder="Kay-Steph Group"
            />
          </Field>
          <Field label="Sender email">
            <Input
              value={form.senderEmail}
              onChange={(event) => setForm((f) => ({ ...f, senderEmail: event.target.value }))}
              placeholder="events@kaystephgroup.com"
            />
          </Field>
          <Field label="Admin notification email">
            <Input
              value={form.adminEmail}
              onChange={(event) => setForm((f) => ({ ...f, adminEmail: event.target.value }))}
              placeholder="registrations@kaystephgroup.com"
            />
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={save} disabled={saving} className="bg-[#0b5748] text-white">
            {saving ? "Saving..." : "Save Brevo settings"}
          </Button>
          <p className="text-xs text-[#8a948f]">
            The key is stored where no signed-in account can read it back, including this page. The
            template must define FIRST_NAME, FULL_NAME, EMAIL, PHONE, LOCATION, GENDER, OCCUPATION,
            INTEREST, EVENT_NAME and REGISTRATION_REFERENCE.
          </p>
        </div>
      </div>
    </Panel>
  );
}

/* ============ WORKSHOP REGISTRATIONS ============ */

type WorkshopRegistration = {
  id: string;
  reference: string;
  event_name: string;
  full_name: string;
  email: string;
  phone: string;
  location: string;
  interest: string;
  confirmation_email_status: string;
  admin_email_status: string;
  brevo_contact_status: string;
  last_error: string | null;
  created_at: string;
};

function WorkshopRegistrationsPanel() {
  const listFn = useServerFn(listWorkshopRegistrations);
  const retryFn = useServerFn(retryWorkshopConfirmation);
  const [rows, setRows] = useState<WorkshopRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [failedOnly, setFailedOnly] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listFn();
      setRows(result.registrations as WorkshopRegistration[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load registrations.");
    } finally {
      setLoading(false);
    }
  }, [listFn]);

  useEffect(() => {
    load();
  }, [load]);

  async function retry(id: string) {
    setRetrying(id);
    try {
      const result = await retryFn({ data: { id } });
      toast.success(`Confirmation re-sent for ${result.reference}.`);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Retry failed.");
      await load();
    } finally {
      setRetrying(null);
    }
  }

  const undelivered = rows.filter((row) => row.confirmation_email_status !== "sent");
  const visible = failedOnly ? undelivered : rows;

  return (
    <Panel
      title="Workshop registrations"
      description="Every sign-up with its reference and email delivery state. A registration is never lost when Brevo fails — retry it here."
    >
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-[#53625c]">
            {rows.length} registration(s)
            {undelivered.length > 0 && (
              <span className="ml-2 rounded bg-amber-50 px-2 py-1 font-semibold text-amber-800">
                {undelivered.length} undelivered
              </span>
            )}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="text-[#0b5748]"
            onClick={() => setFailedOnly((value) => !value)}
          >
            {failedOnly ? "Show all" : "Show undelivered only"}
          </Button>
          <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            title={failedOnly ? "Every confirmation delivered" : "No registrations yet"}
            body={
              failedOnly
                ? "Nothing is waiting to be re-sent."
                : "Sign-ups from the workshop pages appear here."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-xs">
              <thead className="text-[9px] uppercase tracking-wider text-[#8a948f]">
                <tr>
                  <th className="px-3 py-2">Reference</th>
                  <th className="px-3 py-2">Participant</th>
                  <th className="px-3 py-2">Interest</th>
                  <th className="px-3 py-2">Confirmation</th>
                  <th className="px-3 py-2">Registered</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={row.id} className="border-t border-[#e7ebe8] align-top">
                    <td className="px-3 py-2 font-mono text-[11px] text-[#173f36]">
                      {row.reference}
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-semibold text-[#173f36]">{row.full_name}</div>
                      <div className="text-[#8a948f]">{row.email}</div>
                      <div className="text-[#8a948f]">{row.phone}</div>
                    </td>
                    <td className="px-3 py-2 text-[#53625c]">{row.interest}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded px-2 py-1 text-[9px] font-semibold uppercase ${
                          row.confirmation_email_status === "sent"
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-red-50 text-red-800"
                        }`}
                      >
                        {row.confirmation_email_status}
                      </span>
                      {row.last_error && (
                        <p className="mt-1 max-w-xs break-words text-[10px] text-[#8a948f]">
                          {row.last_error}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2 text-[#8a948f]">{fmtDate(row.created_at)}</td>
                    <td className="px-3 py-2 text-right">
                      {row.confirmation_email_status !== "sent" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[#ccd6d1] text-[#315149]"
                          onClick={() => retry(row.id)}
                          disabled={retrying === row.id}
                        >
                          {retrying === row.id ? "Sending..." : "Retry"}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Panel>
  );
}
