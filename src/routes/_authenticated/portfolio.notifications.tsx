import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellRing } from "lucide-react";
import { getMyNotifications, markNotificationRead } from "@/lib/invest.functions";
import { DashCard, EmptyState, fmtDateTime, PageHeader } from "@/components/portfolio/kit";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/portfolio/notifications")({
  component: Notifs,
});

/* eslint-disable @typescript-eslint/no-explicit-any */

function Notifs() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["notifs"], queryFn: () => getMyNotifications() });
  const mut = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifs"] }),
  });
  const rows = (data?.notifications ?? []) as any[];
  const unread = rows.filter((n) => !n.read_at).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={
          unread > 0
            ? `${unread} unread notification${unread === 1 ? "" : "s"}.`
            : "You are all caught up."
        }
      />

      <DashCard noPadding>
        {rows.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications"
            body="Approvals, distributions and account updates will appear here."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {rows.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-4 px-5 py-4 ${n.read_at ? "" : "bg-cream/60"}`}
              >
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    n.read_at ? "bg-slate-100 text-slate-400" : "bg-navy text-gold"
                  }`}
                >
                  {n.read_at ? <Bell className="h-4 w-4" /> : <BellRing className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-navy">{n.title}</div>
                  <div className="mt-0.5 text-sm leading-6 text-slate-600">{n.body}</div>
                  <div className="mt-1 text-xs text-slate-400">{fmtDateTime(n.created_at)}</div>
                </div>
                {!n.read_at && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => mut.mutate({ data: { id: n.id } })}
                    className="shrink-0 text-xs font-bold"
                  >
                    Mark read
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </DashCard>
    </div>
  );
}
