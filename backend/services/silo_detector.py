from typing import List, Dict, Any, Set, Optional
from backend.schemas import (
    SiloItem,
    KnowledgeGapItem,
    SilosAndGapsResponse
)
from backend.repository import Repository

class SiloDetector:
    """
    Deterministic knowledge silo and gap detector.
    Identifies single-owner bottlenecks, unreviewed modules, isolated team members,
    and missing project skills without opaque heuristics or LLM calls.
    """

    @classmethod
    def detect_silos_and_gaps(
        cls,
        project_id: str,
        project: Optional[Dict[str, Any]] = None,
        members: Optional[List[Dict[str, Any]]] = None,
        tasks: Optional[List[Dict[str, Any]]] = None,
        discussions: Optional[List[Dict[str, Any]]] = None,
        documents: Optional[List[Dict[str, Any]]] = None,
        knowledge_graph: Optional[Dict[str, Any]] = None
    ) -> SilosAndGapsResponse:
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

        silos: List[SiloItem] = []
        gaps: List[KnowledgeGapItem] = []

        member_lookup = {
            str(m.get("user_id") or m.get("id") or m.get("userId")): m.get("name", f"Member {m.get('user_id')}")
            for m in members
        }

        # ---------------------------------------------------------------------
        # 1. Topic / Module Single-Owner Silos
        # ---------------------------------------------------------------------
        module_owners: Dict[str, Set[str]] = {}
        module_tasks: Dict[str, List[str]] = {}

        for t in tasks:
            mod = t.get("module") or "Core System"
            assignee = str(t.get("assignee_id") or t.get("assigneeId") or "")
            if mod not in module_owners:
                module_owners[mod] = set()
                module_tasks[mod] = []
            if assignee:
                module_owners[mod].add(assignee)
            module_tasks[mod].append(t.get("title", f"Task {t.get('id')}"))

        for mod, owners in module_owners.items():
            if len(owners) == 1 and len(module_tasks[mod]) >= 1:
                owner_id = list(owners)[0]
                owner_name = member_lookup.get(owner_id, f"User {owner_id}")
                task_list_str = ", ".join(module_tasks[mod][:2])
                silos.append(
                    SiloItem(
                        id=f"silo-mod-{mod.lower().replace(' ', '_')}",
                        topic=mod,
                        risk="single_owner",
                        owners=[owner_name],
                        supporting_evidence=[
                            f"All {len(module_tasks[mod])} task(s) in '{mod}' are solely owned by {owner_name}.",
                            f"Key tasks include: {task_list_str}."
                        ],
                        recommended_action=f"Pair {owner_name} with a teammate to co-develop or cross-review '{mod}'."
                    )
                )

        # ---------------------------------------------------------------------
        # 2. Document Knowledge Concentration Silos
        # ---------------------------------------------------------------------
        for doc in documents:
            author = str(doc.get("author_id") or doc.get("authorId") or "")
            contributors = doc.get("contributors") or []
            if author and (not contributors or (len(contributors) == 1 and contributors[0] == author)):
                author_name = member_lookup.get(author, f"User {author}")
                doc_title = doc.get("title", f"Doc {doc.get('id')}")
                silos.append(
                    SiloItem(
                        id=f"silo-doc-{doc.get('id')}",
                        topic=doc_title,
                        risk="unreviewed_artifact",
                        owners=[author_name],
                        supporting_evidence=[
                            f"Document '{doc_title}' has only 1 author ({author_name}) and no logged peer contributors or reviewers."
                        ],
                        recommended_action=f"Assign a secondary reviewer to validate '{doc_title}'."
                    )
                )

        # ---------------------------------------------------------------------
        # 3. Isolated Member Detection
        # ---------------------------------------------------------------------
        collab_counts: Dict[str, int] = {uid: 0 for uid in member_lookup}
        for doc in documents:
            for c in doc.get("contributors", []):
                if str(c) in collab_counts:
                    collab_counts[str(c)] += 1
        for t in tasks:
            assignee = str(t.get("assignee_id") or t.get("assigneeId") or "")
            if assignee in collab_counts:
                collab_counts[assignee] += 1
        for d in discussions:
            author = str(d.get("author_id") or d.get("authorId") or "")
            if author in collab_counts:
                collab_counts[author] += 1

        for uid, count in collab_counts.items():
            if count == 0 and len(members) >= 2:
                name = member_lookup.get(uid, f"User {uid}")
                silos.append(
                    SiloItem(
                        id=f"silo-isolated-{uid}",
                        topic=f"Participation Isolation: {name}",
                        risk="isolated_contributor",
                        owners=[name],
                        supporting_evidence=[
                            f"{name} has 0 recorded task assignments, document contributions, or discussion threads."
                        ],
                        recommended_action=f"Invite {name} to co-author an upcoming deliverable or attend the next sprint sync."
                    )
                )

        # ---------------------------------------------------------------------
        # 4. Knowledge Gap Detection: Missing Project Required Skills
        # ---------------------------------------------------------------------
        all_member_skills: Set[str] = set()
        for m in members:
            for s in (m.get("skills") or []):
                all_member_skills.add(str(s).lower().strip())

        req_skills = project.get("skills_required") or []
        for rs in req_skills:
            norm_rs = str(rs).lower().strip()
            if norm_rs and norm_rs not in all_member_skills:
                gaps.append(
                    KnowledgeGapItem(
                        id=f"gap-skill-{norm_rs.replace(' ', '_')}",
                        skill_or_topic=str(rs),
                        gap_type="missing_skill",
                        impact=f"Project specifies '{rs}' as required, but no current team member profiles claim this proficiency.",
                        recommended_action=f"Host an exploratory research session or seek matchmaking with an external specialist in {rs}."
                    )
                )

        # ---------------------------------------------------------------------
        # 5. Knowledge Gap Detection: Undocumented Modules
        # ---------------------------------------------------------------------
        doc_titles = [d.get("title", "").lower() for d in documents]
        for mod in module_owners:
            if not any(mod.lower() in dt for dt in doc_titles):
                gaps.append(
                    KnowledgeGapItem(
                        id=f"gap-undoc-{mod.lower().replace(' ', '_')}",
                        skill_or_topic=mod,
                        gap_type="undocumented_system",
                        impact=f"Module '{mod}' has active sprint tasks but lacks dedicated architectural specification or documentation.",
                        recommended_action=f"Draft a technical specification document outlining '{mod}' contracts and boundaries."
                    )
                )

        return SilosAndGapsResponse(
            project_id=project_id,
            silo_count=len(silos),
            gap_count=len(gaps),
            silos=silos,
            gaps=gaps
        )
