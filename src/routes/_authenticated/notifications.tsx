import { createFileRoute } from "@tanstack/react-router";
import { Bell, CheckCircle2, FileText, Landmark } from "lucide-react";
import { Card, PageHeader, PortalShell } from "@/components/portal/PortalShell";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications | Kay-Steph Client Portal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotificationsPage,
});

const items = [
  {
    icon: Landmark,
    title: "Rental distribution received",
    body: "₦220,000 credited from Ruby's Apartment for June 2026.",
    time: "2h ago",
    unread: true,
  },
  {
    icon: FileText,
    title: "New statement available",
    body: "Your June 2026 statement is ready to download.",
    time: "1 day ago",
    unread: true,
  },
  {
    icon: CheckCircle2,
    title: "Contribution approved",
    body: "Your contribution to Lillycrest Terrace was approved.",
    time: "2 weeks ago",
    unread: false,
  },
];

function NotificationsPage() {
  return (
    <PortalShell>
      <PageHeader
        title="Notifications"
        subtitle="Everything happening on your account."
        actions={
          <button className="inline-flex items-center gap-1.5 rounded-md border border-navy/15 bg-white px-3 py-2 text-xs font-bold text-navy hover:bg-cream">
            Mark all read
          </button>
        }
      />
      <Card className="mt-6 p-0">
        <ul className="divide-y divide-navy/5">
          {items.map((n, i) => (
            <li key={i} className={`flex gap-4 px-5 py-4 ${n.unread ? "bg-gold/[0.04]" : ""}`}>
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cream text-navy">
                <n.icon className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-navy">{n.title}</p>
                  {n.unread && <span className="h-2 w-2 rounded-full bg-gold" />}
                </div>
                <p className="mt-0.5 text-sm text-navy/70">{n.body}</p>
                <p className="mt-1 text-[11px] text-navy/40">{n.time}</p>
              </div>
            </li>
          ))}
          {items.length === 0 && (
            <li className="flex items-center justify-center gap-3 px-5 py-10 text-navy/50">
              <Bell className="h-4 w-4" /> No notifications
            </li>
          )}
        </ul>
      </Card>
    </PortalShell>
  );
}
