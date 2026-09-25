from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from backend.supabase_client import get_supabase_client
import logging

logger = logging.getLogger("mindmesh.repository")

# In-memory store initialized with seed state matching the problem statement
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
        "description": "A semantic knowledge graph connecting courses, projects, and student skills to recommend learning pathways.",
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
        "description": "End-to-end encrypted messaging for campus clubs with moderation tools and event coordination.",
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
    {"id": "u1", "name": "Ritheesh", "email": "ritheesh@university.edu", "role": "Lead Coordinator", "skills": ["FastAPI", "Next.js", "System Architecture"]},
    {"id": "u2", "name": "Priya Sharma", "email": "priya@university.edu", "role": "Data Engineer", "skills": ["Python", "Kafka", "ETL Pipelines", "Pandas"]},
    {"id": "u3", "name": "Karthik Raja", "email": "karthik@university.edu", "role": "ML Specialist", "skills": ["PyTorch", "Scikit-Learn", "Feature Engineering"]},
    {"id": "u4", "name": "Arun Kumar", "email": "arun@university.edu", "role": "Security Researcher", "skills": ["Cybersecurity", "Snort Rules", "PCAP Analysis"]},
    {"id": "u5", "name": "Divya Patel", "email": "divya@university.edu", "role": "Frontend & Visualization", "skills": ["React", "TailwindCSS", "Recharts", "UI/UX"]}
]

_MEMORY_TASKS = [
    {"id": "t1", "project_id": "p1", "title": "Kafka Ingestion Buffer for Raw PCAP Streams", "status": "done", "priority": "high", "assignee_id": "u2", "module": "Data Ingestion Pipeline"},
    {"id": "t2", "project_id": "p1", "title": "Transformer Feature Embeddings Extraction", "status": "done", "priority": "high", "assignee_id": "u3", "module": "ML Inference Core"},
    {"id": "t3", "project_id": "p1", "title": "Quantize ONNX Model for Sub-25ms SLA", "status": "in-progress", "priority": "urgent", "assignee_id": "u3", "module": "ML Inference Core"},
    {"id": "t4", "project_id": "p1", "title": "Snort Threat Pattern Heuristic Ruleset", "status": "in-progress", "priority": "medium", "assignee_id": "u4", "module": "Threat Evasion Detection"},
    {"id": "t5", "project_id": "p1", "title": "Interactive Anomaly Radar & Metrics Dashboard", "status": "in-progress", "priority": "medium", "assignee_id": "u5", "module": "Interactive UI & Analytics"},
    {"id": "t6", "project_id": "p1", "title": "FastAPI Orchestration & Supabase Auth Bridge", "status": "done", "priority": "high", "assignee_id": "u1", "module": "API Gateway & Security"}
]

_MEMORY_DISCUSSIONS = [
    {
        "id": "d1",
        "project_id": "p1",
        "author_id": "u3",
        "title": "Model Inference Latency vs Detection Accuracy in Real-Time Traffic",
        "content": "We are observing 120ms latency using deep transformer on raw packet streams. The real-time SLA is under 25ms. Should we adopt lightweight ONNX quantization or switch to an ensemble XGBoost architecture?",
        "type": "architectural_debate",
        "status": "divergent",
        "resolution": "Recommended by AI: Adopt hybrid multi-stage pipeline: XGBoost for 1st-stage wire-speed triage (<5ms) followed by quantized ONNX transformer for ambiguous anomalous sessions.",
        "consensus_pro": 4,
        "consensus_con": 0
    },
    {
        "id": "d2",
        "project_id": "p1",
        "author_id": "u4",
        "title": "Fragmented PCAP Ingestion Pipeline & Thread Safety",
        "content": "The Snort/Suricata PCAP ingestion threads are occasionally dropping 4% of packets during burst intervals. Priya suggested Kafka buffer queues, but we need thread safety guarantees.",
        "type": "unresolved_blocker",
        "status": "fragmented",
        "resolution": "Recommended by AI: Pair Priya (Kafka pipelines) and Arun (PCAP engine) in a 45-minute Knowledge Transfer & Bridge activity.",
        "consensus_pro": 3,
        "consensus_con": 0
    }
]

_MEMORY_DOCUMENTS = [
    {
        "id": "doc1",
        "project_id": "p1",
        "author_id": "u1",
        "title": "Threat Defense System Architecture Specification",
        "content_text": "This document specifies the microservice topology, Kafka bus schema, and ML inference SLA for high-throughput anomaly detection.",
        "file_type": "markdown",
        "contributors": ["u1", "u2", "u3"]
    },
    {
        "id": "doc2",
        "project_id": "p1",
        "author_id": "u4",
        "title": "PCAP Feature Extraction & Network Signatures",
        "content_text": "Specification of network flow heuristics, flow duration, packet length variance, and header flags for anomaly classification.",
        "file_type": "markdown",
        "contributors": ["u4"]
    }
]

