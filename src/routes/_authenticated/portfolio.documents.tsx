/* Client → Documents: assigned documents delivered by the admin team. */
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Download, Eye, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isDemoActive } from "@/lib/demo";
import {
  DashCard,
  EmptyState,
  PageHeader,
  StatusBadge,
  fmtDate,
} from "@/components/portfolio/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* eslint-disable @typescript-eslint/no-explicit-any */
const sb = () => supabase as unknown as { from: (t: string) => any; rpc: any; storage: any; auth: typeof supabase.auth };
const BUCKET = "client-documents";

const CATEGORY_LABELS: Record<string, string> = {
  property: "Property documents",
  receipt: "Payment receipts",
  allocation_letter: "Allocation letters",
  agreement: "Investment agreements",
  spv: "SPV documents",
  share_certificate: "Share / ownership certificates",
  token_certificate: "Property-token certificates",
  kyc: "KYC documents",
  rental_statement: "Rental statements",
  return_statement: "Return statements",
  valuation: "Valuation reports",
  legal: "Legal documents",
  correspondence: "General correspondence",
  other: "Other",
};

export const Route = createFileRoute("/_authenticated/portfolio/documents")({
  component: ClientDocumentsPage,
});

async function fetchMyDocuments() {
  if (isDemoActive()) return { rows: [] as any[] };
  const { data: user } = await supabase.auth.getUser();
  const uid = user.user?.id;
  if (!uid) return { rows: [] };
  const { data, error } = await sb()
    .from("client_document_assignments")
    .select(
      `id, view_count, download_count, first_viewed_at, confirmed_at, created_at,
       document:client_documents!inner(
         id, title, description, category, related_property_id, issue_date, expiry_date,
         visibility, require_confirmation,
         current_version:client_document_versions!client_documents_current_version_fk(
           id, file_name, storage_path, mime_type, size_bytes, uploaded_at
         ),
         property:tokenized_properties(id, name, location)
       )`,
    )
    .eq("client_id", uid)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []).filter((r: any) => r.document?.visibility === "published");
  return { rows };
}

function ClientDocumentsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["client-documents"], queryFn: fetchMyDocuments });
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const rows = data?.rows ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r: any) => {
      if (cat !== "all" && r.document.category !== cat) return false;
      if (!q) return true;
      const hay = [
        r.document.title,
        r.document.description,
        r.document.property?.name,
        r.document.current_version?.file_name,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query, cat]);

  const unread = rows.filter((r: any) => !r.first_viewed_at).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description={
          unread > 0
            ? `${unread} new document${unread === 1 ? "" : "s"} to review.`
            : "Documents shared with your account by the Kay-Steph team."
        }
      />

      <DashCard title="My documents" noPadding description="Preview, download or confirm receipt of the files below.">
        <div className="grid gap-2 border-b border-slate-100 p-3 sm:grid-cols-[1fr_auto]">
          <Input
            placeholder="Search by title, property or filename…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="h-10 w-56" aria-label="Filter category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No documents yet"
            body="Documents shared with your account by the Kay-Steph team will appear here."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((r: any) => (
              <DocumentItem key={r.id} row={r} onChanged={() => qc.invalidateQueries({ queryKey: ["client-documents"] })} />
            ))}
          </ul>
        )}
      </DashCard>
    </div>
  );
}

function DocumentItem({ row, onChanged }: { row: any; onChanged: () => void }) {
  const doc = row.document;
  const v = doc.current_version;
  const isNew = !row.first_viewed_at;
  const [busy, setBusy] = useState<"view" | "download" | "confirm" | null>(null);

  async function logEvent(action: "view" | "download" | "confirm") {
    await sb().rpc("client_log_document_event", { _assignment_id: row.id, _action: action });
  }
  async function getUrl() {
    const { data, error } = await sb().storage.from(BUCKET).createSignedUrl(v.storage_path, 60);
    if (error || !data?.signedUrl) {
      toast.error(error?.message ?? "Could not open document");
      return null;
    }
    return data.signedUrl;
  }
  async function preview() {
    if (!v?.storage_path) return;
    setBusy("view");
    const url = await getUrl();
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      await logEvent("view");
      onChanged();
    }
    setBusy(null);
  }
  async function download() {
    if (!v?.storage_path) return;
    setBusy("download");
    const url = await getUrl();
    if (url) {
      const a = document.createElement("a");
      a.href = url;
      a.download = v.file_name;
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
      await logEvent("download");
      onChanged();
    }
    setBusy(null);
  }
  async function confirm() {
    setBusy("confirm");
    await logEvent("confirm");
    toast.success("Receipt confirmed");
    setBusy(null);
    onChanged();
  }

  return (
    <li className="p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium text-navy">{doc.title}</h3>
            {isNew && (
              <span className="inline-flex items-center rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-semibold text-gold-foreground">
                New
              </span>
            )}
            <StatusBadge status={CATEGORY_LABELS[doc.category] ? doc.category : "other"} label={CATEGORY_LABELS[doc.category] ?? "Other"} />
            {doc.require_confirmation && !row.confirmed_at && (
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                Confirmation required
              </span>
            )}
          </div>
          {doc.description && (
            <p className="mt-1 text-sm text-slate-600">{doc.description}</p>
          )}
          <div className="mt-1 text-xs text-slate-500">
            {v?.file_name}
            {doc.property?.name ? ` · ${doc.property.name}` : ""}
            {" · Issued "}
            {fmtDate(doc.issue_date ?? doc.created_at)}
            {doc.expiry_date ? ` · Expires ${fmtDate(doc.expiry_date)}` : ""}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={preview} disabled={busy !== null || !v?.storage_path}>
            {busy === "view" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Eye className="mr-1 h-4 w-4" />}
            Preview
          </Button>
          <Button
            size="sm"
            onClick={download}
            disabled={busy !== null || !v?.storage_path}
            className="rounded-full bg-navy font-bold text-white hover:bg-navy/90"
          >
            {busy === "download" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Download className="mr-1 h-4 w-4" />}
            Download
          </Button>
          {doc.require_confirmation && !row.confirmed_at && (
            <Button size="sm" variant="outline" onClick={confirm} disabled={busy !== null}>
              {busy === "confirm" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1 h-4 w-4" />}
              Confirm receipt
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}

// silence unused-import warnings when preview isn't rendered
void useEffect;
