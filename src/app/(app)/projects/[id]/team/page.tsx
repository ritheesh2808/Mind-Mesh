"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Code2, Link2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ProgressBar } from "@/components/ui/misc";
import { getUser, users } from "@/lib/mock-data";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";

export default function ProjectTeamPage() {
  const params = useParams();
  const id = params.id as string;
  const project = useAppStore((s) => s.projects.find((p) => p.id === id));
  const allTasks = useAppStore((s) => s.tasks);
  const tasks = useMemo(
    () => allTasks.filter((task) => task.projectId === id),
    [allTasks, id]
  );
  const sendProjectInvite = useAppStore((s) => s.sendProjectInvite);
  const invitations = useAppStore((s) => s.invitations);
  const currentUser = useAuthStore((s) => s.user);
  const [showMatches, setShowMatches] = useState(false);

  const neededSkills = useMemo(() => {
    if (!project) return ["Python", "AI/ML"];
    const covered = new Set(
      project.members.flatMap((m) => getUser(m.userId)?.skills || [])
    );
    return project.skillsRequired.filter((s) => !covered.has(s)).slice(0, 2)
      .length
      ? project.skillsRequired.filter((s) => {
          const count = project.members.filter((m) =>
            getUser(m.userId)?.skills.includes(s)
          ).length;
          return count <= 1;
        }).slice(0, 2)
      : ["Python", "ML"];
  }, [project]);

  const matches = useMemo(() => {
    if (!project) return [];
    const memberIds = new Set(project.members.map((m) => m.userId));
    return users
      .filter((u) => !memberIds.has(u.id))
      .map((u) => {
        const overlap = u.skills.filter((s) =>
          project.skillsRequired.includes(s)
        );
        const pct = Math.round(
          (overlap.length / Math.max(project.skillsRequired.length, 1)) * 100
        );
        return { user: u, overlap, pct };
      })
      .filter((m) => m.pct > 0)
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 4);
  }, [project]);

  if (!project) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {project.members.map((m) => {
          const u = getUser(m.userId) || {
            id: m.userId,
            name: m.userId === currentUser?.id ? currentUser.name : (m.role ? `${m.role} Member` : `Member (${m.userId})`),
            email: "",
            avatar: "",
            role: m.role || "Contributor",
            skills: project.skillsRequired.slice(0, 3),
            organization: project.college || "Mind-Mesh Team",
            department: "Engineering",
            batch: "2026",
            projectsCount: 1,
            contributionsCount: 1,
            reputation: 100,
            github: undefined,
            linkedin: undefined,
          };
          const memberTasks = tasks.filter(
            (t) => t.assigneeId === m.userId && t.status !== "completed"
          );
          return (
            <Card key={m.userId} className="p-5">
              <div className="flex items-start gap-3">
                <Avatar name={u.name} size="lg" />
                <div>
                  <p className="font-semibold">{u.name}</p>
                  <p className="text-sm text-muted-foreground">{m.role}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {u.skills.slice(0, 4).map((s) => (
                  <Badge key={s} variant="outline">
                    {s}
                  </Badge>
                ))}
              </div>
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-muted-foreground">Contribution</span>
                  <span className="font-medium">{m.contribution}%</span>
                </div>
                <ProgressBar value={m.contribution} />
              </div>
              <div className="mt-4">
                <p className="text-xs font-medium text-muted-foreground">
                  Current tasks
                </p>
                <ul className="mt-1 space-y-1">
                  {memberTasks.length === 0 ? (
                    <li className="text-sm text-muted-foreground">None active</li>
                  ) : (
                    memberTasks.slice(0, 2).map((t) => (
                      <li key={t.id} className="truncate text-sm">
                        {t.title}
                      </li>
                    ))
                  )}
                </ul>
              </div>
              <div className="mt-4 flex gap-2">
                {u.github && (
                  <a href={u.github} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <Code2 className="h-3.5 w-3.5" />
                      GitHub
                    </Button>
                  </a>
                )}
                {u.linkedin && (
                  <a href={u.linkedin} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <Link2 className="h-3.5 w-3.5" />
                      LinkedIn
                    </Button>
                  </a>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Find Teammates
            </p>
            <p className="mt-1 font-display text-lg font-semibold">
              You need someone with {neededSkills.join(" + ")}.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Recommendations based on skill overlap — not a guaranteed compatibility score.
            </p>
          </div>
          <Button
            className="gap-2"
            onClick={() => setShowMatches(true)}
          >
            <Sparkles className="h-4 w-4" />
            Show matches
          </Button>
        </div>

        {showMatches && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 animate-fade-up">
            {matches.map(({ user: u, overlap, pct }) => (
              <div
                key={u.id}
                className="rounded-xl border border-border p-4"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={u.name} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{u.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {u.organization}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-semibold text-primary">
                      {pct}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      skill match
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {overlap.map((s) => (
                    <Badge key={s} variant="primary">
                      {s}
                    </Badge>
                  ))}
                </div>
                {(() => {
                  const isPending = invitations.some(
                    (inv) =>
                      inv.projectId === id &&
                      inv.toUserId === u.id &&
                      inv.status === "pending"
                  );
                  return (
                    <Button
                      size="sm"
                      className="mt-3"
                      variant={isPending ? "outline" : "primary"}
                      disabled={isPending}
                      onClick={() => {
                        sendProjectInvite(
                          id,
                          currentUser?.id || "u1",
                          u.id,
                          `Hey ${u?.name ? u.name.split(" ")[0] : "there"}, we saw your skill overlap in ${overlap.join(", ")} and would love to collaborate on ${project.name}!`
                        );
                      }}
                    >
                      {isPending ? "Invitation Sent" : "Invite to Collaborate"}
                    </Button>
                  );
                })()}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
