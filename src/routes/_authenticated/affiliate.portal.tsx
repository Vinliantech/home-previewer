import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { LogOut, Home, Loader2, Camera } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createSignedDocumentUrl } from "@/integrations/supabase/edge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmtNaira, fmtDate, memberId, statusPillClass, getYouTubeId } from "@/lib/affiliate";
import { submitAffiliateReferral } from "@/lib/affiliate.functions";

type AffiliateProfile = {
  id: string;
  user_id: string;
  affiliate_code: string;
  member_number: number | null;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
  sort_code: string | null;
  commission_rate: number;
  status: string;
  supervisor_staff_id?: string | null;
  supervisor?: {
    id: string;
    full_name: string;
    position: string | null;
    department: string | null;
    email: string;
    phone: string | null;
  } | null;
};

export const Route = createFileRoute("/_authenticated/affiliate/portal")({
  head: () => ({
    meta: [
      { title: "Affiliate Dashboard — Kay-Steph Group" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AffiliateDashboard,
});

function AffiliateDashboard() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AffiliateProfile | null>(null);
  const [notAffiliate, setNotAffiliate] = useState(false);

  async function loadProfile() {
    const { data } = await (supabase as any)
      .from("affiliate_profiles")
      .select("*, supervisor:staff_members!affiliate_profiles_supervisor_staff_id_fkey(id, full_name, position, department, email, phone)")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!data) {
      setNotAffiliate(true);
    } else {
      setProfile(data as AffiliateProfile);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadProfile(); /* eslint-disable-next-line */
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/affiliate/auth", replace: true });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (notAffiliate) {
    return (
      <div className="min-h-screen bg-background">
        <PortalHeader onSignOut={signOut} />
        <main className="container mx-auto px-4 py-16">
          <Card className="mx-auto max-w-xl border-gold/30 text-center">
            <CardHeader>
              <CardTitle className="font-serif text-navy">Not an affiliate account</CardTitle>
              <CardDescription>
                Your account is not registered as a Kay-Steph affiliate.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Apply through the affiliate portal to start referring clients.
              </p>
              <div className="flex justify-center gap-3">
                <Button asChild variant="outline">
                  <Link to="/">Home</Link>
                </Button>
                <Button asChild className="bg-navy text-white hover:bg-navy/90">
                  <Link to="/affiliate/auth">Apply Now</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader onSignOut={signOut} />
      <AffiliateBody profile={profile!} onProfileChange={loadProfile} />
    </div>
  );
}

function PortalHeader({ onSignOut }: { onSignOut: () => void }) {
  return (
    <header className="border-b border-border bg-navy text-white">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="font-serif text-xl font-semibold">Kay-Steph</div>
          <span className="rounded-full border border-gold/40 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gold">
            Affiliate
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="hidden items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 hover:text-gold sm:inline-flex"
          >
            <Home className="h-4 w-4" /> Home
          </Link>
          <Button
            onClick={onSignOut}
            variant="ghost"
            className="text-white hover:bg-white/10 hover:text-gold"
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}

function AffiliateBody({
  profile,
  onProfileChange,
}: {
  profile: AffiliateProfile;
  onProfileChange: () => void;
}) {
  const [properties, setProperties] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);

  async function reload() {
    const sb = supabase as any;
    const [p, l, c, po, e, lb, tv] = await Promise.all([
      sb.from("available_properties").select("*").eq("is_active", true).order("property_name"),
      sb
        .from("client_leads")
        .select("*")
        .eq("affiliate_id", profile.id)
        .order("created_at", { ascending: false }),
      sb
        .from("commissions")
        .select("*")
        .eq("affiliate_id", profile.id)
        .order("created_at", { ascending: false }),
      sb
        .from("payout_requests")
        .select("*")
        .eq("affiliate_id", profile.id)
        .order("created_at", { ascending: false }),
      sb.rpc("get_affiliate_earnings", { _affiliate_id: profile.id }),
      sb.rpc("get_affiliate_leaderboard"),
      sb
        .from("training_videos")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false }),
    ]);
    if (p.data) setProperties(p.data);
    if (l.data) setLeads(l.data);
    if (c.data) setCommissions(c.data);
    if (po.data) setPayouts(po.data);
    if (e.data && e.data[0]) setEarnings(e.data[0]);
    if (lb.data) setLeaderboard(lb.data);
    if (tv.data) setVideos(tv.data);
  }

  useEffect(() => {
    reload(); /* eslint-disable-next-line */
  }, [profile.id]);

  const myRank = useMemo(
    () => leaderboard.find((r) => r.affiliate_id === profile.id),
    [leaderboard, profile.id],
  );

  const isActive = profile.status === "active";

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold">
            Member {memberId(profile.member_number)} · Code {profile.affiliate_code}
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-navy">
            Welcome, {profile.full_name.split(" ")[0] || "affiliate"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Status: <span className={statusPillClass(profile.status)}>{profile.status}</span>
            {" · "}Commission rate: {profile.commission_rate}%
            {myRank && (
              <>
                {" "}
                · Rank #{myRank.rank} ({myRank.successful_sales} sales)
              </>
            )}
          </p>
        </div>
      </div>

      {!isActive && (
        <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm text-amber-900">
          Your affiliate account is <strong>{profile.status}</strong>. You can complete your profile
          now — referrals and payouts unlock once an admin approves you.
        </div>
      )}

      <div className="mb-8 grid gap-4 grid-cols-2 md:grid-cols-5">
        <Stat label="Rank" value={myRank ? `#${myRank.rank}` : "—"} />
        <Stat label="Successful sales" value={String(myRank?.successful_sales ?? 0)} />
        <Stat label="Total earned" value={fmtNaira(earnings?.total_earned ?? 0)} />
        <Stat label="Available" value={fmtNaira(earnings?.pending_payout ?? 0)} />
        <Stat label="Referrals" value={String(leads.length)} />
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="flex-wrap bg-navy/5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="refer" disabled={!isActive}>
            Refer Client
          </TabsTrigger>
          <TabsTrigger value="leads">My Referrals ({leads.length})</TabsTrigger>
          <TabsTrigger value="commissions">Commissions ({commissions.length})</TabsTrigger>
          <TabsTrigger value="payouts" disabled={!isActive}>
            Payouts ({payouts.length})
          </TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
          <TabsTrigger value="training">Training ({videos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileForm profile={profile} onChange={onProfileChange} />
        </TabsContent>

        <TabsContent value="refer">
          <ReferForm profile={profile} properties={properties} onDone={reload} />
        </TabsContent>

        <TabsContent value="leads">
          <LeadsTable leads={leads} />
        </TabsContent>

        <TabsContent value="commissions">
          <CommissionsTable commissions={commissions} />
        </TabsContent>

        <TabsContent value="payouts">
          <PayoutsPanel profile={profile} payouts={payouts} earnings={earnings} onDone={reload} />
        </TabsContent>

        <TabsContent value="ranking">
          <Leaderboard rows={leaderboard} myId={profile.id} />
        </TabsContent>

        <TabsContent value="training">
          <TrainingList videos={videos} />
        </TabsContent>
      </Tabs>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gold/30 bg-white p-4 shadow-sm">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-serif text-2xl font-semibold text-navy md:text-3xl">{value}</div>
    </div>
  );
}

function ProfileForm({ profile, onChange }: { profile: AffiliateProfile; onChange: () => void }) {
  const [form, setForm] = useState({
    full_name: profile.full_name ?? "",
    phone: profile.phone ?? "",
    bank_name: profile.bank_name ?? "",
    account_name: profile.account_name ?? "",
    account_number: profile.account_number ?? "",
    sort_code: profile.sort_code ?? "",
  });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await (supabase as any)
      .from("affiliate_profiles")
      .update(form)
      .eq("id", profile.id);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    onChange();
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5 MB");
    if (!file.type.startsWith("image/")) return toast.error("Choose an image file");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${profile.user_id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { cacheControl: "3600", upsert: true });
      if (upErr) throw upErr;
      const url = await createSignedDocumentUrl("avatars", path, 60 * 60 * 24 * 365);
      const { error: updErr } = await (supabase as any)
        .from("affiliate_profiles")
        .update({ avatar_url: url })
        .eq("id", profile.id);
      if (updErr) throw updErr;
      toast.success("Photo updated");
      onChange();
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const initials = (profile.full_name || "A")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6">
      <Card className="border-gold/30 bg-navy text-white">
        <CardHeader>
          <CardTitle className="font-serif text-gold">Your Kay-Steph supervisor</CardTitle>
          <CardDescription className="text-white/60">
            The staff member assigned to support your referrals and client follow-up.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profile.supervisor ? (
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p><span className="text-white/50">Name</span><br /><b>{profile.supervisor.full_name}</b></p>
              <p><span className="text-white/50">Role</span><br />{profile.supervisor.position ?? profile.supervisor.department ?? "Affiliate supervisor"}</p>
              <p><span className="text-white/50">Email</span><br /><a className="text-gold underline" href={`mailto:${profile.supervisor.email}`}>{profile.supervisor.email}</a></p>
              <p><span className="text-white/50">Phone</span><br />{profile.supervisor.phone ?? "Available through the office"}</p>
            </div>
          ) : (
            <p className="text-sm text-white/70">A supervisor has not been assigned yet. The affiliate desk will continue to support you.</p>
          )}
        </CardContent>
      </Card>
      <Card className="border-gold/30">
        <CardContent className="flex flex-col items-center gap-6 py-6 sm:flex-row">
          <div className="relative">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="h-28 w-28 rounded-full border-2 border-gold/50 object-cover"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-gold/50 bg-navy font-serif text-3xl text-gold">
                {initials}
              </div>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Member ID</p>
            <p className="font-serif text-2xl text-navy">{memberId(profile.member_number)}</p>
            <p className="mt-1 text-xs text-muted-foreground">JPG or PNG · max 5 MB</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={uploadAvatar}
            />
            <Button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              variant="outline"
              className="mt-3 border-gold text-navy hover:bg-gold hover:text-gold-foreground"
            >
              <Camera className="mr-2 h-4 w-4" />
              {uploading ? "Uploading…" : profile.avatar_url ? "Change photo" : "Upload photo"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gold/30">
        <CardHeader>
          <CardTitle className="font-serif text-navy">Details & payout bank</CardTitle>
          <CardDescription>
            Keep these current — we pay commissions to the bank details below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
            <Field
              label="Full name"
              value={form.full_name}
              onChange={(v) => setForm({ ...form, full_name: v })}
            />
            <Field
              label="Phone"
              value={form.phone}
              onChange={(v) => setForm({ ...form, phone: v })}
            />
            <div className="space-y-2 md:col-span-2">
              <Label>Email</Label>
              <Input value={profile.email} disabled />
            </div>
            <div className="md:col-span-2 pt-2 text-xs uppercase tracking-widest text-gold">
              Payout Bank Details
            </div>
            <Field
              label="Bank name"
              value={form.bank_name}
              onChange={(v) => setForm({ ...form, bank_name: v })}
            />
            <Field
              label="Account name"
              value={form.account_name}
              onChange={(v) => setForm({ ...form, account_name: v })}
            />
            <Field
              label="Account number"
              value={form.account_number}
              onChange={(v) => setForm({ ...form, account_number: v })}
            />
            <Field
              label="Sort code (optional)"
              value={form.sort_code}
              onChange={(v) => setForm({ ...form, sort_code: v })}
            />
            <Button type="submit" className="md:col-span-2 bg-navy text-white hover:bg-navy/90">
              Save profile
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ReferForm({
  profile,
  properties,
  onDone,
}: {
  profile: AffiliateProfile;
  properties: any[];
  onDone: () => void;
}) {
  const [f, setF] = useState({
    client_full_name: "",
    client_email: "",
    client_phone: "",
    property_of_interest: "",
    client_budget_min: "",
    client_budget_max: "",
    client_requirements: "",
    contact_method: "phone",
  });
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    // Goes through the server so the referral is recorded AND handed to the CRM
    // pipeline (dedupe, adviser assignment, follow-up task) in one step.
    try {
      await submitAffiliateReferral({
        data: {
          clientFullName: f.client_full_name,
          clientEmail: f.client_email,
          clientPhone: f.client_phone,
          propertyOfInterest: f.property_of_interest || undefined,
          clientBudgetMin: f.client_budget_min ? Number(f.client_budget_min) : null,
          clientBudgetMax: f.client_budget_max ? Number(f.client_budget_max) : null,
          clientRequirements: f.client_requirements || undefined,
          contactMethod: f.contact_method,
        },
      });
    } catch (error) {
      setSubmitting(false);
      return toast.error(
        error instanceof Error ? error.message : "The referral could not be submitted.",
      );
    }
    setSubmitting(false);
    toast.success("Referral submitted — an adviser will follow up.");
    setF({
      client_full_name: "",
      client_email: "",
      client_phone: "",
      property_of_interest: "",
      client_budget_min: "",
      client_budget_max: "",
      client_requirements: "",
      contact_method: "phone",
    });
    onDone();
  }

  return (
    <Card className="border-gold/30">
      <CardHeader>
        <CardTitle className="font-serif text-navy">Refer a new client</CardTitle>
        <CardDescription>
          Kay-Steph will follow up and confirm the sale. Approved sales earn you{" "}
          {profile.commission_rate}% commission.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <Field
            label="Client full name"
            value={f.client_full_name}
            onChange={(v) => setF({ ...f, client_full_name: v })}
          />
          <Field
            label="Client email"
            value={f.client_email}
            onChange={(v) => setF({ ...f, client_email: v })}
          />
          <Field
            label="Client phone"
            value={f.client_phone}
            onChange={(v) => setF({ ...f, client_phone: v })}
          />
          <div className="space-y-2">
            <Label>Preferred contact method</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
              value={f.contact_method}
              onChange={(e) => setF({ ...f, contact_method: e.target.value })}
            >
              <option value="phone">Phone call</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Property of interest</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={f.property_of_interest}
              onChange={(e) => setF({ ...f, property_of_interest: e.target.value })}
            >
              <option value="">— Select or leave blank —</option>
              {properties.map((p) => (
                <option key={p.id} value={p.property_name}>
                  {p.property_name} · {p.location}
                </option>
              ))}
            </select>
          </div>
          <Field
            label="Budget min (₦)"
            value={f.client_budget_min}
            onChange={(v) => setF({ ...f, client_budget_min: v })}
          />
          <Field
            label="Budget max (₦)"
            value={f.client_budget_max}
            onChange={(v) => setF({ ...f, client_budget_max: v })}
          />
          <div className="space-y-2 md:col-span-2">
            <Label>Client requirements</Label>
            <Textarea
              rows={3}
              value={f.client_requirements}
              onChange={(e) => setF({ ...f, client_requirements: e.target.value })}
            />
          </div>
          <Button
            type="submit"
            disabled={submitting}
            className="md:col-span-2 bg-gold text-gold-foreground hover:bg-gold/90"
          >
            {submitting ? "Submitting…" : "Submit Referral"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function LeadsTable({ leads }: { leads: any[] }) {
  return (
    <Card className="border-gold/30">
      <CardHeader>
        <CardTitle className="font-serif text-navy">My referrals</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((l) => (
              <TableRow key={l.id}>
                <TableCell>{fmtDate(l.submission_date)}</TableCell>
                <TableCell className="font-medium">{l.client_full_name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {l.client_email}
                  <br />
                  {l.client_phone}
                </TableCell>
                <TableCell>{l.property_of_interest || "—"}</TableCell>
                <TableCell>
                  <span className={statusPillClass(l.status)}>{l.status}</span>
                </TableCell>
              </TableRow>
            ))}
            {!leads.length && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No referrals yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function CommissionsTable({ commissions }: { commissions: any[] }) {
  return (
    <Card className="border-gold/30">
      <CardHeader>
        <CardTitle className="font-serif text-navy">Commissions</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sale date</TableHead>
              <TableHead>Sale</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commissions.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{fmtDate(c.sale_date)}</TableCell>
                <TableCell>{fmtNaira(c.sale_amount)}</TableCell>
                <TableCell>{c.commission_rate}%</TableCell>
                <TableCell className="font-medium text-navy">
                  {fmtNaira(c.commission_amount)}
                </TableCell>
                <TableCell>
                  <span className={statusPillClass(c.status)}>{c.status}</span>
                </TableCell>
              </TableRow>
            ))}
            {!commissions.length && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No commissions yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function PayoutsPanel({
  profile,
  payouts,
  earnings,
  onDone,
}: {
  profile: AffiliateProfile;
  payouts: any[];
  earnings: any;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function request(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (earnings && amt > Number(earnings.pending_payout))
      return toast.error("Amount exceeds approved balance");
    setSubmitting(true);
    const { error } = await (supabase as any).from("payout_requests").insert({
      affiliate_id: profile.id,
      requested_amount: amt,
      bank_details: {
        bank_name: profile.bank_name,
        account_name: profile.account_name,
        account_number: profile.account_number,
        sort_code: profile.sort_code,
      },
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Payout requested");
    setAmount("");
    onDone();
  }

  return (
    <div className="space-y-6">
      <Card className="border-gold/30">
        <CardHeader>
          <CardTitle className="font-serif text-navy">Request payout</CardTitle>
          <CardDescription>
            Available balance: <strong>{fmtNaira(earnings?.pending_payout ?? 0)}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={request} className="flex flex-col gap-3 sm:flex-row">
            <Input
              type="number"
              min="1"
              placeholder="Amount (₦)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="sm:max-w-xs"
            />
            <Button
              type="submit"
              disabled={submitting}
              className="bg-gold text-gold-foreground hover:bg-gold/90"
            >
              {submitting ? "Requesting…" : "Request Payout"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-gold/30">
        <CardHeader>
          <CardTitle className="font-serif text-navy">Payout history</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Requested</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Processed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{fmtDate(p.requested_at)}</TableCell>
                  <TableCell className="font-medium">{fmtNaira(p.requested_amount)}</TableCell>
                  <TableCell>
                    <span className={statusPillClass(p.status)}>{p.status}</span>
                  </TableCell>
                  <TableCell>{fmtDate(p.processed_at)}</TableCell>
                </TableRow>
              ))}
              {!payouts.length && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    No payouts yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Leaderboard({ rows, myId }: { rows: any[]; myId: string }) {
  return (
    <Card className="border-gold/30">
      <CardHeader>
        <CardTitle className="font-serif text-navy">Live leaderboard</CardTitle>
        <CardDescription>Ranked by successful sales, then total sales value.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Sales</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Earned</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.affiliate_id} className={r.affiliate_id === myId ? "bg-gold/5" : ""}>
                <TableCell className="font-serif text-lg text-gold">#{r.rank}</TableCell>
                <TableCell>
                  <div className="font-medium text-navy">{r.full_name}</div>
                  <div className="text-xs text-muted-foreground">{memberId(r.member_number)}</div>
                </TableCell>
                <TableCell>{r.successful_sales}</TableCell>
                <TableCell>{fmtNaira(r.total_sales_amount)}</TableCell>
                <TableCell>{fmtNaira(r.total_earned)}</TableCell>
              </TableRow>
            ))}
            {!rows.length && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No leaderboard data yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function TrainingList({ videos }: { videos: any[] }) {
  if (!videos.length) {
    return (
      <Card className="border-gold/30">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No training videos yet.
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {videos.map((v) => {
        const id = getYouTubeId(v.youtube_url);
        return (
          <Card key={v.id} className="overflow-hidden border-gold/30">
            {id && (
              <div className="aspect-video bg-black">
                <iframe
                  title={v.title}
                  src={`https://www.youtube.com/embed/${id}`}
                  className="h-full w-full"
                  allowFullScreen
                />
              </div>
            )}
            <CardHeader>
              <CardTitle className="font-serif text-lg text-navy">{v.title}</CardTitle>
              <CardDescription className="text-xs uppercase tracking-widest text-gold">
                {v.category}
              </CardDescription>
            </CardHeader>
            {v.description && (
              <CardContent className="text-sm text-muted-foreground">{v.description}</CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
