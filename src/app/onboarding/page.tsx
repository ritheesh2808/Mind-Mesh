"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Camera, Check } from "lucide-react";
import { Logo } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { skillCatalog } from "@/lib/mock-data";
import { useAuthStore } from "@/store/auth-store";
import { useAppStore } from "@/store/app-store";
import { cn, useHydrated } from "@/lib/utils";

const steps = ["Basic Info", "Skills", "Links", "Projects"];

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const completeProfile = useAuthStore((s) => s.completeProfile);
  const addToast = useAppStore((s) => s.addToast);
  const [step, setStep] = useState(0);
  const hydrated = useHydrated();

  const [fullName, setFullName] = useState(user?.name || "");
  const [role, setRole] = useState<"Student" | "Professional">(
    user?.role || "Student"
  );
  const [organization, setOrganization] = useState(user?.organization || "");
  const [year, setYear] = useState(user?.year || "3rd Year");
  const [department, setDepartment] = useState(user?.department || "");
  const [skills, setSkills] = useState<string[]>(user?.skills || []);
  const [customSkill, setCustomSkill] = useState("");
  const [github, setGithub] = useState(user?.github || "");
  const [linkedin, setLinkedin] = useState(user?.linkedin || "");
  const [portfolio, setPortfolio] = useState(user?.portfolio || "");
  const [previousProjects, setPreviousProjects] = useState(
    user?.previousProjects?.join(", ") || ""
  );
  const [interests, setInterests] = useState(user?.interests?.join(", ") || "");
  const [currentProjects, setCurrentProjects] = useState("");

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) router.replace("/sign-in");
  }, [hydrated, isAuthenticated, router]);

  const toggleSkill = (s: string) => {
    setSkills((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const addCustomSkill = () => {
    const s = customSkill.trim();
    if (s && !skills.includes(s)) setSkills([...skills, s]);
    setCustomSkill("");
  };

  const finish = () => {
    completeProfile({
      name: fullName,
      role,
      organization,
      year: role === "Student" ? year : undefined,
      department,
      skills,
      github,
      linkedin,
      portfolio,
      previousProjects: previousProjects
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      interests: interests
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      bio: currentProjects
        ? `Currently working on: ${currentProjects}`
        : user?.bio,
    });
    router.push("/dashboard");
  };

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="skeleton h-10 w-48" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Logo />
          <span className="text-sm text-muted-foreground">
            Step {step + 1} of {steps.length}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 flex gap-2">
          {steps.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => setStep(i)}
              className="flex-1"
            >
              <div
                className={cn(
                  "mb-2 h-1.5 rounded-full transition",
                  i <= step ? "bg-primary" : "bg-muted"
                )}
              />
              <span
                className={cn(
                  "hidden text-xs font-medium sm:block",
                  i === step ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {s}
              </span>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)] sm:p-8 animate-fade-up">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h1 className="font-display text-2xl font-semibold">
                  Basic information
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tell teammates who you are.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-dashed border-border bg-muted">
                  <Camera className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() =>
                      addToast("Photo upload is simulated for this demo.", "info")
                    }
                  >
                    Upload photo
                  </Button>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Optional · PNG or JPG
                  </p>
                </div>
              </div>
              <div>
                <Label>Full Name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div>
                <Label>I am a</Label>
                <div className="grid grid-cols-2 gap-3">
                  {(["Student", "Professional"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={cn(
                        "rounded-xl border px-4 py-3 text-sm font-medium transition",
                        role === r
                          ? "border-primary bg-[color-mix(in_oklab,var(--primary)_8%,white)] text-primary"
                          : "border-border hover:bg-muted"
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>College / Organization</Label>
                <Input
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Your college or company"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {role === "Student" && (
                  <div>
                    <Label>Year</Label>
                    <Select value={year} onChange={(e) => setYear(e.target.value)}>
                      {["1st Year", "2nd Year", "3rd Year", "4th Year", "PG"].map(
                        (y) => (
                          <option key={y}>{y}</option>
                        )
                      )}
                    </Select>
                  </div>
                )}
                <div className={role === "Student" ? "" : "sm:col-span-2"}>
                  <Label>Department</Label>
                  <Input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Computer Science"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h1 className="font-display text-2xl font-semibold">Skills</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Select skills that define how you collaborate.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {skillCatalog.map((s) => {
                  const active = skills.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSkill(s)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition",
                        active
                          ? "border-primary bg-[color-mix(in_oklab,var(--primary)_10%,white)] text-primary"
                          : "border-border hover:bg-muted"
                      )}
                    >
                      {active && <Check className="h-3.5 w-3.5" />}
                      {s}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <Input
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  placeholder="Add a custom skill"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSkill())}
                />
                <Button type="button" variant="outline" onClick={addCustomSkill}>
                  Add
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h1 className="font-display text-2xl font-semibold">Links</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Help teammates find your work.
                </p>
              </div>
              <div>
                <Label>GitHub</Label>
                <Input
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="https://github.com/you"
                />
              </div>
              <div>
                <Label>LinkedIn</Label>
                <Input
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/you"
                />
              </div>
              <div>
                <Label>Portfolio</Label>
                <Input
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                  placeholder="https://yoursite.dev"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h1 className="font-display text-2xl font-semibold">Projects</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Share context that improves matching and insights.
                </p>
              </div>
              <div>
                <Label>Previous projects</Label>
                <Textarea
                  value={previousProjects}
                  onChange={(e) => setPreviousProjects(e.target.value)}
                  placeholder="Comma-separated project names"
                />
              </div>
              <div>
                <Label>Current projects</Label>
                <Input
                  value={currentProjects}
                  onChange={(e) => setCurrentProjects(e.target.value)}
                  placeholder="What are you building now?"
                />
              </div>
              <div>
                <Label>Areas of interest</Label>
                <Textarea
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="Comma-separated interests"
                />
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-between">
            <Button
              variant="outline"
              type="button"
              disabled={step === 0}
              onClick={() => setStep((s) => s - 1)}
            >
              Back
            </Button>
            {step < steps.length - 1 ? (
              <Button type="button" onClick={() => setStep((s) => s + 1)}>
                Continue
              </Button>
            ) : (
              <Button type="button" onClick={finish}>
                Complete Profile
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
