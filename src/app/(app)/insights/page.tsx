"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Brain, Sparkles, Filter, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

export default function InsightsPage() {
  const insights = useAppStore((s) => s.insights);
  const projects = useAppStore((s) => s.projects);
  const addInsight = useAppStore((s) => s.addInsight);
  const addToast = useAppStore((s) => s.addToast);

  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    if (severityFilter === "all") return insights;
    return insights.filter((i) => i.severity === severityFilter);
  }, [insights, severityFilter]);

  const handleScan = () => {
    addInsight({
      projectId: "p1",
      type: "participation_pattern",
      title: "Shared Context Needs a Second Review",
      explanation:
        "Recent authorized project discussions show a shared decision log taking shape, while one open question still needs another teammate's perspective.",
      evidence: [
        "Project decisions are linked to their source discussion",
        "The summary correction flow remains an open question",
      ],
      suggestedAction: "Invite a teammate to review the collective summary and add missing context.",
      severity: "info",
    });
    addToast("Cross-project collaboration scan complete", "success");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-up">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">AI Insights Feed</h1>
          <p className="text-sm text-muted-foreground">
            Cross-project collaboration signals — informational, objective, and never punitive.
          </p>
        </div>

        <Button onClick={handleScan} className="gap-2 shadow-sm text-xs h-9">
          <Sparkles className="h-3.5 w-3.5" />
          Scan All Workspaces
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <Filter className="h-3.5 w-3.5 text-muted-foreground mr-1" />
        {(["all", "urgent", "attention", "info"] as const).map((sev) => (
          <button
            key={sev}
            onClick={() => setSeverityFilter(sev)}
            className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize transition ${
              severityFilter === sev
                ? "bg-primary text-white shadow-xs"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {sev === "all" ? "All Severities" : sev}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <Card className="p-10 text-center">
            <Brain className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">
              No insights found for this filter.
            </p>
          </Card>
        ) : (
          filtered.map((insight) => {
            const project = projects.find((p) => p.id === insight.projectId);
            return (
              <Card key={insight.id} className="p-5 shadow-[var(--shadow-sm)] border-border hover:border-primary/40 transition">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-xs">
                    <Brain className="h-4 w-4" />
                  </div>
                  <Badge
                    variant={
                      insight.severity === "urgent"
                        ? "danger"
                        : insight.severity === "attention"
                          ? "warning"
                          : "primary"
                    }
                  >
                    {insight.severity}
                  </Badge>
                  <span className="text-xs font-semibold text-foreground">
                    {project?.name || "Workspace"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    · {formatRelative(insight.createdAt)}
                  </span>
                </div>

                <h2 className="mt-3 font-display text-base font-bold text-foreground">
                  {insight.title}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {insight.explanation}
                </p>

                {insight.evidence && insight.evidence.length > 0 && (
                  <div className="mt-3 rounded-lg bg-muted/40 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                      Observed Evidence
                    </p>
                    <ul className="mt-1 space-y-1">
                      {insight.evidence.map((e) => (
                        <li key={e} className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <span className="text-primary font-bold">·</span> {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <p className="text-xs text-foreground font-medium">
                    <strong className="text-primary">Suggested action: </strong>
                    {insight.suggestedAction}
                  </p>

                  <Link href={`/projects/${insight.projectId}/intelligence`}>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8">
                      View in Intelligence
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
