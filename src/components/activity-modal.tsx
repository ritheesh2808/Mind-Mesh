"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { users } from "@/lib/mock-data";
import { useAppStore } from "@/store/app-store";
import { createActivityApi } from "@/lib/api";

const ACTIVITY_TYPES = [
  "Knowledge Sharing Session",
  "Pair Programming",
  "Peer Review",
  "Mini Quiz",
  "Task Reassignment",
  "Discussion",
  "Research Comparison",
];

function getInitialDateTime() {
  const d = new Date();
  d.setHours(d.getHours() + 1);
  return d.toISOString().slice(0, 16);
}

interface ActivityModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  defaults?: {
    type?: string;
    title?: string;
    participants?: string[];
    description?: string;
    duration?: string;
    recommendationId?: string;
  };
}

function ActivityForm({
  projectId,
  defaults,
  onClose,
}: {
  projectId: string;
  defaults?: ActivityModalProps["defaults"];
  onClose: () => void;
}) {
  const createActivity = useAppStore((s) => s.createActivity);
  const markRecommendation = useAppStore((s) => s.markRecommendation);
  const project = useAppStore((s) =>
    s.projects.find((p) => p.id === projectId)
  );

  const memberOptions = useMemo(() => {
    return (project?.members || []).map((m) => {
      const u = users.find((x) => x.id === m.userId);
      return { id: m.userId, name: u?.name || m.userId };
    });
  }, [project]);

  const [type, setType] = useState(() => defaults?.type || ACTIVITY_TYPES[0]);
  const [title, setTitle] = useState(() => defaults?.title || "");
  const [description, setDescription] = useState(() => defaults?.description || "");
  const [duration, setDuration] = useState(() => defaults?.duration || "15 minutes");
  const [dateTime, setDateTime] = useState(getInitialDateTime);
  const [participants, setParticipants] = useState<string[]>(() => {
    if (defaults?.participants && defaults.participants.length > 0) {
      return defaults.participants;
    }
    return memberOptions.slice(0, 3).map((m) => m.id);
  });

  const toggleParticipant = (id: string) => {
    setParticipants((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const submit = () => {
    if (!title.trim()) return;
    const finalDesc = description.trim() || defaults?.description || "";
    createActivity({
      projectId,
      type,
      title: title.trim(),
      description: finalDesc,
      participants,
      dateTime,
      duration,
    });
    createActivityApi({
      project_id: projectId,
      title: title.trim(),
      description: finalDesc,
      type: type.toLowerCase().replace(/\s+/g, "_"),
      participants,
      agenda: [],
    }).catch(() => {});
    if (defaults?.recommendationId) {
      markRecommendation(defaults.recommendationId, "scheduled");
    }
    onClose();
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Activity type</Label>
        <Select value={type} onChange={(e) => setType(e.target.value)}>
          {ACTIVITY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Shared decision-log review"
        />
      </div>
      <div>
        <Label>Participants</Label>
        <div className="flex flex-wrap gap-2">
          {memberOptions.map((m) => {
            const active = participants.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleParticipant(m.id)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                  active
                    ? "border-primary bg-[color-mix(in_oklab,var(--primary)_10%,white)] text-primary font-medium"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {m.name}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What should the team cover?"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Date & time</Label>
          <Input
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
          />
        </div>
        <div>
          <Label>Duration</Label>
          <Input
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="15 minutes"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit}>Create Activity</Button>
      </div>
    </div>
  );
}

export function ActivityModal({
  open,
  onClose,
  projectId,
  defaults,
}: ActivityModalProps) {
  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Activity"
      description="Turn an AI recommendation into a scheduled collaboration activity."
      className="max-w-xl"
    >
      <ActivityForm
        key={defaults?.recommendationId || defaults?.title || "activity-new"}
        projectId={projectId}
        defaults={defaults}
        onClose={onClose}
      />
    </Modal>
  );
}
