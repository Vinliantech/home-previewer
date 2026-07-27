/* Estate operations admin modules (Sales ops): Estates, Plots, Allocations,
   Applications, Reservations — bank-UI, self-loading (demo or Supabase). */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Building2, Download, Landmark, Loader2, MapPin, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fmtNGN } from "@/lib/invest";
import { DashCard, EmptyState, StatusBadge, fmtDate } from "@/components/portfolio/kit";
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

/* ============================ ESTATES ============================ */
export function EstatesModule() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState({
    name: "",
    location: "",
    total_land_size: "",
    description: "",
  });

  async function load() {
    setLoading(true);
    const { data } = await sb()
      .from("estates")
      .select("*")
      .order("created_at", { ascending: false });
    setRows(data ?? []);
    setLoading(false);
  }
  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, []);

  function startAdd() {
    setEditing(null);
    setForm({ name: "", location: "", total_land_size: "", description: "" });
    setOpen(true);
  }
  function startEdit(r: Row) {
    setEditing(r);
    setForm({
      name: r.name ?? "",
      location: r.location ?? "",
      total_land_size: r.total_land_size ?? "",
      description: r.description ?? "",
    });
    setOpen(true);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.location.trim())
      return void toast.error("Name and location are required.");
    const payload = {
      name: form.name.trim(),
      location: form.location.trim(),
      total_land_size: form.total_land_size || null,
      description: form.description || null,
    };
    const { error } = editing
      ? await sb().from("estates").update(payload).eq("id", editing.id)
      : await sb().from("estates").insert(payload);
    if (error) return void toast.error(error.message);
    toast.success(editing ? "Estate updated" : "Estate added");
    setOpen(false);
    load();
  }
  async function remove(r: Row) {
    if (
      !window.confirm(
        `Delete estate "${r.name}"? Plots keep their records but lose the estate link.`,
      )
    )
      return;
    const { error } = await sb().from("estates").delete().eq("id", r.id);
    if (error) return void toast.error(error.message);
    toast.success("Estate deleted");
    load();
  }

  return (
    <DashCard
      title="Estates"
      description="Land developments and their inventory."
      noPadding
      action={
        <Button
          size="sm"
          onClick={startAdd}
          className="rounded-full bg-navy font-bold text-white hover:bg-navy/90"
        >
          <Plus className="mr-1 h-4 w-4" /> Add estate
        </Button>
      }
    >
      {loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No estates yet"
          body="Add your first estate to start building plot inventory."
        />
      ) : (
        <TableShell
          min={640}
          head={
            <>
              <Th>Estate</Th>
              <Th>Location</Th>
              <Th>Land size</Th>
              <Th>Created</Th>
              <Th>Actions</Th>
            </>
          }
        >
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-slate-50 last:border-0">
              <Td className="font-semibold text-navy">{r.name}</Td>
              <Td className="text-slate-600">{r.location}</Td>
              <Td className="text-slate-600">{r.total_land_size ?? "—"}</Td>
              <Td className="text-slate-500">{fmtDate(r.created_at)}</Td>
              <Td>
                <div className="flex gap-2">
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
              </Td>
            </tr>
          ))}
        </TableShell>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-navy">
              {editing ? "Edit estate" : "Add estate"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <Field label="Estate name *">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </Field>
            <Field label="Location *">
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                required
              />
            </Field>
            <Field label="Total land size">
              <Input
                placeholder="e.g. 12 hectares"
                value={form.total_land_size}
                onChange={(e) => setForm({ ...form, total_land_size: e.target.value })}
              />
            </Field>
            <Field label="Description">
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>
            <Button
              type="submit"
              className="w-full rounded-full bg-gold font-bold text-gold-foreground hover:bg-gold/90"
            >
              {editing ? "Save changes" : "Add estate"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </DashCard>
  );
}

/* ============================ PLOTS ============================ */
const PLOT_STATUSES = ["available", "on_hold", "reserved", "allocated", "sold"];
const PROPERTY_TYPES = ["residential", "commercial", "land", "mixed_use"];

