"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Brain, Sparkles, Filter, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { getCollectiveInsights } from "@/lib/api";

export default function InsightsPage() {
  const insights = useAppStore((s) => s.insights);
  const projects = useAppStore((s) => s.projects);
  const addInsight = useAppStore((s) => s.addInsight);
  const addToast = useAppStore((s) => s.addToast);

  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [scanning, setScanning] = useState(false);

  const filtered = useMemo(() => {
    if (severityFilter === "all") return insights;
    return insights.filter((i) => i.severity === severityFilter);
  }, [insights, severityFilter]);

  const handleScan = async () => {
    if (projects.length === 0) {
      addToast("No active projects found to scan", "info");
      return;
    }
    setScanning(true);
    let totalAdded = 0;
    try {
      for (const proj of projects) {
        const backendInsights = await getCollectiveInsights(proj.id);
        if (backendInsights && backendInsights.length > 0) {
          for (const bi of backendInsights) {
            addInsight({
              projectId: proj.id,
              type: bi.insight_type === "participation_gap" ? "participation_pattern" : "knowledge_concentration",
              title: bi.title,
              explanation: bi.summary,
              evidence: bi.evidence.map((e) => `${e.source_type}: ${e.description}`),
              suggestedAction: bi.action_items[0] || "Review project metrics and collaborate on next steps.",
              severity: bi.severity === "urgent" ? "urgent" : bi.severity === "attention" ? "attention" : "info",
            });
            totalAdded++;
          }
        }
      }
      if (totalAdded > 0) {
        addToast(`Scanned ${projects.length} project(s): ${totalAdded} collective insight(s) synchronized`, "success");
      } else {
        addToast(`Scanned ${projects.length} project(s): No active bottlenecks or silos detected`, "success");
      }
    } catch {
      addToast("Error scanning project insights from backend", "error");
    } finally {
      setScanning(false);
    }
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

        <Button onClick={handleScan} disabled={scanning} className="gap-2 shadow-sm text-xs h-9">
          <Sparkles className={`h-3.5 w-3.5 ${scanning ? "animate-spin" : ""}`} />
          {scanning ? "Scanning…" : "Scan All Workspaces"}
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
