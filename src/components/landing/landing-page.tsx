"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Brain,
  GitBranch,
  Network,
  Sparkles,
  Users,
  BarChart3,
  MessageSquareWarning,
  Layers,
  Target,
  CheckCircle2,
} from "lucide-react";
import { Logo } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { useAppStore } from "@/store/app-store";

const problems = [
  {
    icon: Users,
    title: "Unequal participation",
    text: "Some voices dominate while others stay silent — and nobody sees the pattern until it's too late.",
  },
  {
    icon: MessageSquareWarning,
    title: "Fragmented discussions",
    text: "Decisions scatter across chats, docs, and meetings with no shared memory of why choices were made.",
  },
  {
    icon: Layers,
    title: "Knowledge silos",
    text: "Critical context lives with one teammate. When they're busy, the whole project slows down.",
  },
  {
    icon: Target,
    title: "Difficult coordination",
    text: "Teams struggle to align tasks, skills, and progress across a living project.",
  },
];

const features = [
  {
    icon: Brain,
    title: "AI Collaboration Insights",
    text: "Surface participation patterns, decision bottlenecks, and unresolved topics — without blaming anyone.",
  },
  {
    icon: Network,
    title: "Knowledge Flow",
    text: "See how information moves across the team and where concentration creates risk.",
  },
  {
    icon: Users,
    title: "Smart Team Matching",
    text: "Discover teammates by skills, interests, and project needs — recommendations, not scores.",
  },
  {
    icon: BarChart3,
    title: "Project Intelligence",
    text: "Progress, milestones, and contribution distribution in one clear workspace view.",
  },
  {
    icon: GitBranch,
    title: "Contribution Analysis",
    text: "Understand how work is distributed across discussions, documents, and tasks.",
  },
  {
    icon: Sparkles,
    title: "AI Recommendations",
    text: "Actionable next steps: knowledge shares, peer reviews, pair sessions, and more.",
  },
];

const steps = [
  {
    n: "01",
    title: "Collect",
    text: "Bring discussions, tasks, documents, and profiles into one authorized collaboration space.",
  },
  {
    n: "02",
    title: "Understand",
    text: "Map who shares what, where decisions happen, and how knowledge moves.",
  },
  {
    n: "03",
    title: "Analyze",
    text: "Detect concentration, gaps, unresolved topics, and project risks early.",
  },
  {
    n: "04",
    title: "Recommend & Improve",
    text: "Get concrete activities that help the team share knowledge and ship better.",
  },
];

