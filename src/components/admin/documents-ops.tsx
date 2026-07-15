/* Admin → Client Documents: upload, assign, replace, edit, archive, delete.
   Files land in the private `client-documents` bucket; downloads use short-lived
   signed URLs; every action is written to client_document_audit. */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Archive,
  ArchiveRestore,
  Download,
  Eye,
  FileText,
  History,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  UploadCloud,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { blockInDemo, demoSupportOps, isDemoActive } from "@/lib/demo";
import { DashCard, EmptyState, StatusBadge, fmtDate, fmtDateTime } from "@/components/portfolio/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = any;
const sb = () => supabase as unknown as { from: (t: string) => any; rpc: any; storage: any; auth: typeof supabase.auth };

const BUCKET = "client-documents";
const MAX_MB = 25;
const ACCEPT = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.xlsx,.csv";
const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
]);

const CATEGORIES: { value: string; label: string }[] = [
  { value: "property", label: "Property documents" },
  { value: "receipt", label: "Payment receipts" },
  { value: "allocation_letter", label: "Allocation letters" },
  { value: "agreement", label: "Investment agreements" },
  { value: "spv", label: "SPV documents" },
  { value: "share_certificate", label: "Share / ownership certificates" },
  { value: "token_certificate", label: "Property-token certificates" },
  { value: "kyc", label: "KYC documents" },
  { value: "rental_statement", label: "Rental statements" },
  { value: "return_statement", label: "Return statements" },
  { value: "valuation", label: "Valuation reports" },
  { value: "legal", label: "Legal documents" },
  { value: "correspondence", label: "General correspondence" },
  { value: "other", label: "Other" },
];
const catLabel = (v?: string) => CATEGORIES.find((c) => c.value === v)?.label ?? "Other";

/* ---------- small helpers ---------- */
function Th({ children }: { children: ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}
function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}
function Loading() {
  return (
    <div className="flex justify-center py-10">
      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
    </div>
  );
}
function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_");
}
function validateFile(f: File) {
  if (f.size > MAX_MB * 1024 * 1024) return `${f.name}: exceeds ${MAX_MB} MB limit.`;
  if (f.type && !ALLOWED_MIME.has(f.type)) return `${f.name}: file type not allowed.`;
  return null;
}
async function openSignedUrl(path: string) {
  const { data, error } = await sb().storage.from(BUCKET).createSignedUrl(path, 60);
  if (error || !data?.signedUrl) {
    toast.error(error?.message ?? "Could not generate download link");
    return null;
  }
  window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  return data.signedUrl;
}

