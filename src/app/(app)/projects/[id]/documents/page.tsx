"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Download,
  Eye,
  FileText,
  Search,
  Sparkles,
  Upload,
  Trash2,
  BookOpen,
  GitMerge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { getUser } from "@/lib/mock-data";
import { formatRelative } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useAppStore } from "@/store/app-store";
import { createDocumentApi, deleteDocumentApi, getDocuments } from "@/lib/api";

import type { Document } from "@/lib/types";

const DOC_TYPES = ["PDF", "Markdown", "Spreadsheet", "Document", "Design", "Code"];

export default function DocumentsPage() {
  const params = useParams();
  const id = params.id as string;
  const user = useAuthStore((s) => s.user);
  const allDocuments = useAppStore((s) => s.documents);
  const documents = useMemo(
    () => allDocuments.filter((document) => document.projectId === id),
    [allDocuments, id]
  );
  const addDocument = useAppStore((s) => s.addDocument);
  const syncDocuments = useAppStore((s) => s.syncDocuments);
  const upsertDocument = useAppStore((s) => s.upsertDocument);
  const deleteDocument = useAppStore((s) => s.deleteDocument);
  const summaries = useAppStore((s) => s.documentSummaries);
  const setSummary = useAppStore((s) => s.setDocumentSummary);
  const integrateDocumentIntoSynthesis = useAppStore(
    (s) => s.integrateDocumentIntoSynthesis
  );
  const addToast = useAppStore((s) => s.addToast);

  const [q, setQ] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);

  // New document form state
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [docStatus, setDocStatus] = useState<"draft" | "reviewed" | "final">("draft");
  const [docContent, setDocContent] = useState("");

  useEffect(() => {
    let mounted = true;
    if (id) {
      getDocuments(id)
        .then((fetched) => {
          if (!mounted) return;
          if (fetched && fetched.length > 0) {
            syncDocuments(id, fetched);
          }
        })
        .catch(() => {});
    }
    return () => {
      mounted = false;
    };
  }, [id, syncDocuments]);

  const filtered = useMemo(() => {
    if (!q.trim()) return documents;
    const query = q.toLowerCase();
    return documents.filter(
      (d) =>
        d.name.toLowerCase().includes(query) ||
        d.type.toLowerCase().includes(query) ||
        (getUser(d.uploadedBy)?.name || "").toLowerCase().includes(query)
    );
  }, [documents, q]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !user) return;

    const title = docName.trim();
    const previewText = docContent.trim() || `# ${title}\n\nUploaded by ${user.name}.\nThis document outlines technical specifications and collaborative notes for the current sprint.`;

    setDocName("");
    setDocContent("");
    setUploadOpen(false);

    try {
      const created = await createDocumentApi({
        project_id: id,
        author_id: user.id,
        title,
        content_text: previewText,
        file_type: docType.toLowerCase(),
        contributors: [user.id],
      });
      if (created) {
        upsertDocument(created);
        addToast("Document uploaded successfully", "success");
        return;
      }
    } catch {}

    addDocument({
      projectId: id,
      name: title,
      type: docType,
      uploadedBy: user.id,
      status: docStatus,
      size: `${(Math.random() * 2 + 0.2).toFixed(1)} MB`,
      contentPreview: previewText,
      keyTopics: [docType, "Team Shared"],
    });

    addToast("Document uploaded successfully", "success");
  };


  const handleDownload = (doc: Document) => {
    try {
      const content = doc.contentPreview || `# ${doc.name}\n\nProject Document`;
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.name.endsWith(`.${doc.type.toLowerCase()}`) ? doc.name : `${doc.name}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast(`Downloaded ${doc.name}`, "success");
    } catch {
      addToast(`Downloaded ${doc.name} (simulated)`, "success");
    }
  };

  const summarize = (doc: Document) => {
    setLoadingId(doc.id);
    setTimeout(() => {
      let richSummary = `AI Synthesis for “${doc.name}”: Core findings establish specifications for the current project sprint. `;
      if (doc.contentPreview?.trim()) {
        richSummary += doc.contentPreview.trim().slice(0, 320);
      } else {
        richSummary += "Connects this shared document to the team's current decisions and follow-up tasks.";
      }

      setSummary(doc.id, richSummary);
      setLoadingId(null);
      addToast("Document AI summary generated", "success");
    }, 850);
  };

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search shared documents, notes, diagrams…"
            className="pl-9"
          />
        </div>
        <Button onClick={() => setUploadOpen(true)} className="gap-2 shadow-sm">
          <Upload className="h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Documents Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-sm)]">
        <div className="hidden grid-cols-[1.4fr_0.6fr_0.8fr_0.7fr_0.6fr_1.1fr] gap-3 border-b border-border bg-muted/40 px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground md:grid">
          <span>Document</span>
          <span>Type</span>
          <span>Uploaded by</span>
          <span>Date</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">
              No documents found. Click <strong>Upload Document</strong> to share files with your team.
            </p>
          </div>
        ) : (
          filtered.map((doc) => {
            const uploader = getUser(doc.uploadedBy);
            return (
              <div
                key={doc.id}
                className="border-b border-border px-5 py-4 last:border-0 hover:bg-muted/20 transition"
              >
                <div className="grid gap-3 md:grid-cols-[1.4fr_0.6fr_0.8fr_0.7fr_0.6fr_1.1fr] md:items-center">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {doc.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{doc.size}</p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground font-medium">{doc.type}</p>
                  <p className="text-sm font-medium">{uploader?.name || "Member"}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelative(doc.date)}
                  </p>

                  <div>
                    <Badge
                      variant={
                        doc.status === "final"
                          ? "success"
                          : doc.status === "reviewed"
                            ? "primary"
                            : "outline"
                      }
                    >
                      {doc.status}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-xs"
                      onClick={() => setViewingDoc(doc)}
                      title="View document content"
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      View
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-xs"
                      onClick={() => handleDownload(doc)}
                      title="Download file"
                    >
                      <Download className="mr-1 h-3.5 w-3.5" />
                      Download
                    </Button>

                    <Button
                      size="sm"
                      variant="soft"
                      className="h-8 px-2 text-xs"
                      disabled={loadingId === doc.id}
                      onClick={() => summarize(doc)}
                      title="Generate AI Summary"
                    >
                      <Sparkles className="mr-1 h-3.5 w-3.5 text-primary" />
                      {loadingId === doc.id ? "…" : "Summarize"}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 text-xs text-primary border-primary/30 hover:bg-primary/5"
                      onClick={() => integrateDocumentIntoSynthesis(id, doc.id)}
                      title="Integrate this contribution into overall architecture blueprint"
                    >
                      <GitMerge className="mr-1 h-3.5 w-3.5" />
                      Integrate
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-xs text-muted-foreground hover:text-danger"
                      onClick={() => {
                        deleteDocument(doc.id);
                        deleteDocumentApi(doc.id).catch(() => {});
                      }}
                      title="Delete document"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>

                  </div>
                </div>

                {/* AI Summary Banner */}
                {summaries[doc.id] && (
                  <Card className="mt-3 border-[color-mix(in_oklab,var(--primary)_25%,var(--border))] bg-[color-mix(in_oklab,var(--primary)_4%,white)] p-3.5 text-xs animate-fade-up">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <p className="font-bold uppercase tracking-wider text-primary">
                        AI Knowledge Extraction & Summary
                      </p>
                    </div>
                    <p className="mt-1 leading-relaxed text-foreground font-medium">
                      {summaries[doc.id]}
                    </p>
                  </Card>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Upload Document Modal */}
      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload Shared Document"
        description="Share architectural specs, notes, datasets, or wireframes with teammates."
        className="max-w-lg"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <Label>Document name</Label>
            <Input
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="e.g. Model Evaluation Protocol.pdf"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Document type</Label>
              <Select value={docType} onChange={(e) => setDocType(e.target.value)}>
                {DOC_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={docStatus}
                onChange={(e) => setDocStatus(e.target.value as "draft" | "reviewed" | "final")}
              >
                <option value="draft">Draft</option>
                <option value="reviewed">Reviewed</option>
                <option value="final">Final</option>
              </Select>
            </div>
          </div>

          <div>
            <Label>Document text / Summary content</Label>
            <Textarea
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              placeholder="Paste document markdown, summary, or key takeaways for AI analysis…"
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setUploadOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Upload & Share</Button>
          </div>
        </form>
      </Modal>

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <Modal
          open={!!viewingDoc}
          onClose={() => setViewingDoc(null)}
          title={viewingDoc.name}
          description={`${viewingDoc.type} · Uploaded by ${getUser(viewingDoc.uploadedBy)?.name || "Teammate"} · ${formatRelative(viewingDoc.date)}`}
          className="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary">{viewingDoc.type}</Badge>
              <Badge variant="outline">{viewingDoc.status}</Badge>
              <span className="text-xs text-muted-foreground">{viewingDoc.size}</span>
              {viewingDoc.keyTopics?.map((topic) => (
                <Badge key={topic} variant="outline" className="text-[10px]">
                  {topic}
                </Badge>
              ))}
            </div>

            <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-border bg-muted/30 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
              {viewingDoc.contentPreview || "No preview content available for this document."}
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => handleDownload(viewingDoc)}
              >
                <Download className="h-3.5 w-3.5" />
                Download Content
              </Button>

              <Button size="sm" onClick={() => setViewingDoc(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
