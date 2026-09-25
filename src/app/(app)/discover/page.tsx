"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/misc";
import { categories, getUser } from "@/lib/mock-data";
import { useAuthStore } from "@/store/auth-store";
import { useAppStore } from "@/store/app-store";
import { Suspense } from "react";

function DiscoverContent() {
  const params = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const projects = useAppStore((s) => s.projects);
  const joinProject = useAppStore((s) => s.joinProject);

  const [q, setQ] = useState(params.get("q") || "");
  const [category, setCategory] = useState("all");
  const [filter, setFilter] = useState<"all" | "public" | "looking" | "recent">(
    "all"
  );

  const results = useMemo(() => {
    let list = projects.filter((p) => p.visibility === "public");
    if (filter === "looking") list = list.filter((p) => p.lookingForMembers);
    if (filter === "recent") {
      list = [...list].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    if (category !== "all") list = list.filter((p) => p.category === category);
    if (q.trim()) {
      const query = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.skillsRequired.some((s) => s.toLowerCase().includes(query)) ||
          p.category.toLowerCase().includes(query) ||
          (p.college || "").toLowerCase().includes(query)
      );
    }
    return list;
  }, [projects, q, category, filter]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-semibold">Discover Projects</h1>
        <p className="text-sm text-muted-foreground">
          Find public teams by skill, category, technology, or college.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search project, skill, technology, college…"
            className="pl-9"
          />
        </div>
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="sm:w-48"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "Public projects"],
            ["recent", "Recently created"],
            ["looking", "Looking for members"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition ${
              filter === id
                ? "border-primary bg-[color-mix(in_oklab,var(--primary)_10%,white)] text-primary"
                : "border-border hover:bg-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <EmptyState
          title="No matching projects"
          description="Try a different skill, category, or clear filters."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {results.map((p) => {
            const owner = getUser(p.ownerId);
            const slots = Math.max(0, p.teamSize - p.members.length);
            const alreadyIn = p.members.some(
              (m) => m.userId === user?.id || m.userId === "u1"
            );
            return (
              <Card key={p.id} hover className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-display text-lg font-semibold">{p.name}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.category}
                      {p.college ? ` · ${p.college}` : ""}
                    </p>
                  </div>
                  {p.lookingForMembers && (
                    <Badge variant="success">Hiring</Badge>
                  )}
                </div>
                <p className="mt-3 line-clamp-3 flex-1 text-sm text-muted-foreground">
                  {p.description}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Avatar name={owner?.name || "Owner"} size="sm" />
                  <span className="text-sm">{owner?.name}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.skillsRequired.map((s) => (
                    <Badge key={s} variant="outline">
                      {s}
                    </Badge>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {p.members.length}/{p.teamSize} members · {slots} slots
                  </p>
                  <Button
                    size="sm"
                    disabled={alreadyIn || slots === 0}
                    onClick={() => {
                      if (!user) return;
                      joinProject(p.id, user.id);
                    }}
                  >
                    {alreadyIn ? "Joined" : "Join"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={<div className="skeleton mx-auto h-40 max-w-6xl" />}>
      <DiscoverContent />
    </Suspense>
  );
}