/* ============================ MAIN MODULE ============================ */
export function DocumentsModule() {
  const demo = isDemoActive();
  const [docs, setDocs] = useState<Row[]>([]);
  const [clients, setClients] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [visFilter, setVisFilter] = useState("active");
  const [openUpload, setOpenUpload] = useState(false);
  const [historyDoc, setHistoryDoc] = useState<Row | null>(null);
  const [editDoc, setEditDoc] = useState<Row | null>(null);

  async function load() {
    setLoading(true);
    if (demo) {
      // Map legacy demo docs into the new shape so the table renders.
      setDocs(
        demoSupportOps.documents.map((d: Row, i: number) => ({
          id: d.id,
          title: d.file_name,
          description: null,
          category: d.document_type ?? "other",
          visibility: d.approval_status === "pending" ? "draft" : "published",
          issue_date: d.created_at,
          expiry_date: null,
          created_at: d.created_at,
          updated_at: d.created_at,
          current_version: { version_no: 1, file_name: d.file_name, storage_path: "", mime_type: null },
          assignments: [
            {
              id: `demo-a-${i}`,
              client_id: d.user_id,
              view_count: 0,
              download_count: 0,
              first_viewed_at: null,
              confirmed_at: null,
              profile: d.profiles ?? null,
            },
          ],
        })),
      );
      setClients([]);
      setLoading(false);
      return;
    }
    const [{ data: docRows }, { data: profs }] = await Promise.all([
      sb()
        .from("client_documents")
        .select(
          `id, title, description, category, related_property_id, related_investment_id,
           issue_date, expiry_date, visibility, require_confirmation,
           current_version:client_document_versions!client_documents_current_version_fk(
             id, version_no, storage_path, file_name, mime_type, size_bytes, uploaded_at
           ),
           assignments:client_document_assignments(
             id, client_id, view_count, download_count, first_viewed_at, last_downloaded_at,
             confirmed_at, notified_at, notify_email, notify_sms, notify_whatsapp
           ),
           created_at, updated_at`,
        )
        .order("created_at", { ascending: false }),
      sb().from("profiles").select("id, user_id, full_name, email").order("full_name"),
    ]);
    const profList = profs ?? [];
    const rows = (docRows ?? []).map((d: Row) => ({
      ...d,
      assignments: (d.assignments ?? []).map((a: Row) => ({
        ...a,
        profile: profList.find((p: Row) => p.user_id === a.client_id) ?? null,
      })),
    }));
    setDocs(rows);
    setClients(profList);
    setLoading(false);
  }
  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs.filter((d) => {
      if (catFilter !== "all" && d.category !== catFilter) return false;
      if (visFilter === "active" && d.visibility === "archived") return false;
      if (visFilter !== "all" && visFilter !== "active" && d.visibility !== visFilter) return false;
      if (!q) return true;
      const hay = [
        d.title,
        d.description,
        d.current_version?.file_name,
        ...((d.assignments ?? []).map((a: Row) => `${a.profile?.full_name ?? ""} ${a.profile?.email ?? ""}`)),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [docs, query, catFilter, visFilter]);

  return (
    <div className="space-y-4">
      <DashCard
        title="Client documents"
        description="Upload, assign and manage documents delivered to specific client accounts."
        noPadding
        action={
          <Button
            onClick={() => {
              if (blockInDemo()) return;
              setOpenUpload(true);
            }}
            className="rounded-full bg-navy font-bold text-white hover:bg-navy/90"
            size="sm"
          >
            <UploadCloud className="mr-1.5 h-4 w-4" /> Upload document
          </Button>
        }
      >
        <div className="grid gap-2 border-b border-slate-100 p-3 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by title, description or client…"
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="h-10 w-48" aria-label="Filter category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={visFilter} onValueChange={setVisFilter}>
            <SelectTrigger className="h-10 w-40" aria-label="Filter visibility">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <Loading />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No documents"
            body="Click Upload document to send the first document to a client."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 960 }}>
              <thead>
                <tr className="border-b border-slate-100">
                  <Th>Title</Th>
                  <Th>Category</Th>
                  <Th>Assigned to</Th>
                  <Th>Version</Th>
                  <Th>Issued</Th>
                  <Th>Status</Th>
                  <Th>Engagement</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <DocRow
                    key={d.id}
                    doc={d}
                    onChanged={load}
                    onHistory={() => setHistoryDoc(d)}
                    onEdit={() => setEditDoc(d)}
                    clients={clients}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashCard>

      <UploadDialog
        open={openUpload}
        onOpenChange={setOpenUpload}
        clients={clients}
        onDone={load}
      />
      <HistoryDialog doc={historyDoc} onOpenChange={(v) => !v && setHistoryDoc(null)} />
      <EditDialog doc={editDoc} onOpenChange={(v) => !v && setEditDoc(null)} onDone={load} />
    </div>
  );
}

