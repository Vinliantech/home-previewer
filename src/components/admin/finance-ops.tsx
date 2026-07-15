/* Finance ops admin modules: Pending Receipts, Payment Plans, Company Accounts
   — bank-UI, self-loading (demo or Supabase). */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, ExternalLink, Landmark, Loader2, Plus, Receipt, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { blockInDemo, demoEstateOps, demoFinanceOps, isDemoActive } from "@/lib/demo";
import { fmtNGN } from "@/lib/invest";
import { DashCard, EmptyState, StatCard, StatusBadge, fmtDate } from "@/components/portfolio/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;
const sb = () => supabase as unknown as { from: (t: string) => any; auth: typeof supabase.auth }; // eslint-disable-line @typescript-eslint/no-explicit-any

const PAYMENT_CATEGORIES = [
  "Search Fee",
  "Application Form",
  "Excavation",
  "Land",
  "Infrastructure Development",
  "Fencing",
  "Ownership Transfer",
  "Others",
];

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
function requirementStatus(required: number, paid: number): string {
  if (paid >= required && required > 0) return "paid";
  if (paid > 0) return "partial";
  return "pending";
}

/* ============================ PENDING RECEIPTS ============================ */
export function ReceiptsModule() {
  const demo = isDemoActive();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    if (demo) {
      setRows(demoFinanceOps.receipts);
    } else {
      const { data } = await sb()
        .from("documents")
        .select("*, profiles(full_name, email)")
        .not("approval_status", "is", null)
        .order("created_at", { ascending: false });
      setRows(data ?? []);
    }
    setLoading(false);
  }
  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, []);

  async function review(r: Row, approval_status: "approved" | "rejected") {
    if (blockInDemo()) return;
    const { data: auth } = await sb().auth.getUser();
    const { error } = await sb()
      .from("documents")
      .update({
        approval_status,
        approved_by: auth?.user?.id ?? null,
        approved_at: new Date().toISOString(),
      })
      .eq("id", r.id);
    if (error) return void toast.error(error.message);
    toast.success(`Receipt ${approval_status}`);
    load();
  }

  const sorted = useMemo(
    () =>
      [...rows].sort(
        (a, b) =>
          (a.approval_status === "pending" ? -1 : 0) - (b.approval_status === "pending" ? -1 : 0),
      ),
    [rows],
  );
  const pending = rows.filter((r) => r.approval_status === "pending").length;
  const approved = rows.filter((r) => r.approval_status === "approved").length;
  const rejected = rows.filter((r) => r.approval_status === "rejected").length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Receipt}
          label="Pending"
          value={String(pending)}
          subTone={pending ? "negative" : "neutral"}
          sub={pending ? "Awaiting review" : "All clear"}
        />
        <StatCard icon={CheckCircle2} label="Approved" value={String(approved)} />
        <StatCard icon={Trash2} label="Rejected" value={String(rejected)} />
      </div>
      <DashCard
        title="Pending receipts"
        description="Payment evidence uploaded by clients."
        noPadding
      >
        {loading ? (
          <Loading />
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No receipts"
            body="Uploaded payment receipts appear here for approval."
          />
        ) : (
          <TableShell
            head={
              <>
                <Th>Client</Th>
                <Th>Category</Th>
                <Th>File</Th>
                <Th>Status</Th>
                <Th>Uploaded</Th>
                <Th>Actions</Th>
              </>
            }
          >
            {sorted.map((r) => (
              <tr key={r.id} className="border-b border-slate-50 last:border-0">
                <Td>
                  <div className="font-medium text-navy">{r.profiles?.full_name ?? "—"}</div>
                  <div className="text-xs text-slate-500">{r.profiles?.email}</div>
                </Td>
                <Td className="text-slate-600">{r.payment_category ?? "—"}</Td>
                <Td>
                  <a
                    href={r.file_url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-navy hover:text-gold"
                  >
                    {r.file_name} <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Td>
                <Td>
                  <StatusBadge status={r.approval_status ?? "pending"} />
                </Td>
                <Td className="text-slate-500">{fmtDate(r.created_at)}</Td>
                <Td>
                  {r.approval_status === "pending" ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={() => review(r, "approved")}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-rose-200 text-rose-600 hover:bg-rose-50"
                        onClick={() => review(r, "rejected")}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">Reviewed</span>
                  )}
                </Td>
              </tr>
            ))}
          </TableShell>
        )}
      </DashCard>
    </div>
  );
}

