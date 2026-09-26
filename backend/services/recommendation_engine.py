from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from backend.schemas import (
    DetailedRecommendationResponse,
    RecommendationParticipantSchema,
    RecommendationSourceSchema,
    ContributionAnalyticsResponse,
    SilosAndGapsResponse,
    DiscussionIntelligenceItem
)
from backend.repository import Repository

class RecommendationEngine:
    """
    Deterministic collaboration recommendation engine.
    Produces targeted pairing, knowledge sharing, and reconciliation recommendations
    grounded in real project data, participants, and evidence sources.
    """

    @classmethod
    def generate_recommendations(
        cls,
        project_id: str,
        contribution_analytics: Optional[ContributionAnalyticsResponse] = None,
        silos_and_gaps: Optional[SilosAndGapsResponse] = None,
        discussions_intelligence: Optional[List[DiscussionIntelligenceItem]] = None,
        members: Optional[List[Dict[str, Any]]] = None,
        tasks: Optional[List[Dict[str, Any]]] = None,
        persist: bool = True
    ) -> List[DetailedRecommendationResponse]:
        if contribution_analytics is None:
            from backend.services.contribution_engine import ContributionEngine
            contribution_analytics = ContributionEngine.analyze_contributions(project_id)
        if silos_and_gaps is None:
            from backend.services.silo_detector import SiloDetector
            silos_and_gaps = SiloDetector.detect_silos_and_gaps(project_id)
        if discussions_intelligence is None:
            from backend.services.discussion_engine import DiscussionEngine
            raw_discs = Repository.get_discussions(project_id)
            discussions_intelligence = [DiscussionEngine.analyze_discussion(d) for d in raw_discs]
        if members is None:
            members = Repository.get_project_members(project_id)
        if tasks is None:
            tasks = Repository.get_tasks(project_id)

        recommendations: List[DetailedRecommendationResponse] = []
        now_str = datetime.now(timezone.utc).isoformat()

        member_map = {
            str(m.get("user_id") or m.get("id") or m.get("userId")): m.get("name", f"User {m.get('user_id')}")
            for m in members
        }
        all_uids = list(member_map.keys())

        # 1. Silo Resolution Recommendations (Knowledge Transfer)
        for idx, silo in enumerate(silos_and_gaps.silos):
            # Pick a partner who is not the silo owner
            silo_owners = [uid for uid, name in member_map.items() if name in silo.owners]
            if not silo_owners:
                continue
            owner_uid = silo_owners[0]
            owner_name = member_map.get(owner_uid, "Lead")

            # Candidate partner: an under-represented or other member
            partner_uid = None
            for inact_name in contribution_analytics.inactive_members:
                for uid, name in member_map.items():
                    if name == inact_name and uid != owner_uid:
                        partner_uid = uid
                        break
                if partner_uid:
                    break
            if not partner_uid:
                partners = [uid for uid in all_uids if uid != owner_uid]
                partner_uid = partners[0] if partners else None
            if partner_uid is None:
                continue
            partner_name = member_map.get(partner_uid, "Teammate")

            recommendations.append(
                DetailedRecommendationResponse(
                    id=f"rec-silo-{idx + 1}-{project_id}",
                    project_id=project_id,
                    type="knowledge_transfer",
                    title=f"Knowledge Transfer: {silo.topic} Architecture Walkthrough",
                    reason=f"{owner_name} is the sole contributor for '{silo.topic}'. Pairing with {partner_name} broadens codebase ownership.",
                    priority="high" if silo.risk == "single_owner" else "medium",
                    confidence=0.92,
                    status="pending",
                    participants=[
                        RecommendationParticipantSchema(user_id=owner_uid, name=owner_name, role="Subject Lead"),
                        RecommendationParticipantSchema(user_id=partner_uid, name=partner_name, role="Reviewer / Peer")
                    ],
                    sources=[
                        RecommendationSourceSchema(source_type="silo", source_id=silo.id, reason="Sole owner detected without peer redundancy")
                    ],
                    suggested_agenda=[
                        f"Walk through core module design and data contracts for {silo.topic}",
                        "Review current edge cases and error handling routines",
                        f"Assign next co-authored deliverable to {partner_name}"
                    ],
                    expected_outcome=f"Eliminates single-point dependency on {owner_name} and expands knowledge distribution across the team.",
                    created_at=now_str
                )
            )

        # 2. Discussion Reconciliation Recommendations
        for idx, d in enumerate(discussions_intelligence):
            if d.divergence_score >= 0.4 or d.consensus_status.lower() in ("fragmented", "polarized split", "high disagreement", "unresolved_disagreement"):
                participants_schemas = [
                    RecommendationParticipantSchema(user_id=uid, name=member_map.get(uid, f"User {uid}"), role="Contributor")
                    for uid in all_uids[:3]
                ]
                recommendations.append(
                    DetailedRecommendationResponse(
                        id=f"rec-debate-{d.id}",
                        project_id=project_id,
                        type="consensus_workshop",
                        title=f"Consensus Alignment: {d.title}",
                        reason=f"Debate has high divergence score ({d.divergence_score}). Aligning on an agreed technical resolution prevents sprint stalls.",
                        priority="high",
                        confidence=0.89,
                        status="pending",
                        participants=participants_schemas,
                        sources=[
                            RecommendationSourceSchema(source_type="discussion", source_id=d.id, reason="Divergent technical opinions detected")
                        ],
                        suggested_agenda=[
                            f"Review proposed architectural compromise: {(d.suggested_resolution or 'Reach consensus')[:80]}...",
                            "Address open questions from discussion thread",
                            "Conduct live pro/con vote to ratify final decision"
                        ],
                        expected_outcome=f"Unblocks pending sprint tasks tied to {d.title} and unifies technical direction.",
                        created_at=now_str
                    )
                )

        # 3. Task Rebalancing Recommendations
        if contribution_analytics.concentrated_members and contribution_analytics.inactive_members:
            lead_name = contribution_analytics.concentrated_members[0]
            peer_name = contribution_analytics.inactive_members[0]
            lead_uid = next((uid for uid, n in member_map.items() if n == lead_name), None)
            peer_uid = next((uid for uid, n in member_map.items() if n == peer_name), None)

            if lead_uid and peer_uid and lead_uid != peer_uid:
                lead_summary = next((member for member in contribution_analytics.member_summaries if member.name == lead_name), None)
                recommendations.append(
                DetailedRecommendationResponse(
                    id=f"rec-rebalance-{project_id}",
                    project_id=project_id,
                    type="task_reassignment",
                    title=f"Sprint Rebalancing: Pair {lead_name} and {peer_name}",
                    reason=f"{lead_name} carries {lead_summary.percentage if lead_summary else 0}% of recorded project contribution weight, while {peer_name} is underrepresented.",
                    priority="medium",
                    confidence=0.87,
                    status="pending",
                    participants=[
                        RecommendationParticipantSchema(user_id=lead_uid, name=lead_name, role="Lead Assignee"),
                        RecommendationParticipantSchema(user_id=peer_uid, name=peer_name, role="Co-Assignee")
                    ],
                    sources=[
                        RecommendationSourceSchema(source_type="voice_equity", source_id="gini_index", reason="Participation imbalance detected")
                    ],
                    suggested_agenda=[
                        "Identify upcoming unblocked backlog tasks",
                        f"Transfer lead ownership of one intermediate task to {peer_name}",
                        f"Set up a 15-minute sync touchpoint between {lead_name} and {peer_name}"
                    ],
                    expected_outcome="Reassess contribution distribution after the paired work; no outcome is assumed.",
                    created_at=now_str
                )
                )

        if persist:
            Repository.save_recommendations(project_id, [r.model_dump() for r in recommendations])

        return recommendations
