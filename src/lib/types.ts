export type UserRole = "Student" | "Professional";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  organization: string;
  year?: string;
  department: string;
  skills: string[];
  github?: string;
  linkedin?: string;
  portfolio?: string;
  interests: string[];
  previousProjects: string[];
  bio?: string;
}

export type ProjectVisibility = "public" | "private";
export type ProjectStatus = "planning" | "active" | "review" | "completed";

export interface ProjectMember {
  userId: string;
  role: string;
  contribution: number;
  joinedAt: string;
  name?: string;
}


export interface Project {
  id: string;
  name: string;
  description: string;
  category: string;
  skillsRequired: string[];
  duration: string;
  teamSize: number;
  visibility: ProjectVisibility;
  status: ProjectStatus;
  progress: number;
  ownerId: string;
  members: ProjectMember[];
  createdAt: string;
  lastActivity: string;
  college?: string;
  lookingForMembers: boolean;
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "completed";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  assigneeId?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  tags: string[];
  aiSuggested?: boolean;
}

export interface DiscussionMessage {
  id: string;
  projectId: string;
  authorId: string;
  content: string;
  timestamp: string;
  topic?: string;
  reactions: { emoji: string; count: number; reacted?: boolean }[];
  replies?: DiscussionMessage[];
  replyTo?: { id: string; authorName: string; text: string };
}

export interface Document {
  id: string;
  projectId: string;
  name: string;
  type: string;
  uploadedBy: string;
  date: string;
  status: "draft" | "reviewed" | "final";
  size: string;
  contentPreview?: string;
  keyTopics?: string[];
}

export type InsightType =
  | "knowledge_concentration"
  | "collaboration_gap"
  | "unresolved_topic"
  | "project_risk"
  | "participation_pattern";

export interface AIInsight {
  id: string;
  projectId: string;
  type: InsightType;
  title: string;
  explanation: string;
  evidence: string[];
  suggestedAction: string;
  severity: "info" | "attention" | "urgent";
  createdAt: string;
}

export interface SolutionSynthesis {
  projectId: string;
  headline: string;
  summary: string;
  architectureComponents: {
    name: string;
    contributor: string;
    sourceType: "Discussion" | "Document" | "Task" | "Code";
    status: "integrated" | "in_progress" | "pending_review";
    description: string;
  }[];
  fragmentedResolutions: {
    id?: string;
    topic: string;
    debatedIn: string;
    divergentPoints: string[];
    synthesizedResolution: string;
    consensusStatus: "resolved" | "needs_team_vote" | "action_assigned";
    votes?: { pro: number; con: number; userVote?: "pro" | "con" };
  }[];
  participationBalanceAnalysis: {
    memberId: string;
    participationScore: number;
    level: "underrepresented" | "balanced" | "dominant";
    observation: string;
    recommendedRole: string;
  }[];
  synthesizedAt: string;
}

export interface Recommendation {
  id: string;
  projectId: string;
  type:
    | "knowledge_sharing"
    | "pair_programming"
    | "peer_review"
    | "mini_quiz"
    | "task_reassignment"
    | "discussion"
    | "research_comparison";
  title: string;
  why: string;
  participants: string[];
  duration: string;
  status: "pending" | "scheduled" | "completed";
}

export interface Activity {
  id: string;
  projectId: string;
  type: string;
  title: string;
  description: string;
  participants: string[];
  dateTime: string;
  duration: string;
  createdAt: string;
  status?: "scheduled" | "completed";
  takeaways?: string;
  notes?: string;
  agendaItems?: string[];
  linkedTaskId?: string;
}

export interface Invitation {
  id: string;
  type: "incoming" | "join_request";
  projectId: string;
  projectName: string;
  fromUserId: string;
  toUserId: string;
  message?: string;
  createdAt: string;
  status: "pending" | "accepted" | "declined";
}

export interface Notification {
  id: string;
  type:
    | "invitation"
    | "join_request"
    | "task"
    | "insight"
    | "activity"
    | "document"
    | "mention";
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  href?: string;
}

export interface ActivityFeedItem {
  id: string;
  projectId: string;
  userId: string;
  action: string;
  timestamp: string;
}

export interface KnowledgeNode {
  id: string;
  label: string;
  role: string;
  topics: string[];
}

export interface KnowledgeEdge {
  id: string;
  source: string;
  target: string;
  topic: string;
  strength: number;
}

