/**
 * Client service layer connecting Next.js to the Mind-Mesh FastAPI Backend
 * with Supabase integration and robust in-memory fallback.
 */

import type {
  Project,
  Task,
  DiscussionMessage,
  Document,
  Activity,
  TaskStatus,
  TaskPriority,
  ContributionAnalyticsResponse,
  KnowledgeGraphResponse,
  SilosAndGapsResponse,
  PersistentInsightResponse,
  DetailedRecommendationResponse,
  BlueprintPersistentResponse,
  AnalysisSnapshotResponse,
  ActivityImpactResponse,
  DiscussionIntelligenceItem,
} from "./types";

export const getApiBase = () => {
  const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") {
    if (configuredApiUrl) return configuredApiUrl.replace(/\/$/, "");
    if (process.env.NODE_ENV === "production") {
      throw new Error("NEXT_PUBLIC_API_URL must be configured for production builds.");
    }
    return "http://localhost:8000/api/v1";
  }
  if (process.env.API_URL) return process.env.API_URL.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") {
    throw new Error("API_URL must be configured for server-side production requests.");
  }
  return "http://127.0.0.1:8000/api/v1";
};

export const getHealthUrl = () => {
  const base = getApiBase();
  return base.replace(/\/api\/v1\/?$/, "") + "/health";
};

export interface ApiHealthStatus {
  status: string;
  service: string;
  version: string;
  database: string;
  supabase_connected: boolean;
  memory_fallback_active?: boolean;
}

export interface VoiceEquityMember {
  user_id: string;
  name: string;
  task_count: number;
  discussion_count: number;
  doc_count: number;
  total_contributions: number;
  contribution_percentage: number;
  status: "balanced" | "overloaded_bottleneck" | "under_represented";
}

export interface VoiceEquityResponse {
  project_id: string;
  gini_coefficient: number;
  equity_score: number;
  equity_status: string;
  members: VoiceEquityMember[];
  bottlenecks: string[];
  isolated_members: string[];
  ai_recommendation: string;
}

export interface FragmentedDebate {
  id: string;
  title: string;
  status: string;
  divergence_score: number;
  pro_votes: number;
  con_votes: number;
  suggested_resolution: string;
}

export interface BlueprintModule {
  name: string;
  owner: string;
  status: string;
  summary: string;
  deliverables: string[];
}

export interface CoherentBlueprint {
  project_id: string;
  project_name: string;
  generated_at: string;
  architectural_summary: string;
  modules: BlueprintModule[];
  agreed_consensus: string[];
  unresolved_risks: string[];
  action_plan: string[];
}

export interface BackendRecommendation {
  id: string;
  type: string;
  title: string;
  reason: string;
  priority: string;
  target_members: string[];
  suggested_agenda: string[];
  expected_outcome: string;
}

export interface BackendDiscussionResponse {
  id: string;
  project_id: string;
  author_id?: string;
  title: string;
  content: string;
  type: string;
  status: string;
  resolution?: string;
  consensus_pro: number;
  consensus_con: number;
  created_at?: string;
  updated_at?: string;
}

export interface BackendProjectMember {
  user_id?: string;
  userId?: string;
  role?: string;
  contribution?: number;
  joined_at?: string;
  joinedAt?: string;
  name?: string;
}

export interface BackendProjectResponse {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  category?: string;
  skills_required?: string[];
  skillsRequired?: string[];
  duration?: string;
  visibility?: "public" | "private";
  status?: string;
  progress?: number;
  owner_id?: string;
  ownerId?: string;
  members?: BackendProjectMember[];
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  lastActivity?: string;
  college?: string;
  lookingForMembers?: boolean;
  milestones?: Project["milestones"];
}

export interface BackendTaskResponse {
  id: string;
  project_id?: string;
  projectId?: string;
  title: string;
  description?: string;
  assignee_id?: string;
  assigneeId?: string;
  status?: string;
  priority?: string;
  due_date?: string;
  dueDate?: string;
  module?: string;
  tags?: string[];
  aiSuggested?: boolean;
}

export interface BackendDocumentResponse {
  id: string;
  project_id?: string;
  projectId?: string;
  title?: string;
  name?: string;
  content_text?: string;
  contentPreview?: string;
  file_type?: string;
  type?: string;
  author_id?: string;
  uploadedBy?: string;
  contributors?: string[];
  created_at?: string;
  date?: string;
  status?: "draft" | "reviewed" | "final";
  size?: string;
}

export interface BackendActivityResponse {
  id: string;
  project_id?: string;
  projectId?: string;
  title: string;
  description?: string;
  type?: string;
  status?: string;
  participants?: string[];
  agenda?: string[];
  agendaItems?: string[];
  linked_task_id?: string;
  linkedTaskId?: string;
  notes?: string;
  takeaways?: string;
  created_at?: string;
  dateTime?: string;
  duration?: string;
  completed_at?: string;
}

