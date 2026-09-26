from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import logging
import uuid
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

_MEMORY_CONTRIBUTIONS: List[Dict[str, Any]] = [
    {"id": "c1", "project_id": "p1", "user_id": "u2", "action_type": "task_completed", "entity_type": "task", "entity_id": "t1", "weight": 3, "metadata": {"title": "Kafka Ingestion Buffer"}, "created_at": "2026-09-24T12:00:00Z"},
    {"id": "c2", "project_id": "p1", "user_id": "u3", "entity_type": "task", "entity_id": "t2", "action_type": "task_completed", "weight": 3, "metadata": {"title": "Transformer Feature Embeddings"}, "created_at": "2026-09-24T14:00:00Z"},
    {"id": "c3", "project_id": "p1", "user_id": "u3", "entity_type": "discussion", "entity_id": "d1", "action_type": "discussion_created", "weight": 2, "metadata": {"title": "Model Inference Latency"}, "created_at": "2026-09-24T10:00:00Z"},
    {"id": "c4", "project_id": "p1", "user_id": "u4", "entity_type": "discussion", "entity_id": "d2", "action_type": "discussion_created", "weight": 2, "metadata": {"title": "Fragmented PCAP Ingestion"}, "created_at": "2026-09-24T11:00:00Z"},
    {"id": "c5", "project_id": "p1", "user_id": "u1", "entity_type": "document", "entity_id": "doc1", "action_type": "document_uploaded", "weight": 2, "metadata": {"title": "Threat Defense System Architecture"}, "created_at": "2026-09-24T09:00:00Z"},
    {"id": "c6", "project_id": "p1", "user_id": "u4", "entity_type": "document", "entity_id": "doc2", "action_type": "document_uploaded", "weight": 2, "metadata": {"title": "PCAP Feature Extraction"}, "created_at": "2026-09-24T15:00:00Z"},
    {"id": "c7", "project_id": "p1", "user_id": "u1", "entity_type": "task", "entity_id": "t6", "action_type": "task_completed", "weight": 3, "metadata": {"title": "FastAPI Orchestration"}, "created_at": "2026-09-25T10:00:00Z"},
    {"id": "c8", "project_id": "p1", "user_id": "u3", "entity_type": "task", "entity_id": "t3", "action_type": "task_created", "weight": 1, "metadata": {"title": "Quantize ONNX Model"}, "created_at": "2026-09-25T11:00:00Z"},
    {"id": "c9", "project_id": "p1", "user_id": "u4", "entity_type": "task", "entity_id": "t4", "action_type": "task_created", "weight": 1, "metadata": {"title": "Snort Threat Pattern Rules"}, "created_at": "2026-09-25T12:00:00Z"},
    {"id": "c10", "project_id": "p1", "user_id": "u5", "entity_type": "task", "entity_id": "t5", "action_type": "task_created", "weight": 1, "metadata": {"title": "Interactive Anomaly Radar"}, "created_at": "2026-09-25T13:00:00Z"}
]

_MEMORY_KNOWLEDGE_NODES: List[Dict[str, Any]] = []
_MEMORY_KNOWLEDGE_EDGES: List[Dict[str, Any]] = []
_MEMORY_INSIGHTS: List[Dict[str, Any]] = []
_MEMORY_INSIGHT_EVIDENCE: List[Dict[str, Any]] = []
_MEMORY_RECOMMENDATIONS: List[Dict[str, Any]] = []
_MEMORY_REC_PARTICIPANTS: List[Dict[str, Any]] = []
_MEMORY_REC_SOURCES: List[Dict[str, Any]] = []
_MEMORY_BLUEPRINTS: Dict[str, Dict[str, Any]] = {}
_MEMORY_BLUEPRINT_MODULES: List[Dict[str, Any]] = []
_MEMORY_BLUEPRINT_SOURCES: List[Dict[str, Any]] = []
_MEMORY_SNAPSHOTS: List[Dict[str, Any]] = []
_MEMORY_DISCUSSION_MESSAGES: List[Dict[str, Any]] = [
    {
        "id": "dm1",
        "discussion_id": "d1",
        "author_id": "u3",
        "content": "Can we test INT8 quantization on the PyTorch model without losing detection sensitivity?",
        "reply_to_id": None,
        "created_at": "2026-09-24T10:15:00Z"
    },
    {
        "id": "dm2",
        "discussion_id": "d1",
        "author_id": "u1",
        "content": "I recommend benchmarking on our validation PCAP suite first before altering the pipeline.",
        "reply_to_id": "dm1",
        "created_at": "2026-09-24T10:30:00Z"
    },
    {
        "id": "dm3",
        "discussion_id": "d2",
        "author_id": "u4",
        "content": "Are the packet drops caused by queue starvation or thread lock contention?",
        "reply_to_id": None,
        "created_at": "2026-09-24T11:15:00Z"
    }
]
_MEMORY_DISCUSSION_VIEWPOINTS: List[Dict[str, Any]] = [
    {
        "id": "dv1",
        "discussion_id": "d1",
        "author_id": "u3",
        "position": "support",
        "argument": "INT8 quantization guarantees under 25ms SLA with minimal F1 score degradation.",
        "evidence": ["ONNX benchmark draft"],
        "created_at": "2026-09-24T10:20:00Z"
    },
    {
        "id": "dv2",
        "discussion_id": "d1",
        "author_id": "u4",
        "position": "alternative",
        "argument": "Consider two-tier classification: fast rule heuristic then ML model for ambiguous alerts.",
        "evidence": ["Snort benchmark report"],
        "created_at": "2026-09-24T10:45:00Z"
    }
]
_MEMORY_DISCUSSION_DECISIONS: List[Dict[str, Any]] = [
    {
        "id": "dd1",
        "discussion_id": "d1",
        "decision": "Adopt hybrid pipeline: XGBoost fast pre-filter + INT8 ONNX transformer for ambiguous sessions.",
        "rationale": "Meets 25ms SLA constraint while preserving 98%+ precision.",
        "created_by": "u1",
        "created_at": "2026-09-24T16:00:00Z"
    }
]
_MEMORY_ACTIVITY_OUTCOMES: List[Dict[str, Any]] = []


def _capture_activity_metrics(project_id: str) -> Dict[str, Any]:
    from backend.services.impact_engine import ImpactEngine
    return ImpactEngine.capture_project_metrics(project_id)


