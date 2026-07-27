/* Support & system admin modules: Support Tickets, Documents, User Roles
   — bank-UI, self-loading (demo or Supabase). */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Loader2,
  Send,
  ShieldCheck,
  Trash2,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_HINTS, roleLabel, type StaffRole } from "@/lib/roles";
import { clientNumber } from "@/lib/client-number";
import {
  DashCard,
  EmptyState,
  StatusBadge,
  fmtDate,
  fmtDateTime,
} from "@/components/portfolio/kit";
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;
const sb = () => supabase as unknown as { from: (t: string) => any; auth: typeof supabase.auth }; // eslint-disable-line @typescript-eslint/no-explicit-any

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
function TableShell({
  head,
  children,
  min = 720,
}: {
  head: ReactNode;
  children: ReactNode;
  min?: number;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ minWidth: min }}>
        <thead>
          <tr className="border-b border-slate-100">{head}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
function Loading() {
  return (
    <div className="flex justify-center py-10">
      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
    </div>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

/* ============================ SUPPORT TICKETS ============================ */
const TICKET_STATUSES = ["open", "in_progress", "resolved", "closed"];

export function SupportModule() {
  const [tickets, setTickets] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [active, setActive] = useState<Row | null>(null);
  const [messages, setMessages] = useState<Row[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  async function loadTickets() {
    setLoading(true);
    const { data } = await sb()
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });
    const ids = [...new Set((data ?? []).map((t: Row) => t.user_id))];
    let profs: Row[] = [];
    if (ids.length) {
      const { data: p } = await sb()
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", ids);
      profs = p ?? [];
    }
    setTickets(
      (data ?? []).map((t: Row) => {
        const p = profs.find((x) => x.user_id === t.user_id);
        return { ...t, user_name: p?.full_name, user_email: p?.email };
      }),
    );
    setLoading(false);
  }
  useEffect(() => {
    loadTickets();
  }, []);

  async function openTicket(t: Row) {
    setActive(t);
    setReply("");
    const { data } = await sb()
      .from("ticket_messages")
      .select("*")
      .eq("ticket_id", t.id)
      .order("created_at");
    setMessages(data ?? []);
  }
  async function send() {
    if (!active || !reply.trim()) return;
    setSending(true);
    const { data: auth } = await sb().auth.getUser();
    const { error } = await sb()
      .from("ticket_messages")
      .insert({
        ticket_id: active.id,
        sender_id: auth?.user?.id ?? null,
        message: reply.trim(),
        is_internal: false,
      });
    setSending(false);
    if (error) return void toast.error(error.message);
    setReply("");
    openTicket(active);
  }
  async function setStatus(t: Row, status: string) {
    const { error } = await sb().from("support_tickets").update({ status }).eq("id", t.id);
    if (error) return void toast.error(error.message);
    toast.success(`Ticket ${status.replace(/_/g, " ")}`);
    if (active?.id === t.id) setActive({ ...active, status });
    loadTickets();
  }

  const filtered = useMemo(
    () => tickets.filter((t) => statusFilter === "all" || t.status === statusFilter),
    [tickets, statusFilter],
  );

  if (active) {
    return (
      <DashCard
        title={active.subject}
        description={`${active.user_name ?? "Client"} · ${active.category} · ${active.priority} priority`}
        action={
          <div className="flex items-center gap-2">
            <Select value={active.status} onValueChange={(v) => setStatus(active, v)}>
              <SelectTrigger className="h-9 w-36" aria-label="Ticket status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TICKET_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => setActive(null)}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {messages.map((m) => {
            const fromClient = m.sender_id === active.user_id;
            return (
              <div key={m.id} className={`flex ${fromClient ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    fromClient ? "bg-slate-100 text-slate-700" : "bg-navy text-white"
                  }`}
                >
                  <div className="mb-0.5 text-[11px] font-semibold opacity-70">
                    {m.sender_name ?? (fromClient ? "Client" : "Support")}
                  </div>
                  {m.message}
                  <div className="mt-1 text-[10px] opacity-60">{fmtDateTime(m.created_at)}</div>
                </div>
              </div>
            );
          })}
          {messages.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500">No messages yet.</p>
          )}
        </div>
        <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
          <Input
            placeholder="Type a reply…"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <Button
            onClick={send}
            disabled={sending}
            className="bg-gold font-bold text-gold-foreground hover:bg-gold/90"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </DashCard>
    );
  }

  return (
    <DashCard
      title="Support tickets"
      description="Client support conversations."
      noPadding
      action={
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-36" aria-label="Filter status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {TICKET_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <EmptyState icon={FileText} title="No tickets" body="Client support tickets appear here." />
      ) : (
        <TableShell
          head={
            <>
              <Th>Subject</Th>
              <Th>Client</Th>
              <Th>Category</Th>
              <Th>Priority</Th>
              <Th>Status</Th>
              <Th>Opened</Th>
              <Th>{null}</Th>
            </>
          }
        >
          {filtered.map((t) => (
            <tr
              key={t.id}
              className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50"
              onClick={() => openTicket(t)}
            >
              <Td className="font-medium text-navy">{t.subject}</Td>
              <Td className="text-slate-600">{t.user_name ?? "—"}</Td>
              <Td className="capitalize text-slate-600">{t.category}</Td>
              <Td>
                <StatusBadge
                  status={t.priority === "urgent" || t.priority === "high" ? "pending" : "active"}
                  label={t.priority}
                />
              </Td>
              <Td>
                <StatusBadge status={t.status} />
              </Td>
              <Td className="text-slate-500">{fmtDate(t.created_at)}</Td>
              <Td>
                <Button size="sm" variant="outline">
                  Open
                </Button>
              </Td>
            </tr>
          ))}
        </TableShell>
      )}
    </DashCard>
  );
}

