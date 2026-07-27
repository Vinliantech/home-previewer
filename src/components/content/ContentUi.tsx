import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { FileText, UserRound } from "lucide-react";
import { contentStatusClass, contentStatusLabel, type ContentPostStatus } from "@/lib/content";

export function ContentPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-[#dfe5e2] pb-5 xl:flex-row xl:items-end xl:justify-between">
      <div className="max-w-3xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a77725]">{eyebrow}</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight text-[#173e35] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6d7974]">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function ContentPanel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`border border-[#dfe5e2] bg-white ${className}`}>
      {(title || description || action) && (
        <div className="flex items-start justify-between gap-4 border-b border-[#e7ebe9] px-4 py-3.5 sm:px-5">
          <div>
            {title && <h2 className="font-serif text-lg font-semibold text-[#21443b]">{title}</h2>}
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

export function ContentStat({
  icon: Icon,
  label,
  value,
  detail,
  tone = "green",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  detail: string;
  tone?: "green" | "gold" | "blue" | "rose";
}) {
  const tones = {
    green: "bg-[#edf6f2] text-[#17624f]",
    gold: "bg-[#fff6df] text-[#9a6818]",
    blue: "bg-[#eef4fb] text-[#315f8c]",
    rose: "bg-[#fff0f2] text-[#a33d51]",
  };
  return (
    <div className="border border-[#dfe5e2] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium text-[#67756f]">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-md ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-4 font-serif text-3xl font-semibold text-[#173e35]">{value}</p>
      <p className="mt-1 text-[10px] text-[#87918d]">{detail}</p>
    </div>
  );
}

export function ContentStatusBadge({ status }: { status: ContentPostStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] ${contentStatusClass(status)}`}
    >
      {contentStatusLabel(status)}
    </span>
  );
}

export function ContentAvatar({ name, imageUrl }: { name: string; imageUrl?: string | null }) {
  if (imageUrl) {
    return <img src={imageUrl} alt="" className="h-9 w-9 rounded-full object-cover" />;
  }
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e5f0ec] text-[10px] font-bold text-[#185545]">
      {initials || <UserRound className="h-4 w-4" />}
    </span>
  );
}

export function ContentEmpty({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#edf4f1] text-[#35675a]">
        <FileText className="h-5 w-5" />
      </span>
      <h3 className="mt-4 font-serif text-lg font-semibold text-[#21443b]">{title}</h3>
      <p className="mt-1 max-w-md text-xs leading-5 text-[#7b8782]">{body}</p>
    </div>
  );
}
