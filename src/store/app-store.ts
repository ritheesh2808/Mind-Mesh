"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  activityFeed as seedFeed,
  discussions as seedDiscussions,
  documents as seedDocuments,
  getUser,
  initialActivities,
  insights as seedInsights,
  invitations as seedInvitations,
  notifications as seedNotifications,
  projects as seedProjects,
  recommendations as seedRecommendations,
  tasks as seedTasks,
} from "@/lib/mock-data";
import type {
  Activity,
  ActivityFeedItem,
  AIInsight,
  DiscussionMessage,
  Document,
  Invitation,
  Notification,
  Project,
  Recommendation,
  SolutionSynthesis,
  Task,
  TaskStatus,
} from "@/lib/types";

interface AppPreferences {
  profileVisibility: "public" | "connections" | "private";
  projectVisibility: "members" | "public" | "invite";
  collaborationAnalysis: boolean;
  notifications: {
    email: boolean;
    project: boolean;
    ai: boolean;
    invitations: boolean;
  };
}

type AppPreferencesUpdate = Partial<Omit<AppPreferences, "notifications">> & {
  notifications?: Partial<AppPreferences["notifications"]>;
};

interface AppState {
  projects: Project[];
  tasks: Task[];
  discussions: DiscussionMessage[];
  documents: Document[];
  insights: AIInsight[];
  invitations: Invitation[];
  notifications: Notification[];
  recommendations: Recommendation[];
  activities: Activity[];
  activityFeed: ActivityFeedItem[];
  solutionSyntheses: Record<string, SolutionSynthesis>;
  discussionAnalysis: Record<
    string,
    {
      decision: string;
      openQuestion: string;
      actionItem: string;
      summary: string;
    }
  >;
  documentSummaries: Record<string, string>;
  preferences: AppPreferences;
  toasts: { id: string; message: string; type: "success" | "info" | "error" }[];

