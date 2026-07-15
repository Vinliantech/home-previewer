// Shared formatting + helper utilities for the affiliate portal + admin.

export const fmtNaira = (value: number | null | undefined): string => {
  const n = typeof value === "number" && Number.isFinite(value) ? value : 0;
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `₦${Math.round(n).toLocaleString()}`;
  }
};

export const fmtDate = (value: string | Date | null | undefined): string => {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const memberId = (n: number | null | undefined): string => {
  if (!n && n !== 0) return "KSA-—";
  return `KSA-${String(n).padStart(5, "0")}`;
};

export const statusPillClass = (status: string | null | undefined): string => {
  const s = (status ?? "").toLowerCase();
  if (["approved", "paid", "closed_won", "active", "completed"].includes(s))
    return "bg-emerald-100 text-emerald-800 border border-emerald-200";
  if (["pending", "in_review", "processing"].includes(s))
    return "bg-amber-100 text-amber-800 border border-amber-200";
  if (["rejected", "closed_lost", "cancelled", "failed"].includes(s))
    return "bg-rose-100 text-rose-800 border border-rose-200";
  return "bg-slate-100 text-slate-700 border border-slate-200";
};

export const getYouTubeId = (url: string | null | undefined): string | null => {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1) || null;
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const parts = u.pathname.split("/").filter(Boolean);
      const idx = parts.findIndex((p) => p === "embed" || p === "shorts");
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    }
    return null;
  } catch {
    return null;
  }
};
