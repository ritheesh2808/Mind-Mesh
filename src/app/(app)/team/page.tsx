"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Sparkles, Users, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Label, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { users } from "@/lib/mock-data";
import { useAuthStore } from "@/store/auth-store";
import { useAppStore } from "@/store/app-store";
import type { User } from "@/lib/types";

const QUERY_SKILLS: Record<string, string[]> = {
  "Python + ML": ["Python", "AI/ML", "Data Science", "Deep Learning"],
  "UI/UX + React": ["UI/UX", "React", "Web Development", "TypeScript"],
  Cybersecurity: ["Cybersecurity", "Network Security", "Python"],
};

export default function TeamPage() {
  const user = useAuthStore((s) => s.user);
  const projects = useAppStore((s) => s.projects);
  const sendProjectInvite = useAppStore((s) => s.sendProjectInvite);
  const [query, setQuery] = useState("Python + ML");

  // Invite modal state
  const [invitee, setInvitee] = useState<User | null>(null);
  const [targetProjectId, setTargetProjectId] = useState<string>("");
  const [inviteNote, setInviteNote] = useState("");

  const myProjects = useMemo(() => {
    return projects.filter((p) =>
      p.members.some((m) => m.userId === user?.id || m.userId === "u1")
    );
  }, [projects, user]);

  const teammates = useMemo(() => {
    const ids = new Set<string>();
    projects.forEach((p) => {
      if (p.members.some((m) => m.userId === user?.id || m.userId === "u1")) {
        p.members.forEach((m) => ids.add(m.userId));
      }
    });
    return users.filter((u) => ids.has(u.id) && u.id !== user?.id);
  }, [projects, user]);

  const matches = useMemo(() => {
    const neededSkills = QUERY_SKILLS[query] || ["Python", "AI/ML"];
    return users
      .filter((u) => u.id !== user?.id)
      .map((u) => {
        const overlap = u.skills.filter((s) => neededSkills.includes(s));
        return {
          user: u,
          overlap,
          pct: Math.round(
            (overlap.length / Math.max(neededSkills.length, 1)) * 100
          ),
        };
      })
      .filter((m) => m.pct >= 25)
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 6);
  }, [user?.id, query]);

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitee) return;

    const projId = targetProjectId || myProjects[0]?.id || "p1";
    sendProjectInvite(
      projId,
      user?.id || "u1",
      invitee.id,
      inviteNote || `Hi ${invitee?.name ? invitee.name.split(" ")[0] : "there"}, we would love to have your skills on our project!`
    );

    setInvitee(null);
    setInviteNote("");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Team & Matchmaking</h1>
        <p className="text-sm text-muted-foreground">
          People you collaborate with across Mesh workspaces, plus AI skill matching.
        </p>
      </div>

      {/* Active Teammates */}
      <div>
        <h2 className="font-display text-lg font-semibold flex items-center gap-2 mb-3">
          <Users className="h-5 w-5 text-primary" />
          Current Teammates ({teammates.length})
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teammates.map((u) => (
            <Card key={u.id} className="p-5 shadow-[var(--shadow-sm)] border-border hover:shadow-[var(--shadow-md)] transition">
              <div className="flex items-center gap-3">
                <Avatar name={u.name} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground truncate">{u.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.department}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{u.organization}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {u.skills.slice(0, 4).map((s) => (
                  <Badge key={s} variant="outline" className="text-[10px]">
                    {s}
                  </Badge>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <Link href="/messages">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Message
                  </Button>
                </Link>

                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-8 text-primary"
                  onClick={() => {
                    setInvitee(u);
                    setTargetProjectId(myProjects[0]?.id || "p1");
                  }}
                >
                  Invite to Project
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Smart Matchmaking Section */}
      <Card className="p-6 border-border shadow-[var(--shadow-sm)]">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>

          <div className="flex-1">
            <h2 className="font-display text-lg font-bold">AI Skill Matchmaking</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Recommendations reflect verified skill overlap and cross-functional need — not a punitive compatibility score.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Skill cluster:</span>
              {(["Python + ML", "UI/UX + React", "Cybersecurity"] as const).map(
                (q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuery(q)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                      query === q
                        ? "border-primary bg-[color-mix(in_oklab,var(--primary)_10%,white)] text-primary font-semibold shadow-xs"
                        : "border-border hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    {q}
                  </button>
                )
              )}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {matches.length === 0 ? (
                <p className="col-span-3 text-sm text-muted-foreground py-6 text-center">
                  No candidate matches found for this specific cluster.
                </p>
              ) : (
                matches.map(({ user: u, overlap, pct }) => (
                  <div
                    key={u.id}
                    className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4 hover:border-primary/40 transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={u.name} size="md" />
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{u.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {u.organization}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-display text-base font-bold text-primary">
                            {pct}%
                          </span>
                          <p className="text-[9px] text-muted-foreground uppercase font-bold">match</p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1">
                        {overlap.map((s) => (
                          <Badge key={s} variant="primary" className="text-[10px]">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className="mt-4 w-full gap-1.5 text-xs"
                      onClick={() => {
                        setInvitee(u);
                        setTargetProjectId(myProjects[0]?.id || "p1");
                      }}
                    >
                      <Send className="h-3 w-3" />
                      Invite to Project
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Invite Modal */}
      {invitee && (
        <Modal
          open={!!invitee}
          onClose={() => setInvitee(null)}
          title={`Invite ${invitee.name}`}
          description={`Send an authorized collaboration invitation to ${invitee.name} (${invitee.department}).`}
          className="max-w-md"
        >
          <form onSubmit={handleSendInvite} className="space-y-4">
            <div>
              <Label>Select Project</Label>
              <Select
                value={targetProjectId}
                onChange={(e) => setTargetProjectId(e.target.value)}
              >
                {myProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>Personal note (optional)</Label>
              <Textarea
                value={inviteNote}
                onChange={(e) => setInviteNote(e.target.value)}
                placeholder={`Hi ${invitee?.name ? invitee.name.split(" ")[0] : "there"}, we saw your skill overlap and would love to collaborate on our project!`}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setInvitee(null)}
              >
                Cancel
              </Button>
              <Button type="submit">Send Invitation</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
