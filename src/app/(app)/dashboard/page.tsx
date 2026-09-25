"use client";

import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Compass,
  FolderPlus,
  Sparkles,
  UserPlus,
} from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AvatarGroup } from "@/components/ui/avatar";
import { ProgressBar } from "@/components/ui/misc";
import { getUser } from "@/lib/mock-data";
import { formatRelative, useMounted } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useAppStore } from "@/store/app-store";
import { ActivityModal } from "@/components/activity-modal";
import { useState } from "react";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const projects = useAppStore((s) => s.projects);
  const tasks = useAppStore((s) => s.tasks);
  const discussions = useAppStore((s) => s.discussions);
  const documents = useAppStore((s) => s.documents);
  const activities = useAppStore((s) => s.activities);
  const allInsights = useAppStore((s) => s.insights);
  const insights = useAppStore((s) => s.recommendations);
  const [activityOpen, setActivityOpen] = useState(false);
  const mounted = useMounted();
  const greetingText = mounted ? getGreeting() : "Good day";

  const myProjects = projects.filter((p) =>
    p.members.some((m) => m.userId === user?.id || m.userId === "u1")
  );

  const myTasks = tasks.filter(
    (t) => t.assigneeId === user?.id || t.assigneeId === "u1"
  );
  const completed = myTasks.filter((t) => t.status === "completed").length;

  const chartData = [
    { name: "Discussions", value: discussions.length },
    { name: "Tasks", value: tasks.length },
    { name: "Docs", value: documents.length },
    { name: "Activities", value: activities.length },
  ];

  const primaryInsight =
    allInsights[0]?.explanation ||
    "Cross-functional knowledge exchange is active across team modules.";

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {greetingText}, {user?.name?.split(" ")[0] || "there"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Here&apos;s your collaboration pulse across active projects.
          </p>
        </div>
        <Link href="/projects/create">
          <Button className="gap-2">
            <FolderPlus className="h-4 w-4" />
            Create Project
          </Button>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            href: "/projects/create",
            icon: FolderPlus,
            title: "Create Project",
            text: "Start a new collaborative workspace",
          },
          {
            href: "/discover",
            icon: Compass,
            title: "Join Project",
            text: "Discover public teams looking for members",
          },
          {
            href: "/team",
            icon: UserPlus,
            title: "Find Teammates",
            text: "Match by skills and project needs",
          },
        ].map((a) => (
          <Link key={a.href} href={a.href}>
            <Card hover className="h-full p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--primary)_10%,white)]">
                  <a.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{a.text}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Current Projects</CardTitle>
            <Link
              href="/projects"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {myProjects.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <p>No active projects yet.</p>
                <Link href="/projects/create" className="mt-3 inline-block">
                  <Button size="sm" variant="outline">
                    Create your first project
                  </Button>
                </Link>
              </div>
            ) : (
              myProjects.slice(0, 3).map((p) => {
                const names = p.members
                  .map((m) => getUser(m.userId)?.name || "")
                  .filter(Boolean);
                return (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="block rounded-xl border border-border p-4 transition hover:border-primary/30 hover:bg-muted/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{p.name}</p>
                          <Badge variant={p.visibility === "public" ? "public" : "private"}>
                            {p.visibility}
                          </Badge>
                          <Badge variant="outline">{p.status}</Badge>
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {p.description}
                        </p>
                      </div>
                      <AvatarGroup names={names} />
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <ProgressBar value={p.progress} className="flex-1" />
                      <span className="text-xs font-medium text-muted-foreground">
                        {p.progress}%
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Last activity {formatRelative(p.lastActivity)}
                    </p>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Collaboration Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid grid-cols-2 gap-3">
                <Stat label="Participation" value={`${myProjects[0]?.members.length || 5} active voices`} />
                <Stat label="Tasks completed" value={`${completed}/${myTasks.length || 6}`} />
                <Stat label="Team activity" value="Active today" />
                <Stat label="Knowledge exchange" value={`${discussions.length + documents.length} flows`} />
              </div>
              <div className="h-40">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={150}>
                    <BarChart data={chartData}>
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: "#5c6578" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis hide />
                      <Tooltip
                        cursor={{ fill: "#eef0f4" }}
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid #e2e5ec",
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="value" fill="#0f766e" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full skeleton rounded-xl" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-[color-mix(in_oklab,var(--primary)_25%,var(--border))] bg-[color-mix(in_oklab,var(--primary)_4%,white)]">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                <Brain className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  AI Insight
                </p>
                <p className="mt-2 font-medium leading-relaxed">{primaryInsight}</p>
                <Link href={`/projects/${myProjects[0]?.id || "p1"}/intelligence`}>
                  <Button size="sm" className="mt-4 gap-1.5">
                    View Insight
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                  Recommended Action
                </p>
                <p className="mt-2 font-medium leading-relaxed">
                  Run a 15-minute knowledge-sharing session.
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {insights[0]?.why || "Bring a teammate into the decision log so project context is shared across the group."}
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-4"
                  onClick={() => setActivityOpen(true)}
                >
                  Create Activity
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ActivityModal
        open={activityOpen}
        onClose={() => setActivityOpen(false)}
        projectId={myProjects[0]?.id || "p1"}
        defaults={{
          type: "Knowledge Sharing Session",
          title: "Project decision-log knowledge share",
          participants: ["u2", "u4", "u5"],
          description: insights[0]?.why || "Organize a 15-minute knowledge transfer session.",
          duration: "15 minutes",
          recommendationId: insights[0]?.id,
        }}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/70 px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}