// -----------------------------------------------------------------------------
// ADAPTERS: Convert backend response models into frontend models
// -----------------------------------------------------------------------------

export function adaptBackendProject(bp: BackendProjectResponse): Project {
  return {
    id: bp.id,
    name: bp.name || bp.title || "Untitled Project",
    description: bp.description || "",
    category: bp.category || "General",
    skillsRequired: bp.skills_required || bp.skillsRequired || [],
    duration: bp.duration || "8 weeks",
    teamSize: bp.members?.length || 4,
    visibility: bp.visibility || "public",
    status: bp.status === "in-progress" ? "active" : ((bp.status as Project["status"]) || "active"),
    progress: bp.progress ?? 0,
    ownerId: bp.owner_id || bp.ownerId || "u1",
    members: (bp.members || []).map((m: BackendProjectMember) => ({
      userId: m.user_id || m.userId || "u1",
      role: m.role || "Member",
      name: m.name,
      contribution: m.contribution ?? 50,
      joinedAt: m.joined_at || m.joinedAt || new Date().toISOString().slice(0, 10),
    })),

    createdAt: bp.created_at || bp.createdAt || new Date().toISOString(),
    lastActivity: bp.updated_at || bp.lastActivity || new Date().toISOString(),
    college: bp.college,
    lookingForMembers: bp.lookingForMembers ?? true,
    milestones: bp.milestones || [
      {
        id: `m-${bp.id}-1`,
        title: "Sprint Kickoff & Setup",
        dueDate: "In 1 week",
        completed: true,
      },
      {
        id: `m-${bp.id}-2`,
        title: "Core Architecture Review",
        dueDate: "In 3 weeks",
        completed: false,
      },
    ],
  };
}

export function adaptBackendTask(bt: BackendTaskResponse): Task {
  let mappedStatus: TaskStatus = "todo";
  const rawStatus = (bt.status || "").toLowerCase();
  if (rawStatus === "done" || rawStatus === "completed") mappedStatus = "completed";
  else if (rawStatus === "in-progress" || rawStatus === "in_progress") mappedStatus = "in_progress";
  else if (rawStatus === "in-review" || rawStatus === "review") mappedStatus = "review";
  else if (rawStatus === "backlog") mappedStatus = "backlog";
  else mappedStatus = "todo";

  let mappedPriority: TaskPriority = "medium";
  const rawPriority = (bt.priority || "").toLowerCase();
  if (rawPriority === "high" || rawPriority === "urgent") mappedPriority = "high";
  else if (rawPriority === "low") mappedPriority = "low";
  else mappedPriority = "medium";

  return {
    id: bt.id,
    projectId: bt.project_id || bt.projectId || "",
    title: bt.title,
    description: bt.description || undefined,
    assigneeId: bt.assignee_id || bt.assigneeId || undefined,
    status: mappedStatus,
    priority: mappedPriority,
    dueDate: bt.due_date || bt.dueDate || undefined,
    tags: bt.tags || ["sprint"],
    aiSuggested: Boolean(bt.aiSuggested),
  };
}

export function adaptBackendDiscussion(bd: BackendDiscussionResponse): DiscussionMessage {
  return {
    id: bd.id,
    projectId: bd.project_id,
    authorId: bd.author_id || "u1",
    content: bd.content,
    timestamp: bd.created_at || new Date().toISOString(),
    topic: bd.title || "General",
    reactions: [
      { emoji: "👍", count: bd.consensus_pro ?? 1, reacted: false },
    ],
    replies: [],
    replyTo: undefined,
  };
}

export function adaptBackendDocument(bdoc: BackendDocumentResponse): Document {
  return {
    id: bdoc.id,
    projectId: bdoc.project_id || bdoc.projectId || "",
    name: bdoc.title || bdoc.name || "Document",
    type: bdoc.file_type ? bdoc.file_type.toUpperCase() : bdoc.type || "Markdown",
    uploadedBy: bdoc.author_id || bdoc.uploadedBy || "u1",
    date: bdoc.created_at || bdoc.date || new Date().toISOString().slice(0, 10),
    status: bdoc.status || "reviewed",
    size: bdoc.size || "1.2 MB",
    contentPreview: bdoc.content_text || bdoc.contentPreview,
    keyTopics: bdoc.contributors || [bdoc.file_type || "Markdown"],
  };
}

