"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { categories, skillCatalog } from "@/lib/mock-data";
import { useAuthStore } from "@/store/auth-store";
import { useAppStore } from "@/store/app-store";
import { createProjectApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { ProjectVisibility } from "@/lib/types";

export default function CreateProjectPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const createProject = useAppStore((s) => s.createProject);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [skills, setSkills] = useState<string[]>(["Python", "AI/ML"]);
  const [duration, setDuration] = useState("8 weeks");
  const [teamSize, setTeamSize] = useState(4);
  const [visibility, setVisibility] = useState<ProjectVisibility>("public");

  const toggleSkill = (s: string) => {
    setSkills((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const project = createProject({
      name,
      description,
      category,
      skillsRequired: skills,
      duration,
      teamSize,
      visibility,
      ownerId: user.id,
      college: user.organization,
    });

    createProjectApi({
      title: name.trim(),
      description: description.trim(),
      owner_id: user.id,
      skills_required: skills,
      status: "in-progress",
    }).catch(() => {});

    router.push(`/projects/${project.id}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-semibold">Create Project</h1>
        <p className="text-sm text-muted-foreground">
          Set up a workspace your team can collaborate in — and Mesh can understand.
        </p>
      </div>

      <Card className="p-6 sm:p-8">
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <Label>Project name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Collaborative Study Workspace"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="What are you building and why?"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Category</Label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Duration</Label>
              <Select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              >
                {["4 weeks", "6 weeks", "8 weeks", "10 weeks", "12 weeks", "14 weeks"].map(
                  (d) => (
                    <option key={d}>{d}</option>
                  )
                )}
              </Select>
            </div>
          </div>
          <div>
            <Label>Skills required</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {skillCatalog.slice(0, 14).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSkill(s)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm transition",
                    skills.includes(s)
                      ? "border-primary bg-[color-mix(in_oklab,var(--primary)_10%,white)] text-primary"
                      : "border-border hover:bg-muted"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Team size</Label>
            <Input
              type="number"
              min={2}
              max={12}
              value={teamSize}
              onChange={(e) => setTeamSize(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Visibility</Label>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {(
                [
                  {
                    id: "public" as const,
                    title: "Public",
                    text: "Anyone can discover and request to join.",
                  },
                  {
                    id: "private" as const,
                    title: "Private",
                    text: "Only invited members can access the project.",
                  },
                ] as const
              ).map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVisibility(v.id)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition",
                    visibility === v.id
                      ? "border-primary bg-[color-mix(in_oklab,var(--primary)_8%,white)]"
                      : "border-border hover:bg-muted"
                  )}
                >
                  <p className="font-medium">{v.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{v.text}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit">Create Project</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
