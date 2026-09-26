from typing import Dict, Any, List, Optional
import uuid
from datetime import datetime, timezone
from backend.schemas import (
    BlueprintPersistentResponse,
    BlueprintModuleItem,
    BlueprintSourceItem,
)
from backend.repository import Repository
from backend.services.silo_detector import SiloDetector
from backend.services.discussion_engine import DiscussionEngine

class BlueprintEngine:
    @staticmethod
    def generate_blueprint(
        project_id: str,
        persist: bool = True,
        regenerate: bool = False,
    ) -> BlueprintPersistentResponse:
        project = Repository.get_project(project_id)
        project_name = (project or {}).get("name") or (project or {}).get("title") or project_id
        project_desc = (project or {}).get("description") or ""

        existing_blueprint = Repository.get_blueprint(project_id)
        if existing_blueprint and persist and not regenerate:
            return BlueprintPersistentResponse(**existing_blueprint)

        tasks = Repository.get_tasks(project_id)
        documents = Repository.get_documents(project_id)
        discussions = Repository.get_discussions(project_id)
        members = Repository.get_team(project_id)
        member_names = {str(member.get("user_id")): member.get("name") for member in members}

        # 1. Group tasks into modules
        # If tasks have categories or prefixes, group by category, else cluster logically
        modules_dict: Dict[str, Dict[str, Any]] = {}
        for t in tasks:
            title = t.get("title", "Task")
            category = t.get("module") or t.get("category") or "General"
            assignee_id = str(t.get("assignee_id") or t.get("assigneeId") or "")
            assignee = member_names.get(assignee_id) or (assignee_id if assignee_id else "Unassigned")
            status = t.get("status", "pending")
            
            if category not in modules_dict:
                modules_dict[category] = {
                    "name": category,
                    "owner": assignee,
                    "owner_id": assignee_id or None,
                    "status": "in-progress" if status == "in-progress" else ("completed" if status == "done" else "planned"),
                    "summary": f"Implementation module for {category}",
                    "deliverables": [],
                    "source_type": "task",
                    "source_id": t.get("id"),
                }
            modules_dict[category]["deliverables"].append(f"[{status.upper()}] {title}")
            if status != "done" and modules_dict[category]["status"] == "completed":
                modules_dict[category]["status"] = "in-progress"

        # Also add document-based architecture modules if any
        for doc in documents:
            doc_title = doc.get("title", "Doc")
            author = doc.get("author") or doc.get("author_id") or "Team"
            mod_name = f"Spec: {doc_title}"
            if mod_name not in modules_dict:
                modules_dict[mod_name] = {
                    "name": mod_name,
                    "owner": author,
                    "owner_id": doc.get("author_id") or doc.get("authorId"),
                    "status": "completed",
                    "summary": f"Documentation and design specs from {doc_title}",
                    "deliverables": [f"Document {doc_title}"],
                    "source_type": "document",
                    "source_id": doc.get("id"),
                }

        modules = [BlueprintModuleItem(**m) for m in modules_dict.values()]

        # 2. Agreed consensus from discussions and decisions
        agreed_consensus: List[str] = []
        unresolved_risks: List[str] = []
        for d in discussions:
            disc_intel = DiscussionEngine.analyze_discussion(d)
            d_title = d.get("title", "Discussion")
            if disc_intel.consensus_status in ["Strong Consensus", "Moderate Agreement"]:
                agreed_consensus.append(f"Consensus reached on '{d_title}': {disc_intel.suggested_resolution or 'Team aligned'}")
            elif disc_intel.consensus_status in ["Polarized Split", "High Disagreement"]:
                unresolved_risks.append(f"Active debate on '{d_title}' (divergence: {disc_intel.divergence_score:.2f}). Needs resolution before finalizing spec.")

        # 3. Add detected silos as unresolved risks
        silos_and_gaps = SiloDetector.detect_silos_and_gaps(project_id)
        for s in silos_and_gaps.silos:
            unresolved_risks.append(f"Knowledge Silo: {s.topic} concentrated with {', '.join(s.owners)}. {s.recommended_action}")
        for g in silos_and_gaps.gaps:
            unresolved_risks.append(f"Knowledge Gap: {g.skill_or_topic} ({g.gap_type}). {g.recommended_action}")

        # 4. Action plan
        action_plan: List[str] = []
        pending_tasks = [t for t in tasks if t.get("status") != "done"]
        if pending_tasks:
            for pt in pending_tasks[:4]:
                action_plan.append(f"Execute task '{pt.get('title')}' (assigned to {pt.get('assignee', 'unassigned')})")

        if silos_and_gaps.silos:
            action_plan.append(f"Schedule cross-functional pairing on {silos_and_gaps.silos[0].topic}")

        # 5. Expected measurable changes
        completed_tasks = sum(task.get("status") in ("done", "completed") for task in tasks)
        expected_changes = [
            f"Track task completion from {completed_tasks}/{len(tasks)} currently complete tasks.",
            "Compare participation and knowledge metrics against the next stored analysis snapshot.",
        ]

        # 6. Check existing version
        version = 1
        if existing_blueprint:
            version = existing_blueprint.get("version", 1) + 1

        sources = [
            BlueprintSourceItem(source_type="task", source_id=t.get("id", ""), relationship="implements")
            for t in tasks[:10] if t.get("id")
        ]
        for doc in documents[:5]:
            if doc.get("id"):
                sources.append(BlueprintSourceItem(source_type="document", source_id=doc.get("id"), relationship="specifies"))

        blueprint_data = {
            "id": str(uuid.uuid4()),
            "project_id": project_id,
            "title": f"{project_name} Solution Blueprint v{version}",
            "summary": f"Deterministic architecture and delivery blueprint synthesizing {len(tasks)} tasks, {len(documents)} documents, and {len(discussions)} discussion threads.",
            "version": version,
            "problem_statement": project_desc or f"Objective: Deliver scalable implementation for {project_name}.",
            "modules": [m.model_dump() for m in modules],
            "sources": [s.model_dump() for s in sources],
            "agreed_consensus": agreed_consensus,
            "unresolved_risks": unresolved_risks,
            "action_plan": action_plan,
            "expected_measurable_changes": expected_changes,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        if persist:
            Repository.save_blueprint(project_id, blueprint_data)

        return BlueprintPersistentResponse(**blueprint_data)
