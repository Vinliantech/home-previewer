import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Light-theme status badge tones for the banking dashboard. */
export function statusToneLight(status: string): string {
  if (
    [
      "approved",
      "verified",
      "active",
      "fully_funded",
      "completed",
      "acquired",
      "income_generating",
      "paid",
    ].includes(status)
  )
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (["rejected", "cancelled", "closed", "sold"].includes(status))
    return "border-rose-200 bg-rose-50 text-rose-700";
  if (
    [
      "pending",
      "submitted",
      "under_review",
      "payment_pending",
      "payment_received",
      "more_info",
      "reserved",
      "pending_approval",
      "pending_payment",
      "not_submitted",
      "draft",
    ].includes(status)
  )
    return "border-amber-200 bg-amber-50 text-amber-700";
  if (
    [
      "open",
      "partially_funded",
      "approved_for_listing",
      "buyer_found",
      "transfer_in_progress",
    ].includes(status)
  )
    return "border-sky-200 bg-sky-50 text-sky-700";
  return "border-slate-200 bg-slate-100 text-slate-600";
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        statusToneLight(status),
      )}
    >
      {label ?? status.replace(/_/g, " ")}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="font-serif text-2xl font-bold text-navy">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  subTone = "neutral",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  subTone?: "positive" | "negative" | "neutral";
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
          {label}
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy/5 text-navy">
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
      <div className="mt-2 font-serif text-2xl font-bold tabular-nums text-navy">{value}</div>
      {sub && (
        <div
          className={cn(
            "mt-1 text-xs font-medium",
            subTone === "positive" && "text-emerald-600",
            subTone === "negative" && "text-rose-600",
            subTone === "neutral" && "text-slate-500",
          )}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

export function DashCard({
  title,
  description,
  action,
  children,
  className,
  noPadding,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}) {
  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            {title && <h2 className="text-sm font-bold text-navy">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={noPadding ? "" : "p-5"}>{children}</div>
    </section>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-sm font-bold text-navy">{title}</h3>
      {body && <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function fmtDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function fmtDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
