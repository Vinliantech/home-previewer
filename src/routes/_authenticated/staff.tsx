import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Clock,
  ExternalLink,
  Loader2,
  LogOut,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  myStaffProfile,
  requestStaffChange,
  updateMyStaffContact,
  STAFF_ROLE_OPTIONS,
} from "@/lib/staff.functions";
import { roleLabel } from "@/lib/roles";
import { DashCard, StatusBadge, fmtDate, fmtDateTime } from "@/components/portfolio/kit";
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

export const Route = createFileRoute("/_authenticated/staff")({
  head: () => ({
    meta: [{ title: "My Profile — Kay-Steph Group" }, { name: "robots", content: "noindex" }],
  }),
  component: StaffProfilePage,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Profile = any;

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-right text-sm font-medium text-navy">{value}</span>
    </div>
  );
}

function StaffProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [savingContact, setSavingContact] = useState(false);
  const [reqRole, setReqRole] = useState("");
  const [reqPosition, setReqPosition] = useState("");
  const [reqNote, setReqNote] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = (await myStaffProfile()) as Profile;
      setProfile(data);
      setPhone(data?.phone ?? "");
      setWhatsapp(data?.whatsapp_number ?? "");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load your profile.");
    }
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function saveContact(e: React.FormEvent) {
    e.preventDefault();
    setSavingContact(true);
    try {
      await updateMyStaffContact({ data: { phone, whatsappNumber: whatsapp } });
      toast.success("Contact details updated");
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your details.");
    }
    setSavingContact(false);
  }

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!reqRole && !reqPosition.trim() && !reqNote.trim()) {
      return void toast.error("Describe what you would like changed.");
    }
    setSendingRequest(true);
    try {
      await requestStaffChange({
        data: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          role: (reqRole || undefined) as any,
          position: reqPosition || undefined,
          note: reqNote || undefined,
        },
      });
      toast.success("Request sent to the administrators");
      setReqRole("");
      setReqPosition("");
      setReqNote("");
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send your request.");
    }
    setSendingRequest(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/admin/auth", replace: true });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7f4]">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7f4] px-4">
        <DashCard title="No staff record" description="This account is not in the staff directory.">
          <p className="text-sm text-slate-600">
            If you were expecting access, ask an administrator to invite you from the Staff page.
          </p>
          <Button className="mt-4" variant="outline" onClick={signOut}>
            <LogOut className="mr-1.5 h-4 w-4" /> Sign out
          </Button>
        </DashCard>
      </div>
    );
  }

  const pending = profile.status === "pending_approval";
  const suspended = profile.status === "suspended";
  const openRequest = (profile.requests ?? []).find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (r: any) => r.status === "pending",
  );

  return (
    <div className="min-h-screen bg-[#f5f7f4] px-4 py-8 md:px-6">
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-serif text-2xl font-semibold text-navy">My profile</p>
            <p className="text-sm text-slate-500">Your Kay-Steph staff record.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-1.5 h-4 w-4" /> Sign out
            </Button>
          </div>
        </header>

        {pending && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Waiting for approval</p>
              <p className="mt-0.5 text-sm text-amber-800">
                Your account is linked and an administrator has been notified. You will not be able
                to open any workspace until they approve your access.
              </p>
            </div>
          </div>
        )}

        {suspended && (
          <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
            <div>
              <p className="text-sm font-semibold text-rose-900">Access suspended</p>
              <p className="mt-0.5 text-sm text-rose-800">
                {profile.rejected_reason ?? "Speak to an administrator if you think this is wrong."}
              </p>
            </div>
          </div>
        )}

        <DashCard
          title="Your details"
          description="Position and access are set by an administrator."
        >
          <Row label="Name" value={profile.full_name} />
          <Row label="Email" value={profile.email} />
          <Row label="Position" value={profile.position || "Not set"} />
          <Row label="Department" value={profile.department || "Not set"} />
          <Row
            label="Access role"
            value={
              (profile.roles ?? []).length ? (
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  {(profile.roles ?? []).map(roleLabel).join(", ")}
                </span>
              ) : profile.intended_role ? (
                <span className="text-slate-500">
                  {roleLabel(profile.intended_role)} — pending approval
                </span>
              ) : (
                <span className="text-slate-500">No access yet</span>
              )
            }
          />
          <Row label="Status" value={<StatusBadge status={profile.status} />} />
          <Row label="Start date" value={profile.started_on ? fmtDate(profile.started_on) : "—"} />
        </DashCard>

        <DashCard
          title="Contact details"
          description="Keep these current — this is how the team reaches you."
        >
          <form onSubmit={saveContact} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Phone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0803 000 0000"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">WhatsApp</Label>
              <Input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="0803 000 0000"
              />
            </div>
            <div className="sm:col-span-2">
              <Button
                type="submit"
                disabled={savingContact}
                className="rounded-full bg-navy font-bold text-white hover:bg-navy/90"
              >
                {savingContact && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Save contact details
              </Button>
            </div>
          </form>
        </DashCard>

        <DashCard
          title="Request a change"
          description="Ask an administrator for a different role or position. Nothing changes until they approve it."
        >
          {openRequest ? (
            <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              <div className="text-sm">
                <p className="font-semibold text-navy">Request pending review</p>
                <p className="mt-0.5 text-slate-600">
                  {[
                    openRequest.requested_role && `Role: ${roleLabel(openRequest.requested_role)}`,
                    openRequest.requested_position && `Position: ${openRequest.requested_position}`,
                  ]
                    .filter(Boolean)
                    .join(" · ") || openRequest.note}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Sent {fmtDateTime(openRequest.created_at)}. Sending a new request replaces it.
                </p>
              </div>
            </div>
          ) : null}

          <form onSubmit={submitRequest} className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Role you need</Label>
              <Select value={reqRole} onValueChange={setReqRole}>
                <SelectTrigger aria-label="Requested role">
                  <SelectValue placeholder="No change" />
                </SelectTrigger>
                <SelectContent>
                  {STAFF_ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {roleLabel(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Position</Label>
              <Input
                value={reqPosition}
                onChange={(e) => setReqPosition(e.target.value)}
                placeholder={profile.position || "Head of Sales"}
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs font-semibold text-slate-600">Why</Label>
              <Textarea
                rows={2}
                value={reqNote}
                onChange={(e) => setReqNote(e.target.value)}
                placeholder="Briefly explain the change you are asking for."
                className="mt-1.5"
              />
            </div>
            <div className="sm:col-span-2">
              <Button
                type="submit"
                disabled={sendingRequest}
                variant="outline"
                className="rounded-full font-bold"
              >
                {sendingRequest ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <BadgeCheck className="mr-1.5 h-4 w-4" />
                )}
                Send request
              </Button>
            </div>
          </form>
        </DashCard>
      </div>
    </div>
  );
}