/* ============================ PAYMENT PLANS ============================ */
export function PaymentPlansModule() {
  const demo = isDemoActive();
  const [rows, setRows] = useState<Row[]>([]);
  const [clients, setClients] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState({
    user_id: "",
    payment_category: "",
    amount_required: "",
    amount_paid: "",
  });

  async function load() {
    setLoading(true);
    if (demo) {
      setRows(demoFinanceOps.requirements);
      setClients(demoEstateOps.profiles);
    } else {
      const [r, c] = await Promise.all([
        sb()
          .from("payment_requirements")
          .select("*, profiles(full_name, email)")
          .order("created_at", { ascending: false }),
        sb().from("profiles").select("id, user_id, full_name, email").order("full_name"),
      ]);
      setRows(r.data ?? []);
      setClients(c.data ?? []);
    }
    setLoading(false);
  }
  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, []);

  function startAdd() {
    setEditing(null);
    setForm({ user_id: "", payment_category: "", amount_required: "", amount_paid: "" });
    setOpen(true);
  }
  function startEdit(r: Row) {
    setEditing(r);
    setForm({
      user_id: r.user_id,
      payment_category: r.payment_category,
      amount_required: String(r.amount_required ?? ""),
      amount_paid: String(r.amount_paid ?? ""),
    });
    setOpen(true);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (blockInDemo()) return;
    if (!form.user_id || !form.payment_category)
      return void toast.error("Choose a client and category.");
    const required = Number(form.amount_required) || 0;
    const paid = Number(form.amount_paid) || 0;
    const payload = {
      user_id: form.user_id,
      payment_category: form.payment_category,
      amount_required: required,
      amount_paid: paid,
      status: requirementStatus(required, paid),
    };
    const { error } = editing
      ? await sb().from("payment_requirements").update(payload).eq("id", editing.id)
      : await sb().from("payment_requirements").insert(payload);
    if (error) return void toast.error(error.message);
    toast.success(editing ? "Payment plan updated" : "Payment plan added");
    setOpen(false);
    load();
  }

  return (
    <DashCard
      title="Payment plans"
      description="Per-client required vs paid across payment categories."
      noPadding
      action={
        <Button
          size="sm"
          onClick={startAdd}
          className="rounded-full bg-navy font-bold text-white hover:bg-navy/90"
        >
          <Plus className="mr-1 h-4 w-4" /> Add plan item
        </Button>
      }
    >
      {loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="No payment plans yet"
          body="Set required amounts per client and category to track progress."
        />
      ) : (
        <TableShell
          head={
            <>
              <Th>Client</Th>
              <Th>Category</Th>
              <Th>Required</Th>
              <Th>Paid</Th>
              <Th>Balance</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </>
          }
        >
          {rows.map((r) => {
            const balance = Number(r.amount_required) - Number(r.amount_paid);
            return (
              <tr key={r.id} className="border-b border-slate-50 last:border-0">
                <Td>
                  <div className="font-medium text-navy">{r.profiles?.full_name ?? "—"}</div>
                  <div className="text-xs text-slate-500">{r.profiles?.email}</div>
                </Td>
                <Td className="text-slate-600">{r.payment_category}</Td>
                <Td className="tabular-nums text-navy">{fmtNGN(r.amount_required)}</Td>
                <Td className="tabular-nums text-emerald-700">{fmtNGN(r.amount_paid)}</Td>
                <Td className={`tabular-nums ${balance > 0 ? "text-rose-600" : "text-slate-500"}`}>
                  {fmtNGN(balance)}
                </Td>
                <Td>
                  <StatusBadge status={r.status} />
                </Td>
                <Td>
                  <Button size="sm" variant="outline" onClick={() => startEdit(r)}>
                    Edit
                  </Button>
                </Td>
              </tr>
            );
          })}
        </TableShell>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-navy">
              {editing ? "Edit payment plan item" : "Add payment plan item"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <Field label="Client *">
              <Select
                value={form.user_id}
                onValueChange={(v) => setForm({ ...form, user_id: v })}
                disabled={!!editing}
              >
                <SelectTrigger aria-label="Client">
                  <SelectValue placeholder="Choose a client" />
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
            <Field label="Category *">
              <Select
                value={form.payment_category}
                onValueChange={(v) => setForm({ ...form, payment_category: v })}
              >
                <SelectTrigger aria-label="Category">
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Amount required (₦)">
                <Input
                  type="number"
                  value={form.amount_required}
                  onChange={(e) => setForm({ ...form, amount_required: e.target.value })}
                />
              </Field>
              <Field label="Amount paid (₦)">
                <Input
                  type="number"
                  value={form.amount_paid}
                  onChange={(e) => setForm({ ...form, amount_paid: e.target.value })}
                />
              </Field>
            </div>
            <Button
              type="submit"
              className="w-full rounded-full bg-gold font-bold text-gold-foreground hover:bg-gold/90"
            >
              {editing ? "Save changes" : "Add item"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </DashCard>
  );
}

/* ============================ COMPANY ACCOUNTS ============================ */
export function CompanyAccountsModule() {
  const demo = isDemoActive();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState({
    bank_name: "",
    account_name: "",
    account_number: "",
    account_type: "",
    purpose: "",
  });

  async function load() {
    setLoading(true);
    if (demo) {
      setRows(demoFinanceOps.accounts);
    } else {
      const { data } = await sb()
        .from("company_account")
        .select("*")
        .order("created_at", { ascending: false });
      setRows(data ?? []);
    }
    setLoading(false);
  }
  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, []);

  function startAdd() {
    setEditing(null);
    setForm({ bank_name: "", account_name: "", account_number: "", account_type: "", purpose: "" });
    setOpen(true);
  }
  function startEdit(r: Row) {
    setEditing(r);
    setForm({
      bank_name: r.bank_name ?? "",
      account_name: r.account_name ?? "",
      account_number: r.account_number ?? "",
      account_type: r.account_type ?? "",
      purpose: r.purpose ?? "",
    });
    setOpen(true);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (blockInDemo()) return;
    if (!form.bank_name.trim() || !form.account_name.trim() || !form.account_number.trim())
      return void toast.error("Bank, account name and number are required.");
    const payload = {
      bank_name: form.bank_name.trim(),
      account_name: form.account_name.trim(),
      account_number: form.account_number.trim(),
      account_type: form.account_type || null,
      purpose: form.purpose || null,
    };
    const { error } = editing
      ? await sb().from("company_account").update(payload).eq("id", editing.id)
      : await sb().from("company_account").insert(payload);
    if (error) return void toast.error(error.message);
    toast.success(editing ? "Account updated" : "Account added");
    setOpen(false);
    load();
  }
  async function remove(r: Row) {
    if (blockInDemo()) return;
    if (!window.confirm(`Delete ${r.bank_name} account ${r.account_number}?`)) return;
    const { error } = await sb().from("company_account").delete().eq("id", r.id);
    if (error) return void toast.error(error.message);
    toast.success("Account deleted");
    load();
  }

  return (
    <DashCard
      title="Company accounts"
      description="Bank accounts shown to clients for payments."
      action={
        <Button
          size="sm"
          onClick={startAdd}
          className="rounded-full bg-navy font-bold text-white hover:bg-navy/90"
        >
          <Plus className="mr-1 h-4 w-4" /> Add account
        </Button>
      }
    >
      {loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="No accounts yet"
          body="Add the bank accounts clients should transfer to."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map((r) => (
            <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 font-serif text-lg font-bold text-navy">
                  <Landmark className="h-5 w-5 text-gold" /> {r.bank_name}
                </div>
                {r.account_type && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                    {r.account_type}
                  </span>
                )}
              </div>
              <div className="mt-3 space-y-1 text-sm">
                <div className="text-slate-600">{r.account_name}</div>
                <div className="font-mono text-base font-semibold tabular-nums text-navy">
                  {r.account_number}
                </div>
                {r.purpose && <div className="text-xs text-slate-500">{r.purpose}</div>}
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => startEdit(r)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-rose-600"
                  onClick={() => remove(r)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-navy">
              {editing ? "Edit account" : "Add account"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <Field label="Bank name *">
              <Input
                value={form.bank_name}
                onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                required
              />
            </Field>
            <Field label="Account name *">
              <Input
                value={form.account_name}
                onChange={(e) => setForm({ ...form, account_name: e.target.value })}
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Account number *">
                <Input
                  value={form.account_number}
                  onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                  required
                />
              </Field>
              <Field label="Account type">
                <Input
                  placeholder="e.g. Current"
                  value={form.account_type}
                  onChange={(e) => setForm({ ...form, account_type: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Purpose">
              <Textarea
                rows={2}
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                placeholder="What payments go to this account?"
              />
            </Field>
            <Button
              type="submit"
              className="w-full rounded-full bg-gold font-bold text-gold-foreground hover:bg-gold/90"
            >
              {editing ? "Save changes" : "Add account"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </DashCard>
  );
}
