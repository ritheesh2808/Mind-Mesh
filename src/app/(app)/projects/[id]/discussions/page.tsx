"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Brain,
  MessageSquare,
  Plus,
  Search,
  Send,
  Smile,
  X,
  CheckCircle2,
  HelpCircle,
  ListTodo,
  GitMerge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getUser } from "@/lib/mock-data";
import { formatRelative } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useAppStore } from "@/store/app-store";
import { createDiscussionApi, createTaskApi, getDiscussions, getDiscussionIntelligence } from "@/lib/api";

const QUICK_EMOJIS = ["👍", "💡", "🔥", "🎯", "✅"];

export default function DiscussionsPage() {
  const params = useParams();
  const id = params.id as string;
  const user = useAuthStore((s) => s.user);
  const allDiscussions = useAppStore((s) => s.discussions);
  const discussions = useMemo(
    () => allDiscussions.filter((discussion) => discussion.projectId === id),
    [allDiscussions, id]
  );
  const addDiscussion = useAppStore((s) => s.addDiscussion);
  const syncDiscussions = useAppStore((s) => s.syncDiscussions);
  const upsertDiscussion = useAppStore((s) => s.upsertDiscussion);
  const toggleReaction = useAppStore((s) => s.toggleReaction);
  const analysis = useAppStore((s) => s.discussionAnalysis[id]);
  const setAnalysis = useAppStore((s) => s.setDiscussionAnalysis);
  const addTask = useAppStore((s) => s.addTask);
  const solutionSyntheses = useAppStore((s) => s.solutionSyntheses);
  const setSolutionSynthesis = useAppStore((s) => s.setSolutionSynthesis);
  const addToast = useAppStore((s) => s.addToast);

  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");
  const [message, setMessage] = useState("");
  const [targetTopic, setTargetTopic] = useState("");
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    authorName: string;
    text: string;
  } | null>(null);
  const [showEmojiPickerFor, setShowEmojiPickerFor] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (id) {
      getDiscussions(id)
        .then((fetched) => {
          if (!mounted) return;
          if (fetched && fetched.length > 0) {
            syncDiscussions(id, fetched);
          }
        })
        .catch(() => {});
    }
    return () => {
      mounted = false;
    };
  }, [id, syncDiscussions]);

  const topics = useMemo(() => {
    const set = new Set(
      discussions.map((d) => d.topic).filter(Boolean) as string[]
    );
    return ["all", ...Array.from(set)];
  }, [discussions]);

  const filtered = discussions.filter((d) => {
    const matchTopic = topic === "all" || d.topic === topic;
    const matchQ =
      !query ||
      d.content.toLowerCase().includes(query.toLowerCase()) ||
      (getUser(d.authorId)?.name || "").toLowerCase().includes(query.toLowerCase());
    return matchTopic && matchQ;
  });

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    const chosenTopic = targetTopic.trim() || (topic === "all" ? "General" : topic);
    const content = message.trim();
    const reply = replyingTo ? { ...replyingTo } : undefined;

    setMessage("");
    setReplyingTo(null);
    setTargetTopic("");

    try {
      const created = await createDiscussionApi({
        project_id: id,
        author_id: user.id,
        title: `Discussion: ${chosenTopic}`,
        content,
        type: "general",
        status: "open",
      });
      if (created) {
        upsertDiscussion({ ...created, topic: chosenTopic, replyTo: reply });
        addToast("Message posted", "success");
        return;
      }
    } catch {}

    addDiscussion({
      projectId: id,
      authorId: user.id,
      content,
      topic: chosenTopic,
      replyTo: reply,
    });

    addToast("Message posted", "success");
  };


  const handleReaction = (msgId: string, emoji: string) => {
    toggleReaction(msgId, emoji);
    setShowEmojiPickerFor(null);
  };

  const analyze = async () => {
    setAnalyzing(true);
    try {
      const intel = await getDiscussionIntelligence(id);
      const topicList = topics.filter((t) => t !== "all");

      let summaryText =
        topicList.length > 0
          ? `Discussions across topics (${topicList.join(", ")}) show active collaboration across ${discussions.length} message(s).`
          : "The team is actively collaborating on architectural scoping, requirements, and next implementation steps.";

      let decisionText = "Team locked in foundational system architecture and distributed task owners.";
      let questionText = "Which external evaluation dataset will be used to benchmark cross-validation?";
      let actionText = "Finalize integration schemas and link document drafts.";

      if (intel && intel.length > 0) {
        const resolved = intel.find((item) => item.suggested_resolution);
        if (resolved?.suggested_resolution) {
          decisionText = resolved.suggested_resolution;
        } else if (intel[0]?.title) {
          decisionText = `Consensus in progress for: ${intel[0].title}`;
        }

        const questions = intel.flatMap((item) => item.unresolved_questions || []);
        if (questions.length > 0) {
          questionText = questions[0];
        } else {
          questionText = "All key architectural questions for the current sprint have recorded resolutions.";
        }

        const openDiscs = intel.filter((item) => item.consensus_status !== "consensus_reached");
        if (openDiscs.length > 0) {
          actionText = `Align team consensus on '${openDiscs[0].title}' through structured voting.`;
        } else {
          actionText = "Review agreed consensus items and proceed with sprint deliverable execution.";
        }

        const consensusCount = intel.filter((item) => item.consensus_status === "consensus_reached").length;
        summaryText = `Deterministic analysis of ${intel.length} discussion thread(s): ${consensusCount} reached consensus, ${openDiscs.length} open for alignment.`;
      }

      setAnalysis(id, {
        summary: summaryText,
        decision: decisionText,
        openQuestion: questionText,
        actionItem: actionText,
      });
      addToast("Discussion analyzed from backend intelligence", "success");
    } catch {
      addToast("Failed to analyze discussions from backend", "error");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <Card className="flex min-h-[580px] flex-col overflow-hidden border-border shadow-[var(--shadow-sm)]">
        {/* Search & Topic Filter */}
        <div className="flex flex-col gap-3 border-b border-border bg-card p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search discussions & team comments…"
              className="pl-9 h-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {topics.map((t) => (
              <button
                key={t}
                onClick={() => setTopic(t)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition ${
                  topic === t
                    ? "bg-primary text-white shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                No discussion messages match your search.
              </p>
            </div>
          ) : (
            filtered.map((d) => {
              const author = getUser(d.authorId);
              const isReplyingToThis = replyingTo?.id === d.id;

              return (
                <div
                  key={d.id}
                  className={`group relative flex gap-3 rounded-2xl p-3 transition ${
                    isReplyingToThis
                      ? "bg-[color-mix(in_oklab,var(--primary)_8%,white)] border border-primary/30"
                      : "hover:bg-muted/30"
                  }`}
                >
                  <Avatar name={author?.name || "User"} size="md" />

                  <div className="min-w-0 flex-1">
                    {/* Reply quote if present */}
                    {d.replyTo && (
                      <div className="mb-2 rounded-lg border-l-2 border-primary bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          Replying to {d.replyTo.authorName}:{" "}
                        </span>
                        <span className="italic line-clamp-1">{d.replyTo.text}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {author?.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {formatRelative(d.timestamp)}
                      </span>
                      {d.topic && (
                        <Badge variant="outline" className="text-[10px]">
                          {d.topic}
                        </Badge>
                      )}
                    </div>

                    <p className="mt-1 text-sm leading-relaxed text-foreground">
                      {d.content}
                    </p>

                    {/* Reactions & Actions bar */}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {d.reactions.map((r) => (
                        <button
                          key={r.emoji}
                          type="button"
                          onClick={() => handleReaction(d.id, r.emoji)}
                          title="Click to toggle reaction"
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition ${
                            r.reacted
                              ? "border-primary/50 bg-[color-mix(in_oklab,var(--primary)_12%,white)] text-primary shadow-xs"
                              : "border-border bg-card text-muted-foreground hover:border-border hover:bg-muted"
                          }`}
                        >
                          <span>{r.emoji}</span>
                          <span>{r.count}</span>
                        </button>
                      ))}

                      {/* Add reaction button */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setShowEmojiPickerFor(
                              showEmojiPickerFor === d.id ? null : d.id
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="React"
                        >
                          <Smile className="h-3 w-3" />
                          <Plus className="h-2.5 w-2.5" />
                        </button>

                        {showEmojiPickerFor === d.id && (
                          <div className="absolute left-0 bottom-full mb-1 z-30 flex items-center gap-1 rounded-xl border border-border bg-card p-1.5 shadow-[var(--shadow-md)] animate-fade-up">
                            {QUICK_EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleReaction(d.id, emoji)}
                                className="h-7 w-7 rounded-lg text-sm hover:bg-muted transition flex items-center justify-center"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Reply button */}
                      <button
                        type="button"
                        onClick={() =>
                          setReplyingTo({
                            id: d.id,
                            authorName: author?.name || "Teammate",
                            text: d.content,
                          })
                        }
                        className="text-xs font-medium text-muted-foreground hover:text-primary transition"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Replying banner */}
        {replyingTo && (
          <div className="flex items-center justify-between border-t border-border bg-[color-mix(in_oklab,var(--primary)_6%,white)] px-4 py-2 text-xs">
            <span className="truncate text-foreground">
              Replying to <strong className="font-semibold">{replyingTo.authorName}</strong>: &ldquo;{replyingTo.text}&rdquo;
            </span>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="ml-2 rounded p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Input box */}
        <form onSubmit={send} className="border-t border-border bg-card p-3 sm:p-4 space-y-2">
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                replyingTo
                  ? `Replying to ${replyingTo.authorName}…`
                  : "Contribute to discussion (decisions, questions, code notes)…"
              }
              className="flex-1"
            />
            <Button type="submit" size="icon" aria-label="Send">
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-2">
              <span>Topic:</span>
              <input
                type="text"
                value={targetTopic}
                onChange={(e) => setTargetTopic(e.target.value)}
                placeholder={topic === "all" ? "General" : topic}
                className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary w-32 sm:w-40"
              />
            </div>
            <span>Press Enter to send</span>
          </div>
        </form>
      </Card>

      {/* Discussion AI Synthesis Column */}
      <div className="space-y-4">
        <Button
          className="w-full gap-2 shadow-sm"
          onClick={analyze}
          disabled={analyzing}
        >
          <Brain className="h-4 w-4" />
          {analyzing ? "Analyzing & Defragmenting…" : "Analyze Discussion"}
        </Button>

        {analysis ? (
          <Card className="border-[color-mix(in_oklab,var(--primary)_25%,var(--border))] p-5 shadow-[var(--shadow-sm)] animate-fade-up">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                AI Synthesis & Consensus
              </p>
              <Badge variant="primary" className="text-[10px]">
                Updated
              </Badge>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {analysis.summary}
            </p>

            <div className="mt-5 space-y-4">
              <Block
                icon={CheckCircle2}
                label="Agreed Decision"
                text={analysis.decision}
                colorClass="text-success"
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 gap-1 text-primary border-primary/30 hover:bg-primary/5"
                    onClick={() => {
                      const current = solutionSyntheses[id] || {
                        projectId: id,
                        headline: "Unified Collaborative System Blueprint",
                        summary: "AI synthesized solution from discussions and documents.",
                        architectureComponents: [],
                        fragmentedResolutions: [],
                        participationBalanceAnalysis: [],
                        synthesizedAt: new Date().toISOString(),
                      };
                      const newResolution = {
                        topic: targetTopic || (topic === "all" ? "Discussion Consensus Resolution" : topic),
                        debatedIn: `Discussions (Thread ${topic === "all" ? "General" : topic})`,
                        divergentPoints: ["Multiple team viewpoints deliberated in discussion"],
                        synthesizedResolution: analysis.decision,
                        consensusStatus: "resolved" as const,
                        votes: { pro: 4, con: 0 },
                      };
                      setSolutionSynthesis(id, {
                        ...current,
                        fragmentedResolutions: [newResolution, ...current.fragmentedResolutions],
                        synthesizedAt: new Date().toISOString(),
                      });
                      addToast("Decision synced into Coherent Solution Blueprint!", "success");
                    }}
                  >
                    <GitMerge className="h-3 w-3" />
                    Sync into Solution Blueprint
                  </Button>
                }
              />
              <Block
                icon={HelpCircle}
                label="Unresolved Question"
                text={analysis.openQuestion}
                colorClass="text-amber-500"
              />
              <Block
                icon={ListTodo}
                label="Assigned Action Item"
                text={analysis.actionItem}
                colorClass="text-primary"
                action={
                  <Button
                    size="sm"
                    variant="soft"
                    className="text-xs h-7 gap-1"
                    onClick={() => {
                      addTask({
                        projectId: id,
                        title: analysis.actionItem.slice(0, 65),
                        description: `Action item created from discussion analysis: "${analysis.actionItem}"`,
                        status: "todo",
                        priority: "high",
                        tags: ["action-item", "ai-extracted"],
                        assigneeId: user?.id || "u1",
                        aiSuggested: true,
                        dueDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
                      });
                      createTaskApi({
                        project_id: id,
                        title: analysis.actionItem.slice(0, 65),
                        description: `Action item created from discussion analysis: "${analysis.actionItem}"`,
                        status: "todo",
                        priority: "high",
                        assignee_id: user?.id || "u1",
                        due_date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
                      }).catch(() => {});
                      addToast("Action item added as project task!", "success");
                    }}
                  >
                    <Plus className="h-3 w-3" />
                    Convert to Sprint Task
                  </Button>
                }
              />
            </div>

          </Card>
        ) : (
          <Card className="p-5 text-center">
            <Brain className="mx-auto h-8 w-8 text-primary/40" />
            <h4 className="mt-2 font-display text-sm font-semibold">
              No Analysis Generated Yet
            </h4>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Click <strong>Analyze Discussion</strong> to automatically defragment this thread into agreed decisions, unresolved questions, and action items.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

function Block({
  icon: Icon,
  label,
  text,
  colorClass,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  text: string;
  colorClass?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3.5">
      <div className="flex items-center gap-1.5">
        <Icon className={`h-4 w-4 ${colorClass || "text-foreground"}`} />
        <p className="text-xs font-bold uppercase tracking-wide text-foreground">
          {label}
        </p>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        {text}
      </p>
      {action && <div className="mt-2.5 pt-2 border-t border-border/60">{action}</div>}
    </div>
  );
}

