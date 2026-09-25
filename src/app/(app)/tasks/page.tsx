"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, Filter, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getUser } from "@/lib/mock-data";
import { useAuthStore } from "@/store/auth-store";
import { useAppStore } from "@/store/app-store";
import type { TaskPriority } from "@/lib/types";

const PRIORITY_VARIANTS: Record<TaskPriority, "outline" | "warning" | "danger"> = {
  low: "outline",
  medium: "warning",
  high: "danger",
};

export default function GlobalTasksPage() {
  const user = useAuthStore((s) => s.user);
  const tasks = useAppStore((s) => s.tasks);
  const projects = useAppStore((s) => s.projects);
  const moveTask = useAppStore((s) => s.moveTask);

  const [statusFilter, setStatusFilter] = useState<string>("all");

  const mine = useMemo(() => {
    let list = tasks.filter(
      (t) => t.assigneeId === user?.id || t.assigneeId === "u1"
    );
    if (statusFilter !== "all") {
      list = list.filter((t) => t.status === statusFilter);
    }
    return list;
  }, [tasks, user?.id, statusFilter]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-up">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Assigned Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Track and complete your personal tasks and AI recommendations across all projects.
          </p>
        </div>

        {/* Status filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-muted-foreground mr-1" />
          {(["all", "todo", "in_progress", "review", "completed"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition ${
                statusFilter === st
                  ? "bg-primary text-white shadow-xs"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {mine.length === 0 ? (
          <Card className="p-10 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-success/40" />
            <p className="mt-2 text-sm text-muted-foreground">
              No tasks found for this status.
            </p>
          </Card>
        ) : (
          mine.map((t) => {
            const project = projects.find((p) => p.id === t.projectId);
            const assignee = t.assigneeId ? getUser(t.assigneeId) : null;
            const isCompleted = t.status === "completed";

            return (
              <Card
                key={t.id}
                className="p-4 border-border hover:border-primary/40 transition shadow-[var(--shadow-sm)]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        moveTask(t.id, isCompleted ? "in_progress" : "completed")
                      }
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                        isCompleted
                          ? "border-primary bg-primary text-white"
                          : "border-border hover:border-primary"
                      }`}
                      title={isCompleted ? "Mark in progress" : "Mark completed"}
                    >
                      {isCompleted && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </button>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`font-semibold text-sm ${
                            isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                          }`}
                        >
                          {t.title}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {t.status.replace("_", " ")}
                        </Badge>
                        <Badge variant={PRIORITY_VARIANTS[t.priority]} className="text-[10px]">
                          {t.priority}
                        </Badge>
                        {t.aiSuggested && (
                          <Badge variant="primary" className="text-[10px]">
                            AI Suggested
                          </Badge>
                        )}
                      </div>

                      {t.description && (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                          {t.description}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {project?.name || "Project"}
                        </span>
                        <span>· {assignee?.name || "You"}</span>
                        {t.dueDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Due {t.dueDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Link href={`/projects/${t.projectId}/tasks`}>
                    <button className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline self-end sm:self-center">
                      Board View
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </Link>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
