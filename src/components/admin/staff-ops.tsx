/* Staff directory: the people, their position and their access.
   — bank-UI, self-loading (demo or Supabase). */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Loader2,
  Mail,
  MailCheck,
  Pencil,
  Search,
  ShieldCheck,
  ShieldX,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { DashCard, EmptyState, StatusBadge, fmtDate } from "@/components/portfolio/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  approveStaff,
  inviteStaff,
  listStaff,
  listStaffChangeRequests,
  rejectStaff,
  removeStaff,
  resendStaffInvite,
  reviewStaffChangeRequest,
  updateStaff,
} from "@/lib/staff.functions";
import { STAFF_ROLES, roleLabel } from "@/lib/roles";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StaffRow = any;

const ROLE_OPTIONS = STAFF_ROLES;

const DEPARTMENTS = [
  "Executive",
  "Sales",
  "Investor Relations",
  "Finance",
  "Operations",
  "Marketing",
  "Editorial",
  "Support",
  "Legal & Compliance",
];

function Th({ children }: { children: ReactNode }) {
  return (
    <th className="whitespace-nowrap px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
      {children}
    </th>
  );
}
function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-sm ${className}`}>{children}</td>;
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-600">{label}</Label>
      {children}
    </div>
  );
}

type FormState = {
  fullName: string;
  email: string;
  position: string;
  department: string;
  phone: string;
  whatsappNumber: string;
  startedOn: string;
  role: string;
  status: string;
  notes: string;
};

const emptyForm: FormState = {
  fullName: "",
  email: "",
  position: "",
  department: "",
  phone: "",
  whatsappNumber: "",
  startedOn: "",
  role: "sales_agent",
  status: "invited",
  notes: "",
};

export function StaffModule() {
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editing, setEditing] = useState<StaffRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [requests, setRequests] = useState<StaffRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [staff, changeRequests] = await Promise.all([
        listStaff() as unknown as Promise<StaffRow[]>,
        listStaffChangeRequests() as unknown as Promise<StaffRow[]>,
      ]);
      setRows(((staff as any)?.staff ?? staff) as StaffRow[]);
      setRequests(((changeRequests as any)?.requests ?? changeRequests) as StaffRow[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load the staff directory.");
    }
    setLoading(false);
  }
  useEffect(() => {
    load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r: StaffRow) =>
      [r.full_name, r.email, r.position, r.department, ...(r.roles ?? []).map(roleLabel)]
        .filter(Boolean)
        .some((v: string) => v.toLowerCase().includes(q)),
    );
  }, [rows, query]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      active: rows.filter((r: StaffRow) => r.status === "active").length,
      invited: rows.filter((r: StaffRow) => r.status === "invited").length,
    }),
    [rows],
  );

  // Signed in and waiting on a human decision — the only place access is granted.
  const awaitingApproval = useMemo(
    () => rows.filter((r: StaffRow) => r.status === "pending_approval"),
    [rows],
  );

  async function approve(row: StaffRow) {
    setBusyId(row.id);
    try {
      await approveStaff({ data: { staffId: row.id } });
      toast.success(`${row.full_name} approved — access granted`);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not approve this staff member.");
    }
    setBusyId(null);
  }

  async function reject(row: StaffRow) {
    const reason = window.prompt(`Why is ${row.full_name} being declined? (optional)`) ?? undefined;
    setBusyId(row.id);
    try {
      await rejectStaff({ data: { staffId: row.id, reason } });
      toast.success("Access request declined");
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not decline this request.");
    }
    setBusyId(null);
  }

  async function reviewRequest(request: StaffRow, approveIt: boolean) {
    setBusyId(request.id);
    try {
      await reviewStaffChangeRequest({ data: { requestId: request.id, approve: approveIt } });
      toast.success(approveIt ? "Change applied" : "Request declined");
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not review this request.");
    }
    setBusyId(null);
  }

  function openInvite() {
    setForm(emptyForm);
    setInviteOpen(true);
  }

  function openEdit(row: StaffRow) {
    setEditing(row);
    setForm({
      fullName: row.full_name ?? "",
      email: row.email ?? "",
      position: row.position ?? "",
      department: row.department ?? "",
      phone: row.phone ?? "",
      whatsappNumber: row.whatsapp_number ?? "",
      startedOn: row.started_on ?? "",
      role: row.roles?.[0] ?? "sales_agent",
      status: row.status ?? "active",
      notes: row.notes ?? "",
    });
  }

  async function submitInvite(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await inviteStaff({
        data: {
          fullName: form.fullName,
          email: form.email,
          position: form.position || undefined,
          department: form.department || undefined,
          phone: form.phone || undefined,
          whatsappNumber: form.whatsappNumber || undefined,
          startedOn: form.startedOn || undefined,
          notes: form.notes || undefined,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          role: form.role as any,
        },
      });
      toast.success(
        result.emailSent
          ? `Invitation emailed to ${form.email}`
          : "Staff member added — the invite email could not be sent. Copy the link from the row menu.",
      );
      setInviteOpen(false);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The invitation could not be sent.");
    }
    setSaving(false);
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await updateStaff({
        data: {
          staffId: editing.id,
          fullName: form.fullName,
          position: form.position || undefined,
          department: form.department || undefined,
          phone: form.phone || undefined,
          whatsappNumber: form.whatsappNumber || undefined,
          startedOn: form.startedOn || undefined,
          notes: form.notes || undefined,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          role: form.role as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          status: form.status as any,
        },
      });
      toast.success("Staff record updated");
      setEditing(null);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The record could not be saved.");
    }
    setSaving(false);
  }

  async function resend(row: StaffRow) {
    try {
      const result = await resendStaffInvite({ data: { staffId: row.id } });
      toast.success(
        result.emailSent ? `Invitation resent to ${row.email}` : "Link generated, but not emailed.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not resend the invitation.");
    }
  }

  async function remove(row: StaffRow) {
    if (!window.confirm(`Remove ${row.full_name} from staff? Their access is revoked immediately.`))
      return;
    try {
      await removeStaff({ data: { staffId: row.id } });
      toast.success("Staff member removed");
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove the staff member.");
    }
  }

  const detailFields = (
    <>
      <Field label="Position">
        <Input
          value={form.position}
          onChange={(e) => setForm({ ...form, position: e.target.value })}
          placeholder="Head of Sales"
        />
      </Field>
      <Field label="Department">
        <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
          <SelectTrigger aria-label="Department">
            <SelectValue placeholder="Choose a department" />
          </SelectTrigger>
          <SelectContent>
            {DEPARTMENTS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Phone">
        <Input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="0803 000 0000"
        />
      </Field>
      <Field label="WhatsApp">
        <Input
          value={form.whatsappNumber}
          onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
          placeholder="0803 000 0000"
        />
      </Field>
      <Field label="Access role">
        <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
          <SelectTrigger aria-label="Access role">
            <SelectValue placeholder="Choose a role" />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((r) => (
              <SelectItem key={r} value={r}>
                {roleLabel(r)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Start date">
        <Input
          type="date"
          value={form.startedOn}
          onChange={(e) => setForm({ ...form, startedOn: e.target.value })}
        />
      </Field>
    </>
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <DashCard title="Total staff" description="Everyone in the directory.">
          <p className="text-2xl font-bold text-navy">{stats.total}</p>
        </DashCard>
        <DashCard title="Active" description="Signed in and working.">
          <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
        </DashCard>
        <DashCard title="Awaiting sign-in" description="Invited, password not set yet.">
          <p className="text-2xl font-bold text-amber-600">{stats.invited}</p>
        </DashCard>
      </div>

      {awaitingApproval.length > 0 && (
        <DashCard
          title={`Waiting for approval (${awaitingApproval.length})`}
          description="These people have signed in but hold no access yet. Approving grants the role recorded on their invite."
        >
          <div className="space-y-2.5">
            {awaitingApproval.map((r: StaffRow) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-navy">
                    {r.full_name}
                    <span className="ml-2 font-normal text-slate-500">{r.email}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {[
                      r.position,
                      r.department,
                      r.intended_role && `Role on approval: ${roleLabel(r.intended_role)}`,
                      r.signed_in_at && `Signed in ${fmtDate(r.signed_in_at)}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-rose-600"
                    disabled={busyId === r.id}
                    onClick={() => reject(r)}
                  >
                    <ShieldX className="mr-1 h-3.5 w-3.5" /> Decline
                  </Button>
                  <Button
                    size="sm"
                    disabled={busyId === r.id}
                    onClick={() => approve(r)}
                    className="rounded-full bg-navy font-bold text-white hover:bg-navy/90"
                  >
                    {busyId === r.id ? (
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                    )}
                    Approve &amp; grant access
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DashCard>
      )}

      {requests.length > 0 && (
        <DashCard
          title={`Change requests (${requests.length})`}
          description="Staff asking for a different role or position. Approving applies it immediately."
        >
          <div className="space-y-2.5">
            {requests.map((req: StaffRow) => (
              <div
                key={req.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-navy">
                    {req.staff_members?.full_name ?? "Staff member"}
                    <span className="ml-2 font-normal text-slate-500">
                      {req.staff_members?.email}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {[
                      req.requested_role && `Role: ${roleLabel(req.requested_role)}`,
                      req.requested_position && `Position: ${req.requested_position}`,
                      req.requested_department && `Department: ${req.requested_department}`,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "No change specified"}
                  </p>
                  {req.note && <p className="mt-1 text-xs italic text-slate-500">“{req.note}”</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-rose-600"
                    disabled={busyId === req.id}
                    onClick={() => reviewRequest(req, false)}
                  >
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === req.id}
                    onClick={() => reviewRequest(req, true)}
                  >
                    {busyId === req.id && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
                    Approve change
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DashCard>
      )}

      <DashCard
        title="Staff directory"
        description="Each person's position, department and platform access. Position is their job title; the access role decides what they can open."
        noPadding
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, position, department or role"
              className="pl-9"
              aria-label="Search staff"
            />
          </div>
          <Button
            onClick={openInvite}
            className="rounded-full bg-navy font-bold text-white hover:bg-navy/90"
          >
            <UserPlus className="mr-1.5 h-4 w-4" /> Invite staff
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-10 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={query ? "No matching staff" : "No staff yet"}
            body={
              query
                ? "Try a different name, position or department."
                : "Invite your first team member to get started."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead className="border-b border-slate-100 bg-slate-50/60">
                <tr>
                  <Th>Name</Th>
                  <Th>Position</Th>
                  <Th>Department</Th>
                  <Th>Access role</Th>
                  <Th>Status</Th>
                  <Th>Started</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r: StaffRow) => (
                  <tr key={r.id} className="border-b border-slate-50 last:border-0">
                    <Td className="font-medium text-navy">
                      {r.full_name}
                      <span className="block text-xs font-normal text-slate-500">{r.email}</span>
                    </Td>
                    <Td className="text-slate-600">{r.position || "—"}</Td>
                    <Td className="text-slate-600">{r.department || "—"}</Td>
                    <Td className="text-slate-600">
                      {(r.roles ?? []).length
                        ? (r.roles ?? []).map(roleLabel).join(", ")
                        : "No access"}
                    </Td>
                    <Td>
                      <StatusBadge status={r.status} />
                    </Td>
                    <Td className="text-slate-500">{r.started_on ? fmtDate(r.started_on) : "—"}</Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>
                          <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                        </Button>
                        {r.status === "invited" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => resend(r)}
                            title="Resend the invitation email"
                          >
                            <Mail className="mr-1 h-3.5 w-3.5" /> Resend
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-rose-600"
                          onClick={() => remove(r)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashCard>

      {/* Invite */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Invite a staff member</DialogTitle>
            <DialogDescription>
              We email a single-use link so they can set their own password. Nobody sends or sees a
              password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitInvite} className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name *">
              <Input
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Aisha Bello"
              />
            </Field>
            <Field label="Work email *">
              <Input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="aisha@kaysteph.com"
              />
            </Field>
            {detailFields}
            <div className="sm:col-span-2">
              <Field label="Notes">
                <Textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Anything the team should know."
                />
              </Field>
            </div>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="ghost" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="rounded-full bg-navy font-bold text-white hover:bg-navy/90"
              >
                {saving ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <MailCheck className="mr-1.5 h-4 w-4" />
                )}
                Send invitation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Edit staff member</DialogTitle>
            <DialogDescription>{editing?.email}</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitEdit} className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name *">
              <Input
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger aria-label="Status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="invited">Invited — not signed in yet</SelectItem>
                  <SelectItem value="pending_approval">Pending approval</SelectItem>
                  <SelectItem value="suspended">Suspended — revokes all access</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {detailFields}
            <div className="sm:col-span-2">
              <Field label="Notes">
                <Textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </Field>
            </div>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="rounded-full bg-navy font-bold text-white hover:bg-navy/90"
              >
                {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
