import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  OPPORTUNITY_STAGES,
  fmtNaira,
  investmentLabel,
  type InvestmentType,
  type OpportunityStage,
} from "@/lib/crm";
import { CrmPageHeader } from "@/components/crm/CrmUi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/crm/opportunities")({
  component: OpportunitiesPage,
});

type Opportunity = {
  id: string;
  buyer_name: string;
  property_name: string | null;
  unit_type: string | null;
  purchase_model: InvestmentType;
  deal_value_naira: number;
  probability: number;
  expected_close_at: string | null;
  stage: OpportunityStage;
  assigned_to: string | null;
};

const DEMO_OPPORTUNITIES: Opportunity[] = [];

function OpportunitiesPage() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast.error("Opportunities could not be loaded.");
    setItems((data ?? []) as unknown as Opportunity[]);
    setLoading(false);
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function move(id: string, stage: OpportunityStage) {
    const patch = stage === "won" ? { stage, won_at: new Date().toISOString() } : { stage };
    const { error } = await supabase.from("opportunities").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Opportunity stage updated.");
      await refresh();
    }
  }

  const won = items.filter((item) => item.stage === "won");
  const pipeline = items.filter((item) => item.stage !== "won" && item.stage !== "lost");

  return (
    <div className="space-y-5">
      <CrmPageHeader
        eyebrow="Qualified deal desk"
        title="Opportunities"
        description="Track property value, purchase structure, probability and expected closing after a lead is commercially qualified."
        actions={
          <div className="text-right">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-[#7b8782]">
              Weighted pipeline
            </p>
            <p className="mt-1 text-lg font-semibold text-[#b07824]">
              {fmtNaira(
                pipeline.reduce(
                  (sum, item) => sum + Number(item.deal_value_naira) * (item.probability / 100),
                  0,
                ),
              )}
            </p>
            <p className="text-[10px] text-[#7b8782]">
              Won {fmtNaira(won.reduce((sum, item) => sum + Number(item.deal_value_naira), 0))}
            </p>
          </div>
        }
      />
      {loading ? (
        <div className="py-20 text-center text-sm text-[#718079]">Loading opportunities...</div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div
            className="grid min-w-max gap-3"
            style={{
              gridTemplateColumns: `repeat(${OPPORTUNITY_STAGES.length}, minmax(250px, 250px))`,
            }}
          >
            {OPPORTUNITY_STAGES.map((stage) => {
              const list = items.filter((item) => item.stage === stage.key);
              return (
                <section
                  key={stage.key}
                  className={`min-h-[500px] border border-[#dfe4df] border-t-2 bg-[#f7f9f7] ${stage.tone}`}
                >
                  <header className="border-b border-[#dfe4df] bg-white px-3 py-3">
                    <div className="flex justify-between">
                      <h2 className="text-xs font-semibold text-[#304940]">{stage.label}</h2>
                      <span className="rounded-full bg-[#edf4f1] px-2 py-0.5 text-[10px] font-bold text-[#0b5748]">
                        {list.length}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-[#818c87]">
                      {fmtNaira(list.reduce((sum, item) => sum + Number(item.deal_value_naira), 0))}
                    </p>
                  </header>
                  <div className="space-y-2 p-2">
                    {list.length === 0 ? (
                      <div className="border border-dashed border-[#d4dbd7] py-8 text-center text-[10px] text-[#929c97]">
                        No deals
                      </div>
                    ) : (
                      list.map((opportunity) => (
                        <article
                          key={opportunity.id}
                          className="border border-[#dfe4df] bg-white p-3 shadow-sm"
                        >
                          <p className="text-xs font-semibold text-[#304940]">
                            {opportunity.buyer_name}
                          </p>
                          <p className="mt-1 text-[10px] leading-4 text-[#74807b]">
                            {opportunity.property_name ?? "Property to be confirmed"}
                            {opportunity.unit_type ? ` · ${opportunity.unit_type}` : ""}
                          </p>
                          <p className="mt-2 text-sm font-semibold text-[#b07824]">
                            {fmtNaira(Number(opportunity.deal_value_naira))}
                          </p>
                          <p className="mt-0.5 text-[10px] text-[#7c8782]">
                            {investmentLabel(opportunity.purchase_model)} ·{" "}
                            {opportunity.probability}% probability
                          </p>
                          <Select
                            value={opportunity.stage}
                            onValueChange={(value) =>
                              void move(opportunity.id, value as OpportunityStage)
                            }
                          >
                            <SelectTrigger className="mt-3 h-7 text-[9px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {OPPORTUNITY_STAGES.map((item) => (
                                <SelectItem key={item.key} value={item.key}>
                                  {item.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </article>
                      ))
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
