export const fmtNaira = (n: number | null | undefined) =>
  `₦${Number(n || 0).toLocaleString("en-NG")}`;

export const fmtDate = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" }) : "—";

export const memberId = (n: number | null | undefined) =>
  n ? `KS-${String(n).padStart(5, "0")}` : "—";

export function getYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
  );
  return m ? m[1] : null;
}

export const statusPillClass = (status: string) => {
  const map: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-700 border-amber-500/40",
    active: "bg-emerald-500/10 text-emerald-700 border-emerald-500/40",
    approved: "bg-emerald-500/10 text-emerald-700 border-emerald-500/40",
    paid: "bg-emerald-600/10 text-emerald-800 border-emerald-600/40",
    completed: "bg-emerald-600/10 text-emerald-800 border-emerald-600/40",
    processing: "bg-sky-500/10 text-sky-700 border-sky-500/40",
    rejected: "bg-red-500/10 text-red-700 border-red-500/40",
    suspended: "bg-red-500/10 text-red-700 border-red-500/40",
    contacted: "bg-sky-500/10 text-sky-700 border-sky-500/40",
    closed: "bg-emerald-600/10 text-emerald-800 border-emerald-600/40",
    lost: "bg-red-500/10 text-red-700 border-red-500/40",
  };
  return `inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${
    map[status] || "bg-muted text-muted-foreground border-border"
  }`;
};
