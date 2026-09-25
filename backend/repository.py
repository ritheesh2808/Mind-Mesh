from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import logging
from fastapi import HTTPException
from backend.config import settings
from backend.supabase_client import get_supabase_client

logger = logging.getLogger("mindmesh.repository")

# --- MEMORY STORE INITIALIZATION ---
_MEMORY_PROJECTS = [
    {
        "id": "p1",
        "title": "AI-Powered Collaborative Cyber Threat Defense System",
        "name": "AI-Powered Collaborative Cyber Threat Defense System",
        "description": "A multi-agent learning platform designed to ingest high-throughput network packets, classify adversarial anomaly patterns in real-time, and orchestrate automated mitigation protocols.",
        "status": "in-progress",
        "progress": 65,
        "deadline": "2026-10-15T00:00:00Z",
        "owner_id": "u1",
        "skills_required": ["Python", "FastAPI", "PyTorch", "Kafka", "React", "Cybersecurity"],
        "tags": ["AI/ML", "Distributed Systems", "Security", "Capstone"],
        "members": [
            {"user_id": "u1", "role": "Owner", "name": "Ritheesh"},
            {"user_id": "u2", "role": "Member", "name": "Priya Sharma"},
            {"user_id": "u3", "role": "Member", "name": "Karthik Raja"},
            {"user_id": "u4", "role": "Member", "name": "Arun Kumar"},
            {"user_id": "u5", "role": "Member", "name": "Divya Patel"}
        ]
    },
    {
        "id": "p2",
        "title": "Campus Knowledge Graph",
        "name": "Campus Knowledge Graph",
        "description": "Semantic knowledge graph connecting courses, projects, and student skills to recommend learning pathways.",
        "status": "planning",
        "progress": 18,
        "deadline": "2026-11-01T00:00:00Z",
        "owner_id": "u2",
        "skills_required": ["Python", "Graph Databases", "NLP", "Web Development"],
        "tags": ["AI/ML", "Knowledge Graph", "Ontology"],
        "members": [
            {"user_id": "u2", "role": "Lead", "name": "Priya Sharma"},
            {"user_id": "u5", "role": "Member", "name": "Divya Patel"},
            {"user_id": "u1", "role": "Member", "name": "Ritheesh"}
        ]
    },
    {
        "id": "p3",
        "title": "Secure Chat for Student Clubs",
        "name": "Secure Chat for Student Clubs",
        "description": "Encrypted messaging for campus clubs with moderation tools and event coordination.",
        "status": "in-progress",
        "progress": 45,
        "deadline": "2026-10-28T00:00:00Z",
        "owner_id": "u5",
        "skills_required": ["TypeScript", "Web Development", "Cryptography", "UI/UX"],
        "tags": ["Web Development", "Security", "Realtime"],
        "members": [
            {"user_id": "u5", "role": "Lead", "name": "Divya Patel"},
            {"user_id": "u3", "role": "Member", "name": "Karthik Raja"},
            {"user_id": "u1", "role": "Member", "name": "Ritheesh"}
        ]
    }
]

_MEMORY_PROFILES = [
    {"id": "u1", "name": "Ritheesh", "email": "ritheesh@university.edu", "role": "Lead Coordinator"},
    {"id": "u2", "name": "Priya Sharma", "email": "priya@university.edu", "role": "Data Engineer"},
    {"id": "u3", "name": "Karthik Raja", "email": "karthik@university.edu", "role": "ML Specialist"},
    {"id": "u4", "name": "Arun Kumar", "email": "arun@university.edu", "role": "Security Researcher"},
    {"id": "u5", "name": "Divya Patel", "email": "divya@university.edu", "role": "Frontend & Visualization"}
]

