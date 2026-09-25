"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  Search,
  Sparkles,
  Trash2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { getUser } from "@/lib/mock-data";
import { useAppStore } from "@/store/app-store";
import { createTaskApi, updateTaskApi, deleteTaskApi, getTasks } from "@/lib/api";

import type { TaskPriority, TaskStatus } from "@/lib/types";

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "backlog", label: "Backlog" },
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "completed", label: "Completed" },
];

const PRIORITY_VARIANTS: Record<TaskPriority, "outline" | "warning" | "danger"> = {
  low: "outline",
  medium: "warning",
  high: "danger",
};

export default function TasksPage() {
  const params = useParams();
  const id = params.id as string;
  const project = useAppStore((s) => s.projects.find((p) => p.id === id));
  const allTasks = useAppStore((s) => s.tasks);
  const tasks = useMemo(
    () => allTasks.filter((task) => task.projectId === id),
    [allTasks, id]
  );
  const moveTask = useAppStore((s) => s.moveTask);
  const addTask = useAppStore((s) => s.addTask);
  const syncTasks = useAppStore((s) => s.syncTasks);
  const upsertTask = useAppStore((s) => s.upsertTask);
  const deleteTask = useAppStore((s) => s.deleteTask);
  const addToast = useAppStore((s) => s.addToast);

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (id) {
      getTasks(id)
        .then((fetched) => {
          if (!mounted) return;
          if (fetched && fetched.length > 0) {
            syncTasks(id, fetched);
          }
        })
        .catch(() => {});
    }
    return () => {
      mounted = false;
    };
  }, [id, syncTasks]);

  // New task form state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskAssignee, setTaskAssignee] = useState<string>("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("medium");
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("todo");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskTags, setTaskTags] = useState("");

  const suggested = tasks.filter((t) => t.aiSuggested && t.status !== "completed");

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        !search.trim() ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.description || "").toLowerCase().includes(search.toLowerCase()) ||
        t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
      const matchPriority = priorityFilter === "all" || t.priority === priorityFilter;
      return matchSearch && matchPriority;
    });
  }, [tasks, search, priorityFilter]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const assignee = taskAssignee || project?.members[0]?.userId || "u1";
    const tags = taskTags
      ? taskTags.split(",").map((s) => s.trim()).filter(Boolean)
      : ["sprint"];
    const title = taskTitle.trim();
    const description = taskDesc.trim() || undefined;
    const dueDate = taskDueDate || undefined;
    const priority = taskPriority;
    const status = taskStatus;

    setTaskTitle("");
    setTaskDesc("");
    setTaskTags("");
    setTaskDueDate("");
    setCreateModalOpen(false);

    try {
      const created = await createTaskApi({
        project_id: id,
        title,
        description,
        assignee_id: assignee,
        priority,
        status,
        due_date: dueDate,
        tags,
      });

      if (created) {
        upsertTask(created);
        addToast("Task created successfully", "success");
        return;
      }
    } catch {
      // Fallback to local store
    }

    addTask({
      projectId: id,
      title,
      description,
      assigneeId: assignee,
      priority,
      status,
      dueDate,
      tags,
    });
    addToast("Task created", "success");
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks, tags…"
              className="pl-9"
            />
          </div>
          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-36"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setCreateModalOpen(true)} className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </div>
      </div>

      {/* AI Suggested Banner */}
      {suggested.length > 0 && (
        <Card className="border-[color-mix(in_oklab,var(--primary)_25%,var(--border))] bg-[color-mix(in_oklab,var(--primary)_4%,white)] p-4 shadow-[var(--shadow-sm)] animate-fade-up">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  AI Suggested Task for Collaboration Balance
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  &ldquo;{suggested[0].title}&rdquo; — {suggested[0].description}
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              className="shrink-0"
              onClick={() => {
                addTask({
                  projectId: id,
                  title: "Review the collective summary with a teammate",
                  description: "Pair two teammates to verify source links, add missing context, and resolve an open project question.",
                  status: "todo",
                  priority: "high",
                  tags: ["ai-suggested", "peer-review", "knowledge-sharing"],
                  aiSuggested: true,
                  assigneeId: "u4",
                  dueDate: new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10),
                });
                createTaskApi({
                  project_id: id,
                  title: "Review the collective summary with a teammate",
                  description: "Pair two teammates to verify source links, add missing context, and resolve an open project question.",
                  status: "todo",
                  priority: "high",
                  assignee_id: "u4",
                  due_date: new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10),
                  tags: ["ai-suggested", "peer-review", "knowledge-sharing"],
                }).then((created) => {
                  if (created) upsertTask(created);
                }).catch(() => {});
                addToast("Added AI suggested collaborative task", "success");
              }}
            >
              Add suggested task
            </Button>
          </div>
        </Card>
      )}

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              className="w-80 shrink-0 rounded-2xl border border-border bg-muted/40 p-3.5 flex flex-col"
            >
              {/* Column Header */}
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground">
                    {col.label}
                  </span>
                  <span className="rounded-md bg-card px-2 py-0.5 text-xs font-bold text-muted-foreground border border-border">
                    {colTasks.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTaskStatus(col.id);
                    setCreateModalOpen(true);
                  }}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition"
                  title={`Add task to ${col.label}`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Tasks List */}
              <div className="space-y-2.5 flex-1 min-h-[140px]">
                {colTasks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/80 p-6 text-center text-xs text-muted-foreground">
                    No tasks in {col.label}
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const assignee = task.assigneeId
                      ? getUser(task.assigneeId)
                      : null;

                    return (
                      <Card
                        key={task.id}
                        className="p-3.5 shadow-[var(--shadow-sm)] border-border hover:border-primary/40 transition group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold leading-snug text-foreground">
                            {task.title}
                          </p>
                          <div className="flex items-center gap-1">
                            {task.aiSuggested && (
                              <span title="AI Suggested">
                                <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                deleteTask(task.id);
                                deleteTaskApi(task.id).catch(() => {});
                              }}
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-danger p-0.5 transition"
                              title="Delete task"
                            >

                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {task.description && (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        <div className="mt-2.5 flex flex-wrap gap-1">
                          <Badge variant={PRIORITY_VARIANTS[task.priority]}>
                            {task.priority}
                          </Badge>
                          {task.tags.map((t) => (
                            <Badge key={t} variant="outline" className="text-[10px]">
                              {t}
                            </Badge>
                          ))}
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-xs">
                          <div className="flex items-center gap-1.5">
                            {assignee ? (
                              <>
                                <Avatar name={assignee.name} size="sm" />
                                <span className="text-[11px] text-muted-foreground font-medium">
                                  {assignee.name.split(" ")[0]}
                                </span>
                              </>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">Unassigned</span>
                            )}
                          </div>

                          {task.dueDate && (
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {task.dueDate}
                            </span>
                          )}
                        </div>

                        {/* Status selector directly on the card */}
                        <div className="mt-2.5 pt-1.5 border-t border-border/60 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-muted-foreground font-medium uppercase">
                            Move:
                          </span>
                          <select
                            value={task.status}
                            onChange={(e) => {
                              const newStatus = e.target.value as TaskStatus;
                              moveTask(task.id, newStatus);
                              updateTaskApi(task.id, { status: newStatus }).catch(() => {});
                            }}
                            className="rounded-md border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-foreground hover:bg-muted focus:outline-none"
                          >
                            {COLUMNS.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Task Modal */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add Project Task"
        description="Assign collaborative tasks, specify priorities, and tag workstreams."
        className="max-w-lg"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <Label>Task Title</Label>
            <Input
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g. Implement SHAP attribution visualizer"
              required
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              placeholder="Detail expected inputs, outputs, and dependencies…"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Assignee</Label>
              <Select
                value={taskAssignee}
                onChange={(e) => setTaskAssignee(e.target.value)}
              >
                <option value="">Select member</option>
                {project?.members.map((m) => {
                  const u = getUser(m.userId);
                  return (
                    <option key={m.userId} value={m.userId}>
                      {u?.name || m.userId} ({m.role})
                    </option>
                  );
                })}
              </Select>
            </div>

            <div>
              <Label>Priority</Label>
              <Select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Initial Status</Label>
              <Select
                value={taskStatus}
                onChange={(e) => setTaskStatus(e.target.value as TaskStatus)}
              >
                {COLUMNS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Tags (comma-separated)</Label>
            <Input
              value={taskTags}
              onChange={(e) => setTaskTags(e.target.value)}
              placeholder="e.g. ml, explainability, frontend"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Task</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
