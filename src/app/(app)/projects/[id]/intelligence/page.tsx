"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  type Node,
  type Edge,
} from "@xyflow/react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Brain,
  Sparkles,
  GitMerge,
  Network,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  ShieldAlert,
  Layers,
  MessageSquare,
  Download,
  ThumbsUp,
  Flag,
} from "lucide-react";
import { ActivityModal } from "@/components/activity-modal";
import { ActivityRoomModal } from "@/components/activity-room-modal";
import { BackendStatusPill } from "@/components/ui/backend-status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { getUser, knowledgeEdges, knowledgeNodes } from "@/lib/mock-data";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { useMounted } from "@/lib/utils";
import {
  fetchVoiceEquity,
  fetchCoherentSolutionBlueprint,
  fetchFragmentedDebates,
  fetchCollaborationRecommendations,
  castConsensusVoteApi,
  updateTaskApi,
  type VoiceEquityResponse,
  type FragmentedDebate,
  type BackendRecommendation,
  type CoherentBlueprint,
} from "@/lib/api";
import type { Activity, Recommendation, SolutionSynthesis } from "@/lib/types";

const COLORS = ["#0f766e", "#0d9488", "#14b8a6", "#2dd4bf", "#99f6e4"];

export default function IntelligencePage() {
  const params = useParams();
  const id = params.id as string;
  const currentUser = useAuthStore((s) => s.user);
  const project = useAppStore((s) => s.projects.find((p) => p.id === id));
  const allDiscussions = useAppStore((s) => s.discussions);
  const allDocuments = useAppStore((s) => s.documents);
  const allTasks = useAppStore((s) => s.tasks);
  const allInsights = useAppStore((s) => s.insights);
  const addInsight = useAppStore((s) => s.addInsight);
  const solutionSyntheses = useAppStore((s) => s.solutionSyntheses);
  const setSolutionSynthesis = useAppStore((s) => s.setSolutionSynthesis);
  const allRecommendations = useAppStore((s) => s.recommendations);
  const rebalanceTasks = useAppStore((s) => s.rebalanceTasks);
  const voteResolution = useAppStore((s) => s.voteResolution);
  const allActivities = useAppStore((s) => s.activities);
  const addToast = useAppStore((s) => s.addToast);

  const [activeTab, setActiveTab] = useState<"overview" | "flow" | "participation" | "solution">("solution");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activityOpen, setActivityOpen] = useState(false);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const mounted = useMounted();
  const [activeRoomSession, setActiveRoomSession] = useState<Activity | null>(null);
  const [backendEquity, setBackendEquity] = useState<VoiceEquityResponse | null>(null);
  const [backendDebates, setBackendDebates] = useState<FragmentedDebate[] | null>(null);
  const [backendRecs, setBackendRecs] = useState<BackendRecommendation[] | null>(null);
  const [backendBlueprint, setBackendBlueprint] = useState<CoherentBlueprint | null>(null);

  const discussions = useMemo(
    () => allDiscussions.filter((discussion) => discussion.projectId === id),
    [allDiscussions, id]
  );
  const documents = useMemo(
    () => allDocuments.filter((document) => document.projectId === id),
    [allDocuments, id]
  );
  const tasks = useMemo(
    () => allTasks.filter((task) => task.projectId === id),
    [allTasks, id]
  );

  useEffect(() => {
    let active = true;

    // Asynchronously ping FastAPI backend for live Voice Equity computation
    fetchVoiceEquity(id)
      .then((data) => {
        if (active && data) setBackendEquity(data);
      })
      .catch(() => {});

    // Fetch fragmented discussion debates detected by AI
    fetchFragmentedDebates(id)
      .then((data) => {
        if (active && data) setBackendDebates(data);
      })
      .catch(() => {});

    // Fetch targeted collaborative activities
    fetchCollaborationRecommendations(id)
      .then((data) => {
        if (active && data) setBackendRecs(data);
      })
      .catch(() => {});

    // Fetch synthesized coherent blueprint from backend
    fetchCoherentSolutionBlueprint(id)
      .then((data) => {
        if (active && data) setBackendBlueprint(data);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [id]);


function mapRecommendationType(type: string): Recommendation["type"] {
  const normalized = type.toLowerCase().replace(/[\s-]+/g, "_");
  if (normalized.includes("pair")) return "pair_programming";
  if (normalized.includes("review")) return "peer_review";
  if (normalized.includes("quiz")) return "mini_quiz";
  if (normalized.includes("reassign") || normalized.includes("task")) return "task_reassignment";
  if (normalized.includes("discuss")) return "discussion";
  if (normalized.includes("research") || normalized.includes("compare")) return "research_comparison";
  return "knowledge_sharing";
}

  const recommendations = useMemo(() => {
    const recs = allRecommendations.filter((r) => r.projectId === id);
    if (backendRecs && backendRecs.length > 0) {
      const mappedBackend: Recommendation[] = backendRecs.map((br) => ({
        id: br.id,
        projectId: id,
        type: mapRecommendationType(br.type),
        title: br.title,
        why: br.reason,
        participants: br.target_members.length > 0 ? br.target_members : (project?.members.slice(0, 2).map((m) => m.userId) || ["u1", "u2"]),
        duration: "30 minutes",
        status: "pending" as const,
      }));
      const existingTitles = new Set(recs.map((r) => r.title.toLowerCase()));
      const uniqueBackend = mappedBackend.filter((b) => !existingTitles.has(b.title.toLowerCase()));
      return [...recs, ...uniqueBackend];
    }
    if (recs.length > 0) return recs;
    return allRecommendations.filter((r) => r.projectId === "p1");
  }, [allRecommendations, backendRecs, id, project]);

  const projectInsights = useMemo(() => {
    const list = allInsights.filter((i) => i.projectId === id);
    if (list.length > 0) return list;
    return allInsights.filter((i) => i.projectId === "p1");
  }, [allInsights, id]);

  // Contribution chart
  const contributionData = useMemo(() => {
    if (backendEquity?.members && backendEquity.members.length > 0) {
      return backendEquity.members.map((m) => {
        const u = getUser(m.user_id);
        const displayName = m.name || u?.name || m.user_id;
        return {
          name: displayName.split(" ")[0],
          value: m.contribution_percentage,
          userId: m.user_id,
        };
      });
    }
    if (!project) return [];
    return project.members.map((m) => ({
      name: (m.name || getUser(m.userId)?.name || m.userId).split(" ")[0],
      value: m.contribution,
      userId: m.userId,
    }));
  }, [backendEquity, project]);

  // Participation by channel
  const participationData = useMemo(() => [
    { name: "Discussions", value: Math.max(discussions.length * 5, 34) },
    { name: "Tasks", value: Math.max(tasks.length * 4, 28) },
    { name: "Documents", value: Math.max(documents.length * 6, 18) },
    { name: "Reviews", value: 20 },
  ], [discussions.length, tasks.length, documents.length]);

  // ReactFlow Nodes
  const nodes: Node[] = useMemo(() => {
    if (id === "p1") {
      return knowledgeNodes.map((n, i) => {
        const isSelected = selectedNodeId === n.id;
        return {
          id: n.id,
          position: {
            x: 80 + (i % 3) * 220,
            y: 40 + Math.floor(i / 3) * 160 + (i % 2) * 25,
          },
          data: {
            label: `${n.label}\n${n.role} · ${n.topics.slice(0, 2).join(", ")}`,
          },
          style: {
            background: isSelected ? "#f0fdfa" : "#ffffff",
            border: isSelected ? "2px solid #0f766e" : "1px solid #e2e5ec",
            borderRadius: 14,
            padding: "10px 14px",
            width: 170,
            fontSize: 12,
            fontWeight: isSelected ? 600 : 500,
            color: isSelected ? "#0f766e" : "#0c1222",
            whiteSpace: "pre-line" as const,
            textAlign: "center" as const,
            boxShadow: isSelected
              ? "0 4px 20px rgba(15, 118, 110, 0.18)"
              : "0 1px 3px rgba(12, 18, 34, 0.04)",
            lineHeight: 1.4,
            cursor: "pointer",
          },
        };
      });
    }

    return (project?.members || []).map((m, i) => {
      const u = getUser(m.userId);
      const isSelected = selectedNodeId === m.userId;
      const role = m.role || u?.role || "Contributor";
      const topics = u?.skills?.slice(0, 2) || ["Architecture", "Core"];
      return {
        id: m.userId,
        position: {
          x: 70 + (i % 3) * 220,
          y: 40 + Math.floor(i / 3) * 160 + (i % 2) * 25,
        },
        data: {
          label: `${u?.name || m.userId}\n${role} · ${topics.join(", ")}`,
        },
        style: {
          background: isSelected ? "#f0fdfa" : "#ffffff",
          border: isSelected ? "2px solid #0f766e" : "1px solid #e2e5ec",
          borderRadius: 14,
          padding: "10px 14px",
          width: 170,
          fontSize: 12,
          fontWeight: isSelected ? 600 : 500,
          color: isSelected ? "#0f766e" : "#0c1222",
          whiteSpace: "pre-line" as const,
          textAlign: "center" as const,
          boxShadow: isSelected
            ? "0 4px 20px rgba(15, 118, 110, 0.18)"
            : "0 1px 3px rgba(12, 18, 34, 0.04)",
          lineHeight: 1.4,
          cursor: "pointer",
        },
      };
    });
  }, [project, selectedNodeId, id]);

  // ReactFlow Edges
  const edges: Edge[] = useMemo(() => {
    if (id === "p1") {
      return knowledgeEdges.map((e) => {
        const isConnected = selectedNodeId === e.source || selectedNodeId === e.target;
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.topic,
          animated: isConnected || e.strength > 0.7,
          style: {
            stroke: isConnected ? "#0f766e" : e.strength > 0.7 ? "#0d9488" : "#cbd5e1",
            strokeWidth: isConnected ? 2.5 : 1 + e.strength * 2,
          },
          labelStyle: {
            fontSize: 10,
            fontWeight: isConnected ? 600 : 500,
            fill: isConnected ? "#0f766e" : "#5c6578",
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isConnected ? "#0f766e" : "#0d9488",
          },
        };
      });
    }

    const members = project?.members || [];
    const generated: Edge[] = [];
    for (let i = 0; i < members.length - 1; i++) {
      const src = members[i].userId;
      const tgt = members[i + 1].userId;
      const isConnected = selectedNodeId === src || selectedNodeId === tgt;
      generated.push({
        id: `ge-${src}-${tgt}`,
        source: src,
        target: tgt,
        label: "Deliverables Exchange",
        animated: isConnected,
        style: {
          stroke: isConnected ? "#0f766e" : "#0d9488",
          strokeWidth: isConnected ? 2.5 : 1.5,
        },
        labelStyle: {
          fontSize: 10,
          fontWeight: isConnected ? 600 : 500,
          fill: isConnected ? "#0f766e" : "#5c6578",
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#0d9488",
        },
      });
    }
    return generated;
  }, [id, project, selectedNodeId]);


  // Default pre-computed solution synthesis for the hackathon problem statement
  const currentSynthesis: SolutionSynthesis = useMemo(() => {
    if (solutionSyntheses[id]) {
      return solutionSyntheses[id];
    }

    if (backendBlueprint) {
      const docModules = documents.map((doc) => ({
        name: doc.name.replace(/\.[^/.]+$/, ""),
        contributor: `${getUser(doc.uploadedBy)?.name || "Teammate"} (${getUser(doc.uploadedBy)?.department || "Contributor"})`,
        sourceType: "Document" as const,
        status: (doc.status === "final" ? "integrated" : "in_progress") as "integrated" | "in_progress" | "pending_review",
        description: doc.contentPreview?.slice(0, 130) || `Shared document specification contributed by ${getUser(doc.uploadedBy)?.name || "a member"}.`,
      }));

      const bpModules = backendBlueprint.modules?.map((m) => ({
        name: m.name,
        contributor: m.owner || "AI Engine",
        sourceType: "Document" as const,
        status: (m.status === "approved" || m.status === "integrated" || m.status === "Verified" ? "integrated" : "in_progress") as "integrated" | "in_progress" | "pending_review",
        description: m.summary || (m.deliverables && m.deliverables.join(", ")) || "Synthesized architecture module.",
      })) || [];

      const initialComponents: SolutionSynthesis["architectureComponents"] = [...docModules, ...bpModules];
      if (initialComponents.length === 0) {
        initialComponents.push({
          name: `${project?.name || "System"} Core Module`,
          contributor: `${getUser(project?.ownerId || "u1")?.name || "Project Lead"}`,
          sourceType: "Code" as const,
          status: "in_progress" as const,
          description: project?.description || "Primary architectural system foundation.",
        });
      }

      const dynamicParticipation = (project?.members || []).map((m) => {
        const u = getUser(m.userId);
        const displayName = m.name || u?.name || m.userId;
        const memberDiscussions = discussions.filter((d) => d.authorId === m.userId).length;
        const memberTasks = tasks.filter((t) => t.assigneeId === m.userId).length;
        const memberDocs = documents.filter((d) => d.uploadedBy === m.userId).length;
        const total = memberDiscussions + memberTasks + memberDocs;

        let level: "dominant" | "balanced" | "underrepresented" = "balanced";
        if (m.contribution >= 45 || total >= 5) level = "dominant";
        else if (m.contribution < 20 && total <= 1) level = "underrepresented";

        let observation = `${displayName} actively coordinates across project deliverables.`;
        let recommendedRole = "Maintain current momentum and coordinate with peers on next sprint deliverables.";

        if (level === "dominant") {
          observation = `${displayName} drives the majority of decisions and tasks (${m.contribution}% contribution). Single-point dependency risk.`;
          recommendedRole = "Host a 15-minute knowledge transfer session to cross-train teammates.";
        } else if (level === "underrepresented") {
          observation = `${displayName} has fewer logged interactions in current sprint threads and assigned tasks.`;
          recommendedRole = "Pair on the next milestone review or lead the upcoming architecture validation check.";
        }

        return {
          memberId: m.userId,
          participationScore: Math.min(95, Math.max(25, m.contribution || 50)),
          level,
          observation,
          recommendedRole,
        };
      });

      return {
        projectId: id,
        headline: backendBlueprint.architectural_summary
          ? `${project?.name || "Project"} — Coherent Architectural Blueprint`
          : `${project?.name || "Project"} — Unified Architecture & Coherent Solution`,
        summary: backendBlueprint.architectural_summary || `AI intelligence has unified ${documents.length} project documents, ${discussions.length} discussion threads, and ${tasks.length} tasks across ${project?.members.length || 0} members into an integrated system architecture.`,
        architectureComponents: initialComponents,
        fragmentedResolutions: (backendBlueprint.agreed_consensus || []).map((cons, idx) => ({
          topic: cons.includes(":") ? cons.split(":")[0].trim() : `Architectural Consensus #${idx + 1}`,
          debatedIn: `Discussions (FastAPI Architectural Debate)`,
          divergentPoints: [
            "Contrasting implementation paths debated across project contributors.",
            "Benchmarked trade-offs on maintainability and runtime performance.",
          ],
          synthesizedResolution: cons.includes(":") ? cons.split(":").slice(1).join(":").trim() : cons,
          consensusStatus: "resolved" as const,
          votes: { pro: 3, con: 0, userVote: undefined },
        })),
        participationBalanceAnalysis: dynamicParticipation.length > 0 ? dynamicParticipation : [
          {
            memberId: project?.ownerId || "u1",
            participationScore: 80,
            level: "balanced",
            observation: "Active contributor and project coordinator.",
            recommendedRole: "Facilitate upcoming sprint knowledge exchange.",
          },
        ],
        synthesizedAt: backendBlueprint.generated_at || new Date().toISOString(),
      };
    }

    if (id !== "p1") {
      const docModules = documents.map((doc) => ({
        name: doc.name.replace(/\.[^/.]+$/, ""),
        contributor: `${getUser(doc.uploadedBy)?.name || "Teammate"} (${getUser(doc.uploadedBy)?.department || "Contributor"})`,
        sourceType: "Document" as const,
        status: (doc.status === "final" ? "integrated" : "in_progress") as "integrated" | "in_progress" | "pending_review",
        description: doc.contentPreview?.slice(0, 130) || `Shared document specification contributed by ${getUser(doc.uploadedBy)?.name || "a member"}.`,
      }));

      const initialComponents: SolutionSynthesis["architectureComponents"] = [...docModules];
      if (initialComponents.length === 0) {
        initialComponents.push({
          name: `${project?.name || "System"} Core Module`,
          contributor: `${getUser(project?.ownerId || "u1")?.name || "Project Lead"}`,
          sourceType: "Code" as const,
          status: "in_progress" as const,
          description: project?.description || "Primary architectural system foundation.",
        });
      }

      const dynamicParticipation = (project?.members || []).map((m) => {
        const u = getUser(m.userId);
        const displayName = m.name || u?.name || m.userId;
        const memberDiscussions = discussions.filter((d) => d.authorId === m.userId).length;
        const memberTasks = tasks.filter((t) => t.assigneeId === m.userId).length;
        const memberDocs = documents.filter((d) => d.uploadedBy === m.userId).length;
        const total = memberDiscussions + memberTasks + memberDocs;

        let level: "dominant" | "balanced" | "underrepresented" = "balanced";
        if (m.contribution >= 45 || total >= 5) level = "dominant";
        else if (m.contribution < 20 && total <= 1) level = "underrepresented";

        let observation = `${displayName} actively coordinates across project deliverables.`;
        let recommendedRole = "Maintain current momentum and coordinate with peers on next sprint deliverables.";

        if (level === "dominant") {
          observation = `${displayName} drives the majority of decisions and tasks (${m.contribution}% contribution). Single-point dependency risk.`;
          recommendedRole = "Host a 15-minute knowledge transfer session to cross-train teammates.";
        } else if (level === "underrepresented") {
          observation = `${displayName} has fewer logged interactions in current sprint threads and assigned tasks.`;
          recommendedRole = "Pair on the next milestone review or lead the upcoming architecture validation check.";
        }

        return {
          memberId: m.userId,
          participationScore: Math.min(95, Math.max(25, m.contribution || 50)),
          level,
          observation,
          recommendedRole,
        };
      });

      return {
        projectId: id,
        headline: `${project?.name || "Project"} — Unified Architecture & Coherent Solution`,
        summary: `AI intelligence has unified ${documents.length} project documents, ${discussions.length} discussion threads, and ${tasks.length} tasks across ${project?.members.length || 0} members into an integrated system architecture.`,
        architectureComponents: initialComponents,
        fragmentedResolutions: [
          {
            topic: "System Interface & Module Integration Protocol",
            debatedIn: `Discussions (${discussions.length} messages analyzed)`,
            divergentPoints: [
              "Initial proposal prioritized rapid isolated component prototypes to maximize velocity.",
              "Peer reviews emphasized shared data contracts and early cross-validation.",
            ],
            synthesizedResolution:
              "Standardize shared schemas across all sub-modules and validate end-to-end integration via continuous test builds.",
            consensusStatus: "resolved",
            votes: { pro: 3, con: 0, userVote: undefined },
          },
        ],
        participationBalanceAnalysis: dynamicParticipation.length > 0 ? dynamicParticipation : [
          {
            memberId: project?.ownerId || "u1",
            participationScore: 80,
            level: "balanced",
            observation: "Active contributor and project coordinator.",
            recommendedRole: "Facilitate upcoming sprint knowledge exchange.",
          },
        ],
        synthesizedAt: new Date().toISOString(),
      };
    }

    return {
      projectId: id,
      headline: "Collective Learning Summary & Collaboration Blueprint",
      summary:
        "AI intelligence has synthesized authorized shared documents, project discussions, and task activity into a collective summary. Decisions are linked to their sources, open questions are surfaced, and next steps are designed to spread knowledge across the team.",
      architectureComponents: [
        {
          name: "Authorized Collaboration Data Map",
          contributor: "Priya Sharma (Learning Data)",
          sourceType: "Document",
          status: "integrated",
          description: "Connects opt-in project discussions, shared documents, and task contributions while keeping private messages out of scope.",
        },
        {
          name: "Collective Summary & Open Questions",
          contributor: "Karthik Menon (NLP Engineer)",
          sourceType: "Task",
          status: "in_progress",
          description: "Combines shared notes and discussion decisions, preserves source links, and highlights unresolved questions for team review.",
        },
        {
          name: "Participation Balance Signals",
          contributor: "Arun Krishnan (Facilitation Research)",
          sourceType: "Document",
          status: "pending_review",
          description: "Shows where project context is concentrated using neutral team-level language, without ranking or shaming members.",
        },
        {
          name: "Knowledge Flow & Activity Recommendations",
          contributor: "Divya Nair (Product Design)",
          sourceType: "Document",
          status: "integrated",
          description: "Connects related topics across authorized sources and recommends peer review, knowledge sharing, or paired work with a clear reason.",
        },
        {
          name: "Member Consent & Source Review",
          contributor: "Ritheesh Kumar (Lead)",
          sourceType: "Code",
          status: "integrated",
          description: "Makes analyzed sources visible so teammates can review the scope, correct summaries, and withdraw participation.",
        },
      ],
      fragmentedResolutions: [
        {
          topic: "Member Consent & Summary Corrections",
          debatedIn: "Discussions #d3 and #d6",
          divergentPoints: [
              "The team wants helpful collaboration insights based on shared project activity.",
              "Members need visibility into analyzed sources and a way to correct generated summaries.",
          ],
          synthesizedResolution:
            "Analyze only member-authorized project discussions, shared documents, and task activity; show source links and allow teammates to review or correct each summary.",
          consensusStatus: "resolved",
        },
        {
          topic: "Participation Insights Without Individual Scores",
          debatedIn: "Discussions #d4 and #d6",
          divergentPoints: [
              "The team wants to notice unequal participation before it blocks progress.",
              "Members do not want individual activity to become a public performance score.",
          ],
          synthesizedResolution:
            "Describe team-level knowledge gaps in neutral language and recommend a specific activity that gives more teammates a meaningful way to contribute.",
          consensusStatus: "resolved",
        },
      ],
      participationBalanceAnalysis: [
        {
          memberId: "u2",
          participationScore: 88,
          level: "dominant",
          observation: "Priya currently carries most of the shared decision notes, so some project context may be difficult for others to pick up.",
          recommendedRole: "Invite a second teammate to co-present the decision log in a short knowledge-sharing session.",
        },
        {
          memberId: "u4",
          participationScore: 82,
          level: "balanced",
          observation: "Karthik connects discussion themes with project tasks and helps keep follow-up work visible.",
          recommendedRole: "Pair with Arun to review unresolved questions and link decisions to their source notes.",
        },
        {
          memberId: "u3",
          participationScore: 54,
          level: "underrepresented",
          observation: "Arun's facilitation notes are valuable, but they have not yet been connected to the active project discussion.",
          recommendedRole: "Invite Arun to lead a peer review of the collective summary and gather missing context.",
        },
        {
          memberId: "u5",
          participationScore: 42,
          level: "underrepresented",
          observation: "Divya's product-design work has few links to the current decision log and open questions.",
          recommendedRole: "Pair with Priya to connect the learning-insights view to member-reviewed source material.",
        },
      ],
      synthesizedAt: new Date().toISOString(),
    };
  }, [id, solutionSyntheses, project, documents, discussions, tasks, backendBlueprint]);

  const allFragmentedResolutions = useMemo(() => {
    const list: typeof currentSynthesis.fragmentedResolutions = [];
    if (backendDebates && backendDebates.length > 0) {
      backendDebates.forEach((bd) => {
        list.push({
          id: bd.id,
          topic: bd.title,
          debatedIn: `Discussions (FastAPI Debate #${bd.id})`,
          divergentPoints: [
            "Identified contrasting technical priorities in project discussion threads.",
            `Divergence score assessed at ${Math.round(bd.divergence_score * 100)}% prior to resolution.`,
          ],
          synthesizedResolution: bd.suggested_resolution,
          consensusStatus: bd.status === "resolved" ? "resolved" : "needs_team_vote",
          votes: {
            pro: bd.pro_votes,
            con: bd.con_votes,
            userVote: undefined,
          },
        });
      });
    }
    currentSynthesis.fragmentedResolutions.forEach((r) => {
      if (!list.some((existing) => existing.topic.toLowerCase() === r.topic.toLowerCase())) {
        list.push(r);
      }
    });
    return list;
  }, [currentSynthesis, backendDebates]);

  const handleSynthesize = async () => {
    setIsSynthesizing(true);
    let backendBp = null;
    try {
      backendBp = await fetchCoherentSolutionBlueprint(id);
    } catch {
      backendBp = null;
    }

    setTimeout(() => {
      const docModules = documents.map((doc) => ({
        name: doc.name.replace(/\.[^/.]+$/, ""),
        contributor: `${getUser(doc.uploadedBy)?.name || "Teammate"} (${getUser(doc.uploadedBy)?.department || "Contributor"})`,
        sourceType: "Document" as const,
        status: (doc.status === "final" ? "integrated" : doc.status === "reviewed" ? "in_progress" : "pending_review") as "integrated" | "in_progress" | "pending_review",
        description: doc.contentPreview?.slice(0, 130) || `Shared document specification contributed by ${getUser(doc.uploadedBy)?.name}.`,
      }));

      const baseModules = id === "p1" ? [
        {
          name: "Authorized Collaboration Data Map",
          contributor: "Priya Sharma (Learning Data)",
          sourceType: "Document" as const,
          status: "integrated" as const,
          description: "Connects opt-in project discussions, shared documents, and task contributions while keeping private messages out of scope.",
        },
        {
          name: "Collective Summary & Open Questions",
          contributor: "Karthik Menon (NLP Engineer)",
          sourceType: "Task" as const,
          status: "in_progress" as const,
          description: "Combines shared notes and discussion decisions, preserves source links, and highlights unresolved questions for team review.",
        },
        {
          name: "Participation Balance Signals",
          contributor: "Arun Krishnan (Facilitation Research)",
          sourceType: "Document" as const,
          status: "pending_review" as const,
          description: "Shows where project context is concentrated using neutral team-level language, without ranking or shaming members.",
        },
        {
          name: "Knowledge Flow & Activity Recommendations",
          contributor: "Divya Nair (Product Design)",
          sourceType: "Document" as const,
          status: "integrated" as const,
          description: "Connects related topics across authorized sources and recommends peer review, knowledge sharing, or paired work with a clear reason.",
        },
        {
          name: "Member Consent & Source Review",
          contributor: "Ritheesh Kumar (Lead)",
          sourceType: "Code" as const,
          status: "integrated" as const,
          description: "Makes analyzed sources visible so teammates can review the scope, correct summaries, and withdraw participation.",
        },
      ] : [];

      const backendModules = backendBp?.modules?.map((m) => ({
        name: m.name,
        contributor: m.owner || "AI Engine",
        sourceType: "Document" as const,
        status: (m.status === "approved" || m.status === "integrated" ? "integrated" : "in_progress") as "integrated" | "in_progress" | "pending_review",
        description: m.summary || (m.deliverables && m.deliverables.join(", ")) || "Synthesized architecture module.",
      })) || [];

      const existingNames = new Set(baseModules.map((m) => m.name.toLowerCase()));
      const extraDocModules = docModules.filter((m) => !existingNames.has(m.name.toLowerCase()));
      const extraBackendModules = backendModules.filter(
        (m) => !existingNames.has(m.name.toLowerCase()) && !extraDocModules.some((d) => d.name.toLowerCase() === m.name.toLowerCase())
      );
      const allModules = [...baseModules, ...extraDocModules, ...extraBackendModules];

      const dynamicParticipation = (project?.members || []).map((m) => {
        const u = getUser(m.userId);
        const memberDiscussions = discussions.filter((d) => d.authorId === m.userId).length;
        const memberTasks = tasks.filter((t) => t.assigneeId === m.userId).length;
        const memberDocs = documents.filter((d) => d.uploadedBy === m.userId).length;
        const total = memberDiscussions + memberTasks + memberDocs;

        let level: "dominant" | "balanced" | "underrepresented" = "balanced";
        if (m.contribution >= 50 || total >= 5) level = "dominant";
        else if (m.contribution < 15 && total <= 1) level = "underrepresented";

        let observation = `${u?.name || "Member"} contributed actively across discussions and tasks.`;
        let recommendedRole = "Maintain current momentum and coordinate with peers on next sprint deliverables.";

        if (level === "dominant") {
          observation = `${u?.name || "Member"} owns a major share of decisions and documentation (${m.contribution}% contribution). Single-point dependency risk.`;
          recommendedRole = "Host a 15-minute knowledge transfer session to cross-train teammates.";
        } else if (level === "underrepresented") {
          observation = `${u?.name || "Member"} has fewer logged interactions in current sprint threads and assigned tasks.`;
          recommendedRole = "Pair on the next milestone review or lead the upcoming architecture validation check.";
        }

        return {
          memberId: m.userId,
          participationScore: Math.min(95, Math.max(25, m.contribution || 50)),
          level,
          observation,
          recommendedRole,
        };
      });

      const updated: SolutionSynthesis = {
        projectId: id,
        headline: backendBp?.architectural_summary
          ? `${project?.name || "Project"} — Coherent Architectural Blueprint`
          : id === "p1"
            ? "Collective Learning Summary & Collaboration Blueprint"
            : `${project?.name || "Project"} — Unified Architecture & Coherent Solution`,
        summary: backendBp?.architectural_summary || `AI intelligence has unified ${documents.length} project documents, ${discussions.length} discussion threads, and ${tasks.length} tasks across ${project?.members.length || 0} members into an integrated system architecture.`,
        architectureComponents: allModules.length > 0 ? allModules : [
          {
            name: "Core Project Module",
            contributor: `${getUser(project?.ownerId || "u1")?.name || "Lead"}`,
            sourceType: "Code",
            status: "in_progress",
            description: project?.description || "Primary project system component.",
          },
        ],
        fragmentedResolutions: [
          {
            topic: id === "p1" ? "Member Consent & Summary Corrections" : "System Component Integration Protocol",
            debatedIn: `Discussions (${discussions.length} messages analyzed)`,
            divergentPoints: [
              "Initial proposal prioritized independent component development to maximize velocity.",
              "Peer review raised concerns over schema mismatches and data serialization overhead.",
            ],
            synthesizedResolution:
              "Standardize shared data schemas across modules and validate end-to-end integration during automated testing.",
            consensusStatus: "resolved",
          },
          {
            topic: id === "p1" ? "Participation Insights Without Individual Scores" : "Sprint Gating & Quality Thresholds",
            debatedIn: "Discussions & Document Review",
            divergentPoints: [
              "Baseline focused on high general accuracy and rapid turnaround.",
              "Security and robustness feedback emphasized zero tolerant failure modes.",
            ],
            synthesizedResolution:
              "Establish strict gating criteria on critical failure paths before deployment approval.",
            consensusStatus: "resolved",
          },
        ],
        participationBalanceAnalysis: dynamicParticipation.length > 0 ? dynamicParticipation : currentSynthesis.participationBalanceAnalysis,
        synthesizedAt: new Date().toISOString(),
      };

      setSolutionSynthesis(id, updated);
      setIsSynthesizing(false);
      addToast("AI Solution Synthesizer generated an updated coherent blueprint!", "success");
    }, 1000);
  };

  const handleRunDiagnostic = () => {
    addInsight({
      projectId: id,
      type: "participation_pattern",
      title: "Cross-functional Knowledge Synergy Detected",
      explanation: "Facilitation notes from Arun are now linked to the team's shared decision summary.",
      evidence: [
        "A project decision is linked to its source discussion",
        "Recent peer review added context to an open team question",
      ],
      suggestedAction: "Schedule a short knowledge-sharing session to spread the updated context.",
      severity: "info",
    });
    addToast("Ran AI diagnostic scan across discussions, documents, and tasks.", "success");
  };

  const openActivity = (rec: Recommendation) => {
    setSelectedRec(rec);
    setActivityOpen(true);
  };

  const giniCoeff = useMemo(() => {
    if (backendEquity?.gini_coefficient !== undefined) {
      return backendEquity.gini_coefficient;
    }
    if (!project || project.members.length <= 1) return 0.05;
    const vals = project.members.map((m) => m.contribution || 0);
    const total = vals.reduce((a, b) => a + b, 0);
    if (total === 0) return 0.05;
    const sorted = [...vals].sort((a, b) => a - b);
    const n = sorted.length;
    const numerator = sorted.reduce((acc, y, i) => acc + (i + 1) * y, 0);
    const gini = (2 * numerator) / (n * total) - (n + 1) / n;
    return Math.max(0.02, Math.min(0.98, Number(gini.toFixed(3))));
  }, [project, backendEquity]);

  const equityScore = useMemo(() => {
    if (backendEquity?.equity_score !== undefined) {
      return Math.round(backendEquity.equity_score);
    }
    return Math.max(50, Math.min(99, Math.round((1 - giniCoeff) * 100)));
  }, [giniCoeff, backendEquity]);


  const handleExportBlueprint = () => {
    if (!project) return;
    const content = `# Mesh Coherent Solution Blueprint — ${project.name}
Generated by AI Collaborative Learning Intelligence (ED-03)
Timestamp: ${new Date().toISOString()}

## 1. Executive Summary & Architecture Headline
**Headline:** ${currentSynthesis.headline}

${currentSynthesis.summary}

---

## 2. Integrated Architecture & Contributor Attributions
${currentSynthesis.architectureComponents
  .map(
    (c, i) => `### Module 0${i + 1}: ${c.name}
- **Lead Contributor:** ${c.contributor}
- **Source Type:** ${c.sourceType}
- **Status:** ${c.status}
- **Specification:** ${c.description}
`
  )
  .join("\n")}

---

## 3. Fragmented Debates Synthesized & Team Consensus
${currentSynthesis.fragmentedResolutions
  .map(
    (r, i) => `### Debate ${i + 1}: ${r.topic}
- **Context:** ${r.debatedIn}
- **Divergent Points:**
${r.divergentPoints.map((p) => `  - ${p}`).join("\n")}
- **Synthesized Resolution:** ${r.synthesizedResolution}
- **Consensus Status:** ${r.consensusStatus} (${r.votes?.pro ?? 4} agreed, ${r.votes?.con ?? 0} edge cases)
`
  )
  .join("\n")}

---

## 4. Voice Equity & Participation Balance Analysis
- **Team Equity Score:** ${equityScore}%
${currentSynthesis.participationBalanceAnalysis
  .map((p) => {
    const u = getUser(p.memberId);
    return `- **${u?.name || p.memberId}**: Score ${p.participationScore}% (${p.level}) — ${p.observation}\n  *Action:* ${p.recommendedRole}`;
  })
  .join("\n")}

---
*Generated by Mesh AI Intelligence for student team collaboration.*
`;

    try {
      const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Mesh_Coherent_Solution_${project.name.replace(/\s+/g, "_")}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast("Exported Coherent Solution Blueprint (Markdown)", "success");
    } catch {
      addToast("Failed to generate export file", "error");
    }
  };

  if (!project) return null;

  const activeNodeId = (selectedNodeId && project.members.some((m) => m.userId === selectedNodeId))
    ? selectedNodeId
    : (project.members[0]?.userId || "u1");

  const selectedNodeMember = project.members.find((m) => m.userId === activeNodeId);
  const selectedNodeData = (id === "p1" && knowledgeNodes.find((n) => n.id === activeNodeId)) || {
    id: activeNodeId,
    label: getUser(activeNodeId)?.name || activeNodeId,
    role: selectedNodeMember?.role || getUser(activeNodeId)?.role || "Contributor",
    topics: getUser(activeNodeId)?.skills?.slice(0, 3) || ["System Architecture", "Core"],
  };
  const selectedNodeIncoming = id === "p1"
    ? knowledgeEdges.filter((e) => e.target === activeNodeId)
    : edges.filter((e) => e.target === activeNodeId).map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        topic: String(e.label || "Module Exchange"),
        strength: 0.8,
      }));
  const selectedNodeOutgoing = id === "p1"
    ? knowledgeEdges.filter((e) => e.source === activeNodeId)
    : edges.filter((e) => e.source === activeNodeId).map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        topic: String(e.label || "Module Exchange"),
        strength: 0.8,
      }));

  const dominantMembers = (backendEquity?.bottlenecks && backendEquity.bottlenecks.length > 0)
    ? backendEquity.bottlenecks
    : project.members
        .filter((m) => m.contribution >= 35)
        .map((m) => getUser(m.userId)?.name || m.userId);

  const underloadedMembers = (backendEquity?.isolated_members && backendEquity.isolated_members.length > 0)
    ? backendEquity.isolated_members
    : project.members
        .filter((m) => m.contribution <= 18)
        .map((m) => getUser(m.userId)?.name?.split(" ")[0] || m.userId);

  const pendingProjectTasks = tasks.filter((t) => t.status !== "completed");

  return (
    <div className="space-y-6">
      {/* Header with Problem Statement Badge */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white">
              <Brain className="h-4 w-4" />
            </span>
            <h2 className="font-display text-2xl font-bold tracking-tight">
              Collaborative Learning Intelligence
            </h2>
            <Badge variant="primary" className="font-semibold">
              Hackathon ED-03
            </Badge>
            <BackendStatusPill compact />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Empowering student teams to overcome unequal participation, fragmented discussions, and assemble coherent solutions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleRunDiagnostic}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Run Diagnostic Scan
          </Button>
          <Button
            size="sm"
            className="gap-2 shadow-sm"
            onClick={handleSynthesize}
            disabled={isSynthesizing}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {isSynthesizing ? "Synthesizing…" : "Synthesize Coherent Solution"}
          </Button>
        </div>
      </div>

      {/* Mode navigation */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {[
          { id: "solution" as const, label: "Coherent Solution Synthesizer", icon: GitMerge, badge: "AI Core" },
          { id: "flow" as const, label: "Knowledge Flow & Exchange Graph", icon: Network, badge: "Interactive" },
          { id: "participation" as const, label: "Unequal Participation Analyzer", icon: Users },
          { id: "overview" as const, label: "Insights & Recommendations", icon: Brain },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                active
                  ? "bg-primary text-white shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider ${
                    active ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* METRIC CHIPS */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          title="Voice equity index"
          value={`${equityScore}% (${equityScore >= 80 ? "Balanced" : equityScore >= 65 ? "Moderate" : "Asymmetric"})`}
          hint={`Gini ${giniCoeff} · ${equityScore >= 80 ? "Healthy distribution" : "Rebalance suggested"}`}
          status={equityScore >= 80 ? "excellent" : equityScore >= 65 ? "good" : "warning"}
        />
        <Metric
          title="Discussion coherence"
          value={`${currentSynthesis.fragmentedResolutions.filter((r) => r.consensusStatus === "resolved").length}/${currentSynthesis.fragmentedResolutions.length} Debates Resolved`}
          hint="AI consensus engine aligned"
          status="good"
        />
        <Metric
          title="Solution synthesis"
          value={`${currentSynthesis.architectureComponents.length} Modules Unified`}
          hint="All contributions integrated"
          status="excellent"
        />
        <Metric
          title="Knowledge flows"
          value={`${edges.length} Flow Vectors`}
          hint="Active peer exchanges"
          status="good"
        />
      </div>


      {/* TAB 1: COHERENT SOLUTION SYNTHESIZER (Addressing problem statement directly) */}
      {activeTab === "solution" && (
        <div className="space-y-6 animate-fade-up">
          {/* Headline synthesis card */}
          <Card className="border-[color-mix(in_oklab,var(--primary)_30%,var(--border))] bg-gradient-to-br from-card via-[color-mix(in_oklab,var(--primary)_3%,white)] to-card p-6 shadow-[var(--shadow-sm)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="primary" className="text-xs">
                    Generative UI · Unified Architecture
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Synthesized from {documents.length} documents, {discussions.length} discussions, and {tasks.length} tasks
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold text-foreground">
                  {currentSynthesis.headline}
                </h3>
                <p className="max-w-4xl text-sm leading-relaxed text-muted-foreground">
                  {currentSynthesis.summary}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleExportBlueprint}
                >
                  <Download className="h-3.5 w-3.5" />
                  Export Blueprint
                </Button>
                <Button
                  variant="soft"
                  size="sm"
                  className="gap-2"
                  onClick={handleSynthesize}
                  disabled={isSynthesizing}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSynthesizing ? "animate-spin" : ""}`} />
                  Re-Synthesize
                </Button>
              </div>
            </div>
          </Card>

          {/* COMBINING INDIVIDUAL CONTRIBUTIONS INTO COHERENT SOLUTION */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  Individual Contributions Combined into Coherent System
                </h3>
                <p className="text-sm text-muted-foreground">
                  How individual documents, tasks, and code segments map directly into the final collective solution.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {currentSynthesis.architectureComponents.map((comp, idx) => (
                <Card
                  key={idx}
                  className="flex flex-col justify-between border-border p-4 transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:border-primary/40"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant={
                          comp.status === "integrated"
                            ? "success"
                            : comp.status === "in_progress"
                              ? "primary"
                              : "warning"
                        }
                      >
                        {comp.status.replace("_", " ")}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        Module 0{idx + 1}
                      </span>
                    </div>

                    <h4 className="mt-2.5 font-display text-base font-semibold leading-snug">
                      {comp.name}
                    </h4>

                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {comp.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground truncate max-w-[180px]">
                      {comp.contributor}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {comp.sourceType}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* FRAGMENTED DISCUSSIONS COHERENCE & CONSENSUS */}
          <Card className="p-5">
            <CardHeader className="p-0 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Fragmented Discussions Defragmenter & Consensus Engine
                  </CardTitle>
                  <CardDescription>
                    Automatically detects debates scattered across conversation threads and synthesizes clear team resolutions.
                  </CardDescription>
                </div>
                <Badge variant="success">{allFragmentedResolutions.length} Debates Analyzed</Badge>
              </div>
            </CardHeader>

            <CardContent className="p-0 space-y-4 pt-1">
              {allFragmentedResolutions.map((res, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-muted/30 p-4 transition hover:bg-muted/50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      {res.topic}
                    </p>
                    <span className="text-xs text-muted-foreground font-mono">
                      {res.debatedIn}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {res.divergentPoints.map((pt, j) => (
                      <div key={j} className="rounded-lg bg-card border border-border p-2.5 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Perspective {j + 1}: </span>
                        {pt}
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 rounded-lg bg-[color-mix(in_oklab,var(--primary)_8%,white)] border border-primary/20 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                      Synthesized Team Resolution
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-foreground font-medium">
                      {res.synthesizedResolution}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-2.5">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={res.votes?.userVote === "pro" ? "primary" : "outline"}
                        className="h-7 text-xs gap-1.5"
                        onClick={async () => {
                          const targetVoteId = res.id || (discussions[i]?.id) || `d${i + 1}`;
                          voteResolution(id, i, "pro");
                          try {
                            await castConsensusVoteApi(targetVoteId, "pro", currentUser?.id || "u1");
                            const updated = await fetchFragmentedDebates(id);
                            if (updated) setBackendDebates(updated);
                          } catch {}
                        }}
                      >
                        <ThumbsUp className="h-3 w-3" />
                        <span>Agree with Consensus ({res.votes?.pro ?? 4})</span>
                      </Button>
                      <Button
                        size="sm"
                        variant={res.votes?.userVote === "con" ? "danger" : "ghost"}
                        className="h-7 text-xs gap-1.5"
                        onClick={async () => {
                          const targetVoteId = res.id || (discussions[i]?.id) || `d${i + 1}`;
                          voteResolution(id, i, "con");
                          try {
                            await castConsensusVoteApi(targetVoteId, "con", currentUser?.id || "u1");
                            const updated = await fetchFragmentedDebates(id);
                            if (updated) setBackendDebates(updated);
                          } catch {}
                        }}
                      >
                        <Flag className="h-3 w-3" />
                        <span>Raise Edge Case ({res.votes?.con ?? 0})</span>
                      </Button>

                    </div>

                    <Badge
                      variant={res.consensusStatus === "resolved" ? "success" : "warning"}
                      className="text-[10px]"
                    >
                      {res.consensusStatus === "resolved" ? "Consensus Approved" : "Under Review"}
                    </Badge>
                  </div>
                </div>
              ))}

            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: KNOWLEDGE FLOW GRAPH & BOTTLENECK ANALYSIS */}
      {activeTab === "flow" && (
        <div className="space-y-6 animate-fade-up">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Knowledge Flow & Interaction Graph</CardTitle>
                <CardDescription>
                  Visualize who shares technical knowledge, topic clusters, and potential single-point bottlenecks. Click any student node to inspect.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 pt-2 sm:pt-0">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" /> Active Flow
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1.5 ml-2">
                  <span className="h-2 w-2 rounded-full bg-slate-400" /> Standard Flow
                </span>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <div className="h-[420px] overflow-hidden rounded-2xl border border-border bg-[#fafbfc]">
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    fitView
                    proOptions={{ hideAttribution: true }}
                    nodesDraggable
                    nodesConnectable={false}
                    elementsSelectable
                    onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                  >
                    <Background gap={24} size={1} color="#e2e5ec" />
                    <Controls showInteractive={false} />
                  </ReactFlow>
                </div>

                {/* Node Inspector Panel */}
                <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                      Member Interaction Profile
                    </span>
                    <h4 className="mt-1 font-display text-lg font-bold">
                      {selectedNodeData?.label.split("\n")[0] || "Select Member"}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {selectedNodeData?.role} · {selectedNodeMember?.contribution}% sprint contribution
                    </p>
                  </div>

                  <div className="border-t border-border pt-3">
                    <p className="text-xs font-semibold text-foreground">Concentrated Topics</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {selectedNodeData?.topics.map((t) => (
                        <Badge key={t} variant="primary">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-border pt-3 space-y-2">
                    <p className="text-xs font-semibold text-foreground">Knowledge Outflows ({selectedNodeOutgoing.length})</p>
                    {selectedNodeOutgoing.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No outgoing shared topics recorded</p>
                    ) : (
                      selectedNodeOutgoing.map((out) => {
                        const targetUser = getUser(out.target);
                        const targetName = targetUser?.name ? targetUser.name.split(" ")[0] : out.target;
                        return (
                          <div key={out.id} className="flex items-center justify-between text-xs rounded-lg bg-muted/40 p-2">
                            <span>→ {targetName}</span>
                            <span className="font-medium text-primary">{out.topic}</span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="border-t border-border pt-3 space-y-2">
                    <p className="text-xs font-semibold text-foreground">Knowledge Inflows ({selectedNodeIncoming.length})</p>
                    {selectedNodeIncoming.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No incoming shared topics recorded</p>
                    ) : (
                      selectedNodeIncoming.map((inc) => {
                        const srcUser = getUser(inc.source);
                        const srcName = srcUser?.name ? srcUser.name.split(" ")[0] : inc.source;
                        return (
                          <div key={inc.id} className="flex items-center justify-between text-xs rounded-lg bg-muted/40 p-2">
                            <span>← {srcName}</span>
                            <span className="font-medium text-foreground">{inc.topic}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <InsightChip
                  icon={CheckCircle2}
                  title="Shared Knowledge"
                  text="Decision notes connect across discussions, shared documents, and tasks."
                />
                <InsightChip
                  icon={AlertTriangle}
                  title="Identified Bottleneck"
                  text="A few decisions need a second reviewer to spread project context."
                />
                <InsightChip
                  icon={ShieldAlert}
                  title="Isolation Warning"
                  text="Invite a teammate to review the summary and add missing context."
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: UNEQUAL PARTICIPATION ANALYZER */}
      {activeTab === "participation" && (
        <div className="space-y-6 animate-fade-up">
          {/* Workload and Voice Rebalance Action Banner */}
          <Card className="border-[color-mix(in_oklab,var(--primary)_30%,var(--border))] bg-gradient-to-br from-card via-[color-mix(in_oklab,var(--primary)_4%,white)] to-card p-4 sm:p-5 shadow-[var(--shadow-sm)]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="primary" className="text-xs">
                    Participation Equalizer
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Addressing dominant voice bottlenecks & isolated contributors
                  </span>
                </div>
                <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Dynamic Sprint Task Rebalancing
                </h3>
                <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                  Automatically redistributes pending sprint tasks from overloaded or dominant contributors to underrepresented teammates to promote equal learning opportunities.
                </p>
              </div>
              <Button
                size="sm"
                className="gap-2 shrink-0 shadow-sm"
                onClick={async () => {
                  const res = rebalanceTasks(id);
                  if (res.rebalancedCount === 0) {
                    addToast("Sprint tasks are already well-distributed among active members!", "info");
                  } else {
                    if (res.taskId && res.newAssigneeId) {
                      await updateTaskApi(res.taskId, { assignee_id: res.newAssigneeId }).catch(() => {});
                    }
                    try {
                      const refreshed = await fetchVoiceEquity(id);
                      if (refreshed) setBackendEquity(refreshed);
                    } catch {
                      setBackendEquity(null);
                    }
                  }
                }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Auto-Rebalance Sprint Tasks
              </Button>
            </div>
          </Card>

          {/* Equity Index & Lorenz Balance Card */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="p-4 border-border">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Voice Equity Index
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-3xl font-bold text-foreground">
                  {equityScore}%
                </span>
                <Badge variant={equityScore >= 80 ? "success" : "warning"} className="text-[10px]">
                  {equityScore >= 80 ? "Healthy Balance" : "Asymmetric Voice"}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Gini-based balance across chat, tasks, and deliverables.
              </p>
            </Card>

            <Card className="p-4 border-border">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Dominant Bottleneck Risk
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-2xl font-bold text-amber-600">
                  {dominantMembers.length > 0
                    ? `${dominantMembers.length} Member${dominantMembers.length > 1 ? "s" : ""}`
                    : "0 Bottlenecks"}
                </span>
                {dominantMembers.length > 0 && (
                  <Badge variant="warning" className="text-[10px]">Overloaded</Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {dominantMembers.length > 0
                  ? `${dominantMembers.join(", ")} holds concentrated deliverables; pair session recommended.`
                  : "Task responsibilities and architecture ownership are balanced across team members."}
              </p>
            </Card>

            <Card className="p-4 border-border">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Equalization Readiness
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-2xl font-bold text-primary">
                  {pendingProjectTasks.length > 0
                    ? `Ready (${pendingProjectTasks.length} pending)`
                    : "Optimized"}
                </span>
                <Badge variant={pendingProjectTasks.length > 0 ? "primary" : "success"} className="text-[10px]">
                  {pendingProjectTasks.length > 0 ? "Rebalance Available" : "Sprint Aligned"}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {pendingProjectTasks.length > 0
                  ? `Click Auto-Rebalance to reallocate backlog tasks${underloadedMembers.length > 0 ? ` to ${underloadedMembers.join(" & ")}` : " to balance equity"}.`
                  : "All sprint deliverables are evenly assigned and progressing smoothly."}
              </p>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Member Contribution Variance</CardTitle>
                <CardDescription>
                  Evaluates balanced participation across discussions, code, and documents.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-56">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={180}>
                      <BarChart data={contributionData}>
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12, fill: "#5c6578" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid #e2e5ec",
                            fontSize: 12,
                          }}
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          {contributionData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full skeleton rounded-xl" />
                  )}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Healthy target: 15% – 30% contribution per member in a 5-person team.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Collaboration Activity by Channel</CardTitle>
                <CardDescription>
                  Distribution of team effort across discussions, tasks, and artifacts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mx-auto h-56 max-w-xs">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={180}>
                      <PieChart>
                        <Pie
                          data={participationData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                        >
                          {participationData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid #e2e5ec",
                            fontSize: 12,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full skeleton rounded-xl" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>


          {/* Individual participation diagnoses */}
          <div>
            <h3 className="font-display text-lg font-semibold">
              Voice Balance & Participation Diagnosis
            </h3>
            <p className="text-sm text-muted-foreground">
              Constructive, non-punitive signals to ensure all students are actively included in high-impact decisions.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {currentSynthesis.participationBalanceAnalysis.map((item) => {
                const u = getUser(item.memberId);
                return (
                  <Card key={item.memberId} className="p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar name={u?.name || "User"} />
                          <div>
                            <p className="font-semibold text-sm">{u?.name}</p>
                            <p className="text-xs text-muted-foreground">{u?.department}</p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            item.level === "balanced"
                              ? "success"
                              : item.level === "dominant"
                                ? "warning"
                                : "primary"
                          }
                        >
                          {item.level}
                        </Badge>
                      </div>

                      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                        {item.observation}
                      </p>
                    </div>

                    <div className="mt-4 rounded-xl bg-muted/60 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                        Recommended Inclusion Activity
                      </p>
                      <p className="mt-1 text-xs text-foreground font-medium">
                        {item.recommendedRole}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Participation: <strong className="text-foreground capitalize">{item.level}</strong>
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs h-8"
                        onClick={() => {
                          setSelectedRec({
                            id: `rec-diag-${item.memberId}`,
                            projectId: id,
                            title:
                              item.level === "dominant"
                                ? "Knowledge Transfer & Delegation Session"
                                : item.level === "underrepresented"
                                  ? "Targeted Mentorship & Co-Authoring Session"
                                  : "Sprint Architecture Sync",
                            type:
                              item.level === "dominant"
                                ? "knowledge_sharing"
                                : item.level === "underrepresented"
                                  ? "pair_programming"
                                  : "peer_review",
                            why: item.recommendedRole,
                            participants: [item.memberId, project.ownerId || "u1"],
                            duration: "30 mins",
                            status: "pending",
                          });
                          setActivityOpen(true);
                        }}
                      >
                        Schedule Activity
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: OVERVIEW INSIGHTS & RECOMMENDATIONS */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-fade-up">
          {/* AI Insights Section */}
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold">Live AI Insights</h3>
                <p className="text-sm text-muted-foreground">
                  Continuous pattern detection across shared documents, discussions, and tasks.
                </p>
              </div>
              <Badge variant="outline">{projectInsights.length} detected</Badge>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {projectInsights.map((insight) => (
                <Card key={insight.id} className="p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2">
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
                      <span className="text-xs text-muted-foreground capitalize">
                        {insight.type.replace(/_/g, " ")}
                      </span>
                    </div>

                    <h4 className="mt-3 font-display text-base font-semibold">
                      {insight.title}
                    </h4>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {insight.explanation}
                    </p>

                    <div className="mt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                        Evidence
                      </p>
                      <ul className="mt-1 space-y-1">
                        {insight.evidence.map((e) => (
                          <li key={e} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="text-primary font-bold">·</span>
                            <span>{e}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl bg-[color-mix(in_oklab,var(--primary)_6%,white)] border border-primary/20 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      Suggested Action
                    </p>
                    <p className="mt-1 text-xs text-foreground font-medium">{insight.suggestedAction}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* AI Recommendations & Direct Activity Scheduler */}
          <div>
            <div>
              <h3 className="font-display text-lg font-semibold">Meaningful Collaboration Activities</h3>
              <p className="text-sm text-muted-foreground">
                Actionable sessions recommended by AI to balance participation and combine insights.
              </p>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {recommendations.map((rec) => (
                <Card key={rec.id} className="p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="primary">{rec.type.replace(/_/g, " ")}</Badge>
                      <Badge variant="outline">{rec.status}</Badge>
                    </div>

                    <h4 className="mt-3 font-display text-base font-semibold">
                      {rec.title}
                    </h4>
                    <p className="mt-2 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Why: </span>
                      {rec.why}
                    </p>

                    <div className="mt-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        Target participants
                      </p>
                      <div className="mt-2 flex -space-x-2">
                        {rec.participants.map((pid) => {
                          const u = getUser(pid);
                          return (
                            <Avatar
                              key={pid}
                              name={u?.name || pid}
                              size="sm"
                              className="ring-2 ring-card"
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Duration: <strong className="text-foreground">{rec.duration}</strong>
                    </span>
                    {rec.status === "scheduled" ? (
                      <Button
                        size="sm"
                        variant="soft"
                        className="gap-1.5"
                        onClick={() => {
                          const existing = allActivities.find(
                            (a) => a.title === rec.title && a.projectId === id
                          );
                          if (existing) {
                            setActiveRoomSession(existing);
                          } else {
                            setActiveRoomSession({
                              id: `act-${rec.id}`,
                              projectId: id,
                              type: rec.type,
                              title: rec.title,
                              description: rec.why,
                              participants: rec.participants,
                              dateTime: new Date().toISOString(),
                              duration: rec.duration,
                              createdAt: new Date().toISOString(),
                              status: "scheduled",
                            });
                          }
                        }}
                      >
                        Enter Session Room
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => openActivity(rec)}
                        className="gap-1.5"
                      >
                        Schedule Activity
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Activity Creation Modal */}
      <ActivityModal
        open={activityOpen}
        onClose={() => setActivityOpen(false)}
        projectId={id}
        defaults={
          selectedRec
            ? {
                type: selectedRec.title,
                title: selectedRec.title,
                participants: selectedRec.participants,
                description: selectedRec.why,
                duration: selectedRec.duration,
                recommendationId: selectedRec.id,
              }
            : undefined
        }
      />

      {/* Interactive Activity Room Execution Modal */}
      <ActivityRoomModal
        activity={activeRoomSession}
        open={!!activeRoomSession}
        onClose={() => setActiveRoomSession(null)}
      />
    </div>
  );
}


function Metric({
  title,
  value,
  hint,
  status,
}: {
  title: string;
  value: string;
  hint: string;
  status: "good" | "excellent" | "warning";
}) {
  return (
    <Card className="p-4 border-border">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <span
          className={`h-2 w-2 rounded-full ${
            status === "excellent"
              ? "bg-teal-500"
              : status === "good"
                ? "bg-emerald-500"
                : "bg-amber-500"
          }`}
        />
      </div>
      <p className="mt-1 font-display text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
    </Card>
  );
}

function InsightChip({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3.5 shadow-[var(--shadow-sm)]">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary shrink-0" />
        <p className="text-xs font-semibold text-primary">{title}</p>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}
