export type UserRole = "Student" | "Professional";

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