export function adaptBackendActivity(ba: BackendActivityResponse): Activity {
  const isDone = ba.status === "completed";
  return {
    id: ba.id,
    projectId: ba.project_id || ba.projectId || "",
    type: ba.type ? ba.type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "Knowledge Transfer",
    title: ba.title,
    description: ba.description || "",
    participants: ba.participants || [],
    dateTime: ba.created_at || ba.dateTime || new Date().toISOString(),
    duration: ba.duration || "30 minutes",
    createdAt: ba.created_at || new Date().toISOString(),
    status: isDone ? "completed" : "scheduled",
    takeaways: ba.takeaways,
    notes: ba.notes,
    agendaItems: ba.agenda || ba.agendaItems || [],
    linkedTaskId: ba.linked_task_id || ba.linkedTaskId,
  };
}

// -----------------------------------------------------------------------------
// CENTRALIZED API CLIENT FUNCTIONS
// -----------------------------------------------------------------------------

export async function checkApiHealth(): Promise<ApiHealthStatus | null> {
  try {
    const res = await fetch(getHealthUrl(), {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// PROJECTS
export async function getProjects(): Promise<Project[]> {
  try {
    const res = await fetch(`${getApiBase()}/projects`, { cache: "no-store" });
    if (!res.ok) return [];
    const data: BackendProjectResponse[] = await res.json();
    return data.map(adaptBackendProject);
  } catch {
    return [];
  }
}

export async function getProject(projectId: string): Promise<Project | null> {
  try {
    const res = await fetch(`${getApiBase()}/projects/${projectId}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data: BackendProjectResponse = await res.json();
    return adaptBackendProject(data);
  } catch {
    return null;
  }
}

export async function getMembers(projectId: string): Promise<BackendProjectMember[]> {
  try {
    const res = await fetch(`${getApiBase()}/projects/${projectId}/members`, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function createProject(payload: {
  title: string;
  description: string;
  owner_id: string;
  skills_required?: string[];
  status?: string;
  progress?: number;
  deadline?: string;
  tags?: string[];
  name?: string;
}): Promise<Project | null> {
  try {
    const res = await fetch(`${getApiBase()}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        title: payload.title || payload.name || "New Project",
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return adaptBackendProject(data);
  } catch {
    return null;
  }
}

// TASKS
export async function getTasks(projectId?: string): Promise<Task[]> {
  try {
    const url = projectId
      ? `${getApiBase()}/tasks/project/${projectId}`
      : `${getApiBase()}/tasks`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map(adaptBackendTask);
  } catch {
    return [];
  }
}

export async function createTask(payload: {
  project_id: string;
  title: string;
  description?: string;
  assignee_id?: string;
  priority?: string;
  status?: string;
  due_date?: string;
  tags?: string[];
}): Promise<Task | null> {
  try {
    const res = await fetch(`${getApiBase()}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return adaptBackendTask(data);
  } catch {
    return null;
  }
}

export async function updateTask(taskId: string, updates: Record<string, unknown>): Promise<Task | null> {
  try {
    const res = await fetch(`${getApiBase()}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return adaptBackendTask(data);
  } catch {
    return null;
  }
}

export async function deleteTask(taskId: string): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBase()}/tasks/${taskId}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch {
    return false;
  }
}

// DISCUSSIONS
export async function getDiscussions(projectId?: string): Promise<DiscussionMessage[]> {
  try {
    const url = projectId
      ? `${getApiBase()}/discussions/project/${projectId}`
      : `${getApiBase()}/discussions`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map(adaptBackendDiscussion);
  } catch {
    return [];
  }
}

export async function createDiscussion(payload: {
  project_id: string;
  author_id: string;
  title: string;
  content: string;
  type?: string;
  status?: string;
  resolution?: string;
}): Promise<DiscussionMessage | null> {
  try {
    const res = await fetch(`${getApiBase()}/discussions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return adaptBackendDiscussion(data);
  } catch {
    return null;
  }
}

export async function voteDiscussion(
  discussionId: string,
  vote: "pro" | "con",
  userId: string
): Promise<BackendDiscussionResponse | null> {
  try {
    const res = await fetch(`${getApiBase()}/discussions/${discussionId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vote, user_id: userId }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// DOCUMENTS
export async function getDocuments(projectId?: string): Promise<Document[]> {
  try {
    const url = projectId
      ? `${getApiBase()}/documents/project/${projectId}`
      : `${getApiBase()}/documents`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map(adaptBackendDocument);
  } catch {
    return [];
  }
}

export async function createDocument(payload: {
  project_id: string;
  author_id: string;
  title: string;
  content_text?: string;
  file_type?: string;
  contributors?: string[];
}): Promise<Document | null> {
  try {
    const res = await fetch(`${getApiBase()}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return adaptBackendDocument(data);
  } catch {
    return null;
  }
}

export async function deleteDocument(docId: string): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBase()}/documents/${docId}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ACTIVITIES
export async function getActivities(projectId?: string): Promise<Activity[]> {
  try {
    const url = projectId
      ? `${getApiBase()}/activities/project/${projectId}`
      : `${getApiBase()}/activities`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map(adaptBackendActivity);
  } catch {
    return [];
  }
}

export async function createActivity(payload: {
  project_id: string;
  title: string;
  description: string;
  type: string;
  participants: string[];
  agenda?: string[];
  linked_task_id?: string;
}): Promise<Activity | null> {
  try {
    const res = await fetch(`${getApiBase()}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return adaptBackendActivity(data);
  } catch {
    return null;
  }
}

export async function completeActivity(
  activityId: string,
  takeaways?: string,
  completedTaskIds: string[] = [],
  notes?: string
): Promise<Activity | null> {
  try {
    const res = await fetch(`${getApiBase()}/activities/${activityId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ takeaways, notes, completed_task_ids: completedTaskIds }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return adaptBackendActivity(data);
  } catch {
    return null;
  }
}

// INTELLIGENCE
export async function getEquity(projectId: string): Promise<VoiceEquityResponse | null> {
  try {
    const res = await fetch(`${getApiBase()}/intelligence/equity/${projectId}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getDebates(projectId: string): Promise<FragmentedDebate[] | null> {
  try {
    const res = await fetch(`${getApiBase()}/intelligence/debates/${projectId}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getRecommendations(projectId: string): Promise<BackendRecommendation[] | null> {
  try {
    const res = await fetch(`${getApiBase()}/intelligence/recommendations/${projectId}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getBlueprint(projectId: string): Promise<CoherentBlueprint | null> {
  try {
    const res = await fetch(`${getApiBase()}/intelligence/blueprint/${projectId}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------------------
// Phase 3 Deterministic ED-03 Intelligence Client APIs
// -----------------------------------------------------------------------------

export async function getContributions(projectId: string): Promise<ContributionAnalyticsResponse | null> {
  try {
    const res = await fetch(`${getApiBase()}/intelligence/contributions/${projectId}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getKnowledgeGraph(projectId: string): Promise<KnowledgeGraphResponse | null> {
  try {
    const res = await fetch(`${getApiBase()}/intelligence/knowledge/${projectId}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getSilos(projectId: string): Promise<SilosAndGapsResponse | null> {
  try {
    const res = await fetch(`${getApiBase()}/intelligence/silos/${projectId}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getCollectiveInsights(projectId: string): Promise<PersistentInsightResponse[] | null> {
  try {
    const res = await fetch(`${getApiBase()}/intelligence/insights/${projectId}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getDetailedRecommendations(projectId: string): Promise<DetailedRecommendationResponse[] | null> {
  try {
    const res = await fetch(`${getApiBase()}/intelligence/detailed-recommendations/${projectId}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getPersistentBlueprint(projectId: string): Promise<BlueprintPersistentResponse | null> {
  try {
    const res = await fetch(`${getApiBase()}/intelligence/persistent-blueprint/${projectId}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getAnalysisSnapshots(projectId: string): Promise<AnalysisSnapshotResponse[] | null> {
  try {
    const res = await fetch(`${getApiBase()}/intelligence/snapshots/${projectId}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function triggerProjectAnalysis(projectId: string): Promise<unknown | null> {
  try {
    const res = await fetch(`${getApiBase()}/intelligence/analyze/${projectId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getActivityImpact(projectId: string, activityId: string): Promise<ActivityImpactResponse | null> {
  try {
    const res = await fetch(`${getApiBase()}/intelligence/impact/${projectId}/${activityId}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getDiscussionIntelligence(projectId: string): Promise<DiscussionIntelligenceItem[] | null> {
  try {
    const res = await fetch(`${getApiBase()}/intelligence/discussions-intel/${projectId}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------------------
// BACKWARD-COMPATIBLE ALIASES
// -----------------------------------------------------------------------------
export const fetchVoiceEquity = getEquity;
export const fetchFragmentedDebates = getDebates;
export const fetchCollaborationRecommendations = getRecommendations;
export const fetchCoherentSolutionBlueprint = getBlueprint;
export const fetchContributions = getContributions;
export const fetchKnowledgeGraph = getKnowledgeGraph;
export const fetchKnowledgeSilos = getSilos;
export const fetchCollectiveInsights = getCollectiveInsights;
export const fetchDetailedRecommendations = getDetailedRecommendations;
export const fetchPersistentBlueprint = getPersistentBlueprint;
export const fetchAnalysisSnapshots = getAnalysisSnapshots;
export const fetchActivityImpact = getActivityImpact;
export const castConsensusVoteApi = voteDiscussion;
export const createDiscussionApi = createDiscussion;
export const createDocumentApi = createDocument;
export const createTaskApi = createTask;
export const updateTaskApi = updateTask;
export const deleteTaskApi = deleteTask;
export const createActivityApi = createActivity;
export const completeActivityApi = completeActivity;
export const createProjectApi = createProject;
export const getProjectMembers = getMembers;
export const deleteDocumentApi = deleteDocument;