// ---------------------------------------------------------------------------
// Phase 3 Deterministic ED-03 Intelligence Interfaces
// ---------------------------------------------------------------------------

export interface ContributionSummary {
  user_id: string;
  name: string;
  total_weight: number;
  count: number;
  percentage: number;
  by_type: Record<string, number>;
  status: string;
}

export interface ContributionAnalyticsResponse {
  project_id: string;
  total_contributions: number;
  active_contributors: number;
  participation_rate: number;
  gini_coefficient: number;
  equity_score: number;
  equity_interpretation: string;
  member_summaries: ContributionSummary[];
  inactive_members: string[];
  concentrated_members: string[];
}

export interface KnowledgeNodeSchema {
  id: string;
  project_id?: string;
  node_type: string;
  label: string;
  description?: string;
  metadata?: Record<string, JsonValue>;
}

export interface KnowledgeEdgeSchema {
  id: string;
  project_id?: string;
  source_node_id: string;
  target_node_id: string;
  edge_type: string;
  weight: number;
  confidence: number;
  evidence_count: number;
  metadata?: Record<string, JsonValue>;
}

export interface KnowledgeGraphResponse {
  project_id: string;
  node_count: number;
  edge_count: number;
  nodes: KnowledgeNodeSchema[];
  edges: KnowledgeEdgeSchema[];
}

export interface SiloItem {
  id: string;
  topic: string;
  risk: string;
  owners: string[];
  supporting_evidence: string[];
  recommended_action: string;
}

export interface KnowledgeGapItem {
  id: string;
  skill_or_topic: string;
  gap_type: string;
  impact: string;
  recommended_action: string;
}

export interface SilosAndGapsResponse {
  project_id: string;
  silo_count: number;
  gap_count: number;
  silos: SiloItem[];
  gaps: KnowledgeGapItem[];
}

export interface DiscussionIntelligenceItem {
  id: string;
  title: string;
  type: string;
  status: string;
  message_count: number;
  participant_count: number;
  viewpoint_count: number;
  vote_count: number;
  pro_votes: number;
  con_votes: number;
  divergence_score: number;
  consensus_status: string;
  unresolved_questions: string[];
  suggested_resolution?: string;
}

export interface InsightEvidenceItem {
  source_type: string;
  source_id: string;
  description: string;
  metric?: string;
  value?: number;
}

export interface PersistentInsightResponse {
  id: string;
  project_id: string;
  insight_type: string;
  title: string;
  summary: string;
  severity: "info" | "attention" | "urgent";
  confidence: number;
  status: string;
  evidence: InsightEvidenceItem[];
  action_items: string[];
  created_at?: string;
}

export interface RecommendationParticipantSchema {
  user_id: string;
  name?: string;
  role?: string;
}

export interface RecommendationSourceSchema {
  source_type: string;
  source_id: string;
  reason?: string;
}

export interface DetailedRecommendationResponse {
  id: string;
  project_id: string;
  type: string;
  title: string;
  reason: string;
  priority: "high" | "medium" | "low";
  confidence: number;
  status: string;
  participants: RecommendationParticipantSchema[];
  sources: RecommendationSourceSchema[];
  suggested_agenda: string[];
  expected_outcome?: string;
  created_at?: string;
}

export interface BlueprintModuleItem {
  name: string;
  owner: string;
  status: string;
  summary: string;
  deliverables: string[];
  source_type?: string;
  source_id?: string;
}

export interface BlueprintSourceItem {
  source_type: string;
  source_id: string;
  relationship?: string;
}

export interface BlueprintPersistentResponse {
  id: string;
  project_id: string;
  title: string;
  summary: string;
  version: number;
  problem_statement?: string;
  modules: BlueprintModuleItem[];
  sources: BlueprintSourceItem[];
  agreed_consensus: string[];
  unresolved_risks: string[];
  action_plan: string[];
  expected_measurable_changes: string[];
  created_at?: string;
}

export interface AnalysisSnapshotResponse {
  id: string;
  project_id: string;
  analysis_type: string;
  data: Record<string, JsonValue>;
  created_at?: string;
}

export interface ActivityImpactResponse {
  activity_id: string;
  project_id: string;
  activity_title: string;
  before_snapshot: Record<string, JsonValue>;
  after_snapshot: Record<string, JsonValue>;
  metric_changes: Record<string, JsonValue>;
  narrative_summary: string;
}