/* ============================ ROW ============================ */
function DocRow({
  doc,
  clients,
  onChanged,
  onHistory,
  onEdit,
}: {
  doc: Row;
  clients: Row[];
  onChanged: () => void;
  onHistory: () => void;
  onEdit: () => void;
}) {
  const [replacing, setReplacing] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const v = doc.current_version;
  const assignments: Row[] = doc.assignments ?? [];
  const views = assignments.reduce((s, a) => s + (a.view_count || 0), 0);
  const downloads = assignments.reduce((s, a) => s + (a.download_count || 0), 0);
  const firstAssignment = assignments[0];
  const assignedLabel =
    assignments.length === 0
      ? "Unassigned"
      : assignments.length === 1
        ? firstAssignment?.profile?.full_name ?? firstAssignment?.profile?.email ?? "1 client"
        : `${assignments.length} clients`;

  async function replaceFile(file: File) {
    if (blockInDemo()) return;
    const err = validateFile(file);
    if (err) return toast.error(err);
    setReplacing(true);
    try {
      const path = `${doc.id}/v${Date.now()}-${safeName(file.name)}`;
      const { error: upErr } = await sb().storage.from(BUCKET).upload(path, file, {
        contentType: file.type || undefined,
        upsert: false,
      });
      if (upErr) throw upErr;
      const { error } = await sb().rpc("admin_replace_document_file", {
        _doc_id: doc.id,
        _storage_path: path,
        _file_name: file.name,
        _mime: file.type || null,
        _size: file.size,
      });
      if (error) throw error;
      toast.success("File replaced");
      onChanged();
    } catch (e: any) {
      toast.error(e.message ?? "Replace failed");
    } finally {
      setReplacing(false);
    }
  }
  async function setVisibility(vis: "published" | "draft" | "archived") {
    if (blockInDemo()) return;
    const { error } = await sb().rpc("admin_set_document_visibility", {
      _doc_id: doc.id,
      _visibility: vis,
    });
    if (error) return toast.error(error.message);
    toast.success(`Document ${vis}`);
    onChanged();
  }
  async function del() {
    if (blockInDemo()) return;
    if (!window.confirm(`Delete "${doc.title}"? This removes it from every assigned client.`)) return;
    const { error } = await sb().rpc("admin_delete_document", { _doc_id: doc.id });
    if (error) return toast.error(error.message);
    toast.success("Document deleted");
    onChanged();
  }
  async function resendNotifications() {
    if (blockInDemo()) return;
    await notifyClients(
      doc,
      assignments.map((a) => a.client_id),
      clients,
    );
    onChanged();
  }

  return (
    <>
      <tr className="border-b border-slate-50 last:border-0">
        <Td>
          <div className="font-medium text-navy">{doc.title}</div>
          {doc.description && (
            <div className="line-clamp-1 text-xs text-slate-500">{doc.description}</div>
          )}
          <div className="mt-0.5 text-[11px] text-slate-400">
            {v?.file_name} · {v?.mime_type ?? "file"}
          </div>
        </Td>
        <Td className="text-slate-600">{catLabel(doc.category)}</Td>
        <Td>
          <button
            className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-navy"
            onClick={() => setAssignOpen(true)}
          >
            <Users className="h-3.5 w-3.5 text-slate-400" /> {assignedLabel}
          </button>
        </Td>
        <Td className="text-slate-500">v{v?.version_no ?? 1}</Td>
        <Td className="text-slate-500">{fmtDate(doc.issue_date ?? doc.created_at)}</Td>
        <Td>
          <StatusBadge status={doc.visibility} />
        </Td>
        <Td className="text-xs text-slate-500">
          <div>
            <Eye className="mr-1 inline h-3 w-3" />
            {views} view{views === 1 ? "" : "s"}
          </div>
          <div>
            <Download className="mr-1 inline h-3 w-3" />
            {downloads}
          </div>
        </Td>
        <Td>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              disabled={!v?.storage_path}
              onClick={() => v?.storage_path && openSignedUrl(v.storage_path)}
              title="Download"
            >
              <Download className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost">
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem asChild>
                  <label className="flex cursor-pointer items-center gap-2">
                    <RefreshCw className="h-4 w-4" /> Replace file
                    <input
                      type="file"
                      accept={ACCEPT}
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void replaceFile(f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAssignOpen(true)}>
                  <Users className="mr-2 h-4 w-4" /> Manage assignments
                </DropdownMenuItem>
                <DropdownMenuItem onClick={resendNotifications}>
                  <Send className="mr-2 h-4 w-4" /> Resend notifications
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onHistory}>
                  <History className="mr-2 h-4 w-4" /> Version history
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {doc.visibility === "archived" ? (
                  <DropdownMenuItem onClick={() => setVisibility("published")}>
                    <ArchiveRestore className="mr-2 h-4 w-4" /> Unarchive
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => setVisibility("archived")}>
                    <Archive className="mr-2 h-4 w-4" /> Archive
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="text-rose-600" onClick={del}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {replacing && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
          </div>
        </Td>
      </tr>
      <AssignmentsDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        doc={doc}
        clients={clients}
        onDone={onChanged}
      />
    </>
  );
}

/* ============================ NOTIFY HELPER ============================ */
async function notifyClients(doc: Row, clientIds: string[], clients: Row[]) {
  if (clientIds.length === 0) return;
  const title = "New document available";
  const message = `A new document has been added to your Kay-Steph account: ${doc.title}. Sign in to your client portal to review or download it.`;
  const rows = clientIds.map((cid) => ({
    investor_id: cid,
    title,
    message,
    category: "document",
    link: "/portfolio/documents",
  }));
  const { error } = await sb().from("investor_notifications").insert(rows);
  if (error) {
    toast.error(error.message);
    return;
  }
  await sb().rpc("admin_mark_document_notified", { _doc_id: doc.id, _client_ids: clientIds });
  const emailWanted = clients.some((c) => clientIds.includes(c.user_id));
  toast.success(
    `Notification sent to ${clientIds.length} client${clientIds.length === 1 ? "" : "s"}${
      emailWanted ? " (in-app; email/SMS pending channel setup)" : ""
    }`,
  );
}

/* ============================ UPLOAD DIALOG ============================ */
function UploadDialog({
  open,
  onOpenChange,
  clients,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clients: Row[];
  onDone: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [visibility, setVisibility] = useState<"published" | "draft">("published");
  const [requireConfirm, setRequireConfirm] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(false);
  const [notifyWa, setNotifyWa] = useState(false);
  const [saving, setSaving] = useState(false);
  const [properties, setProperties] = useState<Row[]>([]);
  const [propertyId, setPropertyId] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setTitle("");
    setDescription("");
    setCategory("other");
    setIssueDate(new Date().toISOString().slice(0, 10));
    setExpiryDate("");
    setVisibility("published");
    setRequireConfirm(false);
    setSelected([]);
    setSearch("");
    setNotifyEmail(true);
    setNotifySms(false);
    setNotifyWa(false);
    setPropertyId("");
    (async () => {
      const { data } = await sb()
        .from("tokenized_properties")
        .select("id, name, location")
        .order("name");
      setProperties(data ?? []);
    })();
  }, [open]);

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients.slice(0, 30);
    return clients.filter((c) =>
      `${c.full_name ?? ""} ${c.email ?? ""}`.toLowerCase().includes(q),
    );
  }, [clients, search]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function submit() {
    if (blockInDemo()) return;
    if (!file) return toast.error("Choose a file to upload.");
    const err = validateFile(file);
    if (err) return toast.error(err);
    if (!title.trim()) return toast.error("Add a document title.");
    if (selected.length === 0) return toast.error("Assign the document to at least one client.");
    setSaving(true);
    try {
      // Upload placeholder path first, then rename via docId prefix after RPC creates doc.
      // Simpler: use a temp id-less path, then insert doc + version pointing to the same path.
      const tempId = crypto.randomUUID();
      const path = `${tempId}/v1-${safeName(file.name)}`;
      const { error: upErr } = await sb().storage.from(BUCKET).upload(path, file, {
        contentType: file.type || undefined,
        upsert: false,
      });
      if (upErr) throw upErr;
      const { data: docId, error: rpcErr } = await sb().rpc("admin_create_document", {
        _title: title.trim(),
        _description: description.trim() || null,
        _category: category,
        _related_property_id: propertyId || null,
        _related_investment_id: null,
        _issue_date: issueDate || null,
        _expiry_date: expiryDate || null,
        _visibility: visibility,
        _require_confirmation: requireConfirm,
        _storage_path: path,
        _file_name: file.name,
        _mime: file.type || null,
        _size: file.size,
      });
      if (rpcErr) throw rpcErr;
      const { error: assignErr } = await sb().rpc("admin_assign_document", {
        _doc_id: docId,
        _client_ids: selected,
        _notify_email: notifyEmail,
        _notify_sms: notifySms,
        _notify_whatsapp: notifyWa,
      });
      if (assignErr) throw assignErr;
      if (visibility === "published") {
        await notifyClients({ id: docId, title: title.trim() }, selected, clients);
      }
      toast.success("Document uploaded and assigned");
      onOpenChange(false);
      onDone();
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload document</DialogTitle>
          <DialogDescription>
            Files are stored in secure private storage and delivered only to the clients you select.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* File */}
          <div className="space-y-2">
            <Label>File</Label>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 hover:border-navy/40">
              <div className="flex items-center gap-3">
                <UploadCloud className="h-5 w-5 text-slate-400" />
                <div className="text-sm">
                  {file ? (
                    <>
                      <div className="font-medium text-navy">{file.name}</div>
                      <div className="text-xs text-slate-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB · {file.type || "unknown type"}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="font-medium text-navy">Choose a file</div>
                      <div className="text-xs text-slate-500">
                        PDF, DOC, DOCX, JPG, PNG, WEBP, XLSX, CSV · up to {MAX_MB} MB
                      </div>
                    </>
                  )}
                </div>
              </div>
              <span className="rounded-full bg-navy px-3 py-1 text-xs font-semibold text-white">
                Browse
              </span>
              <input
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {/* Details */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Allocation letter for Plot A013" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Related property (optional)</Label>
              <Select value={propertyId || "none"} onValueChange={(v) => setPropertyId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Issue date</Label>
              <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Expiry date (optional)</Label>
              <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Short description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select value={visibility} onValueChange={(v: any) => setVisibility(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Published (visible to client)</SelectItem>
                  <SelectItem value="draft">Draft (hidden from client)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2">
                <Switch id="req-confirm" checked={requireConfirm} onCheckedChange={setRequireConfirm} />
                <Label htmlFor="req-confirm" className="text-sm">Require client confirmation</Label>
              </div>
            </div>
          </div>

          {/* Assign */}
          <div className="space-y-2">
            <Label>Assign to clients</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search clients by name or email…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selected.map((id) => {
                  const c = clients.find((x) => x.user_id === id);
                  return (
                    <span key={id} className="inline-flex items-center gap-1 rounded-full bg-navy/10 px-2 py-0.5 text-xs text-navy">
                      {c?.full_name ?? c?.email ?? id.slice(0, 8)}
                      <button onClick={() => toggle(id)} type="button" className="text-navy/60 hover:text-rose-600">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            <div className="max-h-40 overflow-y-auto rounded-md border border-slate-200">
              {filteredClients.length === 0 ? (
                <div className="p-3 text-xs text-slate-500">No clients match.</div>
              ) : (
                filteredClients.map((c) => (
                  <label
                    key={c.user_id}
                    className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-3 py-2 last:border-0 hover:bg-slate-50"
                  >
                    <Checkbox
                      checked={selected.includes(c.user_id)}
                      onCheckedChange={() => toggle(c.user_id)}
                    />
                    <div className="min-w-0 flex-1 text-sm">
                      <div className="truncate font-medium text-navy">{c.full_name ?? "—"}</div>
                      <div className="truncate text-xs text-slate-500">{c.email}</div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="space-y-2 rounded-md border border-slate-200 p-3">
            <Label>Notify client</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={notifyEmail} onCheckedChange={(v) => setNotifyEmail(!!v)} /> Email
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={notifySms} onCheckedChange={(v) => setNotifySms(!!v)} /> SMS
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={notifyWa} onCheckedChange={(v) => setNotifyWa(!!v)} /> WhatsApp
              </label>
            </div>
            <p className="text-[11px] text-slate-500">
              In-app notifications are always sent. Email, SMS and WhatsApp deliver when the matching channel is configured.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={saving}
            className="rounded-full bg-navy font-bold text-white hover:bg-navy/90"
          >
            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
            Publish document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============================ ASSIGNMENTS DIALOG ============================ */
function AssignmentsDialog({
  open,
  onOpenChange,
  doc,
  clients,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  doc: Row;
  clients: Row[];
  onDone: () => void;
}) {
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const existing: Row[] = doc.assignments ?? [];
  const existingIds = existing.map((a) => a.client_id);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients
      .filter((c) => !existingIds.includes(c.user_id))
      .filter((c) => !q || `${c.full_name ?? ""} ${c.email ?? ""}`.toLowerCase().includes(q))
      .slice(0, 30);
  }, [clients, search, existingIds]);
  const [toAdd, setToAdd] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setToAdd([]);
      setSearch("");
    }
  }, [open]);

  async function addSelected() {
    if (blockInDemo()) return;
    if (toAdd.length === 0) return;
    setSaving(true);
    const { error } = await sb().rpc("admin_assign_document", {
      _doc_id: doc.id,
      _client_ids: toAdd,
      _notify_email: true,
      _notify_sms: false,
      _notify_whatsapp: false,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    if (doc.visibility === "published") await notifyClients(doc, toAdd, clients);
    toast.success("Clients added");
    setToAdd([]);
    onDone();
  }
  async function remove(assignmentId: string) {
    if (blockInDemo()) return;
    if (!window.confirm("Remove this client's access to the document?")) return;
    const { error } = await sb().rpc("admin_unassign_document", { _assignment_id: assignmentId });
    if (error) return toast.error(error.message);
    toast.success("Assignment removed");
    onDone();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assignments — {doc.title}</DialogTitle>
          <DialogDescription>Manage which clients can see this document.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs uppercase text-slate-500">Currently assigned</Label>
            {existing.length === 0 ? (
              <p className="mt-1 text-sm text-slate-500">No clients yet.</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {existing.map((a) => (
                  <li key={a.id} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 text-sm">
                    <div>
                      <div className="font-medium text-navy">{a.profile?.full_name ?? "—"}</div>
                      <div className="text-xs text-slate-500">
                        {a.profile?.email} · {a.view_count} view{a.view_count === 1 ? "" : "s"} · {a.download_count} download{a.download_count === 1 ? "" : "s"}
                        {a.confirmed_at ? ` · confirmed ${fmtDate(a.confirmed_at)}` : ""}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => remove(a.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="space-y-2">
            <Label>Add more clients</Label>
            <Input
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="max-h-48 overflow-y-auto rounded-md border border-slate-200">
              {filtered.length === 0 ? (
                <div className="p-3 text-xs text-slate-500">No new clients match.</div>
              ) : (
                filtered.map((c) => (
                  <label
                    key={c.user_id}
                    className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-3 py-2 last:border-0 hover:bg-slate-50"
                  >
                    <Checkbox
                      checked={toAdd.includes(c.user_id)}
                      onCheckedChange={() =>
                        setToAdd((p) => (p.includes(c.user_id) ? p.filter((x) => x !== c.user_id) : [...p, c.user_id]))
                      }
                    />
                    <div className="min-w-0 flex-1 text-sm">
                      <div className="truncate font-medium text-navy">{c.full_name ?? "—"}</div>
                      <div className="truncate text-xs text-slate-500">{c.email}</div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
          <Button
            onClick={addSelected}
            disabled={saving || toAdd.length === 0}
            className="rounded-full bg-navy font-bold text-white hover:bg-navy/90"
          >
            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
            Add {toAdd.length > 0 ? toAdd.length : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============================ EDIT DIALOG ============================ */
function EditDialog({
  doc,
  onOpenChange,
  onDone,
}: {
  doc: Row | null;
  onOpenChange: (v: boolean) => void;
  onDone: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [requireConfirm, setRequireConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!doc) return;
    setTitle(doc.title ?? "");
    setDescription(doc.description ?? "");
    setCategory(doc.category ?? "other");
    setIssueDate(doc.issue_date ?? "");
    setExpiryDate(doc.expiry_date ?? "");
    setRequireConfirm(!!doc.require_confirmation);
  }, [doc]);

  async function save() {
    if (!doc || blockInDemo()) return;
    setSaving(true);
    const { error } = await sb().rpc("admin_edit_document", {
      _doc_id: doc.id,
      _title: title.trim(),
      _description: description.trim() || null,
      _category: category,
      _related_property_id: doc.related_property_id ?? null,
      _related_investment_id: doc.related_investment_id ?? null,
      _issue_date: issueDate || null,
      _expiry_date: expiryDate || null,
      _require_confirmation: requireConfirm,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Document updated");
    onOpenChange(false);
    onDone();
  }

  return (
    <Dialog open={!!doc} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit document</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Issue date</Label>
              <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Expiry date</Label>
              <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={requireConfirm} onCheckedChange={setRequireConfirm} />
                Require confirmation
              </label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button
            onClick={save}
            disabled={saving}
            className="rounded-full bg-navy font-bold text-white hover:bg-navy/90"
          >
            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============================ HISTORY DIALOG ============================ */
function HistoryDialog({
  doc,
  onOpenChange,
}: {
  doc: Row | null;
  onOpenChange: (v: boolean) => void;
}) {
  const [versions, setVersions] = useState<Row[]>([]);
  const [audit, setAudit] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!doc) return;
    setLoading(true);
    Promise.all([
      sb().from("client_document_versions").select("*").eq("document_id", doc.id).order("version_no", { ascending: false }),
      sb().from("client_document_audit").select("*").eq("document_id", doc.id).order("created_at", { ascending: false }).limit(100),
    ]).then(([v, a]) => {
      setVersions(v.data ?? []);
      setAudit(a.data ?? []);
      setLoading(false);
    });
  }, [doc]);

  return (
    <Dialog open={!!doc} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Version history</DialogTitle>
          <DialogDescription>{doc?.title}</DialogDescription>
        </DialogHeader>
        {loading ? (
          <Loading />
        ) : (
          <div className="space-y-6">
            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase text-slate-500">File versions</h4>
              {versions.length === 0 ? (
                <p className="text-sm text-slate-500">No versions yet.</p>
              ) : (
                <ul className="space-y-1">
                  {versions.map((v) => (
                    <li key={v.id} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 text-sm">
                      <div>
                        <div className="font-medium text-navy">v{v.version_no} · {v.file_name}</div>
                        <div className="text-xs text-slate-500">
                          {fmtDateTime(v.uploaded_at)} · {v.mime_type ?? "file"} · {v.size_bytes ? `${(v.size_bytes / 1024).toFixed(0)} KB` : "—"}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => openSignedUrl(v.storage_path)}>
                        <Download className="mr-1 h-4 w-4" /> Download
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase text-slate-500">Audit log</h4>
              {audit.length === 0 ? (
                <p className="text-sm text-slate-500">No events.</p>
              ) : (
                <ul className="space-y-1 text-xs">
                  {audit.map((a) => (
                    <li key={a.id} className="flex items-start gap-3 border-b border-slate-50 py-1.5 last:border-0">
                      <span className="w-32 shrink-0 text-slate-500">{fmtDateTime(a.created_at)}</span>
                      <StatusBadge status={a.action} />
                      <span className="text-slate-500">
                        {a.meta && Object.keys(a.meta).length > 0 ? JSON.stringify(a.meta) : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