def _activity_participant_ids(project_id: str, participants: List[str]) -> List[str]:
    members = Repository.get_project_members(project_id)
    member_ids = {str(member.get("user_id") or member.get("id")) for member in members}
    names_to_ids = {
        str(member.get("name", "")).casefold(): str(member.get("user_id") or member.get("id"))
        for member in members
    }
    resolved = []
    for participant in participants:
        participant_id = str(participant)
        if participant_id not in member_ids:
            participant_id = names_to_ids.get(participant_id.casefold(), "")
        if participant_id and participant_id not in resolved:
            resolved.append(participant_id)
    return resolved


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

    @classmethod
    def get_project(cls, project_id: str) -> Optional[Dict[str, Any]]:
        return cls.get_project_by_id(project_id)

    @classmethod
    def get_team(cls, project_id: str) -> List[Dict[str, Any]]:
        return cls.get_project_members(project_id)

    @classmethod
    def get_activity(cls, project_id: str, activity_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        target_id = activity_id if activity_id else project_id
        return cls.get_activity_by_id(target_id)

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
        return []

    @staticmethod
    def create_project(project_data: Dict[str, Any]) -> Dict[str, Any]:
        project_data["id"] = project_data.get("id") or str(uuid.uuid4())
        if "name" not in project_data and "title" in project_data:
            project_data["name"] = project_data["title"]
        if "title" not in project_data and "name" in project_data:
            project_data["title"] = project_data["name"]
        now_str = datetime.now(timezone.utc).isoformat()
        project_data["created_at"] = project_data.get("created_at") or now_str
        project_data["updated_at"] = now_str

        owner = project_data.get("owner_id")
        if owner and not project_data.get("members"):
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
                    sb.table("project_members").insert({
                        "project_id": project_data["id"],
                        "user_id": owner,
                        "role": "Owner"
                    }).execute()
                    created = res.data[0]
                    created["members"] = project_data["members"]
                    return created
            except Exception as e:
                _check_db_failure("create_project", e)
                logger.warning("Supabase project insert failed: %s; storing in memory store.", e)

        _check_db_failure("create_project")
        _MEMORY_PROJECTS.append(project_data)
        return project_data

    @staticmethod
    def update_project(project_id: str, partial_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        update_payload = {
            key: value
            for key, value in partial_data.items()
            if key in {"title", "name", "description", "status", "progress", "deadline", "skills_required", "tags"}
        }
        if "title" in update_payload and "name" not in update_payload:
            update_payload["name"] = update_payload["title"]
        if "name" in update_payload and "title" not in update_payload:
            update_payload["title"] = update_payload["name"]
        update_payload["updated_at"] = datetime.now(timezone.utc).isoformat()

        sb = get_supabase_client()
        if sb:
            try:
                result = sb.table("projects").update(update_payload).eq("id", project_id).execute()
                if result.data:
                    return Repository.get_project_by_id(project_id)
                return None
            except Exception as e:
                _check_db_failure("update_project", e)
                logger.warning("Supabase project update failed: %s; falling back to memory.", e)

        _check_db_failure("update_project")
        for project in _MEMORY_PROJECTS:
            if project.get("id") == project_id:
                project.update(update_payload)
                return project
        return None

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
        task_data["id"] = task_data.get("id") or str(uuid.uuid4())
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
                    created = res.data[0]
                    if created.get("assignee_id"):
                        Repository.record_contribution(
                            project_id=created["project_id"],
                            user_id=created["assignee_id"],
                            action_type="task_created",
                            entity_type="task",
                            entity_id=created["id"],
                            weight=1,
                            metadata={"title": created.get("title")}
                        )
                    return created
            except Exception as e:
                _check_db_failure("create_task", e)
                logger.warning("Supabase task insert failed: %s; storing in memory store.", e)

        _check_db_failure("create_task")
        _MEMORY_TASKS.append(task_data)
        if task_data.get("assignee_id"):
            Repository.record_contribution(
                project_id=task_data["project_id"],
                user_id=task_data["assignee_id"],
                action_type="task_created",
                entity_type="task",
                entity_id=task_data["id"],
                weight=1,
                metadata={"title": task_data.get("title")}
            )
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
                prior_res = sb.table("tasks").select("status").eq("id", task_id).execute()
                if not prior_res.data:
                    return None
                prior_status = prior_res.data[0].get("status")
                res = sb.table("tasks").update(update_payload).eq("id", task_id).execute()
                if res.data:
                    upd_t = res.data[0]
                    if partial_data.get("status") in ("done", "completed") and prior_status not in ("done", "completed") and upd_t.get("assignee_id"):
                        Repository.record_contribution(
                            project_id=upd_t["project_id"],
                            user_id=upd_t["assignee_id"],
                            action_type="task_completed",
                            entity_type="task",
                            entity_id=task_id,
                            weight=3,
                            metadata={"title": upd_t.get("title")}
                        )
                    return upd_t
            except Exception as e:
                _check_db_failure("update_task", e)
                logger.warning("Supabase task update failed: %s; falling back to memory.", e)

        _check_db_failure("update_task")
        for t in _MEMORY_TASKS:
            if t["id"] == task_id:
                old_status = t.get("status")
                t.update(partial_data)
                if partial_data.get("status") in ("done", "completed") and old_status not in ("done", "completed") and t.get("assignee_id"):
                    Repository.record_contribution(
                        project_id=t["project_id"],
                        user_id=t["assignee_id"],
                        action_type="task_completed",
                        entity_type="task",
                        entity_id=task_id,
                        weight=3,
                        metadata={"title": t.get("title")}
                    )
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
        discussion_data["id"] = discussion_data.get("id") or str(uuid.uuid4())
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
                    created_d = res.data[0]
                    if created_d.get("author_id"):
                        Repository.record_contribution(
                            project_id=created_d["project_id"],
                            user_id=created_d["author_id"],
                            action_type="discussion_created",
                            entity_type="discussion",
                            entity_id=created_d["id"],
                            weight=2,
                            metadata={"title": created_d.get("title")}
                        )
                    return created_d
            except Exception as e:
                _check_db_failure("create_discussion", e)
                logger.warning("Supabase discussion insert failed: %s; storing in memory store.", e)

        _check_db_failure("create_discussion")
        _MEMORY_DISCUSSIONS.append(discussion_data)
        if discussion_data.get("author_id"):
            Repository.record_contribution(
            project_id=discussion_data["project_id"],
            user_id=discussion_data["author_id"],
                action_type="discussion_created",
                entity_type="discussion",
                entity_id=discussion_data["id"],
                weight=2,
                metadata={"title": discussion_data.get("title")}
            )
        return discussion_data

    @staticmethod
    def vote_discussion(discussion_id: str, vote: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        if not user_id:
            raise HTTPException(status_code=400, detail="A user_id is required to record a vote")
        sb = get_supabase_client()
        if sb:
            try:
                disc_res = sb.table("discussions").select("*").eq("id", discussion_id).execute()
                if disc_res.data:
                    disc = disc_res.data[0]
                    sb.table("discussion_votes").upsert({
                        "discussion_id": discussion_id,
                        "user_id": user_id,
                        "vote": vote,
                    }, on_conflict="discussion_id,user_id").execute()
                    votes_res = sb.table("discussion_votes").select("vote").eq("discussion_id", discussion_id).execute()
                    votes = votes_res.data or []
                    pro = sum(item.get("vote") == "pro" for item in votes)
                    con = sum(item.get("vote") == "con" for item in votes)
                    upd = sb.table("discussions").update({"consensus_pro": pro, "consensus_con": con}).eq("id", discussion_id).execute()
                    if upd.data:
                        voted = upd.data[0]
                        Repository.record_contribution(
                            project_id=voted["project_id"],
                            user_id=user_id,
                            action_type="discussion_vote",
                            entity_type="discussion",
                            entity_id=discussion_id,
                            weight=1,
                            metadata={"vote": vote}
                        )
                        return voted
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
                if user_id:
                    try:
                        Repository.record_contribution(
                            project_id=d.get("project_id", "p1"),
                            user_id=user_id,
                            action_type="discussion_vote",
                            entity_type="discussion",
                            entity_id=discussion_id,
                            weight=1,
                            metadata={"vote": vote}
                        )
                    except Exception:
                        pass
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
        document_data["id"] = document_data.get("id") or str(uuid.uuid4())
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
                    created_doc = res.data[0]
                    if created_doc.get("author_id"):
                        Repository.record_contribution(
                            project_id=created_doc["project_id"],
                            user_id=created_doc["author_id"],
                            action_type="document_uploaded",
                            entity_type="document",
                            entity_id=created_doc["id"],
                            weight=2,
                            metadata={"title": created_doc.get("title")}
                        )
                    return created_doc
            except Exception as e:
                _check_db_failure("create_document", e)
                logger.warning("Supabase document insert failed: %s; storing in memory store.", e)

        _check_db_failure("create_document")
        _MEMORY_DOCUMENTS.append(document_data)
        if document_data.get("author_id"):
            Repository.record_contribution(
            project_id=document_data["project_id"],
            user_id=document_data["author_id"],
                action_type="document_uploaded",
                entity_type="document",
                entity_id=document_data["id"],
                weight=2,
                metadata={"title": document_data.get("title")}
            )
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
        activity_data["id"] = activity_data.get("id") or str(uuid.uuid4())
        activity_data["status"] = activity_data.get("status") or "pending"
        activity_data["created_at"] = activity_data.get("created_at") or datetime.now(timezone.utc).isoformat()
        before_snapshot = _capture_activity_metrics(activity_data["project_id"])

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
                    created_activity = res.data[0]
                    Repository.save_activity_outcome(
                        created_activity["id"], {"before_snapshot": before_snapshot}
                    )
                    return created_activity
            except Exception as e:
                _check_db_failure("create_activity", e)
                logger.warning("Supabase activity insert failed: %s; storing in memory store.", e)

        _check_db_failure("create_activity")
        _MEMORY_ACTIVITIES.append(activity_data)
        Repository.save_activity_outcome(activity_data["id"], {"before_snapshot": before_snapshot})
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
                act_res = sb.table("activities").select("*").eq("id", activity_id).execute()
                if not act_res.data:
                    return None
                act_rec = act_res.data[0]
                prior_outcome = Repository.get_activity_outcome(activity_id)
                if act_rec.get("linked_task_id"):
                    lid = act_rec["linked_task_id"]
                    if lid not in all_completed_ids:
                        all_completed_ids.append(lid)

                upd = sb.table("activities").update(update_payload).eq("id", activity_id).execute()
                for tid in all_completed_ids:
                    sb.table("tasks").update({"status": "done"}).eq("id", tid).execute()
                if upd.data:
                    completed_act = upd.data[0]
                    participant_ids = _activity_participant_ids(
                        completed_act["project_id"], completed_act.get("participants", [])
                    )
                    for participant_id in participant_ids:
                        Repository.record_contribution(
                            project_id=completed_act["project_id"],
                            user_id=participant_id,
                            action_type="activity_completed",
                            entity_type="activity",
                            entity_id=activity_id,
                            weight=3,
                            metadata={"title": completed_act.get("title")}
                        )
                    after_snapshot = _capture_activity_metrics(completed_act["project_id"])
                    outcome_data = {"after_snapshot": after_snapshot}
                    if prior_outcome and prior_outcome.get("before_snapshot"):
                        outcome_data["before_snapshot"] = prior_outcome["before_snapshot"]
                    Repository.save_activity_outcome(activity_id, outcome_data)
                    return completed_act
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
                participant_ids = _activity_participant_ids(
                    act["project_id"], act.get("participants", [])
                )
                for participant_id in participant_ids:
                    Repository.record_contribution(
                        project_id=act["project_id"],
                        user_id=participant_id,
                        action_type="activity_completed",
                        entity_type="activity",
                        entity_id=activity_id,
                        weight=3,
                        metadata={"title": act.get("title")}
                    )
                after_snapshot = _capture_activity_metrics(act["project_id"])
                prior_outcome = Repository.get_activity_outcome(activity_id) or {}
                Repository.save_activity_outcome(
                    activity_id,
                    {
                        "before_snapshot": prior_outcome.get("before_snapshot"),
                        "after_snapshot": after_snapshot,
                    },
                )
                return act
        return None

    # -------------------------------------------------------------------------
    # CONTRIBUTIONS (Phase 3 Event Model)
    # -------------------------------------------------------------------------
    @staticmethod
    def record_contribution(
        project_id: str,
        user_id: str,
        action_type: str,
        entity_type: str,
        entity_id: str,
        weight: int = 1,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        cid = str(uuid.uuid4())
        now_str = datetime.now(timezone.utc).isoformat()
        item = {
            "id": cid,
            "project_id": project_id,
            "user_id": user_id,
            "action_type": action_type,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "weight": weight,
            "metadata": metadata or {},
            "created_at": now_str
        }
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("contributions").insert(item).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                _check_db_failure("record_contribution", e)
                logger.warning("Supabase contribution insert failed: %s; storing in memory.", e)

        _check_db_failure("record_contribution")
        _MEMORY_CONTRIBUTIONS.append(item)
        return item

    @staticmethod
    def get_contributions(project_id: str, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                q = sb.table("contributions").select("*").eq("project_id", project_id).order("created_at", desc=True)
                if user_id:
                    q = q.eq("user_id", user_id)
                res = q.execute()
                if res.data is not None:
                    return res.data
            except Exception as e:
                _check_db_failure("get_contributions", e)
                logger.warning("Supabase get_contributions failed: %s; falling back to memory.", e)

        _check_db_failure("get_contributions")
        res = [c for c in _MEMORY_CONTRIBUTIONS if c.get("project_id") == project_id]
        if user_id:
            res = [c for c in res if c.get("user_id") == user_id]
        return sorted(res, key=lambda x: x.get("created_at", ""), reverse=True)

    # -------------------------------------------------------------------------
    # KNOWLEDGE GRAPH (Nodes & Edges)
    # -------------------------------------------------------------------------
    @staticmethod
    def get_knowledge_nodes(project_id: str) -> List[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("knowledge_nodes").select("*").eq("project_id", project_id).execute()
                if res.data is not None:
                    return res.data
            except Exception as e:
                _check_db_failure("get_knowledge_nodes", e)
                logger.warning("Supabase get_knowledge_nodes failed: %s; falling back to memory.", e)

        _check_db_failure("get_knowledge_nodes")
        return [n for n in _MEMORY_KNOWLEDGE_NODES if n.get("project_id") == project_id]

    @staticmethod
    def save_knowledge_nodes(project_id: str, nodes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        global _MEMORY_KNOWLEDGE_NODES
        sb = get_supabase_client()
        if sb:
            try:
                saved = []
                for n in nodes:
                    n["project_id"] = project_id
                    res = sb.table("knowledge_nodes").upsert(n, on_conflict="project_id,node_type,label").execute()
                    if res.data:
                        saved.extend(res.data)
                return saved
            except Exception as e:
                _check_db_failure("save_knowledge_nodes", e)
                logger.warning("Supabase save_knowledge_nodes failed: %s; falling back to memory.", e)

        _check_db_failure("save_knowledge_nodes")
        existing = {f"{n.get('project_id')}:{n.get('node_type')}:{n.get('label')}": n for n in _MEMORY_KNOWLEDGE_NODES}
        for n in nodes:
            n["project_id"] = project_id
            if "id" not in n:
                n["id"] = f"kn_{len(_MEMORY_KNOWLEDGE_NODES) + 1}"
            key = f"{project_id}:{n.get('node_type')}:{n.get('label')}"
            existing[key] = n
        _MEMORY_KNOWLEDGE_NODES = list(existing.values())
        return [n for n in _MEMORY_KNOWLEDGE_NODES if n.get("project_id") == project_id]

    @staticmethod
    def get_knowledge_edges(project_id: str) -> List[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("knowledge_edges").select("*").eq("project_id", project_id).execute()
                if res.data is not None:
                    return res.data
            except Exception as e:
                _check_db_failure("get_knowledge_edges", e)
                logger.warning("Supabase get_knowledge_edges failed: %s; falling back to memory.", e)

        _check_db_failure("get_knowledge_edges")
        return [e for e in _MEMORY_KNOWLEDGE_EDGES if e.get("project_id") == project_id]

    @staticmethod
    def save_knowledge_edges(project_id: str, edges: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        global _MEMORY_KNOWLEDGE_EDGES
        sb = get_supabase_client()
        if sb:
            try:
                saved = []
                for ed in edges:
                    ed["project_id"] = project_id
                    res = sb.table("knowledge_edges").upsert(ed, on_conflict="source_node_id,target_node_id,edge_type").execute()
                    if res.data:
                        saved.extend(res.data)
                return saved
            except Exception as e:
                _check_db_failure("save_knowledge_edges", e)
                logger.warning("Supabase save_knowledge_edges failed: %s; falling back to memory.", e)

        _check_db_failure("save_knowledge_edges")
        existing = {f"{e.get('source_node_id')}:{e.get('target_node_id')}:{e.get('edge_type')}": e for e in _MEMORY_KNOWLEDGE_EDGES}
        for ed in edges:
            ed["project_id"] = project_id
            if "id" not in ed:
                ed["id"] = f"ke_{len(_MEMORY_KNOWLEDGE_EDGES) + 1}"
            key = f"{ed.get('source_node_id')}:{ed.get('target_node_id')}:{ed.get('edge_type')}"
            existing[key] = ed
        _MEMORY_KNOWLEDGE_EDGES = list(existing.values())
        return [e for e in _MEMORY_KNOWLEDGE_EDGES if e.get("project_id") == project_id]

    # -------------------------------------------------------------------------
    # DISCUSSION MESSAGES, VIEWPOINTS & DECISIONS
    # -------------------------------------------------------------------------
    @staticmethod
    def get_discussion_messages(discussion_id: str) -> List[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("discussion_messages").select("*").eq("discussion_id", discussion_id).order("created_at").execute()
                if res.data is not None:
                    return res.data
            except Exception as e:
                _check_db_failure("get_discussion_messages", e)
                logger.warning("Supabase get_discussion_messages failed: %s; falling back to memory.", e)

        _check_db_failure("get_discussion_messages")
        return [m for m in _MEMORY_DISCUSSION_MESSAGES if m.get("discussion_id") == discussion_id]

    @staticmethod
    def create_discussion_message(discussion_id: str, author_id: str, content: str, reply_to_id: Optional[str] = None) -> Dict[str, Any]:
        mid = f"dm_{len(_MEMORY_DISCUSSION_MESSAGES) + 1}"
        now_str = datetime.now(timezone.utc).isoformat()
        item = {
            "id": mid,
            "discussion_id": discussion_id,
            "author_id": author_id,
            "content": content,
            "reply_to_id": reply_to_id,
            "created_at": now_str,
            "updated_at": now_str
        }
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("discussion_messages").insert(item).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                _check_db_failure("create_discussion_message", e)
                logger.warning("Supabase create_discussion_message failed: %s; storing in memory.", e)

        _check_db_failure("create_discussion_message")
        _MEMORY_DISCUSSION_MESSAGES.append(item)
        return item

    @staticmethod
    def get_discussion_viewpoints(discussion_id: str) -> List[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("discussion_viewpoints").select("*").eq("discussion_id", discussion_id).execute()
                if res.data is not None:
                    return res.data
            except Exception as e:
                _check_db_failure("get_discussion_viewpoints", e)
                logger.warning("Supabase get_discussion_viewpoints failed: %s; falling back to memory.", e)

        _check_db_failure("get_discussion_viewpoints")
        return [v for v in _MEMORY_DISCUSSION_VIEWPOINTS if v.get("discussion_id") == discussion_id]

    @staticmethod
    def create_discussion_viewpoint(discussion_id: str, author_id: str, position: str, argument: str, evidence: Optional[List[str]] = None) -> Dict[str, Any]:
        vid = f"dv_{len(_MEMORY_DISCUSSION_VIEWPOINTS) + 1}"
        now_str = datetime.now(timezone.utc).isoformat()
        item = {
            "id": vid,
            "discussion_id": discussion_id,
            "author_id": author_id,
            "position": position,
            "argument": argument,
            "evidence": evidence or [],
            "created_at": now_str
        }
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("discussion_viewpoints").insert(item).execute()
                if res.data:
                    created_vp = res.data[0]
                    disc = Repository.get_discussion_by_id(discussion_id)
                    if disc and disc.get("project_id"):
                        Repository.record_contribution(
                            project_id=disc["project_id"],
                            user_id=author_id,
                            action_type="discussion_viewpoint",
                            entity_type="discussion",
                            entity_id=created_vp.get("id", vid),
                            weight=2,
                            metadata={"position": position, "discussion_id": discussion_id}
                        )
                    return created_vp
            except Exception as e:
                _check_db_failure("create_discussion_viewpoint", e)
                logger.warning("Supabase create_discussion_viewpoint failed: %s; storing in memory.", e)

        _check_db_failure("create_discussion_viewpoint")
        _MEMORY_DISCUSSION_VIEWPOINTS.append(item)
        disc = Repository.get_discussion_by_id(discussion_id)
        if disc and disc.get("project_id"):
            Repository.record_contribution(
                project_id=disc["project_id"],
                user_id=author_id,
                action_type="discussion_viewpoint",
                entity_type="discussion",
                entity_id=item["id"],
                weight=2,
                metadata={"position": position, "discussion_id": discussion_id}
            )
        return item

    @staticmethod
    def get_discussion_decisions(discussion_id: str) -> List[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("discussion_decisions").select("*").eq("discussion_id", discussion_id).execute()
                if res.data is not None:
                    return res.data
            except Exception as e:
                _check_db_failure("get_discussion_decisions", e)
                logger.warning("Supabase get_discussion_decisions failed: %s; falling back to memory.", e)

        _check_db_failure("get_discussion_decisions")
        return [d for d in _MEMORY_DISCUSSION_DECISIONS if d.get("discussion_id") == discussion_id]

    @staticmethod
    def create_discussion_decision(discussion_id: str, decision: str, rationale: Optional[str] = None, created_by: Optional[str] = None) -> Dict[str, Any]:
        did = f"dd_{len(_MEMORY_DISCUSSION_DECISIONS) + 1}"
        now_str = datetime.now(timezone.utc).isoformat()
        item = {
            "id": did,
            "discussion_id": discussion_id,
            "decision": decision,
            "rationale": rationale,
            "created_by": created_by,
            "created_at": now_str
        }
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("discussion_decisions").insert(item).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                _check_db_failure("create_discussion_decision", e)
                logger.warning("Supabase create_discussion_decision failed: %s; storing in memory.", e)

        _check_db_failure("create_discussion_decision")
        _MEMORY_DISCUSSION_DECISIONS.append(item)
        return item

    # -------------------------------------------------------------------------
    # INSIGHTS & EVIDENCE (Persistent Collective Insights)
    # -------------------------------------------------------------------------
    @staticmethod
    def get_insights(project_id: str) -> List[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("insights").select("*").eq("project_id", project_id).execute()
                if res.data is not None:
                    insights = res.data
                    for ins in insights:
                        ev_res = sb.table("insight_evidence").select("*").eq("insight_id", ins["id"]).execute()
                        ins["evidence"] = ev_res.data or []
                    return insights
            except Exception as e:
                _check_db_failure("get_insights", e)
                logger.warning("Supabase get_insights failed: %s; falling back to memory.", e)

        _check_db_failure("get_insights")
        ins_list = [i for i in _MEMORY_INSIGHTS if i.get("project_id") == project_id]
        for ins in ins_list:
            ins["evidence"] = [e for e in _MEMORY_INSIGHT_EVIDENCE if e.get("insight_id") == ins["id"]]
        return ins_list

    @staticmethod
    def save_insights(project_id: str, insights: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        global _MEMORY_INSIGHTS, _MEMORY_INSIGHT_EVIDENCE
        sb = get_supabase_client()
        if sb:
            try:
                saved = []
                for ins in insights:
                    evidence_list = ins.pop("evidence", [])
                    ins["project_id"] = project_id
                    now_str = datetime.now(timezone.utc).isoformat()
                    ins["updated_at"] = now_str
                    ins_res = sb.table("insights").upsert(ins).execute()
                    if ins_res.data:
                        saved_ins = ins_res.data[0]
                        ins_id = saved_ins["id"]
                        if evidence_list:
                            for ev in evidence_list:
                                ev["insight_id"] = ins_id
                                sb.table("insight_evidence").upsert(ev).execute()
                        saved_ins["evidence"] = evidence_list
                        saved.append(saved_ins)
                return saved
            except Exception as e:
                _check_db_failure("save_insights", e)
                logger.warning("Supabase save_insights failed: %s; falling back to memory.", e)

        _check_db_failure("save_insights")
        # Filter out existing for project
        _MEMORY_INSIGHTS = [i for i in _MEMORY_INSIGHTS if i.get("project_id") != project_id]
        saved_list = []
        for ins in insights:
            ins["project_id"] = project_id
            if "id" not in ins:
                ins["id"] = f"ins_{len(_MEMORY_INSIGHTS) + 1}"
            ev_list = ins.get("evidence", [])
            _MEMORY_INSIGHTS.append(ins)
            for ev in ev_list:
                ev["insight_id"] = ins["id"]
                _MEMORY_INSIGHT_EVIDENCE.append(ev)
            saved_list.append(ins)
        return saved_list

    # -------------------------------------------------------------------------
    # RECOMMENDATIONS (Participants & Sources)
    # -------------------------------------------------------------------------
    @staticmethod
    def get_recommendations(project_id: str) -> List[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("recommendations").select("*").eq("project_id", project_id).execute()
                if res.data is not None:
                    recs = res.data
                    for r in recs:
                        p_res = sb.table("recommendation_participants").select("user_id, role, profiles(name)").eq("recommendation_id", r["id"]).execute()
                        r["participants"] = [
                            {"user_id": item["user_id"], "role": item.get("role"), "name": (item.get("profiles") or {}).get("name")}
                            for item in (p_res.data or [])
                        ]
                        s_res = sb.table("recommendation_sources").select("*").eq("recommendation_id", r["id"]).execute()
                        r["sources"] = s_res.data or []
                    return recs
            except Exception as e:
                _check_db_failure("get_recommendations", e)
                logger.warning("Supabase get_recommendations failed: %s; falling back to memory.", e)

        _check_db_failure("get_recommendations")
        return [r for r in _MEMORY_RECOMMENDATIONS if r.get("project_id") == project_id]

    @staticmethod
    def save_recommendations(project_id: str, recs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        global _MEMORY_RECOMMENDATIONS
        sb = get_supabase_client()
        if sb:
            try:
                saved = []
                for r in recs:
                    r["project_id"] = project_id
                    participants = r.pop("participants", [])
                    sources = r.pop("sources", [])
                    res = sb.table("recommendations").upsert(r).execute()
                    if res.data:
                        saved_rec = res.data[0]
                        rec_id = saved_rec["id"]
                        for p in participants:
                            p_user_id = p.get("user_id") if isinstance(p, dict) else str(p)
                            sb.table("recommendation_participants").upsert({
                                "recommendation_id": rec_id,
                                "user_id": p_user_id,
                                "role": p.get("role", "Collaborator") if isinstance(p, dict) else "Collaborator"
                            }).execute()
                        for s in sources:
                            s["recommendation_id"] = rec_id
                            sb.table("recommendation_sources").upsert(s).execute()
                        saved_rec["participants"] = participants
                        saved_rec["sources"] = sources
                        saved.append(saved_rec)
                return saved
            except Exception as e:
                _check_db_failure("save_recommendations", e)
                logger.warning("Supabase save_recommendations failed: %s; falling back to memory.", e)

        _check_db_failure("save_recommendations")
        _MEMORY_RECOMMENDATIONS = [r for r in _MEMORY_RECOMMENDATIONS if r.get("project_id") != project_id]
        for r in recs:
            r["project_id"] = project_id
            if "id" not in r:
                r["id"] = f"rec_{len(_MEMORY_RECOMMENDATIONS) + 1}"
            _MEMORY_RECOMMENDATIONS.append(r)
        return [r for r in _MEMORY_RECOMMENDATIONS if r.get("project_id") == project_id]

    # -------------------------------------------------------------------------
    # BLUEPRINT PERSISTENCE & VERSIONING
    # -------------------------------------------------------------------------
    @staticmethod
    def get_blueprint(project_id: str) -> Optional[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("blueprints").select("*").eq("project_id", project_id).order("version", desc=True).limit(1).execute()
                if res.data:
                    bp = res.data[0]
                    mod_res = sb.table("blueprint_modules").select("*, profiles(name)").eq("blueprint_id", bp["id"]).execute()
                    modules = []
                    for module in mod_res.data or []:
                        profile = module.get("profiles") or {}
                        modules.append({
                            **module,
                            "name": module.get("title", ""),
                            "owner": profile.get("name") or module.get("owner_id") or "Unassigned",
                            "summary": module.get("description", ""),
                            "deliverables": module.get("deliverables") or [],
                        })
                    bp["modules"] = modules
                    src_res = sb.table("blueprint_sources").select("*").eq("blueprint_id", bp["id"]).execute()
                    bp["sources"] = src_res.data or []
                    return bp
            except Exception as e:
                _check_db_failure("get_blueprint", e)
                logger.warning("Supabase get_blueprint failed: %s; falling back to memory.", e)

        _check_db_failure("get_blueprint")
        return _MEMORY_BLUEPRINTS.get(project_id)

    @staticmethod
    def save_blueprint(project_id: str, blueprint_data: Dict[str, Any]) -> Dict[str, Any]:
        sb = get_supabase_client()
        now_str = datetime.now(timezone.utc).isoformat()
        blueprint_data["project_id"] = project_id
        blueprint_data["updated_at"] = now_str
        if "id" not in blueprint_data:
            blueprint_data["id"] = f"bp_{project_id}_{int(datetime.now(timezone.utc).timestamp())}"

        modules = blueprint_data.get("modules", [])
        sources = blueprint_data.get("sources", [])

        if sb:
            try:
                valid_bp_cols = {
                    "id", "project_id", "title", "summary", "problem_statement",
                    "agreed_consensus", "unresolved_risks", "action_plan",
                    "expected_measurable_changes", "status", "version",
                    "generated_by", "created_at", "updated_at"
                }
                insert_payload = {k: v for k, v in blueprint_data.items() if k in valid_bp_cols}
                res = sb.table("blueprints").upsert(insert_payload).execute()
                if res.data:
                    saved_bp = res.data[0]
                    bpid = saved_bp["id"]
                    for m in modules:
                        m_payload = {
                            "blueprint_id": bpid,
                            "title": m.get("name", ""),
                            "description": m.get("summary", ""),
                            "owner_id": m.get("owner_id"),
                            "status": m.get("status", "planned"),
                            "deliverables": m.get("deliverables") or [],
                            "source_type": m.get("source_type"),
                            "source_id": m.get("source_id"),
                        }
                        if m.get("id"):
                            m_payload["id"] = m["id"]
                        sb.table("blueprint_modules").upsert(m_payload).execute()
                    for s in sources:
                        s["blueprint_id"] = bpid
                        valid_s_cols = {"id", "blueprint_id", "module_id", "source_type", "source_id", "relationship"}
                        s_payload = {k: v for k, v in s.items() if k in valid_s_cols}
                        sb.table("blueprint_sources").upsert(s_payload).execute()
                    saved_bp["modules"] = modules
                    saved_bp["sources"] = sources
                    return saved_bp
            except Exception as e:
                _check_db_failure("save_blueprint", e)
                logger.warning("Supabase save_blueprint failed: %s; storing in memory.", e)

        _check_db_failure("save_blueprint")
        _MEMORY_BLUEPRINTS[project_id] = blueprint_data
        return blueprint_data

    # -------------------------------------------------------------------------
    # ANALYSIS SNAPSHOTS (Activity Impact & Historical Analytics)
    # -------------------------------------------------------------------------
    @staticmethod
    def save_snapshot(project_id: str, analysis_type: Any, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if isinstance(analysis_type, dict):
            item_data = analysis_type.get("data", {})
            a_type = analysis_type.get("analysis_type", "snapshot")
            sid = analysis_type.get("id") or f"snap_{len(_MEMORY_SNAPSHOTS) + 1}_{int(datetime.now(timezone.utc).timestamp())}"
            now_str = analysis_type.get("created_at") or datetime.now(timezone.utc).isoformat()
        else:
            item_data = data or {}
            a_type = str(analysis_type)
            sid = f"snap_{len(_MEMORY_SNAPSHOTS) + 1}_{int(datetime.now(timezone.utc).timestamp())}"
            now_str = datetime.now(timezone.utc).isoformat()
        item = {
            "id": sid,
            "project_id": project_id,
            "analysis_type": a_type,
            "data": item_data,
            "created_at": now_str
        }
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("analysis_snapshots").insert(item).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                _check_db_failure("save_snapshot", e)
                logger.warning("Supabase snapshot insert failed: %s; storing in memory.", e)

        _check_db_failure("save_snapshot")
        _MEMORY_SNAPSHOTS.append(item)
        return item

    @staticmethod
    def get_snapshots(project_id: str, analysis_type: Optional[str] = None) -> List[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                q = sb.table("analysis_snapshots").select("*").eq("project_id", project_id).order("created_at", desc=True)
                if analysis_type:
                    q = q.eq("analysis_type", analysis_type)
                res = q.execute()
                if res.data is not None:
                    return res.data
            except Exception as e:
                _check_db_failure("get_snapshots", e)
                logger.warning("Supabase get_snapshots failed: %s; falling back to memory.", e)

        _check_db_failure("get_snapshots")
        res = [s for s in _MEMORY_SNAPSHOTS if s.get("project_id") == project_id]
        if analysis_type:
            res = [s for s in res if s.get("analysis_type") == analysis_type]
        return sorted(res, key=lambda x: x.get("created_at", ""), reverse=True)

    # -------------------------------------------------------------------------
    # ACTIVITY OUTCOMES
    # -------------------------------------------------------------------------
    @staticmethod
    def get_activity_outcome(activity_id_or_project_id: str, activity_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        target_id = activity_id if activity_id else activity_id_or_project_id
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("activity_outcomes").select("*").eq("activity_id", target_id).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                _check_db_failure("get_activity_outcome", e)
                logger.warning("Supabase get_activity_outcome failed: %s; falling back to memory.", e)

        _check_db_failure("get_activity_outcome")
        for o in _MEMORY_ACTIVITY_OUTCOMES:
            if o.get("activity_id") == target_id:
                return o
        return None

    @staticmethod
    def save_activity_outcome(activity_id: str, outcome_data: Dict[str, Any]) -> Dict[str, Any]:
        outcome_data["activity_id"] = activity_id
        now_str = datetime.now(timezone.utc).isoformat()
        outcome_data["created_at"] = now_str
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("activity_outcomes").upsert(outcome_data, on_conflict="activity_id").execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                _check_db_failure("save_activity_outcome", e)
                logger.warning("Supabase save_activity_outcome failed: %s; storing in memory.", e)

        _check_db_failure("save_activity_outcome")
        for i, o in enumerate(_MEMORY_ACTIVITY_OUTCOMES):
            if o.get("activity_id") == activity_id:
                _MEMORY_ACTIVITY_OUTCOMES[i] = outcome_data
                return outcome_data
        _MEMORY_ACTIVITY_OUTCOMES.append(outcome_data)
        return outcome_data

    # -------------------------------------------------------------------------
    # PHASE 1: NEW REPOSITORY METHODS
    # Following the exact same dual-mode pattern as existing methods above.
    # -------------------------------------------------------------------------

    # -- CONTRIBUTIONS (Phase 1 create_contribution wrapper) --
    @staticmethod
    def create_contribution(data: dict) -> dict:
        """Create a contribution record using the existing record_contribution method."""
        return Repository.record_contribution(
            project_id=data.get("project_id", ""),
            user_id=data.get("user_id", ""),
            action_type=data.get("type") or data.get("action_type", "manual"),
            entity_type=data.get("entity_type", ""),
            entity_id=data.get("entity_id", ""),
            weight=int(data.get("weight", 1)),
            metadata=data.get("metadata") or {},
        )

    # -- KNOWLEDGE NODES --
    @staticmethod
    def create_knowledge_node(data: dict) -> dict:
        now_str = datetime.now(timezone.utc).isoformat()
        item = {
            "id": data.get("id") or f"kn_{len(_MEMORY_KNOWLEDGE_NODES) + 1}",
            "project_id": data.get("project_id"),
            "node_type": data.get("node_type"),
            "label": data.get("label"),
            "metadata": data.get("metadata") or {},
            "created_at": data.get("created_at") or now_str,
        }
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("knowledge_nodes").insert(item).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                _check_db_failure("create_knowledge_node", e)
                logger.warning("Supabase create_knowledge_node failed: %s; storing in memory.", e)

        _check_db_failure("create_knowledge_node")
        _MEMORY_KNOWLEDGE_NODES.append(item)
        return item

    @staticmethod
    def get_knowledge_node_by_id(node_id: str) -> Optional[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("knowledge_nodes").select("*").eq("id", node_id).execute()
                if res.data:
                    return res.data[0]
                return None
            except Exception as e:
                _check_db_failure("get_knowledge_node_by_id", e)
                logger.warning("Supabase get_knowledge_node_by_id failed: %s; falling back.", e)

        _check_db_failure("get_knowledge_node_by_id")
        for n in _MEMORY_KNOWLEDGE_NODES:
            if n.get("id") == node_id:
                return n
        return None

    # -- KNOWLEDGE EDGES --
    @staticmethod
    def create_knowledge_edge(data: dict) -> dict:
        now_str = datetime.now(timezone.utc).isoformat()
        item = {
            "id": data.get("id") or f"ke_{len(_MEMORY_KNOWLEDGE_EDGES) + 1}",
            "project_id": data.get("project_id"),
            "source_node_id": data.get("source_node_id"),
            "target_node_id": data.get("target_node_id"),
            "edge_type": data.get("edge_type"),
            "weight": data.get("weight", 1.0),
            "created_at": data.get("created_at") or now_str,
        }
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("knowledge_edges").insert(item).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                _check_db_failure("create_knowledge_edge", e)
                logger.warning("Supabase create_knowledge_edge failed: %s; storing in memory.", e)

        _check_db_failure("create_knowledge_edge")
        _MEMORY_KNOWLEDGE_EDGES.append(item)
        return item

    @staticmethod
    def get_knowledge_edge_by_id(edge_id: str) -> Optional[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("knowledge_edges").select("*").eq("id", edge_id).execute()
                if res.data:
                    return res.data[0]
                return None
            except Exception as e:
                _check_db_failure("get_knowledge_edge_by_id", e)
                logger.warning("Supabase get_knowledge_edge_by_id failed: %s; falling back.", e)

        _check_db_failure("get_knowledge_edge_by_id")
        for e in _MEMORY_KNOWLEDGE_EDGES:
            if e.get("id") == edge_id:
                return e
        return None

    # -- INSIGHTS --
    @staticmethod
    def create_insight(data: dict) -> dict:
        now_str = datetime.now(timezone.utc).isoformat()
        item = {
            "id": data.get("id") or f"ins_{len(_MEMORY_INSIGHTS) + 1}",
            "project_id": data.get("project_id"),
            "type": data.get("type") or data.get("insight_type"),
            "title": data.get("title"),
            "description": data.get("description") or data.get("summary", ""),
            "confidence": data.get("confidence", 0.8),
            "status": data.get("status", "active"),
            "created_at": data.get("created_at") or now_str,
        }
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("insights").insert(item).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                _check_db_failure("create_insight", e)
                logger.warning("Supabase create_insight failed: %s; storing in memory.", e)

        _check_db_failure("create_insight")
        _MEMORY_INSIGHTS.append(item)
        return item

    @staticmethod
    def get_insight_by_id(insight_id: str) -> Optional[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("insights").select("*").eq("id", insight_id).execute()
                if res.data:
                    return res.data[0]
                return None
            except Exception as e:
                _check_db_failure("get_insight_by_id", e)
                logger.warning("Supabase get_insight_by_id failed: %s; falling back.", e)

        _check_db_failure("get_insight_by_id")
        for i in _MEMORY_INSIGHTS:
            if i.get("id") == insight_id:
                return i
        return None

    @staticmethod
    def add_insight_evidence(data: dict) -> dict:
        now_str = datetime.now(timezone.utc).isoformat()
        item = {
            "id": data.get("id") or f"iev_{len(_MEMORY_INSIGHT_EVIDENCE) + 1}",
            "insight_id": data.get("insight_id"),
            "entity_type": data.get("entity_type"),
            "entity_id": data.get("entity_id"),
            "description": data.get("description", ""),
            "created_at": data.get("created_at") or now_str,
        }
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("insight_evidence").insert(item).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                _check_db_failure("add_insight_evidence", e)
                logger.warning("Supabase add_insight_evidence failed: %s; storing in memory.", e)

        _check_db_failure("add_insight_evidence")
        _MEMORY_INSIGHT_EVIDENCE.append(item)
        return item

    # -- RECOMMENDATIONS --
    @staticmethod
    def create_recommendation(data: dict) -> dict:
        now_str = datetime.now(timezone.utc).isoformat()
        item = {
            "id": data.get("id") or f"rec_{len(_MEMORY_RECOMMENDATIONS) + 1}",
            "project_id": data.get("project_id"),
            "type": data.get("type"),
            "title": data.get("title"),
            "reason": data.get("reason", ""),
            "priority": data.get("priority", "medium"),
            "status": data.get("status", "pending"),
            "created_at": data.get("created_at") or now_str,
        }
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("recommendations").insert(item).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                _check_db_failure("create_recommendation", e)
                logger.warning("Supabase create_recommendation failed: %s; storing in memory.", e)

        _check_db_failure("create_recommendation")
        _MEMORY_RECOMMENDATIONS.append(item)
        return item

    @staticmethod
    def get_recommendation_by_id(rec_id: str) -> Optional[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("recommendations").select("*").eq("id", rec_id).execute()
                if res.data:
                    return res.data[0]
                return None
            except Exception as e:
                _check_db_failure("get_recommendation_by_id", e)
                logger.warning("Supabase get_recommendation_by_id failed: %s; falling back.", e)

        _check_db_failure("get_recommendation_by_id")
        for r in _MEMORY_RECOMMENDATIONS:
            if r.get("id") == rec_id:
                return r
        return None

    @staticmethod
    def add_recommendation_participant(data: dict) -> dict:
        now_str = datetime.now(timezone.utc).isoformat()
        item = {
            "id": data.get("id") or f"rp_{len(_MEMORY_REC_PARTICIPANTS) + 1}",
            "recommendation_id": data.get("recommendation_id"),
            "user_id": data.get("user_id"),
            "role": data.get("role", "Collaborator"),
            "created_at": data.get("created_at") or now_str,
        }
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("recommendation_participants").insert(item).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                _check_db_failure("add_recommendation_participant", e)
                logger.warning("Supabase add_recommendation_participant failed: %s; storing in memory.", e)

        _check_db_failure("add_recommendation_participant")
        _MEMORY_REC_PARTICIPANTS.append(item)
        return item

    @staticmethod
    def add_recommendation_source(data: dict) -> dict:
        now_str = datetime.now(timezone.utc).isoformat()
        item = {
            "id": data.get("id") or f"rs_{len(_MEMORY_REC_SOURCES) + 1}",
            "recommendation_id": data.get("recommendation_id"),
            "entity_type": data.get("entity_type"),
            "entity_id": data.get("entity_id"),
            "description": data.get("description", ""),
            "created_at": data.get("created_at") or now_str,
        }
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("recommendation_sources").insert(item).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                _check_db_failure("add_recommendation_source", e)
                logger.warning("Supabase add_recommendation_source failed: %s; storing in memory.", e)

        _check_db_failure("add_recommendation_source")
        _MEMORY_REC_SOURCES.append(item)
        return item

    # -- BLUEPRINTS --
    @staticmethod
    def create_blueprint(data: dict) -> dict:
        now_str = datetime.now(timezone.utc).isoformat()
        item = {
            "id": data.get("id") or f"bp_{data.get('project_id', 'p')}_{int(datetime.now(timezone.utc).timestamp())}",
            "project_id": data.get("project_id"),
            "version": data.get("version", 1),
            "title": data.get("title"),
            "architectural_summary": data.get("architectural_summary", ""),
            "agreed_consensus": data.get("agreed_consensus"),
            "unresolved_risks": data.get("unresolved_risks"),
            "action_plan": data.get("action_plan"),
            "created_at": data.get("created_at") or now_str,
        }
        sb = get_supabase_client()
        if sb:
            try:
                valid_cols = {
                    "id", "project_id", "version", "title", "architectural_summary",
                    "agreed_consensus", "unresolved_risks", "action_plan", "created_at"
                }
                payload = {k: v for k, v in item.items() if k in valid_cols}
                res = sb.table("blueprints").insert(payload).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                _check_db_failure("create_blueprint", e)
                logger.warning("Supabase create_blueprint failed: %s; storing in memory.", e)

        _check_db_failure("create_blueprint")
        _MEMORY_BLUEPRINTS[item["id"]] = item
        return item

    @staticmethod
    def get_blueprints(project_id: str) -> List[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("blueprints").select("*").eq("project_id", project_id).order("version", desc=True).execute()
                if res.data is not None:
                    return res.data
            except Exception as e:
                _check_db_failure("get_blueprints", e)
                logger.warning("Supabase get_blueprints failed: %s; falling back.", e)

        _check_db_failure("get_blueprints")
        return [b for b in _MEMORY_BLUEPRINTS.values() if b.get("project_id") == project_id]

    @staticmethod
    def get_latest_blueprint(project_id: str) -> Optional[Dict[str, Any]]:
        blueprints = Repository.get_blueprints(project_id)
        if not blueprints:
            return None
        return sorted(blueprints, key=lambda b: b.get("version", 1), reverse=True)[0]

    @staticmethod
    def create_blueprint_module(data: dict) -> dict:
        now_str = datetime.now(timezone.utc).isoformat()
        item = {
            "id": data.get("id") or f"bpm_{len(_MEMORY_BLUEPRINT_MODULES) + 1}",
            "blueprint_id": data.get("blueprint_id"),
            "name": data.get("name"),
            "owner_id": data.get("owner_id", ""),
            "status": data.get("status", "planned"),
            "summary": data.get("summary", ""),
            "deliverables": data.get("deliverables"),
            "created_at": data.get("created_at") or now_str,
        }
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("blueprint_modules").insert(item).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                _check_db_failure("create_blueprint_module", e)
                logger.warning("Supabase create_blueprint_module failed: %s; storing in memory.", e)

        _check_db_failure("create_blueprint_module")
        _MEMORY_BLUEPRINT_MODULES.append(item)
        return item

    # -- SNAPSHOTS (Phase 1 create/get wrapper) --
    @staticmethod
    def create_snapshot(data: dict) -> dict:
        """Create an analysis snapshot. Delegates to save_snapshot."""
        return Repository.save_snapshot(
            project_id=data.get("project_id", ""),
            analysis_type=data.get("snapshot_type") or data.get("analysis_type", "full"),
            data=data.get("data") or {},
        )

    @staticmethod
    def get_snapshot_by_id(snapshot_id: str) -> Optional[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("analysis_snapshots").select("*").eq("id", snapshot_id).execute()
                if res.data:
                    return res.data[0]
                return None
            except Exception as e:
                _check_db_failure("get_snapshot_by_id", e)
                logger.warning("Supabase get_snapshot_by_id failed: %s; falling back.", e)

        _check_db_failure("get_snapshot_by_id")
        for s in _MEMORY_SNAPSHOTS:
            if s.get("id") == snapshot_id:
                return s
        return None



