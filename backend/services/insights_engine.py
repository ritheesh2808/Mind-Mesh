from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from backend.schemas import (
    PersistentInsightResponse,
    InsightEvidenceItem,
    ContributionAnalyticsResponse,
    SilosAndGapsResponse,
    DiscussionIntelligenceItem
)
from backend.repository import Repository

class InsightsEngine:
    """
    Synthesizes collective insights with explicit evidence tracking.
    Answers the critical hackathon question: 'Why did Mind-Mesh generate this insight?'
    """

    @classmethod
    def generate_insights(
        cls,
        project_id: str,
        contribution_analytics: ContributionAnalyticsResponse,
        silos_and_gaps: SilosAndGapsResponse,
        discussions_intelligence: List[DiscussionIntelligenceItem]
    ) -> List[PersistentInsightResponse]:
        insights: List[PersistentInsightResponse] = []
        now_str = datetime.now(timezone.utc).isoformat()

        # 1. Voice Equity / Participation Gap Insight
        if contribution_analytics.gini_coefficient > 0.35 and contribution_analytics.concentrated_members:
            bottlenecks_str = ", ".join(contribution_analytics.concentrated_members)
            evidence = [
                InsightEvidenceItem(
                    source_type="gini_calculation",
                    source_id="equity_analysis",
                    description=f"Gini coefficient is {contribution_analytics.gini_coefficient} (ideal <= 0.25).",
                    metric="gini_coefficient",
                    value=contribution_analytics.gini_coefficient
                ),
                InsightEvidenceItem(
                    source_type="contribution_concentration",
                    source_id="contributions",
                    description=f"Lead contributor(s) {bottlenecks_str} account for disproportionate output.",
                    metric="equity_score",
                    value=contribution_analytics.equity_score
                )
            ]
            insights.append(
                PersistentInsightResponse(
                    id=f"ins-equity-{project_id}",
                    project_id=project_id,
                    insight_type="participation_gap",
                    title="Knowledge Concentration & Lead Dependency Detected",
                    summary=f"Voice equity index is {contribution_analytics.equity_score}%. {bottlenecks_str} holds primary contribution weight, creating a single-point dependency risk.",
                    severity="urgent" if contribution_analytics.gini_coefficient > 0.55 else "attention",
                    confidence=0.95,
                    status="active",
                    evidence=evidence,
                    action_items=[
                        "Schedule a 20-minute Knowledge Transfer pairing session.",
                        "Reassign unblocked sprint backlog tasks to under-represented members."
                    ],
                    created_at=now_str
                )
            )

        # 2. Knowledge Silo Insights
        for silo in silos_and_gaps.silos:
            evidence = [
                InsightEvidenceItem(
                    source_type="silo_detection",
                    source_id=silo.id,
                    description=ev,
                    metric="owner_count",
                    value=float(len(silo.owners))
                )
                for ev in silo.supporting_evidence
            ]
            insights.append(
                PersistentInsightResponse(
                    id=f"ins-{silo.id}",
                    project_id=project_id,
                    insight_type="knowledge_silo",
                    title=f"Knowledge Silo: {silo.topic}",
                    summary=f"Topic '{silo.topic}' is solely concentrated with {', '.join(silo.owners)}. No peer cross-validation is logged.",
                    severity="attention" if silo.risk == "single_owner" else "info",
                    confidence=0.92,
                    status="active",
                    evidence=evidence,
                    action_items=[
                        silo.recommended_action,
                        f"Review architecture documentation for {silo.topic}."
                    ],
                    created_at=now_str
                )
            )

        # 3. Knowledge Gap Insights
        for gap in silos_and_gaps.gaps:
            evidence = [
                InsightEvidenceItem(
                    source_type="skill_audit",
                    source_id=gap.id,
                    description=gap.impact,
                    metric="skill_coverage",
                    value=0.0
                )
            ]
            insights.append(
                PersistentInsightResponse(
                    id=f"ins-{gap.id}",
                    project_id=project_id,
                    insight_type="knowledge_gap",
                    title=f"Knowledge Gap: {gap.skill_or_topic}",
                    summary=gap.impact,
                    severity="attention" if gap.gap_type == "missing_skill" else "info",
                    confidence=0.88,
                    status="active",
                    evidence=evidence,
                    action_items=[gap.recommended_action],
                    created_at=now_str
                )
            )

        # 4. Discussion Fragmentation / Consensus Insights
        fragmented = [
            d for d in discussions_intelligence 
            if d.divergence_score >= 0.4 or d.consensus_status.lower() in ("fragmented", "polarized split", "high disagreement", "unresolved_disagreement")
        ]
        if fragmented:
            top_frag = fragmented[0]
            evidence = [
                InsightEvidenceItem(
                    source_type="discussion",
                    source_id=top_frag.id,
                    description=f"Debate '{top_frag.title}' has divergence score {top_frag.divergence_score} ({top_frag.pro_votes} pro / {top_frag.con_votes} con).",
                    metric="divergence_score",
                    value=top_frag.divergence_score
                )
            ]
            insights.append(
                PersistentInsightResponse(
                    id=f"ins-frag-{top_frag.id}",
                    project_id=project_id,
                    insight_type="discussion_fragmentation",
                    title=f"Divergent Architectural Decision: {top_frag.title}",
                    summary=f"Team opinions are split with divergence score {top_frag.divergence_score}. Active blocker on technical path.",
                    severity="attention",
                    confidence=0.90,
                    status="active",
                    evidence=evidence,
                    action_items=[
                        f"Conduct consensus vote on resolution: {(top_frag.suggested_resolution or 'Reach alignment')[:80]}...",
                        "Timebox a 15-minute consensus workshop."
                    ],
                    created_at=now_str
                )
            )

        return insights

    @classmethod
    def generate_and_persist_insights(
        cls,
        project_id: str,
        contribution_analytics: Optional[ContributionAnalyticsResponse] = None,
        silos_and_gaps: Optional[SilosAndGapsResponse] = None,
        discussions_intelligence: Optional[List[DiscussionIntelligenceItem]] = None,
        persist: bool = True
    ) -> List[PersistentInsightResponse]:
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

        insights = cls.generate_insights(
            project_id=project_id,
            contribution_analytics=contribution_analytics,
            silos_and_gaps=silos_and_gaps,
            discussions_intelligence=discussions_intelligence
        )
        if persist:
            Repository.save_insights(project_id, [i.model_dump() for i in insights])
        return insights
