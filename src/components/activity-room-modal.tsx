"use client";

import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
  BookOpen,
  FileCheck,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/input";
import { getUser } from "@/lib/mock-data";
import { formatDateTime } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { completeActivityApi } from "@/lib/api";
import type { Activity } from "@/lib/types";

interface ActivityRoomModalProps {
  activity: Activity | null;
  open: boolean;
  onClose: () => void;
}

export function ActivityRoomModal({
  activity,
  open,
  onClose,
}: ActivityRoomModalProps) {
  const completeActivity = useAppStore((s) => s.completeActivity);
  const upsertActivity = useAppStore((s) => s.upsertActivity);
  const updateTask = useAppStore((s) => s.updateTask);
  const [takeaways, setTakeaways] = useState("");
  const [notes, setNotes] = useState("");
  const [completedItems, setCompletedItems] = useState<number[]>([]);

  if (!activity || !open) return null;

  const defaultAgenda = [
    `Context Alignment: Review background requirements for ${activity.title}`,
    "Knowledge Exchange: Primary author explains architecture, schemas, and design constraints",
    "Hands-on Walkthrough: Review code segments, evaluation notebooks, or shared documents",
    "Action Items & Handoff: Agree on cross-module integration steps and assigned tasks",
  ];

  const agenda = activity.agendaItems || defaultAgenda;

  const toggleAgendaItem = (idx: number) => {
    setCompletedItems((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleComplete = async () => {
    const finalNotes = notes || "Team convened and aligned on module specifications.";
    const finalTakeaways = takeaways || "Shared context across modules and resolved pending interface questions.";
    completeActivity(activity.id, finalNotes, finalTakeaways);
    const taskIds = activity.linkedTaskId ? [activity.linkedTaskId] : [];
    try {
      const updated = await completeActivityApi(activity.id, finalTakeaways, taskIds, finalNotes);
      if (updated) {
        upsertActivity(updated);
        if (activity.linkedTaskId) {
          updateTask(activity.linkedTaskId, { status: "completed" });
        }
      }
    } catch {}
    onClose();
  };


  const isCompleted = activity.status === "completed";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={activity.title}
      description={`Collaboration Session · ${activity.type}`}
      className="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Top Info Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-3.5 text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">
              {formatDateTime(activity.dateTime)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{activity.duration}</span>
          </div>
          <Badge variant={isCompleted ? "success" : "primary"}>
            {isCompleted ? "Completed" : "Active Session"}
          </Badge>
        </div>

        {/* Participants */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-primary" />
            Collaborators ({activity.participants.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {activity.participants.map((pid) => {
              const u = getUser(pid);
              return (
                <div
                  key={pid}
                  className="flex items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-1 text-xs"
                >
                  <Avatar name={u?.name || pid} size="sm" />
                  <div>
                    <p className="font-semibold text-foreground">{u?.name}</p>
                    <p className="text-[10px] text-muted-foreground">{u?.role}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Objective & Description */}
        <div className="rounded-xl border border-border bg-card p-3.5">
          <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">
            Session Goal
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {activity.description || "Synthesize knowledge across participants and unblock downstream implementation."}
          </p>
        </div>

        {/* Structured Agenda Checklist */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            AI-Guided Session Agenda
          </p>
          <div className="space-y-2">
            {agenda.map((item, idx) => {
              const checked = completedItems.includes(idx) || isCompleted;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleAgendaItem(idx)}
                  className={`w-full flex items-start gap-2.5 rounded-xl border p-2.5 text-left text-xs transition ${
                    checked
                      ? "border-success/40 bg-[color-mix(in_oklab,var(--success)_6%,white)] text-foreground"
                      : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <CheckCircle2
                    className={`h-4 w-4 mt-0.5 shrink-0 ${
                      checked ? "text-success" : "text-muted-foreground/40"
                    }`}
                  />
                  <span className={checked ? "line-through opacity-80" : ""}>
                    {item}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Session Notes & Shared Takeaways */}
        {!isCompleted ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" />
                Session Notes & Working Discussions
              </p>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Log live discussion points, code walkthrough findings, or questions raised..."
                rows={2}
                className="text-xs"
              />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Shared Decisions & Key Takeaways
              </p>
              <Textarea
                value={takeaways}
                onChange={(e) => setTakeaways(e.target.value)}
                placeholder="What consensus did the team reach? E.g., agreed on 96% recall threshold, standardized feature column schema..."
                rows={2}
                className="text-xs"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {activity.notes && (
              <div className="rounded-xl border border-border bg-card p-3.5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  Recorded Notes
                </p>
                <p className="text-xs leading-relaxed text-foreground">
                  {activity.notes}
                </p>
              </div>
            )}
            {activity.takeaways && (
              <div className="rounded-xl border border-success/30 bg-[color-mix(in_oklab,var(--success)_5%,white)] p-3.5">
                <p className="text-xs font-bold uppercase tracking-wider text-success mb-1 flex items-center gap-1.5">
                  <FileCheck className="h-3.5 w-3.5" />
                  Logged Takeaways
                </p>
                <p className="text-xs leading-relaxed text-foreground font-medium">
                  {activity.takeaways}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t border-border pt-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>

          {!isCompleted && (
            <Button
              size="sm"
              className="gap-2 shadow-sm"
              onClick={handleComplete}
            >
              <CheckCircle2 className="h-4 w-4" />
              Conclude & Transfer Knowledge
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