_MEMORY_TASKS = [
    {"id": "t1", "project_id": "p1", "title": "Kafka Ingestion Buffer for Raw PCAP Streams", "status": "done", "priority": "high", "assignee_id": "u2", "tags": ["infrastructure", "streaming"], "module": "Data Ingestion"},
    {"id": "t2", "project_id": "p1", "title": "Transformer Feature Embeddings Extraction", "status": "done", "priority": "high", "assignee_id": "u3", "tags": ["ai/ml", "features"], "module": "Feature Pipeline"},
    {"id": "t3", "project_id": "p1", "title": "Quantize ONNX Model for Sub-25ms SLA", "status": "in-progress", "priority": "urgent", "assignee_id": "u3", "tags": ["performance", "onnx"], "module": "Inference Engine"},
    {"id": "t4", "project_id": "p1", "title": "Snort Threat Pattern Heuristic Ruleset", "status": "in-progress", "priority": "medium", "assignee_id": "u4", "tags": ["security", "rules"], "module": "Detection Engine"},
    {"id": "t5", "project_id": "p1", "title": "Interactive Anomaly Radar & Metrics Dashboard", "status": "in-progress", "priority": "medium", "assignee_id": "u5", "tags": ["frontend", "visualization"], "module": "User Interface"},
    {"id": "t6", "project_id": "p1", "title": "FastAPI Orchestration & Supabase Auth Bridge", "status": "done", "priority": "high", "assignee_id": "u1", "tags": ["backend", "api"], "module": "Core API"}
]

_MEMORY_DISCUSSIONS = [
    {
        "id": "d1",
        "project_id": "p1",
        "author_id": "u3",
        "title": "Model Inference Latency vs Detection Accuracy in Real-Time Traffic",
        "content": "We are observing 120ms latency with the unquantized model, exceeding our 25ms SLA target. Shall we quantize to INT8 or prune 40% of layers?",
        "type": "architectural_debate",
        "status": "divergent",
        "resolution": "Adopt hybrid multi-stage pipeline: fast heuristic pre-filter followed by quantized INT8 transformer for ambiguous traffic.",
        "consensus_pro": 4,
        "consensus_con": 0,
        "created_at": "2026-09-24T10:00:00Z"
    },
    {
        "id": "d2",
        "project_id": "p1",
        "author_id": "u4",
        "title": "Fragmented PCAP Ingestion Pipeline & Thread Safety",
        "content": "The Snort/Suricata PCAP ingestion threads are dropping bursts under 10Gbps load without a dedicated ring buffer.",
        "type": "unresolved_blocker",
        "status": "fragmented",
        "resolution": "Pair Priya and Arun in a Knowledge Transfer session to align Kafka buffer partitions with PCAP workers.",
        "consensus_pro": 3,
        "consensus_con": 0,
        "created_at": "2026-09-25T14:30:00Z"
    }
]

_MEMORY_DOCUMENTS = [
    {
        "id": "doc1",
        "project_id": "p1",
        "author_id": "u1",
        "title": "Threat Defense System Architecture Specification",
        "content_text": "This document specifies the end-to-end packet processing pipeline, agent interactions, and mitigation triggers.",
        "file_type": "markdown",
        "contributors": ["u1", "u2", "u3"],
        "created_at": "2026-09-23T08:00:00Z"
    },
    {
        "id": "doc2",
        "project_id": "p1",
        "author_id": "u4",
        "title": "PCAP Feature Extraction & Network Signatures",
        "content_text": "Specification of network flow heuristics, statistical packet length distributions, and behavioral signature rules.",
        "file_type": "markdown",
        "contributors": ["u4"],
        "created_at": "2026-09-24T16:00:00Z"
    }
]

_MEMORY_ACTIVITIES = [
    {
        "id": "act-1",
        "project_id": "p1",
        "title": "Knowledge Transfer & Bridge: Kafka Ingestion to PCAP Engine",
        "description": "Cross-domain pairing between Priya (Data) and Arun (Security) to resolve packet drop bottleneck.",
        "type": "knowledge_transfer",
        "status": "pending",
        "participants": ["Priya Sharma", "Arun Kumar"],
        "agenda": ["Review Kafka consumer group thread isolation model", "Define memory pool ring buffer contract"],
        "linked_task_id": "t4",
        "takeaways": None,
        "notes": None,
        "created_at": "2026-09-25T12:00:00Z"
    }
]


