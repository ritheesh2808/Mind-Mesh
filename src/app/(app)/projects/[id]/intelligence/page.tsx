"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import {
  Activity as ActivityIcon,
  AlertTriangle,
  Brain,
  Clock3,
  Layers3,
  MessageSquareText,
  Network,
  RefreshCw,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getActivityImpact,
  getActivities,
  getAnalysisSnapshots,
  getContributions,
  getDiscussionIntelligence,
  getDetailedRecommendations,
  getKnowledgeGraph,
  getPersistentBlueprint,
  getProject,
  getSilos,
  getCollectiveInsights,
  triggerProjectAnalysis,
} from "@/lib/api";
import type {
  Activity,
  ActivityImpactResponse,
  AnalysisSnapshotResponse,
  BlueprintPersistentResponse,
  ContributionAnalyticsResponse,
  DetailedRecommendationResponse,
  DiscussionIntelligenceItem,
  KnowledgeGraphResponse,
  PersistentInsightResponse,
  Project,
  SilosAndGapsResponse,
} from "@/lib/types";

type IntelligenceData = {
  project: Project | null;
  contributions: ContributionAnalyticsResponse | null;
  discussions: DiscussionIntelligenceItem[] | null;
  graph: KnowledgeGraphResponse | null;
  silos: SilosAndGapsResponse | null;
  insights: PersistentInsightResponse[] | null;
  recommendations: DetailedRecommendationResponse[] | null;
  blueprint: BlueprintPersistentResponse | null;
  snapshots: AnalysisSnapshotResponse[] | null;
  activities: Activity[];
  impacts: ActivityImpactResponse[];
};

async function loadProjectIntelligence(projectId: string): Promise<IntelligenceData> {
  const [project, contributions, discussions, graph, silos, insights, recommendations, blueprint, snapshots, activities] =
    await Promise.all([
      getProject(projectId),
      getContributions(projectId),
      getDiscussionIntelligence(projectId),
      getKnowledgeGraph(projectId),
      getSilos(projectId),
      getCollectiveInsights(projectId),
      getDetailedRecommendations(projectId),
      getPersistentBlueprint(projectId),
      getAnalysisSnapshots(projectId),
      getActivities(projectId),
    ]);
  const completedActivities = activities.filter((activity) => activity.status === "completed");
  const impacts = (await Promise.all(
    completedActivities.map((activity) => getActivityImpact(projectId, activity.id)),
  )).filter((impact): impact is ActivityImpactResponse => impact !== null);

  return {
    project,
    contributions,
    discussions,
    graph,
    silos,
    insights,
    recommendations,
    blueprint,
    snapshots,
    activities,
    impacts,
  };
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="py-5 text-sm text-muted-foreground">{children}</p>;
}

function SectionTitle({ icon: Icon, title, count }: { icon: typeof Brain; title: string; count?: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </h2>
      {count !== undefined && <span className="text-xs text-muted-foreground">{count}</span>}
    </div>
  );
}

function formatMetric(value: unknown): string {
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(2);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return typeof value === "string" ? value : "Not recorded";
}

