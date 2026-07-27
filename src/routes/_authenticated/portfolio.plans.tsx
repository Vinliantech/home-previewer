import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fmtNGN } from "@/lib/invest";
import { DashCard, EmptyState, fmtDate, PageHeader, StatusBadge } from "@/components/portfolio/kit";

export const Route = createFileRoute("/_authenticated/portfolio/plans")({
  component: ReservationsAndPlans,
});

async function loadConnectedPlans() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { reservations: [], plans: [] };
  const sb = supabase as any;
  const [reservations, plans] = await Promise.all([
    sb
      .from("reservations")
      .select("*, plots(plot_number, size_sqm, estates(name, location))")
      .eq("client_user_id", auth.user.id)
      .order("created_at", { ascending: false }),
    sb
      .from("payment_requirements")
      .select("*, available_properties(property_name, location), group_pools(name, property_name)")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false }),
  ]);
  if (reservations.error) throw reservations.error;
  if (plans.error) throw plans.error;
  return { reservations: reservations.data ?? [], plans: plans.data ?? [] };
}

function ReservationsAndPlans() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["connected-reservations-payment-plans"],
    queryFn: loadConnectedPlans,
  });
  const reservations = (data?.reservations ?? []) as any[];
  const plans = (data?.plans ?? []) as any[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reservations & payment plans"
        description="Plot holds and installment schedules assigned by the Kay-Steph team."
      />

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          These records could not be loaded. Please contact your relationship manager.
        </div>
      )}

      <DashCard title="My reservations" description="Plots currently connected to your account" noPadding>
        {isLoading ? (
          <p className="p-5 text-sm text-slate-500">Loading reservations…</p>
        ) : reservations.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="No linked reservations" body="A confirmed plot hold will appear here as soon as an administrator assigns it to your account." />
        ) : (
          <div className="divide-y divide-slate-100">
            {reservations.map((reservation) => (
              <div key={reservation.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-navy">{reservation.plots?.estates?.name ?? reservation.property_type ?? "Property reservation"}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {reservation.plots?.plot_number ? `Plot ${reservation.plots.plot_number}` : "Plot selection pending"}
                    {reservation.plots?.estates?.location ? ` · ${reservation.plots.estates.location}` : ""}
                  </p>
                  {reservation.reserved_until && <p className="mt-1 text-xs font-semibold text-gold">Hold expires {fmtDate(reservation.reserved_until)}</p>}
                </div>
                <StatusBadge status={reservation.status} />
              </div>
            ))}
          </div>
        )}
      </DashCard>

      <DashCard title="My payment plans" description="Full-purchase and group-buy schedules" noPadding>
        {isLoading ? (
          <p className="p-5 text-sm text-slate-500">Loading payment plans…</p>
        ) : plans.length === 0 ? (
          <EmptyState icon={CreditCard} title="No payment plan assigned" body="Your approved 3-month, 6-month, 1-year, 2-year, or custom schedule will appear here." />
        ) : (
          <div className="divide-y divide-slate-100">
            {plans.map((plan) => {
              const balance = Number(plan.amount_required) - Number(plan.amount_paid);
              return (
                <div key={plan.id} className="px-5 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-bold text-navy">{plan.available_properties?.property_name ?? plan.group_pools?.name ?? plan.payment_category}</p>
                      <p className="mt-1 text-sm capitalize text-slate-500">{String(plan.purchase_model ?? "full_purchase").replace(/_/g, " ")} · {plan.term_months ?? 3} months · {plan.payment_category}</p>
                    </div>
                    <StatusBadge status={plan.status} />
                  </div>
                  <dl className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-4">
                    <PlanStat label="Required" value={fmtNGN(plan.amount_required)} />
                    <PlanStat label="Paid" value={fmtNGN(plan.amount_paid)} />
                    <PlanStat label="Balance" value={fmtNGN(Math.max(0, balance))} />
                    <PlanStat label="Next due" value={plan.next_due_date ? fmtDate(plan.next_due_date) : "Not scheduled"} />
                  </dl>
                  {plan.notes && <p className="mt-3 text-sm leading-6 text-slate-600">{plan.notes}</p>}
                </div>
              );
            })}
          </div>
        )}
      </DashCard>
    </div>
  );
}

function PlanStat({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-0.5 font-bold tabular-nums text-navy">{value}</dd></div>;
}