def _check_db_failure(operation: str, exc: Optional[Exception] = None):
    if not settings.USE_MEMORY_FALLBACK:
        msg = f"Database unavailable during {operation}"
        if exc:
            msg += f": {exc}"
        logger.error(msg)
        raise HTTPException(status_code=503, detail=msg)


class Repository:
    """
    Centralized data access repository providing seamless dual-mode execution:
    - Direct Supabase PostgreSQL queries when configured
    - Robust in-memory state engine when running in fallback mode
    - Explicit 503 error handling when USE_MEMORY_FALLBACK=False
    """

    # -------------------------------------------------------------------------
    # PROJECTS
    # -------------------------------------------------------------------------
    @staticmethod
    def get_projects() -> List[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("projects").select("*").execute()
                projects = res.data or []
                for p in projects:
                    m_res = sb.table("project_members").select("user_id, role, profiles(name)").eq("project_id", p["id"]).execute()
                    members = []
                    for item in (m_res.data or []):
                        prof = item.get("profiles") or {}
                        name = prof.get("name") if isinstance(prof, dict) else None
                        members.append({
                            "user_id": item["user_id"],
                            "role": item.get("role", "Member"),
                            "name": name or f"User {item['user_id']}"
                        })
                    p["members"] = members
                return projects
            except Exception as e:
                _check_db_failure("get_projects", e)
                logger.warning("Supabase read failed: %s; falling back to memory.", e)

        _check_db_failure("get_projects")
        return _MEMORY_PROJECTS

    @staticmethod
    def get_project_by_id(project_id: str) -> Optional[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("projects").select("*").eq("id", project_id).execute()
                if res.data:
                    p = res.data[0]
                    m_res = sb.table("project_members").select("user_id, role, profiles(name)").eq("project_id", project_id).execute()
                    members = []
                    for item in (m_res.data or []):
                        prof = item.get("profiles") or {}
                        name = prof.get("name") if isinstance(prof, dict) else None
                        members.append({
                            "user_id": item["user_id"],
                            "role": item.get("role", "Member"),
                            "name": name or f"User {item['user_id']}"
                        })
                    p["members"] = members
                    return p
                return None
            except Exception as e:
                _check_db_failure("get_project_by_id", e)
                logger.warning("Supabase read failed: %s; falling back to memory.", e)

        _check_db_failure("get_project_by_id")
        for p in _MEMORY_PROJECTS:
            if p["id"] == project_id:
                return p
        return None

    @staticmethod
    def get_project_members(project_id: str) -> List[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                m_res = sb.table("project_members").select("user_id, role, profiles(name)").eq("project_id", project_id).execute()
                if m_res.data:
                    return [
                        {
                            "user_id": item["user_id"],
                            "role": item.get("role", "Member"),
                            "name": (item.get("profiles") or {}).get("name", f"User {item['user_id']}")
                        }
                        for item in m_res.data
                    ]
                return []
            except Exception as e:
                _check_db_failure("get_project_members", e)
                logger.warning("Supabase read failed: %s; falling back to memory.", e)

        _check_db_failure("get_project_members")
        proj = Repository.get_project_by_id(project_id)
        if proj and "members" in proj and proj["members"]:
            return proj["members"]
        return [{"user_id": p["id"], "role": "Member", "name": p["name"]} for p in _MEMORY_PROFILES]

    @staticmethod
    def create_project(project_data: Dict[str, Any]) -> Dict[str, Any]:
        project_data["id"] = project_data.get("id") or f"p{len(_MEMORY_PROJECTS) + 1}"
        if "name" not in project_data and "title" in project_data:
            project_data["name"] = project_data["title"]
        if "title" not in project_data and "name" in project_data:
            project_data["title"] = project_data["name"]
        now_str = datetime.now(timezone.utc).isoformat()
        project_data["created_at"] = project_data.get("created_at") or now_str
        project_data["updated_at"] = now_str

        owner = project_data.get("owner_id", "u1")
        if not project_data.get("members"):
            project_data["members"] = [
                {"user_id": owner, "role": "Owner", "name": f"User {owner}"}
            ]

        sb = get_supabase_client()
        if sb:
            try:
                # Valid columns for public.projects table
                valid_columns = {
                    "id", "title", "name", "description", "status", "progress",
                    "deadline", "owner_id", "skills_required", "tags",
                    "solution_blueprint", "created_at", "updated_at"
                }
                insert_payload = {k: v for k, v in project_data.items() if k in valid_columns}
                res = sb.table("projects").insert(insert_payload).execute()
                if res.data:
                    # Also insert initial owner member into project_members
                    try:
                        sb.table("project_members").insert({
                            "project_id": project_data["id"],
                            "user_id": owner,
                            "role": "Owner"
                        }).execute()
                    except Exception:
                        pass
                    created = res.data[0]
                    created["members"] = project_data["members"]
                    return created
            except Exception as e:
                _check_db_failure("create_project", e)
                logger.warning("Supabase project insert failed: %s; storing in memory store.", e)

        _check_db_failure("create_project")
        _MEMORY_PROJECTS.append(project_data)
        return project_data

    # -------------------------------------------------------------------------
    # TASKS
    # -------------------------------------------------------------------------
    @staticmethod
    def get_tasks(project_id: Optional[str] = None) -> List[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                query = sb.table("tasks").select("*")
                if project_id:
                    query = query.eq("project_id", project_id)
                res = query.execute()
                if res.data is not None:
                    return res.data
            except Exception as e:
                _check_db_failure("get_tasks", e)
                logger.warning("Supabase read failed: %s; falling back to memory store.", e)

        _check_db_failure("get_tasks")
        if project_id:
            return [t for t in _MEMORY_TASKS if t.get("project_id") == project_id]
        return _MEMORY_TASKS

    @staticmethod
    def get_task_by_id(task_id: str) -> Optional[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("tasks").select("*").eq("id", task_id).execute()
                if res.data:
                    return res.data[0]
                return None
            except Exception as e:
                _check_db_failure("get_task_by_id", e)
                logger.warning("Supabase read failed: %s; falling back to memory store.", e)

        _check_db_failure("get_task_by_id")
        for t in _MEMORY_TASKS:
            if t["id"] == task_id:
                return t
        return None

    @staticmethod
    def create_task(task_data: Dict[str, Any]) -> Dict[str, Any]:
        task_data["id"] = task_data.get("id") or f"t{len(_MEMORY_TASKS) + 1}"
        task_data["status"] = task_data.get("status") or "todo"
        task_data["priority"] = task_data.get("priority") or "medium"
        task_data["tags"] = task_data.get("tags") or []
        now_str = datetime.now(timezone.utc).isoformat()
        task_data["created_at"] = task_data.get("created_at") or now_str
        task_data["updated_at"] = now_str

        sb = get_supabase_client()
        if sb:
            try:
                valid_columns = {
                    "id", "project_id", "title", "description", "assignee_id",
                    "status", "priority", "due_date", "module", "tags",
                    "created_at", "updated_at"
                }
                insert_payload = {k: v for k, v in task_data.items() if k in valid_columns}
                res = sb.table("tasks").insert(insert_payload).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                _check_db_failure("create_task", e)
                logger.warning("Supabase task insert failed: %s; storing in memory store.", e)

        _check_db_failure("create_task")
        _MEMORY_TASKS.append(task_data)
        return task_data

    @staticmethod
    def update_task(task_id: str, partial_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        partial_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        sb = get_supabase_client()
        if sb:
            try:
                valid_columns = {
                    "title", "description", "assignee_id", "status",
                    "priority", "due_date", "module", "tags", "updated_at"
                }
                update_payload = {k: v for k, v in partial_data.items() if k in valid_columns}
                res = sb.table("tasks").update(update_payload).eq("id", task_id).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                _check_db_failure("update_task", e)
                logger.warning("Supabase task update failed: %s; falling back to memory.", e)

        _check_db_failure("update_task")
        for t in _MEMORY_TASKS:
            if t["id"] == task_id:
                t.update(partial_data)
                return t
        return None

    @staticmethod
    def delete_task(task_id: str) -> bool:
        sb = get_supabase_client()
        if sb:
            try:
                sb.table("tasks").delete().eq("id", task_id).execute()
                return True
            except Exception as e:
                _check_db_failure("delete_task", e)
                logger.warning("Supabase task delete failed: %s; falling back to memory.", e)

        _check_db_failure("delete_task")
        global _MEMORY_TASKS
        initial_len = len(_MEMORY_TASKS)
        _MEMORY_TASKS = [t for t in _MEMORY_TASKS if t["id"] != task_id]
        return len(_MEMORY_TASKS) < initial_len

    # -------------------------------------------------------------------------
    # DISCUSSIONS
    # -------------------------------------------------------------------------
    @staticmethod
    def get_discussions(project_id: Optional[str] = None) -> List[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                query = sb.table("discussions").select("*")
                if project_id:
                    query = query.eq("project_id", project_id)
                res = query.execute()
                if res.data is not None:
                    return res.data
            except Exception as e:
                _check_db_failure("get_discussions", e)
                logger.warning("Supabase read failed: %s; falling back to memory store.", e)

        _check_db_failure("get_discussions")
        if project_id:
            return [d for d in _MEMORY_DISCUSSIONS if d.get("project_id") == project_id]
        return _MEMORY_DISCUSSIONS

    @staticmethod
    def get_discussion_by_id(discussion_id: str) -> Optional[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("discussions").select("*").eq("id", discussion_id).execute()
                if res.data:
                    return res.data[0]
                return None
            except Exception as e:
                _check_db_failure("get_discussion_by_id", e)
                logger.warning("Supabase read failed: %s; falling back to memory store.", e)

        _check_db_failure("get_discussion_by_id")
        for d in _MEMORY_DISCUSSIONS:
            if d["id"] == discussion_id:
                return d
        return None

    @staticmethod
    def create_discussion(discussion_data: Dict[str, Any]) -> Dict[str, Any]:
        discussion_data["id"] = discussion_data.get("id") or f"d{len(_MEMORY_DISCUSSIONS) + 1}"
        discussion_data["consensus_pro"] = discussion_data.get("consensus_pro", 0)
        discussion_data["consensus_con"] = discussion_data.get("consensus_con", 0)
        now_str = datetime.now(timezone.utc).isoformat()
        discussion_data["created_at"] = discussion_data.get("created_at") or now_str
        discussion_data["updated_at"] = now_str

        sb = get_supabase_client()
        if sb:
            try:
                valid_columns = {
                    "id", "project_id", "author_id", "title", "content",
                    "type", "status", "resolution", "sentiment",
                    "consensus_pro", "consensus_con", "created_at", "updated_at"
                }
                insert_payload = {k: v for k, v in discussion_data.items() if k in valid_columns}
                res = sb.table("discussions").insert(insert_payload).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                _check_db_failure("create_discussion", e)
                logger.warning("Supabase discussion insert failed: %s; storing in memory store.", e)

        _check_db_failure("create_discussion")
        _MEMORY_DISCUSSIONS.append(discussion_data)
        return discussion_data

    @staticmethod
    def vote_discussion(discussion_id: str, vote: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                disc_res = sb.table("discussions").select("*").eq("id", discussion_id).execute()
                if disc_res.data:
                    disc = disc_res.data[0]
                    pro = disc.get("consensus_pro", 0) + (1 if vote == "pro" else 0)
                    con = disc.get("consensus_con", 0) + (1 if vote == "con" else 0)
                    upd = sb.table("discussions").update({"consensus_pro": pro, "consensus_con": con}).eq("id", discussion_id).execute()
                    if user_id:
                        try:
                            sb.table("discussion_votes").insert({
                                "discussion_id": discussion_id,
                                "user_id": user_id,
                                "vote": vote
                            }).execute()
                        except Exception:
                            pass
                    if upd.data:
                        return upd.data[0]
            except Exception as e:
                _check_db_failure("vote_discussion", e)
                logger.warning("Supabase vote failed: %s; falling back to memory.", e)

        _check_db_failure("vote_discussion")
        for d in _MEMORY_DISCUSSIONS:
            if d["id"] == discussion_id:
                if vote == "pro":
                    d["consensus_pro"] = d.get("consensus_pro", 0) + 1
                else:
                    d["consensus_con"] = d.get("consensus_con", 0) + 1
                return d
        return None

    # -------------------------------------------------------------------------
    # DOCUMENTS
    # -------------------------------------------------------------------------
    @staticmethod
    def get_documents(project_id: Optional[str] = None) -> List[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                query = sb.table("documents").select("*")
                if project_id:
                    query = query.eq("project_id", project_id)
                res = query.execute()
                if res.data is not None:
                    return res.data
            except Exception as e:
                _check_db_failure("get_documents", e)
                logger.warning("Supabase read failed: %s; falling back to memory store.", e)

        _check_db_failure("get_documents")
        if project_id:
            return [doc for doc in _MEMORY_DOCUMENTS if doc.get("project_id") == project_id]
        return _MEMORY_DOCUMENTS

    @staticmethod
    def get_document_by_id(document_id: str) -> Optional[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("documents").select("*").eq("id", document_id).execute()
                if res.data:
                    return res.data[0]
                return None
            except Exception as e:
                _check_db_failure("get_document_by_id", e)
                logger.warning("Supabase read failed: %s; falling back to memory store.", e)

        _check_db_failure("get_document_by_id")
        for d in _MEMORY_DOCUMENTS:
            if d["id"] == document_id:
                return d
        return None

    @staticmethod
    def create_document(document_data: Dict[str, Any]) -> Dict[str, Any]:
        document_data["id"] = document_data.get("id") or f"doc{len(_MEMORY_DOCUMENTS) + 1}"
        now_str = datetime.now(timezone.utc).isoformat()
        document_data["created_at"] = document_data.get("created_at") or now_str
        document_data["updated_at"] = now_str

        sb = get_supabase_client()
        if sb:
            try:
                valid_columns = {
                    "id", "project_id", "author_id", "title", "content_text",
                    "file_type", "file_url", "contributors", "created_at", "updated_at"
                }
                insert_payload = {k: v for k, v in document_data.items() if k in valid_columns}
                res = sb.table("documents").insert(insert_payload).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                _check_db_failure("create_document", e)
                logger.warning("Supabase document insert failed: %s; storing in memory store.", e)

        _check_db_failure("create_document")
        _MEMORY_DOCUMENTS.append(document_data)
        return document_data

    @staticmethod
    def delete_document(document_id: str) -> bool:
        sb = get_supabase_client()
        if sb:
            try:
                sb.table("documents").delete().eq("id", document_id).execute()
                return True
            except Exception as e:
                _check_db_failure("delete_document", e)
                logger.warning("Supabase document delete failed: %s; falling back to memory.", e)

        _check_db_failure("delete_document")
        global _MEMORY_DOCUMENTS
        initial_len = len(_MEMORY_DOCUMENTS)
        _MEMORY_DOCUMENTS = [d for d in _MEMORY_DOCUMENTS if d["id"] != document_id]
        return len(_MEMORY_DOCUMENTS) < initial_len

    # -------------------------------------------------------------------------
    # ACTIVITIES
    # -------------------------------------------------------------------------
    @staticmethod
    def get_activities(project_id: Optional[str] = None) -> List[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                query = sb.table("activities").select("*")
                if project_id:
                    query = query.eq("project_id", project_id)
                res = query.execute()
                if res.data is not None:
                    return res.data
            except Exception as e:
                _check_db_failure("get_activities", e)
                logger.warning("Supabase read failed: %s; falling back to memory store.", e)

        _check_db_failure("get_activities")
        if project_id:
            return [act for act in _MEMORY_ACTIVITIES if act.get("project_id") == project_id]
        return _MEMORY_ACTIVITIES

    @staticmethod
    def get_activity_by_id(activity_id: str) -> Optional[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("activities").select("*").eq("id", activity_id).execute()
                if res.data:
                    return res.data[0]
                return None
            except Exception as e:
                _check_db_failure("get_activity_by_id", e)
                logger.warning("Supabase read failed: %s; falling back to memory store.", e)

        _check_db_failure("get_activity_by_id")
        for a in _MEMORY_ACTIVITIES:
            if a["id"] == activity_id:
                return a
        return None

    @staticmethod
    def create_activity(activity_data: Dict[str, Any]) -> Dict[str, Any]:
        activity_data["id"] = activity_data.get("id") or f"act-{len(_MEMORY_ACTIVITIES) + 1}"
        activity_data["status"] = activity_data.get("status") or "pending"
        activity_data["created_at"] = activity_data.get("created_at") or datetime.now(timezone.utc).isoformat()

        sb = get_supabase_client()
        if sb:
            try:
                valid_columns = {
                    "id", "project_id", "title", "description", "type",
                    "status", "participants", "agenda", "linked_task_id",
                    "notes", "takeaways", "created_at", "completed_at"
                }
                insert_payload = {k: v for k, v in activity_data.items() if k in valid_columns}
                res = sb.table("activities").insert(insert_payload).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                _check_db_failure("create_activity", e)
                logger.warning("Supabase activity insert failed: %s; storing in memory store.", e)

        _check_db_failure("create_activity")
        _MEMORY_ACTIVITIES.append(activity_data)
        return activity_data

    @staticmethod
    def complete_activity(activity_id: str, takeaways: Optional[str] = None, completed_task_ids: List[str] = [], notes: Optional[str] = None) -> Optional[Dict[str, Any]]:
        now_str = datetime.now(timezone.utc).isoformat()
        update_payload = {
            "status": "completed",
            "takeaways": takeaways,
            "completed_at": now_str
        }
        if notes:
            update_payload["notes"] = notes

        all_completed_ids = list(completed_task_ids or [])

        sb = get_supabase_client()
        if sb:
            try:
                act_res = sb.table("activities").select("linked_task_id").eq("id", activity_id).execute()
                if act_res.data and act_res.data[0].get("linked_task_id"):
                    lid = act_res.data[0]["linked_task_id"]
                    if lid not in all_completed_ids:
                        all_completed_ids.append(lid)

                upd = sb.table("activities").update(update_payload).eq("id", activity_id).execute()
                for tid in all_completed_ids:
                    sb.table("tasks").update({"status": "done"}).eq("id", tid).execute()
                if upd.data:
                    return upd.data[0]
            except Exception as e:
                _check_db_failure("complete_activity", e)
                logger.warning("Supabase activity update failed: %s; falling back to memory.", e)

        _check_db_failure("complete_activity")
        for act in _MEMORY_ACTIVITIES:
            if act["id"] == activity_id:
                act["status"] = "completed"
                act["takeaways"] = takeaways
                if notes:
                    act["notes"] = notes
                act["completed_at"] = now_str
                if act.get("linked_task_id") and act["linked_task_id"] not in all_completed_ids:
                    all_completed_ids.append(act["linked_task_id"])
                for tid in all_completed_ids:
                    for t in _MEMORY_TASKS:
                        if t["id"] == tid:
                            t["status"] = "done"
                return act
        return None
