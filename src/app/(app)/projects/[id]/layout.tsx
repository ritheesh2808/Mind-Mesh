"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  Brain,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Settings,
  CheckSquare,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AvatarGroup } from "@/components/ui/avatar";
import { getUser } from "@/lib/mock-data";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "", label: "Overview", icon: LayoutDashboard },
  { href: "/discussions", label: "Discussions", icon: MessageSquare },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/team", label: "Team", icon: Users },
  { href: "/intelligence", label: "AI Intelligence", icon: Brain },
];

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const id = params.id as string;
  const project = useAppStore((s) => s.projects.find((p) => p.id === id));

  if (!project) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center">
        <h1 className="font-display text-xl font-semibold">Project not found</h1>
        <Link href="/projects" className="mt-4 inline-block text-primary hover:underline">
          Back to projects
        </Link>
      </div>
    );
  }

  const names = project.members
    .map((m) => getUser(m.userId)?.name || "")
    .filter(Boolean);
  const base = `/projects/${id}`;

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-up">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-semibold">{project.name}</h1>
              <Badge variant={project.visibility === "public" ? "public" : "private"}>
                {project.visibility}
              </Badge>
              <Badge variant="outline">{project.status}</Badge>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {project.description}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <AvatarGroup names={names} max={5} />
              <span className="text-sm text-muted-foreground">
                {project.members.length} members
              </span>
            </div>
          </div>
          <Link href="/settings">
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>

        <div className="mt-6 flex gap-1 overflow-x-auto border-t border-border pt-3">
          {tabs.map((tab) => {
            const href = `${base}${tab.href}`;
            const active =
              tab.href === ""
                ? pathname === base || pathname === `${base}/`
                : pathname.startsWith(href);
            const Icon = tab.icon;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-[color-mix(in_oklab,var(--primary)_10%,white)] text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {children}
    </div>
  );
}
