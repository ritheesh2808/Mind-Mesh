/**
 * Client service layer connecting Next.js to the Mind-Mesh FastAPI Backend
 * with Supabase integration and robust in-memory fallback.
 */

const getApiBase = () => {
  if (typeof window !== "undefined") {
    // In browser, prefer relative /api/py rewrite or explicit env URL
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    return "http://localhost:8000/api/v1";
  }
  return process.env.API_URL || "http://127.0.0.1:8000/api/v1";
};

const getHealthUrl = () => {
  const base = getApiBase();
  return base.replace(/\/api\/v1\/?$/, "") + "/health";
};

export interface ApiHealthStatus {
  status: string;
  service: string;
  version: string;
  database: string;
  supabase_connected: boolean;
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

export async function fetchVoiceEquity(projectId: string): Promise<VoiceEquityResponse | null> {
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

export async function fetchFragmentedDebates(projectId: string): Promise<FragmentedDebate[] | null> {
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

export async function fetchCollaborationRecommendations(projectId: string): Promise<BackendRecommendation[] | null> {
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

export async function fetchCoherentSolutionBlueprint(projectId: string): Promise<CoherentBlueprint | null> {
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

export async function castConsensusVoteApi(discussionId: string, vote: "pro" | "con", userId: string) {
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

export async function createDiscussionApi(payload: {
  project_id: string;
  author_id: string;
  title: string;
  content: string;
  type?: string;
  status?: string;
  resolution?: string;
}) {
  try {
    const res = await fetch(`${getApiBase()}/discussions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function createDocumentApi(payload: {
  project_id: string;
  author_id: string;
  title: string;
  content_text?: string;
  file_type?: string;
  contributors?: string[];
}) {
  try {
    const res = await fetch(`${getApiBase()}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function createTaskApi(payload: {
  project_id: string;
  title: string;
  description?: string;
  assignee_id?: string;
  priority?: string;
  status?: string;
  due_date?: string;
}) {
  try {
    const res = await fetch(`${getApiBase()}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function updateTaskApi(taskId: string, updates: Record<string, unknown>) {
  try {
    const res = await fetch(`${getApiBase()}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function createActivityApi(payload: {
  project_id: string;
  title: string;
  description: string;
  type: string;
  participants: string[];
  agenda?: string[];
  linked_task_id?: string;
}) {
  try {
    const res = await fetch(`${getApiBase()}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function completeActivityApi(
  activityId: string,
  takeaways?: string,
  completedTaskIds: string[] = [],
  notes?: string
) {
  try {
    const res = await fetch(`${getApiBase()}/activities/${activityId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ takeaways, notes, completed_task_ids: completedTaskIds }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function createProjectApi(payload: {
  title: string;
  description: string;
  owner_id: string;
  skills_required?: string[];
  status?: string;
  progress?: number;
  deadline?: string;
  tags?: string[];
}) {
  try {
    const res = await fetch(`${getApiBase()}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

