import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { DoorOpen } from "lucide-react";
import { getMyPortfolio, requestExit } from "@/lib/invest.functions";
import { EXIT_STATUS_LABEL, fmtNGN } from "@/lib/invest";
import { DashCard, EmptyState, fmtDate, PageHeader, StatusBadge } from "@/components/portfolio/kit";
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
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/portfolio/exit-requests")({
  component: Exits,
});

/* eslint-disable @typescript-eslint/no-explicit-any */

function Exits() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["portfolio"], queryFn: () => getMyPortfolio() });
  const [propId, setPropId] = useState<string>("");
  const [tokens, setTokens] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const mut = useMutation({ mutationFn: requestExit });

  const { data: exits, refetch } = useQuery({
    queryKey: ["exits", "mine"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("exit_requests")
        .select("*, tokenized_properties(name)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const invs = ((data?.investments ?? []) as any[]).filter((i) => i.status === "approved");

  async function submit() {
    if (!propId || tokens <= 0 || price <= 0) return toast.error("Fill all fields");
    try {
      await mut.mutateAsync({
        data: { property_id: propId, tokens_to_sell: tokens, asking_price: price },
      });
      toast.success("Exit request submitted for company approval.");
      refetch();
      qc.invalidateQueries({ queryKey: ["portfolio"] });
      setPropId("");
      setTokens(0);
      setPrice(0);
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exit requests"
        description="Request to sell part or all of your interest to a verified buyer."
      />

      <DashCard
        title="Request to sell tokens"
        description="Submissions are reviewed before your interest is listed for resale."
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Property</Label>
              <Select value={propId} onValueChange={setPropId}>
                <SelectTrigger aria-label="Select property">
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {invs.map((i) => (
                    <SelectItem key={i.property_id} value={i.property_id}>
                      {i.tokenized_properties?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exit-tokens">Tokens to sell</Label>
              <Input
                id="exit-tokens"
                type="number"
                min={1}
                placeholder="0"
                value={tokens || ""}
                onChange={(e) => setTokens(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exit-price">Asking price (₦)</Label>
              <Input
                id="exit-price"
                type="number"
                min={1}
                placeholder="0"
                value={price || ""}
                onChange={(e) => setPrice(Number(e.target.value))}
              />
            </div>
          </div>
          <Button
            onClick={submit}
            disabled={invs.length === 0}
            className="bg-navy font-bold text-white hover:bg-navy/90"
          >
            Submit exit request
          </Button>
          <p className="text-xs leading-5 text-slate-500">
            All transfers require Kay-Steph approval before ownership records change. You will be
            notified at each stage — listing approval, buyer found, payment and completion.
          </p>
        </div>
      </DashCard>

      <DashCard title="Your exit requests" noPadding>
        {(exits ?? []).length === 0 ? (
          <EmptyState
            icon={DoorOpen}
            title="No exit requests"
            body="When you submit a resale request, its progress is tracked here."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {(exits ?? []).map((e: any) => (
              <div key={e.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-navy">{e.tokenized_properties?.name}</div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {e.tokens_to_sell} token{e.tokens_to_sell === 1 ? "" : "s"} · Asking{" "}
                    <b className="text-slate-700">{fmtNGN(e.asking_price)}</b> · Submitted{" "}
                    {fmtDate(e.created_at)}
                  </div>
                  {e.admin_notes && (
                    <div className="mt-1 text-xs text-amber-700">Notes: {e.admin_notes}</div>
                  )}
                </div>
                <StatusBadge status={e.status} label={EXIT_STATUS_LABEL[e.status] ?? e.status} />
              </div>
            ))}
          </div>
        )}
      </DashCard>
    </div>
  );
}