  updatePreferences: (partial: AppPreferencesUpdate) => void;
  createProject: (
    data: Omit<
      Project,
      | "id"
      | "progress"
      | "status"
      | "createdAt"
      | "lastActivity"
      | "members"
      | "milestones"
      | "lookingForMembers"
    > & { ownerId: string }
  ) => Project;
  joinProject: (projectId: string, userId: string) => void;
  updateInvitation: (
    id: string,
    status: "accepted" | "declined"
  ) => void;
  sendProjectInvite: (
    projectId: string,
    fromUserId: string,
    toUserId: string,
    message?: string
  ) => void;
  moveTask: (taskId: string, status: TaskStatus) => void;
  addTask: (task: Omit<Task, "id">) => void;
  updateTask: (taskId: string, partial: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  addDiscussion: (msg: Omit<DiscussionMessage, "id" | "reactions" | "timestamp">) => void;
  toggleReaction: (discussionId: string, emoji: string) => void;
  addDocument: (doc: Omit<Document, "id" | "date">) => Document;
  deleteDocument: (id: string) => void;
  setDiscussionAnalysis: (
    projectId: string,
    analysis: AppState["discussionAnalysis"][string]
  ) => void;
  setDocumentSummary: (docId: string, summary: string) => void;
  setSolutionSynthesis: (projectId: string, synthesis: SolutionSynthesis) => void;
  addInsight: (insight: Omit<AIInsight, "id" | "createdAt">) => void;
  createActivity: (activity: Omit<Activity, "id" | "createdAt">) => void;
  completeActivity: (activityId: string, notes?: string, takeaways?: string) => void;
  voteResolution: (projectId: string, topicIndex: number, vote: "pro" | "con") => void;
  addRecommendation: (rec: Omit<Recommendation, "id">) => void;
  rebalanceTasks: (projectId: string) => { rebalancedCount: number };
  integrateDocumentIntoSynthesis: (projectId: string, docId: string) => void;
  markRecommendation: (id: string, status: Recommendation["status"]) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addToast: (message: string, type?: "success" | "info" | "error") => void;
  dismissToast: (id: string) => void;
  addNotification: (n: Omit<Notification, "id" | "read" | "createdAt">) => void;
}

function migrateSeededRecords<T extends { id: string }>(
  existing: T[] | undefined,
  seeds: T[],
  update: (record: T, seed: T) => T
): T[] {
  return (existing ?? seeds).map((record) => {
    const seed = seeds.find((candidate) => candidate.id === record.id);
    return seed ? update(record, seed) : record;
  });
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      projects: seedProjects,
      tasks: seedTasks,
      discussions: seedDiscussions,
      documents: seedDocuments,
      insights: seedInsights,
      invitations: seedInvitations,
      notifications: seedNotifications,
      recommendations: seedRecommendations,
      activities: initialActivities,
      activityFeed: seedFeed,
      solutionSyntheses: {},
      discussionAnalysis: {},
      documentSummaries: {},
      preferences: {
        profileVisibility: "public",
        projectVisibility: "members",
        collaborationAnalysis: true,
        notifications: {
          email: true,
          project: true,
          ai: true,
          invitations: true,
        },
      },
      toasts: [],

      updatePreferences: (partial) =>
        set((s) => ({
          preferences: {
            ...s.preferences,
            ...partial,
            notifications: {
              ...s.preferences.notifications,
              ...partial.notifications,
            },
          },
        })),

      createProject: (data) => {
        const project: Project = {
          ...data,
          id: `p-${Date.now()}`,
          progress: 5,
          status: "planning",
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          lookingForMembers: data.visibility === "public",
          members: [
            {
              userId: data.ownerId,
              role: "Lead",
              contribution: 100,
              joinedAt: new Date().toISOString().slice(0, 10),
            },
          ],
          milestones: [
            {
              id: `m-${Date.now()}`,
              title: "Project kickoff",
              dueDate: new Date(Date.now() + 7 * 86400000)
                .toISOString()
                .slice(0, 10),
              completed: false,
            },
          ],
        };
        set((s) => ({ projects: [project, ...s.projects] }));
        get().addToast(`Created project “${project.name}”`, "success");
        return project;
      },

      joinProject: (projectId, userId) => {
        const proj = get().projects.find((p) => p.id === projectId);
        set((s) => ({
          projects: s.projects.map((p) => {
            if (p.id !== projectId) return p;
            if (p.members.some((m) => m.userId === userId)) return p;
            return {
              ...p,
              members: [
                ...p.members,
                {
                  userId,
                  role: "Contributor",
                  contribution: 0,
                  joinedAt: new Date().toISOString().slice(0, 10),
                },
              ],
              lastActivity: new Date().toISOString(),
            };
          }),
        }));
        get().addToast(`Joined “${proj?.name || "project"}”`, "success");
        get().addNotification({
          type: "join_request",
          title: "Project Joined",
          body: `You are now a member of ${proj?.name || "the project"}.`,
          href: `/projects/${projectId}`,
        });
      },

      sendProjectInvite: (projectId, fromUserId, toUserId, message) => {
        const proj = get().projects.find((p) => p.id === projectId);
        const inv: Invitation = {
          id: `inv-${Date.now()}`,
          type: "incoming",
          projectId,
          projectName: proj?.name || "Project",
          fromUserId,
          toUserId,
          message: message || "You've been invited to join this project on Mesh.",
          createdAt: new Date().toISOString(),
          status: "pending",
        };
        set((s) => ({
          invitations: [inv, ...s.invitations],
        }));
        get().addNotification({
          type: "invitation",
          title: "New Project Invitation",
          body: `You have been invited to join ${proj?.name || "a project"}.`,
          href: "/invitations",
        });
        get().addToast("Invitation sent successfully", "success");
      },

      updateInvitation: (id, status) => {
        const inv = get().invitations.find((i) => i.id === id);
        set((s) => ({
          invitations: s.invitations.map((i) =>
            i.id === id ? { ...i, status } : i
          ),
        }));
        if (inv && status === "accepted" && inv.type === "incoming") {
          get().joinProject(inv.projectId, inv.toUserId);
        }
        if (inv && status === "accepted" && inv.type === "join_request") {
          get().joinProject(inv.projectId, inv.fromUserId);
        }
        get().addToast(
          status === "accepted" ? "Invitation accepted" : "Invitation declined",
          "info"
        );
      },

      moveTask: (taskId, status) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, status } : t
          ),
        }));
        get().addToast("Task updated", "info");
      },

      addTask: (task) => {
        const newTask: Task = { ...task, id: `t-${Date.now()}` };
        set((s) => ({ tasks: [...s.tasks, newTask] }));
        get().addToast("Task added", "success");
      },

      updateTask: (taskId, partial) => {
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, ...partial } : t)),
        }));
        get().addToast("Task updated", "success");
      },

      deleteTask: (taskId) => {
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== taskId),
        }));
        get().addToast("Task removed", "info");
      },

      addDiscussion: (msg) => {
        const newMsg: DiscussionMessage = {
          ...msg,
          id: `d-${Date.now()}`,
          timestamp: new Date().toISOString(),
          reactions: [],
        };
        set((s) => ({ discussions: [...s.discussions, newMsg] }));
      },

      toggleReaction: (discussionId, emoji) => {
        set((s) => ({
          discussions: s.discussions.map((d) => {
            if (d.id !== discussionId) return d;
            const existing = d.reactions.find((r) => r.emoji === emoji);
            let newReactions;
            if (existing) {
              if (existing.reacted) {
                newReactions = d.reactions
                  .map((r) =>
                    r.emoji === emoji
                      ? { ...r, count: Math.max(0, r.count - 1), reacted: false }
                      : r
                  )
                  .filter((r) => r.count > 0);
              } else {
                newReactions = d.reactions.map((r) =>
                  r.emoji === emoji
                    ? { ...r, count: r.count + 1, reacted: true }
                    : r
                );
              }
            } else {
              newReactions = [...d.reactions, { emoji, count: 1, reacted: true }];
            }
            return { ...d, reactions: newReactions };
          }),
        }));
      },

      addDocument: (doc) => {
        const newDoc: Document = {
          ...doc,
          id: `doc-${Date.now()}`,
          date: new Date().toISOString(),
        };
        const feedItem: ActivityFeedItem = {
          id: `af-${Date.now()}`,
          projectId: doc.projectId,
          userId: doc.uploadedBy,
          action: `uploaded document: ${doc.name}`,
          timestamp: new Date().toISOString(),
        };
        set((s) => ({
          documents: [newDoc, ...s.documents],
          activityFeed: [feedItem, ...s.activityFeed],
        }));
        get().addToast(`Uploaded “${doc.name}”`, "success");
        return newDoc;
      },

      deleteDocument: (id) => {
        set((s) => ({
          documents: s.documents.filter((d) => d.id !== id),
        }));
        get().addToast("Document removed", "info");
      },

      setDiscussionAnalysis: (projectId, analysis) => {
        set((s) => ({
          discussionAnalysis: {
            ...s.discussionAnalysis,
            [projectId]: analysis,
          },
        }));
      },

      setDocumentSummary: (docId, summary) => {
        set((s) => ({
          documentSummaries: { ...s.documentSummaries, [docId]: summary },
        }));
      },

      setSolutionSynthesis: (projectId, synthesis) => {
        set((s) => ({
          solutionSyntheses: {
            ...s.solutionSyntheses,
            [projectId]: synthesis,
          },
        }));
      },

      addInsight: (insight) => {
        const newInsight: AIInsight = {
          ...insight,
          id: `i-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          insights: [newInsight, ...s.insights],
        }));
        get().addNotification({
          type: "insight",
          title: "New AI Insight",
          body: insight.title,
          href: `/projects/${insight.projectId}/intelligence`,
        });
        get().addToast("New insight generated", "info");
      },

      addRecommendation: (rec) => {
        const newRec: Recommendation = {
          ...rec,
          id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        };
        set((s) => ({
          recommendations: [newRec, ...s.recommendations],
        }));
        get().addNotification({
          type: "activity",
          title: "New AI Recommendation",
          body: rec.title,
          href: `/projects/${rec.projectId}/intelligence`,
        });
        get().addToast("AI recommendation created", "info");
      },

      rebalanceTasks: (projectId) => {
        const state = get();
        const proj = state.projects.find((p) => p.id === projectId);
        if (!proj) return { rebalancedCount: 0 };

        const projectTasks = state.tasks.filter(
          (t) => t.projectId === projectId && t.status !== "completed"
        );
        if (projectTasks.length === 0) return { rebalancedCount: 0 };

        const memberCounts: Record<string, number> = {};
        proj.members.forEach((m) => {
          memberCounts[m.userId] = projectTasks.filter((t) => t.assigneeId === m.userId).length;
        });

        const sortedMembers = [...proj.members].sort(
          (a, b) => (memberCounts[b.userId] || 0) - (memberCounts[a.userId] || 0)
        );

        const overloaded = sortedMembers[0];
        const underloaded = sortedMembers[sortedMembers.length - 1];

        if (!overloaded || !underloaded || overloaded.userId === underloaded.userId) {
          return { rebalancedCount: 0 };
        }

        const candidate = projectTasks.find(
          (t) => t.assigneeId === overloaded.userId && (t.status === "todo" || t.status === "backlog")
        );

        if (!candidate) return { rebalancedCount: 0 };

        const toUser = getUser(underloaded.userId);
        const fromUser = getUser(overloaded.userId);

        // Recalculate member contribution percentages toward balance
        const updatedMembers = proj.members.map((m) => {
          if (m.userId === overloaded.userId) {
            return { ...m, contribution: Math.max(14, m.contribution - 6) };
          }
          if (m.userId === underloaded.userId) {
            return { ...m, contribution: Math.min(30, m.contribution + 6) };
          }
          return m;
        });

        const totalContrib = updatedMembers.reduce((acc, m) => acc + m.contribution, 0);
        const normalizedMembers = updatedMembers.map((m) => ({
          ...m,
          contribution: Math.round((m.contribution / totalContrib) * 100),
        }));

        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId ? { ...p, members: normalizedMembers, lastActivity: new Date().toISOString() } : p
          ),
          tasks: s.tasks.map((t) =>
            t.id === candidate.id ? { ...t, assigneeId: underloaded.userId } : t
          ),
          activityFeed: [
            {
              id: `af-${Date.now()}`,
              projectId,
              userId: underloaded.userId,
              action: `rebalanced task: "${candidate.title}" reallocated to balance participation`,
              timestamp: new Date().toISOString(),
            },
            ...s.activityFeed,
          ],
        }));

        const toName = toUser?.name ? toUser.name.split(" ")[0] : "Teammate";
        const fromName = fromUser?.name || "a teammate";
        const targetFullName = toUser?.name || "a peer";

        get().addToast(
          `Rebalanced "${candidate.title}" to ${toName} (Voice Equity improved!)`,
          "success"
        );

        get().addNotification({
          type: "task",
          title: "Task Rebalanced",
          body: `"${candidate.title}" was reallocated from ${fromName} to ${targetFullName} to balance participation.`,
          href: `/projects/${projectId}/tasks`,
        });

        return { rebalancedCount: 1 };
      },


      integrateDocumentIntoSynthesis: (projectId, docId) => {
        const state = get();
        const doc = state.documents.find((d) => d.id === docId);
        if (!doc) return;

        const current = state.solutionSyntheses[projectId] || {
          projectId,
          headline: "Unified System Architecture & Solution Blueprint",
          summary: `AI has synthesized collective insights from team contributions.`,
          architectureComponents: [],
          fragmentedResolutions: [],
          participationBalanceAnalysis: [],
          synthesizedAt: new Date().toISOString(),
        };

        const author = getUser(doc.uploadedBy);
        const newComp = {
          name: doc.name.replace(/\.[^/.]+$/, ""),
          contributor: `${author?.name || "Team Member"} (${author?.department || "Contributor"})`,
          sourceType: "Document" as const,
          status: (doc.status === "final" ? "integrated" : "in_progress") as "integrated" | "in_progress" | "pending_review",
          description: doc.contentPreview?.slice(0, 140) || `Shared document specification contributed by ${author?.name || "a teammate"}.`,
        };

        const existingIdx = current.architectureComponents.findIndex(
          (c) => c.name.toLowerCase() === newComp.name.toLowerCase()
        );

        const updatedComponents = existingIdx >= 0
          ? current.architectureComponents.map((c, i) => (i === existingIdx ? newComp : c))
          : [...current.architectureComponents, newComp];

        const updatedSynthesis = {
          ...current,
          architectureComponents: updatedComponents,
          summary: `AI has integrated ${updatedComponents.length} components across team documents, discussions, and tasks into an end-to-end solution.`,
          synthesizedAt: new Date().toISOString(),
        };

        set((s) => ({
          solutionSyntheses: {
            ...s.solutionSyntheses,
            [projectId]: updatedSynthesis,
          },
        }));

        get().addToast(`Integrated "${doc.name}" into Solution Synthesis blueprint`, "success");
        get().addNotification({
          type: "document",
          title: "Document Integrated into Solution",
          body: `"${doc.name}" has been mapped into the project's coherent architecture.`,
          href: `/projects/${projectId}/intelligence`,
        });
      },

      createActivity: (activity) => {
        const newActivity: Activity = {
          ...activity,
          id: `act-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        const feedItem: ActivityFeedItem = {
          id: `af-${Date.now()}`,
          projectId: activity.projectId,
          userId: activity.participants[0] || "u1",
          action: `scheduled activity: ${activity.title}`,
          timestamp: new Date().toISOString(),
        };
        set((s) => ({
          activities: [newActivity, ...s.activities],
          activityFeed: [feedItem, ...s.activityFeed],
          tasks: [
            {
              id: `t-act-${Date.now()}`,
              projectId: activity.projectId,
              title: activity.title,
              description: activity.description,
              status: "todo",
              priority: "medium",
              dueDate: activity.dateTime.slice(0, 10),
              tags: ["activity", activity.type],
              assigneeId: activity.participants[0],
            },
            ...s.tasks,
          ],
        }));
        get().addNotification({
          type: "activity",
          title: "Activity created",
          body: `${activity.title} scheduled for the team.`,
          href: `/projects/${activity.projectId}`,
        });
        get().addToast("Activity created", "success");
      },

      completeActivity: (activityId, notes, takeaways) => {
        const act = get().activities.find((a) => a.id === activityId);
        if (!act) return;

        set((s) => ({
          activities: s.activities.map((a) =>
            a.id === activityId
              ? { ...a, status: "completed" as const, notes, takeaways }
              : a
          ),
          activityFeed: [
            {
              id: `af-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              projectId: act.projectId,
              userId: act.participants[0] || "u1",
              action: `concluded collaborative session: "${act.title}" — knowledge exchange synthesized`,
              timestamp: new Date().toISOString(),
            },
            ...s.activityFeed,
          ],
          tasks: s.tasks.map((t) =>
            t.projectId === act.projectId && t.title === act.title
              ? { ...t, status: "completed" as const }
              : t
          ),
        }));

        get().addToast(`Completed "${act.title}" & logged knowledge transfer!`, "success");
        get().addNotification({
          type: "activity",
          title: "Activity Concluded",
          body: `"${act.title}" takeaways logged. Cross-team flow updated.`,
          href: `/projects/${act.projectId}`,
        });
      },

      voteResolution: (projectId, topicIndex, vote) => {
        const current = get().solutionSyntheses[projectId];
        if (!current || !current.fragmentedResolutions[topicIndex]) return;

        const target = current.fragmentedResolutions[topicIndex];
        const votes = target.votes || { pro: 3, con: 1 };
        
        let newPro = votes.pro;
        let newCon = votes.con;
        let userVote: "pro" | "con" | undefined = vote;
        
        if (votes.userVote === vote) {
          if (vote === "pro") newPro = Math.max(0, newPro - 1);
          else newCon = Math.max(0, newCon - 1);
          userVote = undefined;
        } else {
          if (votes.userVote === "pro") newPro = Math.max(0, newPro - 1);
          if (votes.userVote === "con") newCon = Math.max(0, newCon - 1);
          if (vote === "pro") newPro++;
          else newCon++;
        }

        const updatedResolutions = current.fragmentedResolutions.map((r, i) =>
          i === topicIndex
            ? {
                ...r,
                votes: { pro: newPro, con: newCon, userVote },
                consensusStatus: (newPro > 3 ? "resolved" : "needs_team_vote") as "resolved" | "needs_team_vote",
              }
            : r
        );

        set((s) => ({
          solutionSyntheses: {
            ...s.solutionSyntheses,
            [projectId]: {
              ...current,
              fragmentedResolutions: updatedResolutions,
            },
          },
        }));

        get().addToast(`Recorded feedback for "${target.topic}"`, "success");
      },

      markRecommendation: (id, status) => {
        set((s) => ({
          recommendations: s.recommendations.map((r) =>
            r.id === id ? { ...r, status } : r
          ),
        }));
      },

      markNotificationRead: (id) => {
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      markAllNotificationsRead: () => {
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        }));
      },

      addToast: (message, type = "info") => {
        // Unique even when multiple toasts fire in the same millisecond
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        set((s) => ({
          toasts: [...s.toasts, { id, message, type }],
        }));
        setTimeout(() => get().dismissToast(id), 3200);
      },

      dismissToast: (id) => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      },

      addNotification: (n) => {
        set((s) => ({
          notifications: [
            {
              ...n,
              id: `n-${Date.now()}`,
              read: false,
              createdAt: new Date().toISOString(),
            },
            ...s.notifications,
          ],
        }));
      },
    }),
    {
      name: "mesh-app",
      version: 1,
      migrate: (persistedState, version) => {
        const state = persistedState as Partial<AppState>;
        const hasLegacyDemo = state.projects?.some(
          (project) => project.id === "p1" && project.name === "AI-Based Intrusion Detection"
        );

        if (version >= 1 || !hasLegacyDemo) return state as AppState;

        const seededProject = seedProjects.find((project) => project.id === "p1");
        const legacyDocumentIds = new Set(seedDocuments.map((document) => document.id));

        return {
          ...state,
          projects: (state.projects ?? seedProjects).map((project) => {
            if (project.id !== "p1" || !seededProject) return project;
            return {
              ...project,
              name: seededProject.name,
              description: seededProject.description,
              category: seededProject.category,
              skillsRequired: seededProject.skillsRequired,
              members: project.members.map((member) => ({
                ...member,
                role:
                  seededProject.members.find((seed) => seed.userId === member.userId)?.role ??
                  member.role,
              })),
              milestones: project.milestones.map((milestone) => ({
                ...milestone,
                title:
                  seededProject.milestones.find((seed) => seed.id === milestone.id)?.title ??
                  milestone.title,
              })),
            };
          }),
          tasks: migrateSeededRecords(state.tasks, seedTasks, (record, seed) =>
            record.projectId === "p1"
              ? { ...record, title: seed.title, description: seed.description, tags: seed.tags, aiSuggested: seed.aiSuggested }
              : record
          ),
          discussions: migrateSeededRecords(state.discussions, seedDiscussions, (record, seed) =>
            record.projectId === "p1"
              ? { ...record, content: seed.content, topic: seed.topic }
              : record
          ),
          documents: migrateSeededRecords(state.documents, seedDocuments, (record, seed) =>
            record.projectId === "p1"
              ? { ...record, name: seed.name, type: seed.type, keyTopics: seed.keyTopics, contentPreview: seed.contentPreview }
              : record
          ),
          insights: migrateSeededRecords(state.insights, seedInsights, (record, seed) =>
            record.projectId === "p1"
              ? { ...record, title: seed.title, explanation: seed.explanation, evidence: seed.evidence, suggestedAction: seed.suggestedAction }
              : record
          ),
          recommendations: migrateSeededRecords(state.recommendations, seedRecommendations, (record, seed) =>
            record.projectId === "p1" ? { ...record, title: seed.title, why: seed.why } : record
          ),
          invitations: migrateSeededRecords(state.invitations, seedInvitations, (record, seed) =>
            record.projectId === "p1" ? { ...record, projectName: seed.projectName, message: seed.message } : record
          ),
          notifications: migrateSeededRecords(state.notifications, seedNotifications, (record, seed) =>
            seed.href?.includes("/projects/p1") ? { ...record, body: seed.body } : record
          ),
          activityFeed: migrateSeededRecords(state.activityFeed, seedFeed, (record, seed) =>
            record.projectId === "p1" ? { ...record, action: seed.action } : record
          ),
          solutionSyntheses: Object.fromEntries(
            Object.entries(state.solutionSyntheses ?? {}).filter(([projectId]) => projectId !== "p1")
          ),
          discussionAnalysis: Object.fromEntries(
            Object.entries(state.discussionAnalysis ?? {}).filter(([projectId]) => projectId !== "p1")
          ),
          documentSummaries: Object.fromEntries(
            Object.entries(state.documentSummaries ?? {}).filter(([documentId]) => !legacyDocumentIds.has(documentId))
          ),
        } as AppState;
      },
      partialize: (s) => ({
        projects: s.projects,
        tasks: s.tasks,
        discussions: s.discussions,
        documents: s.documents,
        insights: s.insights,
        invitations: s.invitations,
        notifications: s.notifications,
        recommendations: s.recommendations,
        activities: s.activities,
        activityFeed: s.activityFeed,
        solutionSyntheses: s.solutionSyntheses,
        discussionAnalysis: s.discussionAnalysis,
        documentSummaries: s.documentSummaries,
        preferences: s.preferences,
      }),
    }
  )
);
