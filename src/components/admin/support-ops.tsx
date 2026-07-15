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
import { blockInDemo, demoEstateOps, demoSupportOps, isDemoActive } from "@/lib/demo";
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
  const demo = isDemoActive();
  const [tickets, setTickets] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [active, setActive] = useState<Row | null>(null);
  const [messages, setMessages] = useState<Row[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  async function loadTickets() {
    setLoading(true);
    if (demo) {
      setTickets(demoSupportOps.tickets);
    } else {
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
    }
    setLoading(false);
  }
  useEffect(() => {
    loadTickets(); /* eslint-disable-next-line */
  }, []);

  async function openTicket(t: Row) {
    setActive(t);
    setReply("");
    if (demo) {
      setMessages((demoSupportOps.messages[t.id] as Row[]) ?? []);
    } else {
      const { data } = await sb()
        .from("ticket_messages")
        .select("*")
        .eq("ticket_id", t.id)
        .order("created_at");
      setMessages(data ?? []);
    }
  }
  async function send() {
    if (!active || !reply.trim()) return;
    if (blockInDemo()) return;
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
    if (blockInDemo()) return;
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

/* ============================ CLIENT DOCUMENTS ============================ */
export { DocumentsModule } from "./documents-ops";

/* ============================ USER ROLES ============================ */
const ADMIN_ROLES = ["super_admin", "admin", "manager"];

export function UserRolesModule() {
  const demo = isDemoActive();
  const [rows, setRows] = useState<Row[]>([]);
  const [clients, setClients] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("");

  async function load() {
    setLoading(true);
    if (demo) {
      setRows(demoSupportOps.roles);
      setClients(demoEstateOps.profiles);
    } else {
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
      setRows(
        (roles ?? []).map((r: Row) => ({
          ...r,
          email: profs.find((x) => x.user_id === r.user_id)?.email ?? "Unknown",
        })),
      );
      const { data: allClients } = await sb()
        .from("profiles")
        .select("id, user_id, full_name, email")
        .order("full_name");
      setClients(allClients ?? []);
    }
    setLoading(false);
  }
  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, []);

  async function grant(e: React.FormEvent) {
    e.preventDefault();
    if (blockInDemo()) return;
    if (!userId || !role) return void toast.error("Choose a user and role.");
    await sb().from("user_roles").delete().eq("user_id", userId).eq("role", "client");
    const { error } = await sb().from("user_roles").insert({ user_id: userId, role });
    if (error) return void toast.error(error.message);
    toast.success("Role granted");
    setUserId("");
    setRole("");
    load();
  }
  async function revoke(r: Row) {
    if (blockInDemo()) return;
    if (!window.confirm(`Remove ${r.role.replace(/_/g, " ")} from ${r.email}?`)) return;
    const { error } = await sb()
      .from("user_roles")
      .delete()
      .eq("user_id", r.user_id)
      .eq("role", r.role);
    if (error) return void toast.error(error.message);
    toast.success("Role removed");
    load();
  }

  return (
    <div className="space-y-4">
      <DashCard
        title="Grant admin role"
        description="Give an existing user Super Admin, Admin or Manager access."
      >
        <form onSubmit={grant} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label="User">
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger aria-label="User">
                <SelectValue placeholder="Choose a user" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.user_id}>
                    {c.full_name} — {c.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Role">
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger aria-label="Role">
                <SelectValue placeholder="Choose a role" />
              </SelectTrigger>
              <SelectContent>
                {ADMIN_ROLES.map((r) => (
                  <SelectItem key={r} value={r} className="capitalize">
                    {r.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Button
            type="submit"
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
                <Th>Role</Th>
                <Th>Since</Th>
                <Th>Actions</Th>
              </>
            }
          >
            {rows.map((r) => (
              <tr key={`${r.user_id}-${r.role}`} className="border-b border-slate-50 last:border-0">
                <Td className="font-medium text-navy">{r.email}</Td>
                <Td>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-navy/15 bg-navy/5 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-navy">
                    <UserCog className="h-3.5 w-3.5 text-gold" /> {r.role.replace(/_/g, " ")}
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
