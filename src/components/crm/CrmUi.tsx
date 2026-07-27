import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  gradeMeta,
  initials,
  sourceLabel,
  statusMeta,
  type LeadGrade,
  type LeadStatus,
} from "@/lib/crm";

export function CrmPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-[#dfe4df] pb-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        {eyebrow && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#b18432]">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 text-2xl font-semibold tracking-0 text-[#123d34] md:text-[28px]">
          {title}
        </h1>
        {description && <p className="mt-1.5 text-sm leading-6 text-[#63706b]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  change,
  changeLabel,
  attention = false,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  change?: number;
  changeLabel?: string;
  attention?: boolean;
}) {
  const positive = (change ?? 0) >= 0;
  return (
    <div className={cn("border bg-white p-4", attention ? "border-amber-300" : "border-[#dfe4df]")}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-[#68746f]">{label}</p>
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md",
            attention ? "bg-amber-50 text-amber-700" : "bg-[#edf4f1] text-[#0f5648]",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-[#173f36]">{value}</p>
      {(change !== undefined || changeLabel) && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#7b8581]">
          {change !== undefined && (
            <span
              className={cn(
                "flex items-center font-semibold",
                positive ? "text-emerald-700" : "text-rose-700",
              )}
            >
              {positive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {Math.abs(change)}%
            </span>
          )}
          {changeLabel && <span>{changeLabel}</span>}
        </div>
      )}
    </div>
  );
}

export function GradeBadge({ grade, compact = false }: { grade: LeadGrade; compact?: boolean }) {
  const meta = gradeMeta(grade);
  return (
    <span
      className={cn(
        "inline-flex items-center border font-semibold",
        compact ? "rounded px-1.5 py-0.5 text-[10px]" : "rounded-md px-2 py-1 text-xs",
        meta.tone,
      )}
    >
      Grade {grade}
      {compact ? "" : ` · ${meta.label}`}
    </span>
  );
}

export function StatusBadge({
  status,
  compact = false,
}: {
  status: LeadStatus;
  compact?: boolean;
}) {
  const meta = statusMeta(status);
  return (
    <span
      className={cn(
        "inline-flex items-center border font-medium",
        compact ? "rounded px-1.5 py-0.5 text-[10px]" : "rounded-md px-2 py-1 text-xs",
        meta.tone,
      )}
    >
      {compact ? meta.shortLabel : meta.label}
    </span>
  );
}

export function SourceBadge({ source }: { source: string | null | undefined }) {
  return (
    <span className="inline-flex rounded border border-[#dce3df] bg-[#f6f8f6] px-2 py-1 text-[10px] font-medium text-[#5e6a65]">
      {sourceLabel(source)}
    </span>
  );
}

export function AdviserAvatar({ name, compact = false }: { name: string; compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-[#dcebe5] font-semibold text-[#0b5748]",
          compact ? "h-6 w-6 text-[9px]" : "h-8 w-8 text-[10px]",
        )}
      >
        {initials(name)}
      </span>
      {!compact && <span className="text-xs font-medium text-[#41504a]">{name}</span>}
    </span>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border border-[#dfe4df] bg-white", className)}>
      {(title || description || action) && (
        <div className="flex items-start justify-between gap-4 border-b border-[#e5e9e6] px-4 py-3.5">
          <div>
            {title && <h2 className="text-sm font-semibold text-[#173f36]">{title}</h2>}
            {description && (
              <p className="mt-0.5 text-xs leading-5 text-[#7a8580]">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center px-6 py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf4f1] text-[#0f5648]">
        <Inbox className="h-5 w-5" />
      </span>
      <h3 className="mt-3 text-sm font-semibold text-[#173f36]">{title}</h3>
      <p className="mt-1 max-w-sm text-xs leading-5 text-[#7a8580]">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function CrmSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4" aria-label="Loading" role="status">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-12 animate-pulse rounded bg-[#eef1ef]" />
      ))}
    </div>
  );
}
