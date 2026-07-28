import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Eye, Mail, Phone, Plus, Search, Upload, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { supabase as _supabaseTyped } from "@/integrations/supabase/client";
// CRM schema is not fully wired; cast to any to bypass generated types.
const supabase: any = _supabaseTyped;
import {
  INVESTMENT_TYPES,
  LEAD_GRADES,
  LEAD_SOURCES,
  LEAD_STATUSES,
  fmtDate,
  fmtNaira,
  investmentLabel,
  type InvestmentType,
  type Lead,
  type LeadGrade,
  type LeadSource,
  type LeadStatus,
  type SalesAgent,
} from "@/lib/crm";
import { assignLead, createManualLead, updateLeadStatus } from "@/lib/crm.functions";
import {
  CrmPageHeader,
  EmptyState,
  GradeBadge,
  SourceBadge,
  StatusBadge,
} from "@/components/crm/CrmUi";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

export const Route = createFileRoute("/_authenticated/crm/leads")({
  component: LeadsRoute,
});

function LeadsRoute() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return pathname === "/crm/leads" ? <LeadsWorkspace /> : <Outlet />;
}

function LeadsWorkspace() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<SalesAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<LeadStatus | "all">("all");
  const [grade, setGrade] = useState<LeadGrade | "all">("all");
  const [source, setSource] = useState<LeadSource | "all">("all");
  const [agent, setAgent] = useState("all");

  const refresh = useCallback(async () => {
    const [leadResult, agentResult] = await Promise.all([
      supabase.from("leads").select("*").order("captured_at", { ascending: false }).limit(1000),
      supabase.from("sales_agents").select("*").eq("active", true).order("full_name"),
    ]);
    if (leadResult.error) toast.error("Leads could not be loaded.");
    setLeads((leadResult.data ?? []) as unknown as Lead[]);
    setAgents((agentResult.data ?? []) as unknown as SalesAgent[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return leads.filter((lead) => {
      if (status !== "all" && lead.status !== status) return false;
      if (grade !== "all" && lead.lead_grade !== grade) return false;
      if (source !== "all" && lead.lead_source !== source) return false;
      if (agent !== "all" && lead.assigned_to !== agent) return false;
      if (!normalized) return true;
      return [lead.full_name, lead.email, lead.phone, lead.property_name, lead.campaign_name]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalized));
    });
  }, [agent, grade, leads, query, source, status]);

  function exportCsv() {
    const cell = (value: string | number | null | undefined) =>
      `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = [
      [
        "Full name",
        "Email",
        "Phone",
        "Country",
        "Property",
        "Budget min",
        "Budget max",
        "Investment preference",
        "Source",
        "Grade",
        "Status",
        "Captured",
      ],
      ...filtered.map((lead) => [
        lead.full_name,
        lead.email,
        lead.phone,
        lead.country_of_residence,
        lead.property_name,
        lead.budget_min,
        lead.budget_max,
        investmentLabel(lead.investment_type),
        lead.lead_source,
        lead.lead_grade,
        lead.status,
        lead.captured_at,
      ]),
    ];
    const csv = rows.map((row) => row.map(cell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `kaysteph-crm-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-w-0 space-y-5 overflow-x-hidden">
      <CrmPageHeader
        eyebrow="Lead management"
        title="Every prospect, one complete profile"
        description="Search, qualify, assign and follow up without splitting one person across disconnected enquiries."
        actions={
          <>
            <Button
              variant="outline"
              className="border-[#ccd6d1] bg-white text-[#42564f]"
              onClick={() =>
                toast.info("Use the CSV template in CRM settings to prepare a validated import.")
              }
            >
              <Upload className="mr-2 h-4 w-4" /> Import
            </Button>
            <Button
              variant="outline"
              className="border-[#ccd6d1] bg-white text-[#42564f]"
              onClick={exportCsv}
              disabled={filtered.length === 0}
            >
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <AddLeadDialog agents={agents} onCreated={refresh} />
          </>
        }
      />

      <div className="grid gap-3 border border-[#dfe4df] bg-white p-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-[minmax(240px,1fr)_180px_160px_210px_190px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#87928d]" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, phone, property or campaign"
            className="h-9 border-[#dce2de] pl-9 text-xs"
          />
        </div>
        <FilterSelect
          value={status}
          onChange={(value) => setStatus(value as LeadStatus | "all")}
          placeholder="All stages"
          options={LEAD_STATUSES.map((item) => ({ value: item.key, label: item.label }))}
        />
        <FilterSelect
          value={grade}
          onChange={(value) => setGrade(value as LeadGrade | "all")}
          placeholder="All grades"
          options={LEAD_GRADES.map((item) => ({ value: item.key, label: `Grade ${item.key}` }))}
        />
        <FilterSelect
          value={source}
          onChange={(value) => setSource(value as LeadSource | "all")}
          placeholder="All sources"
          options={LEAD_SOURCES.map((item) => ({ value: item.key, label: item.label }))}
        />
        <FilterSelect
          value={agent}
          onChange={setAgent}
          placeholder="All advisers"
          options={agents.map((item) => ({ value: item.user_id, label: item.full_name }))}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#6e7b75]">
        <span>
          <strong className="text-[#243f37]">{filtered.length}</strong> visible leads
        </span>
        <span>
          <strong className="text-emerald-700">
            {filtered.filter((lead) => lead.lead_grade === "A").length}
          </strong>{" "}
          Grade A
        </span>
        <span>
          <strong className="text-amber-700">
            {filtered.filter((lead) => !lead.assigned_to).length}
          </strong>{" "}
          unassigned
        </span>
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setStatus("all");
            setGrade("all");
            setSource("all");
            setAgent("all");
          }}
          className="font-semibold text-[#0b5748] hover:underline"
        >
          Clear filters
        </button>
      </div>

      <div className="border border-[#dfe4df] bg-white">
        {loading ? (
          <div className="py-16 text-center text-sm text-[#74817b]">Loading leads...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No matching leads"
            body="Adjust the filters or add a new prospect to the CRM."
          />
        ) : (
          <div className="max-w-full overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[960px] table-fixed text-left">
              <colgroup>
                <col className="w-[22%]" />
                <col className="w-[8%]" />
                <col className="w-[20%]" />
                <col className="w-[14%]" />
                <col className="w-[18%]" />
                <col className="w-[14%]" />
                <col className="hidden w-[9%] 2xl:table-column" />
                <col className="w-[4%]" />
              </colgroup>
              <thead className="bg-[#f7f9f7] text-[9px] uppercase tracking-[0.16em] text-[#74807b]">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Lead</th>
                  <th className="px-4 py-2.5 font-semibold">Grade</th>
                  <th className="px-4 py-2.5 font-semibold">Property and budget</th>
                  <th className="px-4 py-2.5 font-semibold">Source</th>
                  <th className="px-4 py-2.5 font-semibold">Stage</th>
                  <th className="px-4 py-2.5 font-semibold">Adviser</th>
                  <th className="hidden px-4 py-2.5 font-semibold 2xl:table-cell">Captured</th>
                  <th className="w-12 px-4 py-2.5">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7ebe8]">
                {filtered.map((lead) => (
                  <LeadRow key={lead.id} lead={lead} agents={agents} onChange={refresh} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function LeadRow({
  lead,
  agents,
  onChange,
}: {
  lead: Lead;
  agents: SalesAgent[];
  onChange: () => void;
}) {
  const changeStage = useServerFn(updateLeadStatus);
  const assign = useServerFn(assignLead);
  const [busy, setBusy] = useState(false);

  async function handleStage(value: string) {
    setBusy(true);
    try {
      await changeStage({ data: { leadId: lead.id, status: value as LeadStatus } });
      toast.success("Lead stage updated.");
      onChange();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Stage could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  async function handleAssign(value: string) {
    setBusy(true);
    try {
      await assign({ data: { leadId: lead.id, agentId: value } });
      toast.success("Lead assigned.");
      onChange();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lead could not be assigned.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr className="hover:bg-[#fafbf9]">
      <td className="px-4 py-3">
        <Link
          to="/crm/leads/$leadId"
          params={{ leadId: lead.id }}
          className="text-xs font-semibold text-[#24443b] hover:text-[#0b5748]"
        >
          {lead.full_name}
        </Link>
        <div className="mt-1 flex min-w-0 flex-col items-start gap-0.5 text-[10px] text-[#7b8782]">
          {lead.phone && (
            <a
              href={`tel:${lead.phone}`}
              className="flex max-w-full items-center gap-1 truncate hover:text-[#0b5748]"
            >
              <Phone className="h-3 w-3" />
              {lead.phone}
            </a>
          )}
          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              className="flex max-w-full items-center gap-1 truncate hover:text-[#0b5748]"
            >
              <Mail className="h-3 w-3 shrink-0" />
              {lead.email}
            </a>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <GradeBadge grade={lead.lead_grade} compact />
        <p className="mt-1 text-[9px] text-[#8a948f]">Score {lead.grade_score}/100</p>
      </td>
      <td className="px-4 py-3">
        <p className="max-w-52 truncate text-xs font-medium text-[#42534d]">
          {lead.property_name ?? "No property selected"}
        </p>
        <p className="mt-0.5 text-[10px] text-[#7c8782]">
          {fmtNaira(lead.budget_min)} to {fmtNaira(lead.budget_max)} ·{" "}
          {investmentLabel(lead.investment_type)}
        </p>
      </td>
      <td className="px-4 py-3">
        <SourceBadge source={lead.lead_source} />
        {lead.campaign_name && (
          <p className="mt-1 max-w-44 truncate text-[9px] text-[#89938f]">{lead.campaign_name}</p>
        )}
      </td>
      <td className="px-4 py-3">
        <Select value={lead.status} onValueChange={handleStage} disabled={busy}>
          <SelectTrigger className="h-8 w-full border-[#dce2de] bg-white text-[10px]">
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
      </td>
      <td className="px-4 py-3">
        <Select value={lead.assigned_to ?? ""} onValueChange={handleAssign} disabled={busy}>
          <SelectTrigger className="h-8 w-full border-[#dce2de] bg-white text-[10px]">
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
      </td>
      <td className="hidden px-4 py-3 text-[10px] text-[#7c8782] 2xl:table-cell">
        {fmtDate(lead.captured_at)}
      </td>
      <td className="px-4 py-3">
        <Button asChild size="icon" variant="ghost" className="h-8 w-8 text-[#0b5748]">
          <Link
            to="/crm/leads/$leadId"
            params={{ leadId: lead.id }}
            aria-label={`Open ${lead.full_name}`}
          >
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      </td>
    </tr>
  );
}

function AddLeadDialog({ agents, onCreated }: { agents: SalesAgent[]; onCreated: () => void }) {
  const create = useServerFn(createManualLead);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    whatsappNumber: "",
    location: "",
    countryOfResidence: "Nigeria",
    propertyName: "",
    propertyType: "",
    preferredLocation: "",
    budgetMin: "",
    budgetMax: "",
    investmentType: "not_decided" as InvestmentType,
    leadSource: "manual_entry" as LeadSource,
    sourceDetail: "",
    preferredContactMethod: "whatsapp",
    expectedTimeline: "",
    assignedTo: "",
    notes: "",
    consentGiven: false,
  });

  const set = (field: keyof typeof form, value: string | boolean) =>
    setForm((previous) => ({ ...previous, [field]: value }));

  async function submit() {
    if (!form.fullName.trim()) return toast.error("Full name is required.");
    if (!form.email.trim() && !form.phone.trim())
      return toast.error("Add an email address or phone number.");
    setBusy(true);
    try {
      const result = await create({
        data: {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          whatsappNumber: form.whatsappNumber,
          location: form.location,
          countryOfResidence: form.countryOfResidence,
          propertyName: form.propertyName,
          propertyType: form.propertyType,
          preferredLocation: form.preferredLocation,
          budgetMin: form.budgetMin ? Number(form.budgetMin) : undefined,
          budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
          investmentType: form.investmentType,
          leadSource: form.leadSource,
          sourceDetail: form.sourceDetail,
          preferredContactMethod: form.preferredContactMethod,
          expectedTimeline: form.expectedTimeline,
          assignedTo: form.assignedTo || undefined,
          notes: form.notes,
          consentGiven: form.consentGiven,
        },
      });
      toast.success(
        (result as any).merged ? "Enquiry merged into the existing lead profile." : "Lead added to the CRM.",
      );
      setOpen(false);
      onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lead could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#0b5748] text-white hover:bg-[#08483c]">
          <Plus className="mr-2 h-4 w-4" /> Add lead
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto border-[#dce2de] bg-white text-[#263f38]">
        <DialogHeader>
          <DialogTitle className="text-xl text-[#173f36]">Add or update a lead</DialogTitle>
          <p className="text-xs leading-5 text-[#74817b]">
            Matching email or phone details are merged into the existing profile.
          </p>
        </DialogHeader>
        <div className="grid gap-4 py-2 md:grid-cols-2">
          <Field label="Full name *">
            <Input
              value={form.fullName}
              onChange={(event) => set("fullName", event.target.value)}
            />
          </Field>
          <Field label="Email address">
            <Input
              type="email"
              value={form.email}
              onChange={(event) => set("email", event.target.value)}
            />
          </Field>
          <Field label="Phone number">
            <Input value={form.phone} onChange={(event) => set("phone", event.target.value)} />
          </Field>
          <Field label="WhatsApp number">
            <Input
              value={form.whatsappNumber}
              onChange={(event) => set("whatsappNumber", event.target.value)}
            />
          </Field>
          <Field label="Current location">
            <Input
              value={form.location}
              onChange={(event) => set("location", event.target.value)}
            />
          </Field>
          <Field label="Country of residence">
            <Input
              value={form.countryOfResidence}
              onChange={(event) => set("countryOfResidence", event.target.value)}
            />
          </Field>
          <Field label="Property of interest">
            <Input
              value={form.propertyName}
              onChange={(event) => set("propertyName", event.target.value)}
            />
          </Field>
          <Field label="Property type">
            <Input
              value={form.propertyType}
              onChange={(event) => set("propertyType", event.target.value)}
              placeholder="Apartment, land, terrace"
            />
          </Field>
          <Field label="Preferred property location">
            <Input
              value={form.preferredLocation}
              onChange={(event) => set("preferredLocation", event.target.value)}
            />
          </Field>
          <Field label="Investment preference">
            <OptionSelect
              value={form.investmentType}
              onChange={(value) => set("investmentType", value)}
              options={INVESTMENT_TYPES.map((item) => ({ value: item.key, label: item.label }))}
            />
          </Field>
          <Field label="Budget minimum (NGN)">
            <Input
              type="number"
              min="0"
              value={form.budgetMin}
              onChange={(event) => set("budgetMin", event.target.value)}
            />
          </Field>
          <Field label="Budget maximum (NGN)">
            <Input
              type="number"
              min="0"
              value={form.budgetMax}
              onChange={(event) => set("budgetMax", event.target.value)}
            />
          </Field>
          <Field label="Lead source">
            <OptionSelect
              value={form.leadSource}
              onChange={(value) => set("leadSource", value)}
              options={LEAD_SOURCES.map((item) => ({ value: item.key, label: item.label }))}
            />
          </Field>
          <Field label="Source detail">
            <Input
              value={form.sourceDetail}
              onChange={(event) => set("sourceDetail", event.target.value)}
              placeholder="Campaign, event or affiliate"
            />
          </Field>
          <Field label="Preferred contact">
            <OptionSelect
              value={form.preferredContactMethod}
              onChange={(value) => set("preferredContactMethod", value)}
              options={[
                { value: "whatsapp", label: "WhatsApp" },
                { value: "phone", label: "Phone" },
                { value: "email", label: "Email" },
              ]}
            />
          </Field>
          <Field label="Investment timeline">
            <OptionSelect
              value={form.expectedTimeline}
              onChange={(value) => set("expectedTimeline", value)}
              placeholder="Select timeline"
              options={[
                { value: "immediately", label: "Immediately" },
                { value: "within_30_days", label: "Within 30 days" },
                { value: "1_3_months", label: "1 to 3 months" },
                { value: "3_6_months", label: "3 to 6 months" },
                { value: "future", label: "Future research" },
              ]}
            />
          </Field>
          <Field label="Assigned adviser">
            <OptionSelect
              value={form.assignedTo}
              onChange={(value) => set("assignedTo", value)}
              placeholder="Auto-assign later"
              options={agents.map((item) => ({ value: item.user_id, label: item.full_name }))}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Notes">
              <Textarea
                rows={4}
                value={form.notes}
                onChange={(event) => set("notes", event.target.value)}
              />
            </Field>
          </div>
          <label className="flex items-start gap-3 border border-[#dce2de] bg-[#f7f9f7] p-3 text-xs leading-5 text-[#65726c] md:col-span-2">
            <Checkbox
              checked={form.consentGiven}
              onCheckedChange={(checked) => set("consentGiven", checked === true)}
              className="mt-0.5"
            />
            <span>
              The prospect agreed that Kay-Steph may contact them about properties, events and
              investment opportunities. Record consent only when it was actually provided.
            </span>
          </label>
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
            {busy ? "Saving..." : "Save lead"}
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

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 border-[#dce2de] text-xs">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {options.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function OptionSelect({
  value,
  onChange,
  placeholder = "Select",
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
