"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatRelative } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const router = useRouter();
  const notifications = useAppStore((s) => s.notifications);
  const markRead = useAppStore((s) => s.markNotificationRead);
  const markAll = useAppStore((s) => s.markAllNotificationsRead);

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-up">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Invitations, tasks, insights, and activity reminders.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={markAll}>
          Mark all read
        </Button>
      </div>

      <div className="space-y-2">
        {notifications.map((n) => (
          <Card
            key={n.id}
            className={cn(
              "cursor-pointer p-4 transition hover:shadow-[var(--shadow-md)]",
              !n.read && "border-primary/30 bg-[color-mix(in_oklab,var(--primary)_4%,white)]"
            )}
            onClick={() => {
              markRead(n.id);
              if (n.href) router.push(n.href);
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatRelative(n.createdAt)}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