_MEMORY_ACTIVITIES = [
    {
        "id": "act-1",
        "project_id": "p1",
        "title": "Knowledge Transfer & Bridge: Kafka Ingestion to PCAP Engine",
        "description": "Cross-domain pairing between Priya and Arun to integrate Kafka buffer queues directly into the high-rate packet capture daemon.",
        "type": "knowledge_transfer",
        "status": "pending",
        "participants": ["Priya Sharma", "Arun Kumar"],
        "agenda": [
            "Review Kafka consumer group thread isolation model",
            "Establish zero-copy ring buffer interface for PCAP frames",
            "Simulate 10,000 pps burst load test",
            "Document interface contract in shared docs"
        ],
        "linked_task_id": "t4",
        "takeaways": None,
        "created_at": "2026-09-25T12:00:00Z"
    }
]

class Repository:
    """
    Data access repository providing dual-mode execution:
    - Directly interacts with Supabase when configured
    - Seamlessly falls back to rich in-memory mock repository if Supabase is offline or not configured
    """

    @staticmethod
    def get_projects() -> List[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("projects").select("*").execute()
                if res.data:
                    return res.data
            except Exception as e:
                logger.warning("Supabase read failed: %s; falling back to memory store.", e)
        return _MEMORY_PROJECTS

    @staticmethod
    def get_project_by_id(project_id: str) -> Optional[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("projects").select("*").eq("id", project_id).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.warning("Supabase read failed: %s; falling back to memory store.", e)
        for p in _MEMORY_PROJECTS:
            if p["id"] == project_id:
                return p
        return None

    @staticmethod
    def get_project_members(project_id: str) -> List[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("project_members").select("*, profiles(*)").eq("project_id", project_id).execute()
                if res.data:
                    return [
                        {
                            "user_id": item["user_id"],
                            "role": item["role"],
                            "name": item.get("profiles", {}).get("name", f"User {item['user_id']}")
                        }
                        for item in res.data
                    ]
            except Exception as e:
                logger.warning("Supabase read failed: %s; falling back to memory store.", e)
        
        proj = Repository.get_project_by_id(project_id)
        if proj and "members" in proj:
            return proj["members"]
        return [{"user_id": p["id"], "role": "Member", "name": p["name"]} for p in _MEMORY_PROFILES]

    @staticmethod
    def get_tasks(project_id: str) -> List[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("tasks").select("*").eq("project_id", project_id).execute()
                if res.data:
                    return res.data
            except Exception as e:
                logger.warning("Supabase read failed: %s; falling back to memory store.", e)
        return [t for t in _MEMORY_TASKS if t.get("project_id") == project_id]

    @staticmethod
    def create_task(task_data: Dict[str, Any]) -> Dict[str, Any]:
        task_data["id"] = task_data.get("id") or f"t{len(_MEMORY_TASKS) + 1}"
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("tasks").insert(task_data).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.warning("Supabase insert failed: %s; storing in memory store.", e)
        _MEMORY_TASKS.append(task_data)
        return task_data

    @staticmethod
    def update_task(task_id: str, partial_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("tasks").update(partial_data).eq("id", task_id).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.warning("Supabase task update failed: %s; falling back to memory.", e)
        for t in _MEMORY_TASKS:
            if t["id"] == task_id:
                t.update(partial_data)
                return t
        return None

    @staticmethod
    def create_project(project_data: Dict[str, Any]) -> Dict[str, Any]:
        project_data["id"] = project_data.get("id") or f"p{len(_MEMORY_PROJECTS) + 1}"
        if "name" not in project_data and "title" in project_data:
            project_data["name"] = project_data["title"]
        if "title" not in project_data and "name" in project_data:
            project_data["title"] = project_data["name"]
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("projects").insert(project_data).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.warning("Supabase project insert failed: %s; storing in memory store.", e)
        _MEMORY_PROJECTS.append(project_data)
        return project_data

    @staticmethod
    def create_discussion(discussion_data: Dict[str, Any]) -> Dict[str, Any]:
        discussion_data["id"] = discussion_data.get("id") or f"d{len(_MEMORY_DISCUSSIONS) + 1}"
        discussion_data["consensus_pro"] = discussion_data.get("consensus_pro", 0)
        discussion_data["consensus_con"] = discussion_data.get("consensus_con", 0)
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("discussions").insert(discussion_data).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.warning("Supabase discussion insert failed: %s; storing in memory store.", e)
        _MEMORY_DISCUSSIONS.append(discussion_data)
        return discussion_data

    @staticmethod
    def create_document(document_data: Dict[str, Any]) -> Dict[str, Any]:
        document_data["id"] = document_data.get("id") or f"doc{len(_MEMORY_DOCUMENTS) + 1}"
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("documents").insert(document_data).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.warning("Supabase document insert failed: %s; storing in memory store.", e)
        _MEMORY_DOCUMENTS.append(document_data)
        return document_data

    @staticmethod
    def get_discussions(project_id: str) -> List[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("discussions").select("*").eq("project_id", project_id).execute()
                if res.data:
                    return res.data
            except Exception as e:
                logger.warning("Supabase read failed: %s; falling back to memory store.", e)
        return [d for d in _MEMORY_DISCUSSIONS if d.get("project_id") == project_id]

    @staticmethod
    def vote_discussion(discussion_id: str, vote: str) -> Optional[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                disc_res = sb.table("discussions").select("*").eq("id", discussion_id).execute()
                if disc_res.data:
                    disc = disc_res.data[0]
                    pro = disc.get("consensus_pro", 0) + (1 if vote == "pro" else 0)
                    con = disc.get("consensus_con", 0) + (1 if vote == "con" else 0)
                    upd = sb.table("discussions").update({"consensus_pro": pro, "consensus_con": con}).eq("id", discussion_id).execute()
                    if upd.data:
                        return upd.data[0]
            except Exception as e:
                logger.warning("Supabase vote failed: %s; falling back to memory.", e)

        for d in _MEMORY_DISCUSSIONS:
            if d["id"] == discussion_id:
                if vote == "pro":
                    d["consensus_pro"] = d.get("consensus_pro", 0) + 1
                else:
                    d["consensus_con"] = d.get("consensus_con", 0) + 1
                return d
        return None

    @staticmethod
    def get_documents(project_id: str) -> List[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("documents").select("*").eq("project_id", project_id).execute()
                if res.data:
                    return res.data
            except Exception as e:
                logger.warning("Supabase read failed: %s; falling back to memory store.", e)
        return [doc for doc in _MEMORY_DOCUMENTS if doc.get("project_id") == project_id]

    @staticmethod
    def get_activities(project_id: str) -> List[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("activities").select("*").eq("project_id", project_id).execute()
                if res.data:
                    return res.data
            except Exception as e:
                logger.warning("Supabase read failed: %s; falling back to memory store.", e)
        return [act for act in _MEMORY_ACTIVITIES if act.get("project_id") == project_id]

    @staticmethod
    def create_activity(activity_data: Dict[str, Any]) -> Dict[str, Any]:
        activity_data["id"] = activity_data.get("id") or f"act-{len(_MEMORY_ACTIVITIES) + 1}"
        activity_data["status"] = "pending"
        activity_data["created_at"] = datetime.now(timezone.utc).isoformat()
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("activities").insert(activity_data).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.warning("Supabase activity insert failed: %s; storing in memory store.", e)
        _MEMORY_ACTIVITIES.append(activity_data)
        return activity_data

    @staticmethod
    def complete_activity(activity_id: str, takeaways: Optional[str] = None, completed_task_ids: List[str] = [], notes: Optional[str] = None) -> Optional[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                update_payload = {
                    "status": "completed",
                    "takeaways": takeaways,
                    "completed_at": datetime.now(timezone.utc).isoformat()
                }
                if notes:
                    update_payload["notes"] = notes
                upd = sb.table("activities").update(update_payload).eq("id", activity_id).execute()
                if completed_task_ids:
                    for tid in completed_task_ids:
                        sb.table("tasks").update({"status": "done"}).eq("id", tid).execute()
                if upd.data:
                    return upd.data[0]
            except Exception as e:
                logger.warning("Supabase activity update failed: %s; falling back to memory.", e)

        for act in _MEMORY_ACTIVITIES:
            if act["id"] == activity_id:
                act["status"] = "completed"
                act["takeaways"] = takeaways
                if notes:
                    act["notes"] = notes
                act["completed_at"] = datetime.now(timezone.utc).isoformat()
                for tid in completed_task_ids:
                    for t in _MEMORY_TASKS:
                        if t["id"] == tid:
                            t["status"] = "done"
                return act
        return None