export function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const profileComplete = useAuthStore((s) => s.profileComplete);
  const demoEnter = useAuthStore((s) => s.demoEnter);
  const addToast = useAppStore((s) => s.addToast);

  const handleLaunchDemo = () => {
    demoEnter();
    addToast("Signed into demo workspace as Ritheesh Kumar (Team Lead)", "success");
    router.push("/dashboard");
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const startHref = isAuthenticated
    ? profileComplete
      ? "/dashboard"
      : "/onboarding"
    : "/sign-up";

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-foreground">
      <header
        className={`fixed inset-x-0 top-0 z-50 transition ${
          scrolled
            ? "border-b border-border bg-white/90 backdrop-blur-md"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#product" className="hover:text-foreground">
              Product
            </a>
            <a href="#how" className="hover:text-foreground">
              How it Works
            </a>
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <a href="#about" className="hover:text-foreground">
              About
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLaunchDemo}
              className="hidden sm:inline-flex gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Live Demo
            </Button>
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href={startHref}>
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-16">
        <div className="absolute inset-0 mesh-noise" />
        <div className="absolute inset-0 mesh-grid opacity-60" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:pb-24 lg:pt-24">
          <div className="flex flex-col justify-center animate-fade-up">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              ED-03 · Collaborative Learning Intelligence
            </p>
            <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight text-hero-ink sm:text-5xl lg:text-[3.5rem]">
              Mesh
            </h1>
            <p className="mt-3 font-display text-2xl font-medium text-hero-ink/80 sm:text-3xl">
              Turn teamwork into intelligence.
            </p>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              AI-powered collaboration intelligence for student teams — understand
              how knowledge flows, balance contributions, and improve how you build together.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" className="gap-2 shadow-sm" onClick={handleLaunchDemo}>
                <Sparkles className="h-4 w-4" />
                Launch Live Demo
              </Button>
              <Link href={startHref}>
                <Button size="lg" variant="outline" className="gap-2">
                  Start Collaborating
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#product">
                <Button size="lg" variant="ghost">
                  Explore Platform
                </Button>
              </a>
            </div>
          </div>

          {/* Product preview */}
          <div className="relative animate-fade-up" style={{ animationDelay: "80ms" }}>
            <div className="rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-lg)] sm:p-4">
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#f87171]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#fbbf24]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#34d399]" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  Collaborative learning intelligence
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <PreviewCard
                  label="Team collaboration"
                  title="5 members active"
                  detail="62% project progress · last sync 2h ago"
                >
                  <div className="mt-3 flex -space-x-2">
                    {["RK", "PS", "AK", "KM", "DN"].map((i) => (
                      <span
                        key={i}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-white ring-2 ring-card"
                      >
                        {i}
                      </span>
                    ))}
                  </div>
                </PreviewCard>
                <PreviewCard
                  label="AI insight"
                  title="Knowledge concentration"
                  detail="A few project decisions need a second teammate's perspective."
                  accent
                />
                <PreviewCard
                  label="Knowledge flow"
                  title="Priya → Karthik → Arun"
                  detail="Discussion notes connect to shared decisions and tasks."
                >
                  <div className="mt-3 h-10 rounded-lg bg-muted/80 px-2 py-1.5">
                    <svg viewBox="0 0 160 28" className="h-full w-full">
                      <circle cx="16" cy="14" r="6" fill="#0f766e" />
                      <circle cx="80" cy="14" r="6" fill="#0d9488" />
                      <circle cx="144" cy="14" r="6" fill="#5c6578" />
                      <path
                        d="M22 14h52M86 14h52"
                        stroke="#0f766e"
                        strokeWidth="1.5"
                        strokeDasharray="3 2"
                      />
                    </svg>
                  </div>
                </PreviewCard>
                <PreviewCard
                  label="Project progress"
                  title="Collective learning summary"
                  detail="Consent reviewed · 3 questions open"
                >
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-[62%] rounded-full bg-primary" />
                  </div>
                </PreviewCard>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="product" className="border-t border-border bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
              The problem
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Student teams collaborate hard — and still miss what matters.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Tools track messages and tasks. Mesh understands collaboration itself.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {problems.map((p) => (
              <div key={p.title} className="rounded-2xl border border-border bg-[#f7f8fa] p-5">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-border">
                  <p.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-base font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="border-t border-border py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
              The solution
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Collect → Understand → Analyze → Recommend → Improve
            </h2>
          </div>
          <div className="mt-12 grid gap-3 md:grid-cols-5">
            {["Collect", "Understand", "Analyze", "Recommend", "Improve"].map(
              (step, i) => (
                <div
                  key={step}
                  className="relative rounded-2xl border border-border bg-white p-5 text-center shadow-[var(--shadow-sm)]"
                >
                  <span className="font-display text-2xl font-semibold text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-2 font-medium">{step}</p>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
              Features
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Intelligence built for how teams actually work.
            </h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-border bg-[#f7f8fa] p-6 transition hover:border-[color-mix(in_oklab,var(--primary)_30%,var(--border))] hover:bg-white hover:shadow-[var(--shadow-md)]"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white border border-border transition group-hover:border-primary/30">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-border py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
              How it works
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              From raw collaboration to better teamwork.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n} className="rounded-2xl border border-border bg-white p-6">
                <span className="font-display text-sm font-semibold text-primary">{s.n}</span>
                <h3 className="mt-3 font-display text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="border-t border-border bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                About Mesh
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                We don&apos;t just track collaboration. We understand it.
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Mesh is an AI-based collaborative learning intelligence platform built for
                student and project teams. Authorized collaboration data — discussions,
                documents, tasks, and skills — becomes insights, knowledge-flow maps, and
                recommendations that help teams improve how they learn and ship together.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Neutral language that informs, never shames",
                  "Actionable recommendations tied to real project context",
                  "Built for the full journey: discover → build → improve",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-[#0c1222] p-8 text-white shadow-[var(--shadow-lg)]">
              <p className="text-sm font-medium text-teal-300">Product positioning</p>
              <p className="mt-4 font-display text-2xl font-semibold leading-snug">
                &ldquo;We don&apos;t just track collaboration. We understand it and help
                teams improve it.&rdquo;
              </p>
              <p className="mt-6 text-sm text-white/60">
                Hackathon project ED-03 · AI-Based Collaborative Learning Intelligence
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="overflow-hidden rounded-3xl bg-[#0c1222] px-8 py-14 text-center text-white sm:px-12">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Build better projects together.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/65">
              Start with your team today. Create a project, invite teammates, and let Mesh
              turn collaboration into intelligence.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary-hover gap-2"
                onClick={handleLaunchDemo}
              >
                <Sparkles className="h-4 w-4" />
                Launch Live Demo
              </Button>
              <Link href={startHref}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 bg-transparent text-white hover:bg-white/10"
                >
                  Get Started
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-white/80 hover:text-white hover:bg-white/10"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <Logo />
          <p className="text-sm text-muted-foreground">
            © 2026 Mesh · ED-03 Collaborative Learning Intelligence
          </p>
        </div>
      </footer>
    </div>
  );
}

function PreviewCard({
  label,
  title,
  detail,
  children,
  accent,
}: {
  label: string;
  title: string;
  detail: string;
  children?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3.5 ${
        accent
          ? "border-[color-mix(in_oklab,var(--primary)_35%,var(--border))] bg-[color-mix(in_oklab,var(--primary)_6%,white)]"
          : "border-border bg-[#f7f8fa]"
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{detail}</p>
      {children}
    </div>
  );
}
