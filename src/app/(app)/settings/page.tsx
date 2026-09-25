"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth-store";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

const sections = ["Account", "Privacy", "Notifications", "Security"] as const;

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const signOut = useAuthStore((s) => s.signOut);
  const addToast = useAppStore((s) => s.addToast);
  const preferences = useAppStore((s) => s.preferences);
  const updatePreferences = useAppStore((s) => s.updatePreferences);

  const [section, setSection] = useState<(typeof sections)[number]>("Account");
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [profileVisibility, setProfileVisibility] = useState(preferences.profileVisibility);
  const [projectVisibility, setProjectVisibility] = useState(preferences.projectVisibility);
  const [collabPerms, setCollabPerms] = useState(preferences.collaborationAnalysis);
  const [notifEmail, setNotifEmail] = useState(preferences.notifications.email);
  const [notifProject, setNotifProject] = useState(preferences.notifications.project);
  const [notifAi, setNotifAi] = useState(preferences.notifications.ai);
  const [notifInvite, setNotifInvite] = useState(preferences.notifications.invitations);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage account, privacy, and notification preferences.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {sections.map((s) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm font-medium transition",
              section === s
                ? "border-primary bg-[color-mix(in_oklab,var(--primary)_10%,white)] text-primary"
                : "border-border hover:bg-muted"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <Card className="p-6">
        {section === "Account" && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold">Account</h2>
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep current"
              />
            </div>
            <Button
              onClick={() => {
                updateProfile({ name, email });
                addToast("Account settings saved", "success");
              }}
            >
              Save changes
            </Button>
          </div>
        )}

        {section === "Privacy" && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold">Privacy</h2>
            <div>
              <Label>Profile visibility</Label>
              <Select
                value={profileVisibility}
                onChange={(e) =>
                  setProfileVisibility(
                    e.target.value as "public" | "connections" | "private"
                  )
                }
              >
                <option value="public">Public to Mesh users</option>
                <option value="connections">Connections only</option>
                <option value="private">Private</option>
              </Select>
            </div>
            <div>
              <Label>Default project visibility</Label>
              <Select
                value={projectVisibility}
                onChange={(e) =>
                  setProjectVisibility(
                    e.target.value as "members" | "public" | "invite"
                  )
                }
              >
                <option value="members">Project members</option>
                <option value="public">Public discoverable</option>
                <option value="invite">Invite only</option>
              </Select>
            </div>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={collabPerms}
                onChange={(e) => setCollabPerms(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-[var(--primary)]"
              />
              Allow Mesh to analyze authorized collaboration data for insights
            </label>
            <Button
              onClick={() => {
                updatePreferences({
                  profileVisibility: profileVisibility as "public" | "connections" | "private",
                  projectVisibility: projectVisibility as "members" | "public" | "invite",
                  collaborationAnalysis: collabPerms,
                });
                addToast("Privacy settings saved", "success");
              }}
            >
              Save privacy
            </Button>
          </div>
        )}

        {section === "Notifications" && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold">Notifications</h2>
            {(
              [
                ["Email", notifEmail, setNotifEmail],
                ["Project updates", notifProject, setNotifProject],
                ["AI insights", notifAi, setNotifAi],
                ["Invitations", notifInvite, setNotifInvite],
              ] as const
            ).map(([label, value, setter]) => (
              <label key={label} className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setter(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-[var(--primary)]"
                />
                {label}
              </label>
            ))}
            <Button
              onClick={() => {
                updatePreferences({
                  notifications: {
                    email: notifEmail,
                    project: notifProject,
                    ai: notifAi,
                    invitations: notifInvite,
                  },
                });
                addToast("Notification preferences saved", "success");
              }}
            >
              Save notifications
            </Button>
          </div>
        )}

        {section === "Security" && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold">Security</h2>
            <div className="rounded-xl border border-border p-4">
              <p className="text-sm font-medium">Active sessions</p>
              <p className="mt-1 text-sm text-muted-foreground">
                This browser · Kali Linux · Current session
              </p>
            </div>
            <Button
              variant="danger"
              onClick={() => {
                signOut();
                addToast("Signed out", "info");
                router.push("/");
              }}
            >
              Logout
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
