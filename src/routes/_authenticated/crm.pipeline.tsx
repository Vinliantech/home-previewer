import { createFileRoute, Link } from "@tanstack/react-router";
import { useClientFn } from "@/lib/client-function";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Filter, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  LEAD_STATUSES,
  PIPELINE_PHASES,
  fmtNaira,
  pipelineStageForStatus,
  type Lead,
  type LeadGrade,
  type LeadStatus,
  type PipelineStage,
} from "@/lib/crm";
import { updateLeadStatus } from "@/lib/crm.functions";
import { CrmPageHeader, GradeBadge, SourceBadge } from "@/components/crm/CrmUi";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/crm/pipeline")({
  component: Pipeline,
});

function Pipeline() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [grade, setGrade] = useState<LeadGrade | "all">("all");
  const [phase, setPhase] = useState<(typeof PIPELINE_PHASES)[number] | "All">("All");
  const [dragging, setDragging] = useState<string | null>(null);
  const changeStatus = useClientFn(updateLeadStatus);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("captured_at", { ascending: false })
      .limit(1000);
    if (error) toast.error("Pipeline could not be loaded.");
    setLeads((data ?? []) as unknown as Lead[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return leads.filter((lead) => {
      if (grade !== "all" && lead.lead_grade !== grade) return false;
      if (!normalized) return true;
      return [lead.full_name, lead.property_name, lead.email, lead.phone]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalized));
    });
  }, [grade, leads, query]);

  const stages =
    phase === "All" ? LEAD_STATUSES : LEAD_STATUSES.filter((item) => item.phase === phase);
  const openValue = filtered
    .filter(
      (lead) =>
        !["converted", "not_interested", "lost"].includes(pipelineStageForStatus(lead.status)),
    )
    .reduce((sum, lead) => sum + (lead.budget_max ?? lead.budget_min ?? 0), 0);

  async function move(leadId: string, status: PipelineStage) {
    const lead = leads.find((item) => item.id === leadId);
    if (!lead || pipelineStageForStatus(lead.status) === status) return;
    setLeads((current) => current.map((item) => (item.id === leadId ? { ...item, status } : item)));
    try {
      await changeStatus({ data: { leadId, status } });
      toast.success(
        `Moved ${lead.full_name} to ${LEAD_STATUSES.find((item) => item.key === status)?.label}.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lead could not be moved.");
      await refresh();
    }
  }

  return (
    <div className="space-y-5">
      <CrmPageHeader
        eyebrow="Sales workflow"
        title="Lead pipeline"
        description="Drag prospects between stages on desktop, or use the stage selector on any device. Every move is retained in the activity history."
      />

      <div className="grid gap-3 border border-[#dfe4df] bg-white p-3 md:grid-cols-[minmax(240px,1fr)_180px_190px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#87928d]" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pipeline"
            className="h-9 border-[#dce2de] pl-9 text-xs"
          />
        </div>
        <Select value={grade} onValueChange={(value) => setGrade(value as LeadGrade | "all")}>
          <SelectTrigger className="h-9 border-[#dce2de] text-xs">
            <Filter className="mr-2 h-3.5 w-3.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All lead grades</SelectItem>
            {["A", "B", "C", "D"].map((item) => (
              <SelectItem key={item} value={item}>
                Grade {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={phase} onValueChange={(value) => setPhase(value as typeof phase)}>
          <SelectTrigger className="h-9 border-[#dce2de] text-xs">
            <SlidersHorizontal className="mr-2 h-3.5 w-3.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All stages</SelectItem>
            {PIPELINE_PHASES.map((item) => (
              <SelectItem key={item} value={item}>
                {item} phase
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-5 text-[11px] text-[#6e7b75]">
        <span>
          <strong className="text-[#243f37]">{filtered.length}</strong> leads
        </span>
        <span>
          <strong className="text-[#243f37]">{fmtNaira(openValue)}</strong> indicative open value
        </span>
        <span>
          <strong className="text-emerald-700">
            {filtered.filter((lead) => lead.lead_grade === "A").length}
          </strong>{" "}
          hot leads
        </span>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-[#718079]">Loading pipeline...</div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div
            className="grid min-w-max gap-3"
            style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(258px, 258px))` }}
          >
            {stages.map((stage) => {
              const items = filtered.filter(
                (lead) => pipelineStageForStatus(lead.status) === stage.key,
              );
              const value = items.reduce(
                (sum, lead) => sum + (lead.budget_max ?? lead.budget_min ?? 0),
                0,
              );
              return (
                <section
                  key={stage.key}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const leadId = event.dataTransfer.getData("text/plain") || dragging;
                    if (leadId) void move(leadId, stage.key);
                    setDragging(null);
                  }}
                  className={`min-h-[520px] border bg-[#f7f9f7] ${dragging ? "border-[#b6c9c1]" : "border-[#dfe4df]"}`}
                >
                  <header className="border-b border-[#dfe4df] bg-white px-3 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#7c8782]">
                          {stage.phase}
                        </p>
                        <h2 className="mt-1 text-xs font-semibold text-[#29483f]">{stage.label}</h2>
                      </div>
                      <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#edf4f1] px-1.5 text-[10px] font-bold text-[#0b5748]">
                        {items.length}
                      </span>
                    </div>
                    <p className="mt-2 text-[10px] text-[#85908b]">{fmtNaira(value)}</p>
                  </header>
                  <div className="space-y-2 p-2">
                    {items.map((lead) => (
                      <article
                        key={lead.id}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData("text/plain", lead.id);
                          event.dataTransfer.effectAllowed = "move";
                          setDragging(lead.id);
                        }}
                        onDragEnd={() => setDragging(null)}
                        className={`cursor-grab border border-[#dfe4df] bg-white p-3 shadow-sm active:cursor-grabbing ${dragging === lead.id ? "opacity-50" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            to="/crm/leads/$leadId"
                            params={{ leadId: lead.id }}
                            className="text-xs font-semibold text-[#29483f] hover:text-[#0b5748]"
                          >
                            {lead.full_name}
                          </Link>
                          <GradeBadge grade={lead.lead_grade} compact />
                        </div>
                        <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#74807b]">
                          {lead.property_name ?? "Property not selected"}
                        </p>
                        <p className="mt-2 text-[11px] font-semibold text-[#b07824]">
                          {fmtNaira(lead.budget_max ?? lead.budget_min)}
                        </p>
                        <div className="mt-2">
                          <SourceBadge source={lead.lead_source} />
                        </div>
                        <Select
                          value={pipelineStageForStatus(lead.status)}
                          onValueChange={(value) => void move(lead.id, value as PipelineStage)}
                        >
                          <SelectTrigger className="mt-3 h-7 w-full border-[#dce2de] bg-[#fafbf9] text-[9px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LEAD_STATUSES.map((item) => (
                              <SelectItem key={item.key} value={item.key}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </article>
                    ))}
                    {items.length === 0 && (
                      <div className="border border-dashed border-[#d4dbd7] px-3 py-8 text-center text-[10px] text-[#929c97]">
                        Drop a lead here
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
