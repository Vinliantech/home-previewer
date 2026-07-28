import { createFileRoute } from "@tanstack/react-router";
import { useClientFn } from "@/lib/client-function";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, Copy, MapPin, Plus, UsersRound, Video } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate, type CrmEvent } from "@/lib/crm";
import { createCrmEvent } from "@/lib/crm.functions";
import { CrmPageHeader, EmptyState, Panel } from "@/components/crm/CrmUi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/crm/events")({
  component: EventsWorkspace,
});

type Registration = { event_id: string; status: string };

function EventsWorkspace() {
  const [events, setEvents] = useState<CrmEvent[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [view, setView] = useState<"upcoming" | "completed" | "draft" | "all">("upcoming");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [eventResult, registrationResult] = await Promise.all([
      supabase.from("crm_events").select("*").order("starts_at", { ascending: true }),
      supabase.from("event_registrations").select("event_id, status"),
    ]);
    setRegistrations((registrationResult.data ?? []) as Registration[]);
    setEvents(
      ((eventResult.data ?? []) as unknown as CrmEvent[]).map((event) => ({
        ...event,
        registration_count: (registrationResult.data ?? []).filter(
          (item) => item.event_id === event.id,
        ).length,
        attendance_count: (registrationResult.data ?? []).filter(
          (item) => item.event_id === event.id && item.status === "attended",
        ).length,
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = useMemo(
    () =>
      events.filter((event) => {
        if (view === "all") return true;
        if (view === "completed") return event.status === "completed";
        if (view === "draft") return event.status === "draft";
        return event.status === "published" && new Date(event.starts_at).getTime() >= Date.now();
      }),
    [events, view],
  );

  const upcomingRegistrations = events
    .filter((event) => event.status === "published")
    .reduce((sum, event) => sum + (event.registration_count ?? 0), 0);
  const totalAttended = events.reduce((sum, event) => sum + (event.attendance_count ?? 0), 0);

  async function copyLink(event: CrmEvent) {
    const url = `${window.location.origin}/events/${event.id}`;
    await navigator.clipboard.writeText(url);
    toast.success("Registration link copied.");
  }

  return (
    <div className="space-y-5">
      <CrmPageHeader
        eyebrow="Events and workshops"
        title="Turn registrations into qualified conversations"
        description="Manage webinars, property presentations, investor workshops and site inspections from registration through post-event follow-up."
        actions={<NewEventDialog onCreated={refresh} />}
      />

      <div className="grid grid-cols-3 gap-3">
        <Summary
          label="Published events"
          value={events.filter((event) => event.status === "published").length}
          icon={CalendarDays}
        />
        <Summary label="Upcoming registrations" value={upcomingRegistrations} icon={UsersRound} />
        <Summary label="Recorded attendance" value={totalAttended} icon={Check} />
      </div>

      <div className="flex gap-1 overflow-x-auto border border-[#dfe4df] bg-white p-2">
        {(["upcoming", "completed", "draft", "all"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setView(item)}
            className={`rounded-md px-4 py-2 text-[11px] font-semibold capitalize ${view === item ? "bg-[#0b5748] text-white" : "text-[#63716b] hover:bg-[#f1f4f2]"}`}
          >
            {item}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-[#718079]">Loading events...</div>
      ) : filtered.length === 0 ? (
        <div className="border border-[#dfe4df] bg-white">
          <EmptyState
            title="No events in this view"
            body="Create an event or choose another event status."
          />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((event) => {
            const attendance = event.registration_count
              ? Math.round(((event.attendance_count ?? 0) / event.registration_count) * 100)
              : 0;
            return (
              <article key={event.id} className="border border-[#dfe4df] bg-white">
                <div className="flex items-start justify-between gap-3 border-b border-[#e7ebe8] p-4">
                  <div>
                    <span
                      className={`inline-flex rounded px-2 py-1 text-[9px] font-semibold uppercase tracking-wider ${event.status === "published" ? "bg-emerald-50 text-emerald-800" : event.status === "completed" ? "bg-slate-100 text-slate-700" : "bg-amber-50 text-amber-800"}`}
                    >
                      {event.status}
                    </span>
                    <h2 className="mt-3 text-base font-semibold text-[#173f36]">{event.name}</h2>
                    <p className="mt-1 text-xs capitalize text-[#7a8580]">
                      {event.event_type.replaceAll("_", " ")}
                      {event.property_name ? ` · ${event.property_name}` : ""}
                    </p>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#edf4f1] text-[#0b5748]">
                    {event.meeting_url ? (
                      <Video className="h-5 w-5" />
                    ) : (
                      <MapPin className="h-5 w-5" />
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 p-4 text-xs">
                  <Detail label="Date and time" value={fmtDate(event.starts_at)} />
                  <Detail
                    label="Venue"
                    value={event.venue ?? (event.meeting_url ? "Online" : "To be confirmed")}
                  />
                  <Detail
                    label="Registrations"
                    value={`${event.registration_count ?? 0}${event.capacity ? ` of ${event.capacity}` : ""}`}
                  />
                  <Detail
                    label="Attendance"
                    value={
                      event.status === "completed"
                        ? `${event.attendance_count ?? 0} (${attendance}%)`
                        : "Pending event"
                    }
                  />
                </div>
                {event.description && (
                  <p className="border-t border-[#e7ebe8] px-4 py-3 text-xs leading-5 text-[#65726c]">
                    {event.description}
                  </p>
                )}
                <div className="flex items-center gap-2 border-t border-[#e7ebe8] px-4 py-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 border-[#ccd6d1] text-xs text-[#315149]"
                    onClick={() => void copyLink(event)}
                  >
                    <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy registration link
                  </Button>
                  <span className="ml-auto text-[10px] text-[#84908b]">
                    {
                      registrations.filter(
                        (item) =>
                          item.event_id === event.id && item.status === "follow_up_required",
                      ).length
                    }{" "}
                    require follow-up
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Panel
        title="Registration workflow"
        description="Every status can trigger reminders, tasks or adviser notifications."
      >
        <div className="grid gap-px bg-[#e2e7e4] sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {[
            "Registered",
            "Confirmed",
            "Reminder sent",
            "Attended",
            "Did not attend",
            "Cancelled",
            "Follow-up required",
          ].map((status, index) => (
            <div key={status} className="bg-white p-4">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#8a948f]">
                {String(index + 1).padStart(2, "0")}
              </p>
              <p className="mt-1 text-xs font-semibold text-[#3d5049]">{status}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function NewEventDialog({ onCreated }: { onCreated: () => void }) {
  const create = useClientFn(createCrmEvent);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    eventType: "property_presentation",
    propertyName: "",
    startsAt: "",
    endsAt: "",
    venue: "",
    meetingUrl: "",
    capacity: "",
    description: "",
    status: "draft" as "draft" | "published",
  });
  const set = (field: keyof typeof form, value: string) =>
    setForm((previous) => ({ ...previous, [field]: value }));
  async function submit() {
    if (!form.name || !form.startsAt) return toast.error("Event name and start time are required.");
    setBusy(true);
    try {
      await create({
        data: {
          name: form.name,
          eventType: form.eventType,
          propertyName: form.propertyName,
          startsAt: new Date(form.startsAt).toISOString(),
          endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
          venue: form.venue,
          meetingUrl: form.meetingUrl,
          capacity: form.capacity ? Number(form.capacity) : undefined,
          description: form.description,
          status: form.status,
        },
      });
      toast.success("Event created.");
      setOpen(false);
      onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Event could not be created.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#0b5748] text-white hover:bg-[#08483c]">
          <Plus className="mr-2 h-4 w-4" /> Create event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-[#dce2de] bg-white text-[#263f38]">
        <DialogHeader>
          <DialogTitle>Create event or workshop</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Event name">
              <Input value={form.name} onChange={(event) => set("name", event.target.value)} />
            </Field>
          </div>
          <Field label="Event type">
            <Select value={form.eventType} onValueChange={(value) => set("eventType", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  { v: "property_presentation", l: "Property presentation" },
                  { v: "webinar", l: "Webinar" },
                  { v: "workshop", l: "Investment workshop" },
                  { v: "site_inspection", l: "Site inspection" },
                  { v: "private_briefing", l: "Private briefing" },
                ].map((item) => (
                  <SelectItem key={item.v} value={item.v}>
                    {item.l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Property">
            <Input
              value={form.propertyName}
              onChange={(event) => set("propertyName", event.target.value)}
            />
          </Field>
          <Field label="Starts">
            <Input
              type="datetime-local"
              value={form.startsAt}
              onChange={(event) => set("startsAt", event.target.value)}
            />
          </Field>
          <Field label="Ends">
            <Input
              type="datetime-local"
              value={form.endsAt}
              onChange={(event) => set("endsAt", event.target.value)}
            />
          </Field>
          <Field label="Venue">
            <Input value={form.venue} onChange={(event) => set("venue", event.target.value)} />
          </Field>
          <Field label="Meeting URL">
            <Input
              type="url"
              value={form.meetingUrl}
              onChange={(event) => set("meetingUrl", event.target.value)}
            />
          </Field>
          <Field label="Capacity">
            <Input
              type="number"
              min="1"
              value={form.capacity}
              onChange={(event) => set("capacity", event.target.value)}
            />
          </Field>
          <Field label="Initial status">
            <Select value={form.status} onValueChange={(value) => set("status", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Description">
              <Textarea
                rows={4}
                value={form.description}
                onChange={(event) => set("description", event.target.value)}
              />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={busy}
            className="bg-[#0b5748] text-white hover:bg-[#08483c]"
          >
            {busy ? "Creating..." : "Create event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Summary({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof CalendarDays;
}) {
  return (
    <div className="flex items-center gap-3 border border-[#dfe4df] bg-white p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#edf4f1] text-[#0b5748]">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-xl font-semibold text-[#173f36]">{value}</p>
        <p className="text-[10px] uppercase tracking-wider text-[#7a8580]">{label}</p>
      </div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6f7c76]">
        {label}
      </Label>
      {children}
    </div>
  );
}
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8a948f]">{label}</p>
      <p className="mt-1 text-xs font-medium text-[#3d5049]">{value}</p>
    </div>
  );
}
