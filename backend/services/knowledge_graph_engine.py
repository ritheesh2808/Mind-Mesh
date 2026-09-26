from typing import List, Dict, Any, Set, Tuple, Optional
from backend.schemas import (
    KnowledgeNodeSchema,
    KnowledgeEdgeSchema,
    KnowledgeGraphResponse
)

class KnowledgeGraphEngine:
    """
    Constructs deterministic knowledge graphs from project entities,
    mapping contributors, skills, topics, tasks, documents, and discussions into an explainable graph.
    """

    @classmethod
    def build_graph(
        cls,
        project_id: str,
        project: Dict[str, Any],
        members: List[Dict[str, Any]],
        tasks: List[Dict[str, Any]],
        discussions: List[Dict[str, Any]],
        documents: List[Dict[str, Any]]
    ) -> KnowledgeGraphResponse:
        nodes: Dict[str, KnowledgeNodeSchema] = {}
        edges: Dict[str, KnowledgeEdgeSchema] = {}

        # 1. Person nodes & Skills
        for m in members:
            uid = str(m.get("user_id") or m.get("id") or m.get("userId"))
            name = m.get("name") or f"Member {uid}"
            role = m.get("role", "Member")
            skills = m.get("skills") or []

            p_node_id = f"person:{uid}"
            nodes[p_node_id] = KnowledgeNodeSchema(
                id=p_node_id,
                project_id=project_id,
                node_type="person",
                label=name,
                description=f"{role} on project",
                metadata={"user_id": uid, "role": role, "skills": skills}
            )

            # Person -> knows -> Skill
            for s in skills:
                s_name = str(s).strip()
                if not s_name:
                    continue
                s_node_id = f"skill:{s_name.lower().replace(' ', '_')}"
                if s_node_id not in nodes:
                    nodes[s_node_id] = KnowledgeNodeSchema(
                        id=s_node_id,
                        project_id=project_id,
                        node_type="skill",
                        label=s_name,
                        description=f"Skill: {s_name}",
                        metadata={"skill_name": s_name}
                    )
                edge_id = f"{p_node_id}-knows-{s_node_id}"
                edges[edge_id] = KnowledgeEdgeSchema(
                    id=edge_id,
                    project_id=project_id,
                    source_node_id=p_node_id,
                    target_node_id=s_node_id,
                    edge_type="knows",
                    weight=2,
                    confidence=1.0,
                    evidence_count=1,
                    metadata={"relationship": "profile_skill"}
                )

        # 2. Project required skills
        req_skills = project.get("skills_required") or []
        for s in req_skills:
            s_name = str(s).strip()
            if not s_name:
                continue
            s_node_id = f"skill:{s_name.lower().replace(' ', '_')}"
            if s_node_id not in nodes:
                nodes[s_node_id] = KnowledgeNodeSchema(
                    id=s_node_id,
                    project_id=project_id,
                    node_type="skill",
                    label=s_name,
                    description=f"Project Requirement: {s_name}",
                    metadata={"required_by_project": True}
                )

        # 3. Task nodes & edges
        for t in tasks:
            tid = str(t.get("id"))
            t_title = t.get("title", f"Task {tid}")
            t_module = t.get("module") or "General"
            t_status = t.get("status", "todo")
            t_assignee = str(t.get("assignee_id") or t.get("assigneeId") or "")

            t_node_id = f"task:{tid}"
            nodes[t_node_id] = KnowledgeNodeSchema(
                id=t_node_id,
                project_id=project_id,
                node_type="task",
                label=t_title,
                description=f"Task ({t_status}) in {t_module}",
                metadata={"task_id": tid, "status": t_status, "module": t_module}
            )

            # Person -> contributed_to -> Task
            if t_assignee:
                p_node_id = f"person:{t_assignee}"
                if p_node_id in nodes:
                    edge_id = f"{p_node_id}-contributed-{t_node_id}"
                    edges[edge_id] = KnowledgeEdgeSchema(
                        id=edge_id,
                        project_id=project_id,
                        source_node_id=p_node_id,
                        target_node_id=t_node_id,
                        edge_type="contributed_to",
                        weight=3 if t_status in ("done", "completed") else 1,
                        confidence=1.0,
                        evidence_count=1,
                        metadata={"action": "assigned_task"}
                    )

            # Task -> related_to -> Topic/Module
            mod_node_id = f"topic:{t_module.lower().replace(' ', '_')}"
            if mod_node_id not in nodes:
                nodes[mod_node_id] = KnowledgeNodeSchema(
                    id=mod_node_id,
                    project_id=project_id,
                    node_type="topic",
                    label=t_module,
                    description=f"System Module: {t_module}",
                    metadata={"module": t_module}
                )
            edge_id = f"{t_node_id}-related-{mod_node_id}"
            edges[edge_id] = KnowledgeEdgeSchema(
                id=edge_id,
                project_id=project_id,
                source_node_id=t_node_id,
                target_node_id=mod_node_id,
                edge_type="related_to",
                weight=1,
                confidence=1.0,
                evidence_count=1,
                metadata={"association": "task_module"}
            )

        # 4. Document nodes & edges
        for doc in documents:
            doc_id = str(doc.get("id"))
            doc_title = doc.get("title", f"Document {doc_id}")
            doc_author = str(doc.get("author_id") or doc.get("authorId") or "")
            doc_contributors = doc.get("contributors") or []

            doc_node_id = f"document:{doc_id}"
            nodes[doc_node_id] = KnowledgeNodeSchema(
                id=doc_node_id,
                project_id=project_id,
                node_type="document",
                label=doc_title,
                description=f"Artifact: {doc_title}",
                metadata={"document_id": doc_id, "file_type": doc.get("file_type", "markdown")}
            )

            # Person -> authored -> Document
            if doc_author:
                p_node_id = f"person:{doc_author}"
                if p_node_id in nodes:
                    edge_id = f"{p_node_id}-authored-{doc_node_id}"
                    edges[edge_id] = KnowledgeEdgeSchema(
                        id=edge_id,
                        project_id=project_id,
                        source_node_id=p_node_id,
                        target_node_id=doc_node_id,
                        edge_type="authored",
                        weight=2,
                        confidence=1.0,
                        evidence_count=1,
                        metadata={"action": "author"}
                    )

            # Contributors -> reviewed / contributed -> Document
            for c in doc_contributors:
                c_str = str(c)
                if c_str and c_str != doc_author:
                    p_node_id = f"person:{c_str}"
                    if p_node_id in nodes:
                        edge_id = f"{p_node_id}-reviewed-{doc_node_id}"
                        edges[edge_id] = KnowledgeEdgeSchema(
                            id=edge_id,
                            project_id=project_id,
                            source_node_id=p_node_id,
                            target_node_id=doc_node_id,
                            edge_type="reviewed",
                            weight=1,
                            confidence=0.9,
                            evidence_count=1,
                            metadata={"action": "co_contributor"}
                        )
                        # Also person <-> person collaborated edge
                        if doc_author and f"person:{doc_author}" in nodes:
                            collab_id = f"person:{doc_author}-collab-{p_node_id}"
                            edges[collab_id] = KnowledgeEdgeSchema(
                                id=collab_id,
                                project_id=project_id,
                                source_node_id=f"person:{doc_author}",
                                target_node_id=p_node_id,
                                edge_type="collaborated",
                                weight=2,
                                confidence=0.95,
                                evidence_count=1,
                                metadata={"context": f"Document {doc_title}"}
                            )

        # 5. Discussion nodes & edges
        for disc in discussions:
            d_id = str(disc.get("id"))
            d_title = disc.get("title", f"Discussion {d_id}")
            d_author = str(disc.get("author_id") or disc.get("authorId") or "")
            d_type = disc.get("type", "general")
            d_res = disc.get("resolution")

            d_node_id = f"discussion:{d_id}"
            nodes[d_node_id] = KnowledgeNodeSchema(
                id=d_node_id,
                project_id=project_id,
                node_type="discussion",
                label=d_title,
                description=f"Debate: {d_type}",
                metadata={"discussion_id": d_id, "type": d_type, "status": disc.get("status")}
            )

            # Person -> discussed -> Discussion
            if d_author:
                p_node_id = f"person:{d_author}"
                if p_node_id in nodes:
                    edge_id = f"{p_node_id}-discussed-{d_node_id}"
                    edges[edge_id] = KnowledgeEdgeSchema(
                        id=edge_id,
                        project_id=project_id,
                        source_node_id=p_node_id,
                        target_node_id=d_node_id,
                        edge_type="discussed",
                        weight=2,
                        confidence=1.0,
                        evidence_count=1,
                        metadata={"action": "opened_discussion"}
                    )

            # If there is a resolution/decision, add Decision node
            if d_res:
                dec_node_id = f"decision:{d_id}"
                nodes[dec_node_id] = KnowledgeNodeSchema(
                    id=dec_node_id,
                    project_id=project_id,
                    node_type="decision",
                    label=f"Decision: {d_title[:30]}...",
                    description=d_res,
                    metadata={"source_discussion_id": d_id}
                )
                edge_id = f"{d_node_id}-resolved_as-{dec_node_id}"
                edges[edge_id] = KnowledgeEdgeSchema(
                    id=edge_id,
                    project_id=project_id,
                    source_node_id=d_node_id,
                    target_node_id=dec_node_id,
                    edge_type="supports",
                    weight=3,
                    confidence=1.0,
                    evidence_count=1,
                    metadata={"status": "resolved"}
                )

        node_list = list(nodes.values())
        edge_list = list(edges.values())

        return KnowledgeGraphResponse(
            project_id=project_id,
            node_count=len(node_list),
            edge_count=len(edge_list),
            nodes=node_list,
            edges=edge_list
        )

    @classmethod
    def generate_and_persist_graph(
        cls,
        project_id: str,
        project: Optional[Dict[str, Any]] = None,
        members: Optional[List[Dict[str, Any]]] = None,
        tasks: Optional[List[Dict[str, Any]]] = None,
        discussions: Optional[List[Dict[str, Any]]] = None,
        documents: Optional[List[Dict[str, Any]]] = None,
        persist: bool = True
    ) -> KnowledgeGraphResponse:
        from backend.repository import Repository
        if project is None:
            project = Repository.get_project_by_id(project_id) or {}
        if members is None:
            members = Repository.get_project_members(project_id)
        if tasks is None:
            tasks = Repository.get_tasks(project_id)
        if discussions is None:
            discussions = Repository.get_discussions(project_id)
        if documents is None:
            documents = Repository.get_documents(project_id)

        graph = cls.build_graph(
            project_id=project_id,
            project=project,
            members=members,
            tasks=tasks,
            discussions=discussions,
            documents=documents
        )
        if persist:
            Repository.save_knowledge_nodes(project_id, [n.model_dump() for n in graph.nodes])
            Repository.save_knowledge_edges(project_id, [e.model_dump() for e in graph.edges])
        return graph
