"use client";

import { useEffect } from "react";
import Link from "next/link";
import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AvatarGroup } from "@/components/ui/avatar";
import { ProgressBar, EmptyState } from "@/components/ui/misc";
import { getUser } from "@/lib/mock-data";
import { formatRelative } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useAppStore } from "@/store/app-store";
import { getProjects } from "@/lib/api";

export default function ProjectsPage() {
  const user = useAuthStore((s) => s.user);
  const projects = useAppStore((s) => s.projects);
  const syncProjects = useAppStore((s) => s.syncProjects);

  useEffect(() => {
    let mounted = true;
    getProjects().then((fetched) => {
      if (!mounted) return;
      if (fetched && fetched.length > 0) {
        syncProjects(fetched);
      }
    }).catch(() => {});
    return () => {
      mounted = false;
    };
  }, [syncProjects]);

  const myProjects = projects.filter((p) =>
    !user ||
    p.ownerId === user.id ||
    p.ownerId === "u1" ||
    p.members.some((m) => m.userId === user?.id || m.userId === "u1")
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-up">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">My Projects</h1>
          <p className="text-sm text-muted-foreground">
            Workspaces you own or contribute to.
          </p>
        </div>
        <Link href="/projects/create">
          <Button className="gap-2">
            <FolderPlus className="h-4 w-4" />
            Create Project
          </Button>
        </Link>
      </div>

      {myProjects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create a project or discover teams looking for members."
          action={
            <Link href="/projects/create">
              <Button>Create Project</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {myProjects.map((p) => {
            const names = p.members
              .map((m) => m.name || getUser(m.userId)?.name || m.userId)
              .filter(Boolean);
            return (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <Card hover className="h-full p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-display text-lg font-semibold">{p.name}</h2>
                    <Badge variant={p.visibility === "public" ? "public" : "private"}>
                      {p.visibility}
                    </Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {p.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {p.skillsRequired.slice(0, 4).map((s) => (
                      <Badge key={s} variant="outline">
                        {s}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <AvatarGroup names={names} />
                    <span className="text-xs text-muted-foreground">
                      {formatRelative(p.lastActivity)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <ProgressBar value={p.progress} className="flex-1" />
                    <span className="text-xs font-medium">{p.progress}%</span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