export function PlotsModule() {
  const [rows, setRows] = useState<Row[]>([]);
  const [estates, setEstates] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [estateFilter, setEstateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    plot_number: "",
    block_number: "",
    estate_id: "",
    location: "",
    size_sqm: "",
    property_type: "residential",
    price: "",
  });

  async function load() {
    setLoading(true);
    const [p, e] = await Promise.all([
      sb().from("plots").select("*, estates(id, name)").order("plot_number"),
      sb().from("estates").select("id, name, location").order("name"),
    ]);
    setRows(p.data ?? []);
    setEstates(e.data ?? []);
    setLoading(false);
  }
  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, []);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (estateFilter === "all" || r.estate_id === estateFilter) &&
          (statusFilter === "all" || r.status === statusFilter),
      ),
    [rows, estateFilter, statusFilter],
  );

  async function addPlot(e: React.FormEvent) {
    e.preventDefault();
    if (!form.plot_number.trim() || !form.estate_id)
      return void toast.error("Plot number and estate are required.");
    const { error } = await sb()
      .from("plots")
      .insert({
        plot_number: form.plot_number.trim(),
        block_number: form.block_number || null,
        estate_id: form.estate_id,
        location: form.location || estates.find((x) => x.id === form.estate_id)?.location || "",
        size_sqm: Number(form.size_sqm) || 0,
        property_type: form.property_type,
        price: Number(form.price) || 0,
        status: "available",
      });
    if (error) return void toast.error(error.message);
    toast.success("Plot added");
    setOpen(false);
    setForm({
      plot_number: "",
      block_number: "",
      estate_id: "",
      location: "",
      size_sqm: "",
      property_type: "residential",
      price: "",
    });
    load();
  }
  async function setStatus(r: Row, status: string) {
    const { error } = await sb().from("plots").update({ status }).eq("id", r.id);
    if (error) return void toast.error(error.message);
    toast.success(`Plot marked ${status}`);
    load();
  }
  async function remove(r: Row) {
    if (!window.confirm(`Delete plot ${r.plot_number}?`)) return;
    const { error } = await sb().from("plots").delete().eq("id", r.id);
    if (error) return void toast.error(error.message);
    toast.success("Plot deleted");
    load();
  }
  function exportCsv() {
    const header = ["Plot", "Block", "Estate", "Location", "Size (sqm)", "Type", "Price", "Status"];
    const lines = filtered.map((r) =>
      [
        r.plot_number,
        r.block_number ?? "",
        r.estates?.name ?? "",
        r.location,
        r.size_sqm,
        r.property_type,
        r.price,
        r.status,
      ]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(","),
    );
    const csv = [header.join(","), ...lines].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `plots-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <DashCard
      title="Plots"
      description="Plot inventory across all estates."
      noPadding
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={exportCsv}>
            <Download className="mr-1 h-4 w-4" /> CSV
          </Button>
          <Button
            size="sm"
            onClick={() => setOpen(true)}
            className="rounded-full bg-navy font-bold text-white hover:bg-navy/90"
          >
            <Plus className="mr-1 h-4 w-4" /> Add plot
          </Button>
        </div>
      }
    >
      <div className="flex flex-wrap gap-3 border-b border-slate-100 p-4">
        <div className="w-52">
          <Select value={estateFilter} onValueChange={setEstateFilter}>
            <SelectTrigger aria-label="Filter by estate">
              <SelectValue placeholder="All estates" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All estates</SelectItem>
              {estates.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-44">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger aria-label="Filter by status">
              <SelectValue placeholder="Any status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any status</SelectItem>
              {PLOT_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <EmptyState icon={MapPin} title="No plots" body="Add plots or adjust the filters above." />
      ) : (
        <TableShell
          head={
            <>
              <Th>Plot</Th>
              <Th>Estate</Th>
              <Th>Size</Th>
              <Th>Type</Th>
              <Th>Price</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </>
          }
        >
          {filtered.map((r) => (
            <tr key={r.id} className="border-b border-slate-50 last:border-0">
              <Td className="font-semibold text-navy">
                {r.plot_number}
                {r.block_number ? (
                  <span className="text-slate-400"> · Blk {r.block_number}</span>
                ) : null}
              </Td>
              <Td className="text-slate-600">{r.estates?.name ?? "—"}</Td>
              <Td className="text-slate-600">{r.size_sqm} sqm</Td>
              <Td className="capitalize text-slate-600">
                {String(r.property_type).replace(/_/g, " ")}
              </Td>
              <Td className="font-semibold text-navy">{fmtNGN(r.price)}</Td>
              <Td>
                <StatusBadge status={r.status} />
              </Td>
              <Td>
                <div className="flex items-center gap-2">
                  <Select value={r.status} onValueChange={(v) => setStatus(r, v)}>
                    <SelectTrigger className="h-8 w-32" aria-label="Change status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLOT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-rose-600"
                    onClick={() => remove(r)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Td>
            </tr>
          ))}
        </TableShell>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-navy">Add plot</DialogTitle>
          </DialogHeader>
          <form onSubmit={addPlot} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Plot number *">
                <Input
                  value={form.plot_number}
                  onChange={(e) => setForm({ ...form, plot_number: e.target.value })}
                  required
                />
              </Field>
              <Field label="Block number">
                <Input
                  value={form.block_number}
                  onChange={(e) => setForm({ ...form, block_number: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Estate *">
              <Select
                value={form.estate_id}
                onValueChange={(v) => setForm({ ...form, estate_id: v })}
              >
                <SelectTrigger aria-label="Estate">
                  <SelectValue placeholder="Choose estate" />
                </SelectTrigger>
                <SelectContent>
                  {estates.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Location">
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Defaults to estate location"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Size (sqm)">
                <Input
                  type="number"
                  value={form.size_sqm}
                  onChange={(e) => setForm({ ...form, size_sqm: e.target.value })}
                />
              </Field>
              <Field label="Type">
                <Select
                  value={form.property_type}
                  onValueChange={(v) => setForm({ ...form, property_type: v })}
                >
                  <SelectTrigger aria-label="Type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">
                        {t.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Price (₦)">
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </Field>
            </div>
            <Button
              type="submit"
              className="w-full rounded-full bg-gold font-bold text-gold-foreground hover:bg-gold/90"
            >
              Add plot
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </DashCard>
  );
}

/* ============================ ALLOCATIONS ============================ */
export function AllocationsModule() {
  const [rows, setRows] = useState<Row[]>([]);
  const [plots, setPlots] = useState<Row[]>([]);
  const [clients, setClients] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [plotId, setPlotId] = useState("");
  const [userId, setUserId] = useState("");

  async function load() {
    setLoading(true);
    const [a, p, c] = await Promise.all([
      sb()
        .from("plot_allocations")
        .select(
          "*, plots(plot_number, location, block_number, estates(name)), profiles(full_name, email, phone)",
        )
        .order("allocation_date", { ascending: false }),
      sb()
        .from("plots")
        .select("id, plot_number, location, status")
        .eq("status", "available")
        .order("plot_number"),
      sb().from("profiles").select("id, user_id, full_name, email").order("full_name"),
    ]);
    setRows(a.data ?? []);
    setPlots(p.data ?? []);
    setClients(c.data ?? []);
    setLoading(false);
  }
  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, []);

  async function allocate(e: React.FormEvent) {
    e.preventDefault();
    if (!plotId || !userId) return void toast.error("Choose a plot and a client.");
    const { data: auth } = await sb().auth.getUser();
    const { error } = await sb()
      .from("plot_allocations")
      .insert({
        plot_id: plotId,
        user_id: userId,
        allocation_type: "new",
        approval_status: "approved",
        status: "active",
        admin_id: auth?.user?.id ?? null,
      });
    if (error) return void toast.error(error.message);
    await sb().from("plots").update({ status: "allocated" }).eq("id", plotId);
    toast.success("Plot allocated");
    setOpen(false);
    setPlotId("");
    setUserId("");
    load();
  }
  async function deallocate(r: Row) {
    if (!window.confirm("Release this allocation and return the plot to available?")) return;
    await sb().from("plot_allocations").delete().eq("id", r.id);
    await sb().from("plots").update({ status: "available" }).eq("id", r.plot_id);
    toast.success("Allocation released");
    load();
  }

  return (
    <DashCard
      title="Plot allocations"
      description="Which client holds which plot."
      noPadding
      action={
        <Button
          size="sm"
          onClick={() => setOpen(true)}
          className="rounded-full bg-navy font-bold text-white hover:bg-navy/90"
        >
          <Plus className="mr-1 h-4 w-4" /> Allocate plot
        </Button>
      }
    >
      {loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="No allocations yet"
          body="Allocate an available plot to a verified client."
        />
      ) : (
        <TableShell
          head={
            <>
              <Th>Plot</Th>
              <Th>Estate</Th>
              <Th>Client</Th>
              <Th>Status</Th>
              <Th>Allocated</Th>
              <Th>Actions</Th>
            </>
          }
        >
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-slate-50 last:border-0">
              <Td className="font-semibold text-navy">{r.plots?.plot_number ?? "—"}</Td>
              <Td className="text-slate-600">{r.plots?.estates?.name ?? "—"}</Td>
              <Td>
                <div className="font-medium text-navy">{r.profiles?.full_name ?? "—"}</div>
                <div className="text-xs text-slate-500">{r.profiles?.email}</div>
              </Td>
              <Td>
                <StatusBadge status={r.status} />
              </Td>
              <Td className="text-slate-500">{fmtDate(r.allocation_date)}</Td>
              <Td>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-rose-600"
                  onClick={() => deallocate(r)}
                >
                  Release
                </Button>
              </Td>
            </tr>
          ))}
        </TableShell>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-navy">Allocate a plot</DialogTitle>
          </DialogHeader>
          <form onSubmit={allocate} className="space-y-4">
            <Field label="Available plot *">
              <Select value={plotId} onValueChange={setPlotId}>
                <SelectTrigger aria-label="Plot">
                  <SelectValue placeholder="Choose an available plot" />
                </SelectTrigger>
                <SelectContent>
                  {plots.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.plot_number} — {p.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Client *">
              <Select value={userId} onValueChange={setUserId}>
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
            <Button
              type="submit"
              className="w-full rounded-full bg-gold font-bold text-gold-foreground hover:bg-gold/90"
            >
              Allocate plot
            </Button>
            {plots.length === 0 && (
              <p className="text-xs text-amber-600">
                No available plots — mark a plot available first.
              </p>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </DashCard>
  );
}

/* ============================ APPLICATIONS ============================ */
export function ApplicationsModule() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Row | null>(null);
  const [notes, setNotes] = useState("");

  async function load() {
    setLoading(true);
    const { data } = await sb()
      .from("client_applications")
      .select("*")
      .order("created_at", { ascending: false });
    setRows(data ?? []);
    setLoading(false);
  }
  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, []);

  async function review(app: Row, status: "approved" | "rejected") {
    const { data: auth } = await sb().auth.getUser();
    const { error } = await sb()
      .from("client_applications")
      .update({
        status,
        admin_notes: notes || app.admin_notes || null,
        processed_by: auth?.user?.id ?? null,
        processed_at: new Date().toISOString(),
      })
      .eq("id", app.id);
    if (error) return void toast.error(error.message);
    toast.success(`Application ${status}`);
    setSelected(null);
    setNotes("");
    load();
  }

  return (
    <DashCard
      title="Client applications"
      description="Review and process incoming applications."
      noPadding
    >
      {loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No applications"
          body="Applications submitted from the website appear here."
        />
      ) : (
        <TableShell
          head={
            <>
              <Th>Reference</Th>
              <Th>Applicant</Th>
              <Th>Contact</Th>
              <Th>Payment</Th>
              <Th>Status</Th>
              <Th>Received</Th>
              <Th>Actions</Th>
            </>
          }
        >
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-slate-50 last:border-0">
              <Td className="font-mono text-xs text-navy">{r.application_ref_no ?? "—"}</Td>
              <Td className="font-medium text-navy">
                {[r.title, r.first_name, r.surname].filter(Boolean).join(" ")}
              </Td>
              <Td className="text-xs text-slate-500">
                {r.email}
                <br />
                {r.phone_number_1}
              </Td>
              <Td className="capitalize text-slate-600">{r.payment_mode ?? "—"}</Td>
              <Td>
                <StatusBadge status={r.status} />
              </Td>
              <Td className="text-slate-500">{fmtDate(r.created_at)}</Td>
              <Td>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelected(r);
                    setNotes(r.admin_notes ?? "");
                  }}
                >
                  Review
                </Button>
              </Td>
            </tr>
          ))}
        </TableShell>
      )}

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-navy">
              Application {selected?.application_ref_no}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <Detail
                  label="Applicant"
                  value={[selected.title, selected.first_name, selected.other_names, selected.surname]
                    .filter(Boolean)
                    .join(" ")}
                />
                <Detail label="Gender" value={selected.gender} />
                <Detail label="Date of birth" value={fmtDate(selected.date_of_birth)} />
                <Detail label="Nationality" value={selected.nationality} />
                <Detail label="State of origin" value={selected.state_of_origin} />
                <Detail label="Local government" value={selected.local_government_area} />
                <Detail label="Email" value={selected.email} />
                <Detail label="Phone" value={selected.phone_number_1} />
                <Detail label="Alternative phone" value={selected.phone_number_2} />
                <Detail
                  label="Residential address"
                  value={[
                    selected.house_number,
                    selected.street_name,
                    selected.city_town,
                    selected.contact_state,
                  ].filter(Boolean).join(", ")}
                />
                <Detail label="Payment mode" value={selected.payment_mode} />
                <Detail
                  label="Categories"
                  value={(selected.building_categories ?? []).join(", ")}
                />
                <Detail label="Employment status" value={selected.employment_status} />
                <Detail label="Employer" value={selected.employer_name} />
                <Detail label="Position held" value={selected.position_held} />
                <Detail label="Office address" value={selected.office_address} />
                <Detail label="Next of kin" value={selected.nok_name} />
                <Detail label="Next-of-kin phone" value={selected.nok_phone} />
                <Detail label="Next-of-kin relationship" value={selected.nok_relationship} />
                <Detail
                  label="Identity document"
                  value={[selected.id_type, selected.id_number].filter(Boolean).join(" · ")}
                />
                <Detail label="Company application" value={selected.is_company ? "Yes" : "No"} />
                {selected.is_company && <Detail label="Company name" value={selected.company_name} />}
                <Detail label="Received" value={fmtDate(selected.created_at)} />
                <Detail label="Processed" value={fmtDate(selected.processed_at)} />
              </div>
              {selected.passport_url && (
                <a href={selected.passport_url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-navy underline">
                  View passport photograph
                </a>
              )}
              <Field label="Admin notes">
                <Textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Decision notes…"
                />
              </Field>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-emerald-600 font-bold text-white hover:bg-emerald-700"
                  onClick={() => review(selected, "approved")}
                >
                  Approve
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50"
                  onClick={() => review(selected, "rejected")}
                >
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashCard>
  );
}

/* ============================ RESERVATIONS ============================ */
const RESERVATION_STATUSES = ["pending", "contacted", "confirmed", "cancelled"];

export function ReservationsModule() {
  const [rows, setRows] = useState<Row[]>([]);
  const [estates, setEstates] = useState<Row[]>([]);
  const [plots, setPlots] = useState<Row[]>([]);
  const [clients, setClients] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Row | null>(null);
  const [notes, setNotes] = useState("");
  const [estateId, setEstateId] = useState("");
  const [plotId, setPlotId] = useState("");
  const [clientUserId, setClientUserId] = useState("");
  const [reservedUntil, setReservedUntil] = useState("");

  async function load() {
    setLoading(true);
    const [r, e, p, c] = await Promise.all([
      sb().from("reservations").select("*, plots(plot_number, status, estates(id, name))").order("created_at", { ascending: false }),
      sb().from("estates").select("id, name, location").order("name"),
      sb().from("plots").select("id, estate_id, plot_number, block_number, size_sqm, status").in("status", ["available", "on_hold"]).order("plot_number"),
      sb().from("profiles").select("id, user_id, full_name, email").order("full_name"),
    ]);
    setRows(r.data ?? []);
    setEstates(e.data ?? []);
    setPlots(p.data ?? []);
    setClients(c.data ?? []);
    setLoading(false);
  }
  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, []);

  async function setStatus(r: Row, status: string) {
    if (status === "cancelled" && r.plot_id) {
      const { error } = await (supabase as any).rpc("admin_assign_reservation_plot", {
        _reservation_id: r.id,
        _plot_id: null,
        _client_user_id: r.client_user_id ?? null,
        _reserved_until: null,
        _notes: r.admin_notes ?? null,
        _status: status,
      });
      if (error) return void toast.error(error.message);
      toast.success("Reservation cancelled and plot returned to sale");
      return void load();
    }
    const { error } = await sb().from("reservations").update({ status }).eq("id", r.id);
    if (error) return void toast.error(error.message);
    toast.success(`Reservation ${status}`);
    load();
  }
  function openReservation(r: Row) {
    setActive(r);
    setNotes(r.admin_notes ?? "");
    setEstateId(r.estate_id ?? r.plots?.estates?.id ?? "");
    setPlotId(r.plot_id ?? "");
    setClientUserId(r.client_user_id ?? "");
    setReservedUntil(r.reserved_until ?? "");
  }
  async function saveNotes() {
    if (!active) return;
    const { error } = await (supabase as any).rpc("admin_assign_reservation_plot", {
      _reservation_id: active.id,
      _plot_id: plotId || null,
      _client_user_id: clientUserId || null,
      _reserved_until: reservedUntil || null,
      _notes: notes || null,
      _status: plotId ? "confirmed" : active.status,
    });
    if (error) return void toast.error(error.message);
    toast.success(plotId ? "Plot placed on hold for this reservation" : "Reservation updated");
    setActive(null);
    load();
  }
  async function remove(r: Row) {
    if (!window.confirm("Delete this reservation?")) return;
    if (r.plot_id) {
      await (supabase as any).rpc("admin_assign_reservation_plot", {
        _reservation_id: r.id,
        _plot_id: null,
        _client_user_id: r.client_user_id ?? null,
        _reserved_until: null,
        _notes: r.admin_notes ?? null,
        _status: "cancelled",
      });
    }
    await sb().from("reservations").delete().eq("id", r.id);
    toast.success("Reservation deleted");
    load();
  }

  return (
    <DashCard
      title="Reservations"
      description="Property reservation enquiries from the website."
      noPadding
    >
      {loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No reservations"
          body="Reservation enquiries appear here as they arrive."
        />
      ) : (
        <TableShell
          head={
            <>
              <Th>Name</Th>
              <Th>Contact</Th>
              <Th>Interest</Th>
              <Th>Status</Th>
              <Th>Received</Th>
              <Th>Actions</Th>
            </>
          }
        >
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-slate-50 last:border-0">
              <Td className="font-medium text-navy">{r.full_name}</Td>
              <Td className="text-xs text-slate-500">
                {r.email}
                <br />
                {r.phone}
              </Td>
              <Td className="text-slate-600">
                {r.plots?.estates?.name ?? r.property_type ?? "—"}
                {r.plots?.plot_number ? ` · Plot ${r.plots.plot_number}` : r.plot_size ? ` · ${r.plot_size}` : ""}
              </Td>
              <Td>
                <Select value={r.status} onValueChange={(v) => setStatus(r, v)}>
                  <SelectTrigger className="h-8 w-32" aria-label="Status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESERVATION_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Td>
              <Td className="text-slate-500">{fmtDate(r.created_at)}</Td>
              <Td>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openReservation(r)}
                  >
                    Manage
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
              </Td>
            </tr>
          ))}
        </TableShell>
      )}

      <Dialog open={!!active} onOpenChange={(v) => !v && setActive(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-navy">{active?.full_name}</DialogTitle>
          </DialogHeader>
          {active && (
            <div className="space-y-4">
              {active.message && (
                <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
                  “{active.message}”
                </div>
              )}
              <Field label="Link to client account">
                <Select value={clientUserId || "__none__"} onValueChange={(value) => setClientUserId(value === "__none__" ? "" : value)}>
                  <SelectTrigger aria-label="Client account"><SelectValue placeholder="Choose client" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No client account linked</SelectItem>
                    {clients.map((client) => <SelectItem key={client.id} value={client.user_id}>{client.full_name} — {client.email}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Estate">
                  <Select value={estateId || "__none__"} onValueChange={(value) => { setEstateId(value === "__none__" ? "" : value); setPlotId(""); }}>
                    <SelectTrigger aria-label="Estate"><SelectValue placeholder="Choose estate" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No estate selected</SelectItem>
                      {estates.map((estate) => <SelectItem key={estate.id} value={estate.id}>{estate.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Plot to hold">
                  <Select value={plotId || "__none__"} onValueChange={(value) => setPlotId(value === "__none__" ? "" : value)} disabled={!estateId}>
                    <SelectTrigger aria-label="Plot"><SelectValue placeholder="Choose plot" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Release / no plot hold</SelectItem>
                      {plots.filter((plot) => plot.estate_id === estateId && (plot.status === "available" || plot.id === active.plot_id)).map((plot) => (
                        <SelectItem key={plot.id} value={plot.id}>Plot {plot.plot_number}{plot.block_number ? ` · Block ${plot.block_number}` : ""} · {plot.size_sqm} sqm</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Hold until">
                <Input type="date" value={reservedUntil} onChange={(event) => setReservedUntil(event.target.value)} />
              </Field>
              <Field label="Admin notes">
                <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </Field>
              <Button
                onClick={saveNotes}
                className="w-full rounded-full bg-gold font-bold text-gold-foreground hover:bg-gold/90"
              >
                {plotId ? "Save and hold plot" : "Save reservation"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashCard>
  );
}

/* ---------- small shared bits ---------- */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-navy">{value || "—"}</div>
    </div>
  );
}
