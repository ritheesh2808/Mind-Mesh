"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ProgressBar } from "@/components/ui/misc";
import { ActivityRoomModal } from "@/components/activity-room-modal";
import { getUser } from "@/lib/mock-data";
import { formatDateTime, formatRelative } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { getActivities } from "@/lib/api";
import type { Activity } from "@/lib/types";

export default function ProjectOverviewPage() {
  const params = useParams();
  const id = params.id as string;
  const project = useAppStore((s) => s.projects.find((p) => p.id === id));
  const allFeed = useAppStore((s) => s.activityFeed);
  const allActivities = useAppStore((s) => s.activities);
  const syncActivities = useAppStore((s) => s.syncActivities);

  useEffect(() => {
    let mounted = true;
    if (id) {
      getActivities(id)
        .then((fetched) => {
          if (!mounted) return;
          if (fetched && fetched.length > 0) {
            syncActivities(id, fetched);
          }
        })
        .catch(() => {});
    }
    return () => {
      mounted = false;
    };
  }, [id, syncActivities]);
  const feed = useMemo(
    () => allFeed.filter((item) => item.projectId === id),
    [allFeed, id]
  );
  const activities = useMemo(
    () => allActivities.filter((activity) => activity.projectId === id),
    [allActivities, id]
  );
  const [activeSession, setActiveSession] = useState<Activity | null>(null);

  if (!project) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <p className="font-display text-4xl font-semibold">{project.progress}%</p>
              <p className="text-sm text-muted-foreground">Project completion</p>
            </div>
            <ProgressBar value={project.progress} className="mt-4 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Milestones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {project.milestones.map((m, i) => (
              <div key={m.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={`h-3 w-3 rounded-full ${
                      m.completed ? "bg-primary" : "bg-muted border border-border"
                    }`}
                  />
                  {i < project.milestones.length - 1 && (
                    <span className="mt-1 w-px flex-1 bg-border" />
                  )}
                </div>
                <div className="pb-4">
                  <p className={`text-sm font-medium ${m.completed ? "text-muted-foreground line-through" : ""}`}>
                    {m.title}
                  </p>
                  <p className="text-xs text-muted-foreground">Due {m.dueDate}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {activities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Activities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activities.map((a) => {
                const isDone = a.status === "completed";
                return (
                  <div
                    key={a.id}
                    className="rounded-xl border border-border bg-muted/40 p-4 transition hover:border-primary/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={isDone ? "success" : "primary"}>
                          {isDone ? "Completed" : a.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {a.duration}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant={isDone ? "outline" : "soft"}
                        className="text-xs h-7 gap-1"
                        onClick={() => setActiveSession(a)}
                      >
                        {isDone ? "View Takeaways" : "Join Session"}
                      </Button>
                    </div>
                    <p className="mt-2 font-medium">{a.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDateTime(a.dateTime)} ·{" "}
                      {a.participants.length} participants
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {project.members.map((m) => {
              const u = getUser(m.userId);
              return (
                <div key={m.userId} className="flex items-center gap-3">
                  <Avatar name={u?.name || m.userId} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{u?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.role} · {m.contribution}% contribution
                    </p>
                  </div>
                  <div className="hidden flex-wrap justify-end gap-1 sm:flex">
                    {u?.skills.slice(0, 2).map((s) => (
                      <Badge key={s} variant="outline">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {feed.slice(0, 6).map((item) => {
              const u = getUser(item.userId);
              return (
                <div key={item.id} className="flex gap-3">
                  <Avatar name={u?.name || "User"} size="sm" />
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">{u?.name}</span>{" "}
                      <span className="text-muted-foreground">{item.action}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelative(item.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <ActivityRoomModal
        activity={activeSession}
        open={!!activeSession}
        onClose={() => setActiveSession(null)}
      />
    </div>
  );
}

