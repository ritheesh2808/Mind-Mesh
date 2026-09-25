"use client";

import { useState } from "react";
import { Code2, Link2, Globe, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useAuthStore } from "@/store/auth-store";
import { useAppStore } from "@/store/app-store";
import Link from "next/link";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const projects = useAppStore((s) => s.projects);
  const addToast = useAppStore((s) => s.addToast);
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState(user?.name || "");
  const [department, setDepartment] = useState(user?.department || "");
  const [organization, setOrganization] = useState(user?.organization || "");
  const [skills, setSkills] = useState(user?.skills.join(", ") || "");
  const [github, setGithub] = useState(user?.github || "");
  const [linkedin, setLinkedin] = useState(user?.linkedin || "");
  const [portfolio, setPortfolio] = useState(user?.portfolio || "");
  const [bio, setBio] = useState(user?.bio || "");

  if (!user) return null;

  const current = projects.filter((p) =>
    p.members.some((m) => m.userId === user.id)
  );

  const save = () => {
    updateProfile({
      name,
      department,
      organization,
      skills: skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      github,
      linkedin,
      portfolio,
      bio,
    });
    setEditing(false);
    addToast("Profile updated", "success");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-up">
      <Card className="overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-[#0c1222] via-[#134e4a] to-[#0f766e]" />
        <div className="relative px-6 pb-6">
          <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <Avatar
                name={user.name}
                size="xl"
                className="ring-4 ring-card"
              />
              <div className="pb-1">
                <h1 className="font-display text-2xl font-semibold">{user.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {user.role} · {user.department}
                  {user.year ? ` · ${user.year}` : ""}
                </p>
                <p className="text-sm text-muted-foreground">{user.organization}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit profile
            </Button>
          </div>

          {user.bio && (
            <p className="mt-4 max-w-2xl text-sm text-muted-foreground">{user.bio}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {user.skills.map((s) => (
              <Badge key={s} variant="primary">
                {s}
              </Badge>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {user.github && (
              <a href={user.github} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Code2 className="h-3.5 w-3.5" />
                  GitHub
                </Button>
              </a>
            )}
            {user.linkedin && (
              <a href={user.linkedin} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Link2 className="h-3.5 w-3.5" />
                  LinkedIn
                </Button>
              </a>
            )}
            {user.portfolio && (
              <a href={user.portfolio} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  Portfolio
                </Button>
              </a>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-display font-semibold">Current projects</h2>
          <ul className="mt-3 space-y-2">
            {current.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/projects/${p.id}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <h2 className="font-display font-semibold">Previous projects</h2>
          <ul className="mt-3 space-y-2">
            {user.previousProjects.length === 0 ? (
              <li className="text-sm text-muted-foreground">None listed</li>
            ) : (
              user.previousProjects.map((p) => (
                <li key={p} className="text-sm">
                  {p}
                </li>
              ))
            )}
          </ul>
          {user.interests.length > 0 && (
            <>
              <h2 className="mt-5 font-display font-semibold">Interests</h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {user.interests.map((i) => (
                  <Badge key={i} variant="outline">
                    {i}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Edit profile"
        description="Update how teammates see you on Mesh."
        className="max-w-xl"
      >
        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Organization</Label>
            <Input
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
            />
          </div>
          <div>
            <Label>Department</Label>
            <Input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>
          <div>
            <Label>Skills (comma-separated)</Label>
            <Input value={skills} onChange={(e) => setSkills(e.target.value)} />
          </div>
          <div>
            <Label>GitHub</Label>
            <Input value={github} onChange={(e) => setGithub(e.target.value)} />
          </div>
          <div>
            <Label>LinkedIn</Label>
            <Input
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
            />
          </div>
          <div>
            <Label>Portfolio</Label>
            <Input
              value={portfolio}
              onChange={(e) => setPortfolio(e.target.value)}
            />
          </div>
          <div>
            <Label>Bio</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <Button onClick={save}>Save changes</Button>
        </div>
      </Modal>
    </div>
  );
}