/**
 * client-documents is a private bucket, so rows hold a storage path rather than
 * a URL. Older rows may hold a full URL; both are handled.
 */
async function openClientDocument(row: { storage_path?: string | null; file_url?: string | null }) {
  const reference = row.storage_path || row.file_url;
  if (!reference) return toast.error("This document has no file attached.");
  if (/^https?:\/\//i.test(reference)) {
    window.open(reference, "_blank", "noopener,noreferrer");
    return;
  }
  const { data, error } = await supabase.storage
    .from("client-documents")
    .createSignedUrl(reference, 60);
  if (error || !data) return toast.error("That document could not be opened.");
  window.open(data.signedUrl, "_blank", "noopener,noreferrer");
}

const ADMIN_DOCUMENT_KINDS = [
  { value: "invoice", label: "Payment invoice" },
  { value: "receipt", label: "Receipt" },
  { value: "allocation_letter", label: "Allocation letter" },
  { value: "contract", label: "Contract" },
  { value: "other", label: "Other document" },
];

/**
 * Issuing a document to a client. Uploaded straight to approved: it comes from
 * Kay-Steph, so there is nobody left to review it, and it should appear on the
 * client's account immediately.
 */
function AdminDocumentUpload({ clients, onUploaded }: { clients: Row[]; onUploaded: () => void }) {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [kind, setKind] = useState("invoice");
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    if (!userId) return toast.error("Choose the client this document belongs to.");
    setBusy(true);
    try {
      // Filed under the client's folder so their own read policy can reach it.
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${userId}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("client-documents")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: auth } = await sb().auth.getUser();
      const { error: rowError } = await sb()
        .from("documents")
        .insert({
          user_id: userId,
          document_type: kind,
          file_name: file.name,
          file_url: path,
          storage_path: path,
          uploaded_by: auth?.user?.id ?? null,
          approval_status: "approved",
          approved_by: auth?.user?.id ?? null,
          approved_at: new Date().toISOString(),
        });
      if (rowError) throw rowError;

      toast.success("Document issued to the client");
      setOpen(false);
      setUserId("");
      onUploaded();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The upload failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div className="border-b border-slate-100 px-4 py-3">
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          Issue a document to a client
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-4">
      <Field label="Client">
        <Select value={userId} onValueChange={setUserId}>
          <SelectTrigger className="h-9 w-64" aria-label="Client">
            <SelectValue placeholder="Choose a client" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.user_id} value={client.user_id}>
                {client.full_name || client.email}
                {client.client_number ? ` · ${clientNumber(client.client_number)}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Type">
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="h-9 w-48" aria-label="Document type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ADMIN_DOCUMENT_KINDS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="File">
        <input
          type="file"
          aria-label="Choose a file to issue"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          disabled={busy || !userId}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
          className="text-xs"
        />
      </Field>
      <Button size="sm" variant="ghost" disabled={busy} onClick={() => setOpen(false)}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancel"}
      </Button>
    </div>
  );
}

/* ============================ DOCUMENTS ============================ */
export function DocumentsModule() {
  const [rows, setRows] = useState<Row[]>([]);
  const [clients, setClients] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");

  async function load() {
    setLoading(true);
    const [{ data }, { data: clientRows }] = await Promise.all([
      sb()
        .from("documents")
        .select("*, profiles(full_name, email, client_number)")
        .order("created_at", { ascending: false }),
      sb().from("profiles").select("user_id, full_name, email, client_number").order("full_name"),
    ]);
    setRows(data ?? []);
    setClients(clientRows ?? []);
    setLoading(false);
  }

  /**
   * The client sees this decision immediately — an approval marks the document
   * good on their account, a rejection tells them what to re-upload — so a
   * rejection must carry a reason rather than silently flipping a badge.
   */
  async function review(id: string, decision: "approved" | "rejected") {
    let reason: string | null = null;
    if (decision === "rejected") {
      reason =
        window.prompt("Why is this being rejected? The client will see this.")?.trim() || null;
      if (!reason) return toast.error("A rejection needs a reason the client can act on.");
    }

    const { data: auth } = await supabase.auth.getUser();
    const { error } = await sb()
      .from("documents")
      .update({
        approval_status: decision,
        approved_by: auth.user?.id ?? null,
        approved_at: new Date().toISOString(),
        rejection_reason: reason,
      })
      .eq("id", id);

    if (error) return toast.error(error.message);
    toast.success(decision === "approved" ? "Document approved" : "Document rejected");
    load();
  }
  useEffect(() => {
    load();
  }, []);

  const types = useMemo(
    () => [...new Set(rows.map((r) => r.document_type).filter(Boolean))],
    [rows],
  );
  const filtered = useMemo(
    () => rows.filter((r) => typeFilter === "all" || r.document_type === typeFilter),
    [rows, typeFilter],
  );

  return (
    <DashCard
      title="Documents"
      description="All client documents — receipts, letters, IDs and contracts."
      noPadding
      action={
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-9 w-44" aria-label="Filter type">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {types.map((t) => (
              <SelectItem key={t} value={t} className="capitalize">
                {String(t).replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      <AdminDocumentUpload clients={clients} onUploaded={load} />
      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <EmptyState icon={FileText} title="No documents" body="Uploaded documents appear here." />
      ) : (
        <TableShell
          head={
            <>
              <Th>Document</Th>
              <Th>Type</Th>
              <Th>Client</Th>
              <Th>Status</Th>
              <Th>Uploaded</Th>
              <Th>Review</Th>
            </>
          }
        >
          {filtered.map((r) => (
            <tr key={r.id} className="border-b border-slate-50 last:border-0">
              <Td>
                <button
                  type="button"
                  onClick={() => openClientDocument(r)}
                  className="inline-flex items-center gap-1 font-medium text-navy hover:text-gold"
                >
                  {r.file_name} <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </Td>
              <Td className="capitalize text-slate-600">
                {String(r.document_type ?? "—").replace(/_/g, " ")}
              </Td>
              <Td className="text-slate-600">
                {r.profiles?.full_name ?? "—"}
                {r.profiles?.client_number ? (
                  <span className="ml-2 font-mono text-xs text-slate-400">
                    {clientNumber(r.profiles.client_number)}
                  </span>
                ) : null}
              </Td>
              <Td>
                {r.approval_status ? (
                  <StatusBadge status={r.approval_status} />
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
                {r.approval_status === "rejected" && r.rejection_reason ? (
                  <p className="mt-1 max-w-56 text-xs text-rose-600">{r.rejection_reason}</p>
                ) : null}
              </Td>
              <Td className="text-slate-500">{fmtDate(r.created_at)}</Td>
              <Td className="whitespace-nowrap">
                {r.approval_status === "approved" ? (
                  <span className="text-xs text-slate-400">Approved</span>
                ) : (
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => review(r.id, "approved")}>
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                      onClick={() => review(r.id, "rejected")}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </Td>
            </tr>
          ))}
        </TableShell>
      )}
    </DashCard>
  );
}

/* ============================ USER ROLES ============================ */
// This tab manages workspace/admin roles only; sales advisers are added from
// CRM settings and clients never appear here. Labels and hints come from the
// shared roles module so the wording cannot drift between pages.
const ADMIN_ROLES: StaffRole[] = [
  "super_admin",
  "admin",
  "manager",
  "crm_manager",
  "content_manager",
  "content_editor",
  "content_author",
  "seo_manager",
  "social_media_manager",
];

export function UserRolesModule() {
  const [rows, setRows] = useState<Row[]>([]);
  const [staffCandidates, setStaffCandidates] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffId, setStaffId] = useState("");
  const [role, setRole] = useState("");

  async function load() {
    setLoading(true);
    const { data: roles } = await sb()
      .from("user_roles")
      .select("user_id, role, created_at")
      .in("role", ADMIN_ROLES);
    const ids = [...new Set((roles ?? []).map((r: Row) => r.user_id))];
    let profs: Row[] = [];
    if (ids.length) {
      const { data: p } = await sb()
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", ids);
      profs = p ?? [];
    }
    // The staff directory is the better source for who somebody is: it carries
    // their working name and job title, where profiles only has the account.
    let staff: Row[] = [];
    if (ids.length) {
      const { data: s } = await sb()
        .from("staff_members")
        .select("user_id, full_name, email, position")
        .in("user_id", ids);
      staff = s ?? [];
    }
    setRows(
      (roles ?? []).map((r: Row) => {
        const prof = profs.find((x) => x.user_id === r.user_id);
        const member = staff.find((x) => x.user_id === r.user_id);
        return {
          ...r,
          email: member?.email ?? prof?.email ?? "Unknown",
          full_name: member?.full_name ?? prof?.full_name ?? null,
          position: member?.position ?? null,
        };
      }),
    );
    const { data: registeredStaff } = await sb()
      .from("staff_members")
      .select("id, user_id, full_name, email, position, department, status, signed_in_at")
      .not("user_id", "is", null)
      .in("status", ["active", "pending_approval"])
      .order("full_name");
    setStaffCandidates(registeredStaff ?? []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  // Role changes go through audited RPCs, never direct table writes: the
  // database enforces the tier rules (only super admins touch administrator
  // roles) and refuses self-lockout, so the UI cannot be talked around.
  async function grant(e: React.FormEvent) {
    e.preventDefault();
    if (!staffId || !role) return void toast.error("Choose a registered staff member and role.");
    const { error } = await (supabase as any).rpc("grant_registered_staff_role", {
      _staff_id: staffId,
      _role: role,
    });
    if (error) return void toast.error(error.message);
    toast.success("Role granted");
    setStaffId("");
    setRole("");
    load();
  }
  async function revoke(r: Row) {
    if (!window.confirm(`Remove ${roleLabel(r.role)} from ${r.email}?`)) return;
    const { error } = await supabase.rpc("revoke_user_role", {
      _user_id: r.user_id,
      _role: r.role,
    });
    if (error) return void toast.error(error.message);
    toast.success("Role removed");
    load();
  }

  return (
    <div className="space-y-4">
      <DashCard
        title="Grant admin role"
        description="Select a registered staff member, then grant the appropriate administration access."
      >
        <form onSubmit={grant} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label="Registered staff">
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger aria-label="Registered staff">
                <SelectValue placeholder="Choose a staff member" />
              </SelectTrigger>
              <SelectContent>
                {staffCandidates.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name}
                    {member.position ? ` — ${member.position}` : ""}
                    {member.status === "pending_approval" ? " (registration pending)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!loading && staffCandidates.length === 0 && (
              <p className="mt-1.5 text-xs text-slate-500">
                No registered staff accounts are eligible for an admin role yet.
              </p>
            )}
          </Field>
          <Field label="Role">
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger aria-label="Role">
                <SelectValue placeholder="Choose a role" />
              </SelectTrigger>
              <SelectContent>
                {ADMIN_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {roleLabel(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {ROLE_HINTS[role as StaffRole] && (
              <p className="mt-1.5 text-xs text-slate-500">{ROLE_HINTS[role as StaffRole]}</p>
            )}
          </Field>
          <Button
            type="submit"
            disabled={!staffId || !role}
            className="rounded-full bg-navy font-bold text-white hover:bg-navy/90"
          >
            Grant role
          </Button>
        </form>
      </DashCard>

      <DashCard title="Administrators" description="Everyone with elevated access." noPadding>
        {loading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No administrators"
            body="Grant a role above to add your first admin."
          />
        ) : (
          <TableShell
            min={560}
            head={
              <>
                <Th>User</Th>
                <Th>Position</Th>
                <Th>Role</Th>
                <Th>Since</Th>
                <Th>Actions</Th>
              </>
            }
          >
            {rows.map((r) => (
              <tr key={`${r.user_id}-${r.role}`} className="border-b border-slate-50 last:border-0">
                <Td className="font-medium text-navy">
                  {r.full_name ?? r.email}
                  {r.full_name && (
                    <span className="block text-xs font-normal text-slate-500">{r.email}</span>
                  )}
                </Td>
                <Td className="text-slate-600">{r.position ?? "—"}</Td>
                <Td>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-navy/15 bg-navy/5 px-2.5 py-0.5 text-[11px] font-semibold text-navy">
                    <UserCog className="h-3.5 w-3.5 text-gold" /> {roleLabel(r.role)}
                  </span>
                </Td>
                <Td className="text-slate-500">{fmtDate(r.created_at)}</Td>
                <Td>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-rose-600"
                    onClick={() => revoke(r)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" /> Remove
                  </Button>
                </Td>
              </tr>
            ))}
          </TableShell>
        )}
      </DashCard>
    </div>
  );
}
