"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { users } from "@/lib/mock-data";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";

const threads = [
  {
    id: "m1",
    userId: "u2",
    preview: "I added the decision notes to our shared summary.",
    time: "10m",
    messages: [
      { from: "them", text: "I added the decision notes to our shared summary." },
      { from: "me", text: "Thanks. I can review the open questions after standup." },
      {
        from: "them",
        text: "Great. Please flag anything that needs more context from the group.",
      },
    ],
  },
  {
    id: "m2",
    userId: "u4",
    preview: "Could you review the participation insight wording?",
    time: "1h",
    messages: [
      { from: "them", text: "Could you review the participation insight wording?" },
      { from: "me", text: "Yes. Let's keep it neutral and focused on team patterns." },
    ],
  },
  {
    id: "m3",
    userId: "u5",
    preview: "The source review panel is ready in Documents.",
    time: "Yesterday",
    messages: [
      { from: "them", text: "The source review panel is ready in Documents." },
      { from: "me", text: "Reviewed. The consent scope reads clearly now." },
    ],
  },
];

export default function MessagesPage() {
  const user = useAuthStore((s) => s.user);
  const [active, setActive] = useState(threads[0].id);
  const [draft, setDraft] = useState("");
  const [localMessages, setLocalMessages] = useState(threads);

  const thread = localMessages.find((t) => t.id === active) || localMessages[0];
  const other = users.find((u) => u.id === thread?.userId) || users[1];

  const send = () => {
    if (!draft.trim()) return;
    setLocalMessages((prev) =>
      prev.map((t) =>
        t.id === active
          ? {
              ...t,
              preview: draft,
              messages: [...t.messages, { from: "me" as const, text: draft }],
            }
          : t
      )
    );
    setDraft("");
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 animate-fade-up lg:h-[calc(100vh-8rem)] lg:flex-row">
      <Card className="flex w-full flex-col overflow-hidden lg:w-80">
        <div className="border-b border-border p-4">
          <h1 className="font-display text-lg font-semibold">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {localMessages.map((t) => {
            const u = users.find((x) => x.id === t.userId)!;
            return (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={cn(
                  "flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left hover:bg-muted/50",
                  active === t.id && "bg-[color-mix(in_oklab,var(--primary)_6%,white)]"
                )}
              >
                <Avatar name={u.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2">
                    <p className="truncate text-sm font-medium">{u.name}</p>
                    <span className="text-[11px] text-muted-foreground">{t.time}</span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{t.preview}</p>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="flex min-h-[420px] flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Avatar name={other.name} />
          <div>
            <p className="font-medium">{other.name}</p>
            <p className="text-xs text-muted-foreground">{other.department}</p>
          </div>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {thread.messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                m.from === "me" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
                  m.from === "me"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 border-t border-border p-4">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Message ${other?.name ? other.name.split(" ")[0] : "Teammate"}…`}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <Button onClick={send}>Send</Button>
        </div>
        <p className="px-4 pb-3 text-[11px] text-muted-foreground">
          Signed in as {user?.name}
        </p>
      </Card>
    </div>
  );
}
