import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

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
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-serif text-2xl font-bold text-navy sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function DashCard({
  title,
  description,
  children,
  className = "",
  noPadding = false,
  action,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
  action?: ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${
        noPadding ? "" : "p-5 sm:p-6"
      } ${className}`}
    >
      {(title || description || action) && (
        <header
          className={`flex flex-wrap items-start justify-between gap-3 ${
            noPadding ? "border-b border-slate-100 p-5 sm:p-6" : "mb-4"
          }`}
        >
          <div className="min-w-0">
            {title && <h2 className="font-serif text-lg font-bold text-navy">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div>{children}</div>
    </section>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className="mt-2 font-serif text-xl font-bold text-navy">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

const STATUS_TONE: Record<string, string> = {
  open: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  committed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  threshold_met: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  pending_approval: "bg-amber-50 text-amber-700 ring-amber-200",
  invited: "bg-amber-50 text-amber-700 ring-amber-200",
  closing: "bg-amber-50 text-amber-700 ring-amber-200",
  rejected: "bg-rose-50 text-rose-700 ring-rose-200",
  declined: "bg-rose-50 text-rose-700 ring-rose-200",
  cancelled: "bg-slate-100 text-slate-600 ring-slate-200",
  removed: "bg-slate-100 text-slate-600 ring-slate-200",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const tone = STATUS_TONE[status] ?? "bg-slate-100 text-slate-600 ring-slate-200";
  const text = label ?? String(status).replace(/_/g, " ");
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${tone}`}
    >
      {text}
    </span>
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
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 ring-1 ring-slate-200">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="font-bold text-navy">{title}</p>
        {body && <p className="mt-1 text-sm text-slate-500">{body}</p>}
      </div>
      {action}
    </div>
  );
}

export function fmtDate(input: string | null | undefined): string {
  if (!input) return "—";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return String(input);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