export default function IntelligencePage() {
  const params = useParams();
  const projectId = params.id as string;
  const [loadedData, setLoadedData] = useState<{ projectId: string; value: IntelligenceData } | null>(null);
  const [loadError, setLoadError] = useState<{ projectId: string; message: string } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const data = loadedData?.projectId === projectId ? loadedData.value : null;
  const error = loadError?.projectId === projectId ? loadError.message : null;
  const loading = !data && !error;

  useEffect(() => {
    let active = true;
    loadProjectIntelligence(projectId)
      .then((result) => {
        if (!active) return;
        setLoadedData({ projectId, value: result });
        setLoadError(result.project ? null : { projectId, message: "Project data could not be loaded from the backend." });
      })
      .catch(() => {
        if (active) setLoadError({ projectId, message: "Intelligence data could not be loaded from the backend." });
      });
    return () => {
      active = false;
    };
  }, [projectId]);

  const graphNodes = useMemo<Node[]>(() => {
    const nodes = data?.graph?.nodes ?? [];
    const columns = Math.max(1, Math.ceil(Math.sqrt(nodes.length)));
    return nodes.map((node, index) => ({
      id: node.id,
      position: { x: (index % columns) * 230, y: Math.floor(index / columns) * 130 },
      data: { label: `${node.label}\n${node.node_type}` },
      style: {
        width: 190,
        whiteSpace: "pre-line",
        borderColor: selectedNodeId === node.id ? "var(--primary)" : "var(--border)",
        background: "var(--card)",
        color: "var(--foreground)",
      },
    }));
  }, [data?.graph?.nodes, selectedNodeId]);

  const graphEdges = useMemo<Edge[]>(() => {
    const nodeIds = new Set((data?.graph?.nodes ?? []).map((node) => node.id));
    return (data?.graph?.edges ?? [])
      .filter((edge) => nodeIds.has(edge.source_node_id) && nodeIds.has(edge.target_node_id))
      .map((edge) => ({
        id: edge.id,
        source: edge.source_node_id,
        target: edge.target_node_id,
        label: edge.edge_type,
        markerEnd: { type: MarkerType.ArrowClosed },
      }));
  }, [data?.graph?.edges, data?.graph?.nodes]);

  const selectedNode = data?.graph?.nodes.find((node) => node.id === selectedNodeId);
  const contributionTypes = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const member of data?.contributions?.member_summaries ?? []) {
      for (const [type, count] of Object.entries(member.by_type)) {
        totals[type] = (totals[type] ?? 0) + count;
      }
    }
    return Object.entries(totals).sort((left, right) => right[1] - left[1]);
  }, [data?.contributions?.member_summaries]);

  async function reanalyze() {
    setAnalyzing(true);
    setLoadError(null);
    const result = await triggerProjectAnalysis(projectId);
    if (result === null) {
      setLoadError({ projectId, message: "Analysis failed. The backend did not save a new analysis snapshot." });
      setAnalyzing(false);
      return;
    }
    try {
      setLoadedData({ projectId, value: await loadProjectIntelligence(projectId) });
    } catch {
      setLoadError({ projectId, message: "Analysis completed, but refreshed results could not be loaded." });
    } finally {
      setAnalyzing(false);
    }
  }

  const contributions = data?.contributions;
  const blueprint = data?.blueprint;
  const activities = data?.activities ?? [];

  return (
    <main className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <h1 className="font-display text-2xl font-bold">Project Intelligence</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {data?.project?.name ?? `Project ${projectId}`} · Deterministic analysis from recorded project data
          </p>
        </div>
        <Button onClick={reanalyze} disabled={loading || analyzing} size="sm">
          <RefreshCw className={`h-4 w-4 ${analyzing ? "animate-spin" : ""}`} />
          {analyzing ? "Analyzing" : "Analyze project"}
        </Button>
      </header>

      {error && <div role="alert" className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>}
      {loading && <p className="text-sm text-muted-foreground">Loading project analysis…</p>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Users} label="Participation equity" value={contributions ? `${contributions.equity_score}%` : "Unavailable"} detail={contributions?.equity_interpretation ?? "No backend result"} />
        <MetricCard icon={ActivityIcon} label="Contribution events" value={contributions ? String(contributions.total_contributions) : "Unavailable"} detail={contributions ? `${contributions.active_contributors} active contributors` : "No backend result"} />
        <MetricCard icon={MessageSquareText} label="Discussions" value={data?.discussions ? String(data.discussions.length) : "Unavailable"} detail={`${data?.discussions?.reduce((total, item) => total + item.message_count, 0) ?? 0} recorded messages`} />
        <MetricCard icon={Network} label="Knowledge graph" value={data?.graph ? `${data.graph.node_count} nodes` : "Unavailable"} detail={`${data?.graph?.edge_count ?? 0} recorded relationships`} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><SectionTitle icon={Users} title="Participation equity" /></CardHeader>
          <CardContent>
            {!contributions?.member_summaries.length ? <EmptyState>No contribution analytics are available.</EmptyState> : (
              <div className="space-y-4">
                {contributions.member_summaries.map((member) => (
                  <div key={member.user_id}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-medium">{member.name}</span>
                      <span className="shrink-0 text-muted-foreground">{member.percentage}% · {member.count} events</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded bg-muted">
                      <div className="h-full rounded bg-primary" style={{ width: `${Math.max(0, Math.min(100, member.percentage))}%` }} />
                    </div>
                  </div>
                ))}
                <div className="border-t border-border pt-3 text-xs text-muted-foreground">
                  Gini coefficient {contributions.gini_coefficient} · Participation rate {Math.round(contributions.participation_rate * 100)}%
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><SectionTitle icon={ActivityIcon} title="Contribution breakdown" /></CardHeader>
          <CardContent>
            {!contributionTypes.length ? <EmptyState>No contribution events have been recorded.</EmptyState> : (
              <div className="space-y-3">
                {contributionTypes.map(([type, count]) => {
                  const maxCount = Math.max(...contributionTypes.map((entry) => entry[1]));
                  return (
                    <div key={type}>
                      <div className="mb-1 flex justify-between text-sm"><span>{type.replaceAll("_", " ")}</span><span className="text-muted-foreground">{count}</span></div>
                      <div className="h-2 rounded bg-muted"><div className="h-2 rounded bg-emerald-600" style={{ width: `${(count / maxCount) * 100}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.6fr)]">
        <Card>
          <CardHeader><SectionTitle icon={Network} title="Knowledge graph" count={graphEdges.length} /></CardHeader>
          <CardContent>
            {!graphNodes.length ? <EmptyState>No graph data is available for this project.</EmptyState> : (
              <div className="h-107.5 overflow-hidden rounded-lg border border-border bg-muted/20">
                <ReactFlow nodes={graphNodes} edges={graphEdges} fitView nodesConnectable={false} onNodeClick={(_, node) => setSelectedNodeId(node.id)}>
                  <Background gap={22} size={1} />
                  <Controls showInteractive={false} />
                </ReactFlow>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Selected node</CardTitle><CardDescription>Recorded graph metadata and connected evidence.</CardDescription></CardHeader>
          <CardContent>
            {!selectedNode ? <EmptyState>Select a graph node to inspect its recorded metadata.</EmptyState> : (
              <div className="space-y-3">
                <div><Badge variant="outline">{selectedNode.node_type}</Badge><h3 className="mt-2 font-semibold">{selectedNode.label}</h3></div>
                <p className="text-sm text-muted-foreground">{selectedNode.description || "No description recorded."}</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {Object.entries(selectedNode.metadata ?? {}).map(([key, value]) => <p key={key}><span className="font-medium text-foreground">{key}:</span> {JSON.stringify(value)}</p>)}
                </div>
                <p className="border-t border-border pt-3 text-xs text-muted-foreground">
                  {(data?.graph?.edges ?? []).filter((edge) => edge.source_node_id === selectedNode.id || edge.target_node_id === selectedNode.id).length} linked relationships
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><SectionTitle icon={AlertTriangle} title="Knowledge silos and gaps" /></CardHeader>
          <CardContent className="space-y-4">
            {!data?.silos ? <EmptyState>Silo analysis is unavailable.</EmptyState> : (
              <>
                {data.silos.silos.map((silo) => (
                  <div key={silo.id} className="border-b border-border pb-3 last:border-0">
                    <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{silo.topic}</h3><Badge variant="warning">{silo.risk}</Badge></div>
                    <p className="mt-1 text-sm text-muted-foreground">Owners: {silo.owners.join(", ") || "Not identified"}</p>
                    <p className="mt-1 text-sm">{silo.supporting_evidence.join(" · ")}</p>
                    <p className="mt-1 text-sm text-primary">Action: {silo.recommended_action}</p>
                  </div>
                ))}
                {data.silos.gaps.map((gap) => (
                  <div key={gap.id} className="border-b border-border pb-3 last:border-0">
                    <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{gap.skill_or_topic}</h3><Badge variant="outline">{gap.gap_type}</Badge></div>
                    <p className="mt-1 text-sm text-muted-foreground">{gap.impact}</p>
                    <p className="mt-1 text-sm text-primary">Action: {gap.recommended_action}</p>
                  </div>
                ))}
                {!data.silos.silos.length && !data.silos.gaps.length && <EmptyState>No silos or knowledge gaps were detected from current records.</EmptyState>}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><SectionTitle icon={MessageSquareText} title="Discussion intelligence" count={data?.discussions?.length ?? 0} /></CardHeader>
          <CardContent className="space-y-3">
            {!data?.discussions?.length ? <EmptyState>No discussion analysis is available.</EmptyState> : data.discussions.map((discussion) => (
              <div key={discussion.id} className="border-b border-border pb-3 last:border-0">
                <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{discussion.title}</h3><Badge variant="outline">{discussion.consensus_status}</Badge></div>
                <p className="mt-1 text-xs text-muted-foreground">{discussion.message_count} messages · {discussion.participant_count} participants · {discussion.viewpoint_count} viewpoints · {discussion.vote_count} votes · divergence {discussion.divergence_score.toFixed(2)}</p>
                {discussion.unresolved_questions.map((question) => <p key={question} className="mt-2 text-sm">Open question: {question}</p>)}
                {discussion.suggested_resolution && <p className="mt-2 text-sm text-muted-foreground">Recorded resolution: {discussion.suggested_resolution}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section>
        <SectionTitle icon={Brain} title="Collective insights" count={data?.insights?.length ?? 0} />
        {!data?.insights?.length ? <EmptyState>No persisted insights are available. Run analysis to refresh them.</EmptyState> : (
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.insights.map((insight) => (
              <Card key={insight.id}>
                <CardHeader><div className="flex items-center justify-between gap-2"><Badge variant="outline">{insight.insight_type}</Badge><span className="text-xs text-muted-foreground">{Math.round(insight.confidence * 100)}% confidence</span></div><CardTitle className="mt-2">{insight.title}</CardTitle><CardDescription>{insight.summary}</CardDescription></CardHeader>
                <CardContent>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Evidence</p>
                  {!insight.evidence.length ? <p className="mt-1 text-sm text-muted-foreground">No evidence is attached.</p> : insight.evidence.map((item, index) => <p key={`${item.source_type}-${item.source_id}-${index}`} className="mt-1 text-sm">{item.description} <span className="text-xs text-muted-foreground">({item.source_type} {item.source_id})</span></p>)}
                  {insight.action_items.length > 0 && <p className="mt-3 text-sm text-primary">{insight.action_items.join(" · ")}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle icon={Users} title="Collaboration recommendations" count={data?.recommendations?.length ?? 0} />
        {!data?.recommendations?.length ? <EmptyState>No recommendations are available from current project data.</EmptyState> : (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {data.recommendations.map((recommendation) => (
              <Card key={recommendation.id}>
                <CardHeader><div className="flex items-center justify-between gap-2"><Badge variant="outline">{recommendation.type}</Badge><Badge variant={recommendation.priority === "high" ? "warning" : "outline"}>{recommendation.priority}</Badge></div><CardTitle className="mt-2">{recommendation.title}</CardTitle><CardDescription>{recommendation.reason}</CardDescription></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><span className="font-medium">Participants:</span> {recommendation.participants.map((person) => person.name || person.user_id).join(", ") || "Not specified"}</p>
                  <p><span className="font-medium">Evidence:</span> {recommendation.sources.map((source) => `${source.source_type} ${source.source_id}`).join(", ") || "No sources attached"}</p>
                  {recommendation.suggested_agenda.length > 0 && <p className="text-muted-foreground">{recommendation.suggested_agenda.join(" · ")}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><SectionTitle icon={ActivityIcon} title="Activity impact" count={data?.impacts.length ?? 0} /></CardHeader>
          <CardContent className="space-y-3">
            {data?.impacts.length ? data.impacts.map((impact) => (
              <div key={impact.activity_id} className="border-b border-border pb-3 last:border-0">
                <h3 className="font-semibold">{impact.activity_title}</h3><p className="mt-1 text-sm text-muted-foreground">{impact.narrative_summary}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">{Object.entries(impact.metric_changes).map(([key, value]) => <Badge key={key} variant="outline">{key.replaceAll("_", " ")}: {formatMetric(value)}</Badge>)}</div>
              </div>
            )) : <EmptyState>{activities.some((activity) => activity.status === "completed") ? "Completed activities have no persisted before/after metrics." : "No completed activity has a measured before/after comparison."}</EmptyState>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><SectionTitle icon={Layers3} title="Solution blueprint" /></CardHeader>
          <CardContent>
            {!blueprint ? <EmptyState>No persisted blueprint is available.</EmptyState> : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{blueprint.title}</h3><Badge variant="outline">Version {blueprint.version}</Badge></div>
                <p className="text-sm text-muted-foreground">{blueprint.problem_statement || blueprint.summary}</p>
                <div className="divide-y divide-border">
                  {blueprint.modules.map((module, index) => <div key={`${module.name}-${index}`} className="py-2"><div className="flex justify-between gap-2"><span className="font-medium">{module.name}</span><span className="text-xs text-muted-foreground">{module.status}</span></div><p className="text-sm text-muted-foreground">{module.summary}</p>{module.deliverables.length > 0 && <p className="mt-1 text-xs">{module.deliverables.join(" · ")}</p>}</div>)}
                </div>
                <div className="grid gap-3 sm:grid-cols-2"><div><h4 className="text-xs font-semibold uppercase text-muted-foreground">Unresolved risks</h4>{blueprint.unresolved_risks.map((risk) => <p key={risk} className="mt-1 text-sm">{risk}</p>)}</div><div><h4 className="text-xs font-semibold uppercase text-muted-foreground">Next actions</h4>{blueprint.action_plan.map((action) => <p key={action} className="mt-1 text-sm">{action}</p>)}</div></div>
                <p className="border-t border-border pt-2 text-xs text-muted-foreground">{blueprint.sources.length} source references · {blueprint.expected_measurable_changes.length} expected measures</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader><SectionTitle icon={Clock3} title="Analysis history" count={data?.snapshots?.length ?? 0} /></CardHeader>
        <CardContent>
          {!data?.snapshots?.length ? <EmptyState>No analysis snapshots are stored.</EmptyState> : (
            <div className="divide-y divide-border">
              {data.snapshots.map((snapshot) => (
                <div key={snapshot.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="font-medium">{snapshot.analysis_type.replaceAll("_", " ")}</p><p className="text-xs text-muted-foreground">{snapshot.created_at ? new Date(snapshot.created_at).toLocaleString() : "Timestamp unavailable"}</p></div>
                  <div className="flex flex-wrap gap-2">{Object.entries(snapshot.data).slice(0, 5).map(([key, value]) => <Badge key={key} variant="outline">{key.replaceAll("_", " ")}: {formatMetric(value)}</Badge>)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Brain;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground"><Icon className="h-4 w-4" />{label}</div>
        <p className="mt-3 font-display text-2xl font-bold">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}
