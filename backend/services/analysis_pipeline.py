from typing import Dict, Any, List
import uuid
from datetime import datetime, timezone

from backend.repository import Repository
from backend.services.contribution_engine import ContributionEngine
from backend.services.knowledge_graph_engine import KnowledgeGraphEngine
from backend.services.silo_detector import SiloDetector
from backend.services.discussion_engine import DiscussionEngine
from backend.services.insights_engine import InsightsEngine
from backend.services.recommendation_engine import RecommendationEngine
from backend.services.blueprint_engine import BlueprintEngine

class AnalysisPipeline:
    @staticmethod
    def run_project_analysis(project_id: str) -> Dict[str, Any]:
        """
        Deterministic ED-03 Intelligence master re-analysis pipeline.
        Orchestrates contribution analysis, graph generation, silo detection,
        insights derivation, recommendation generation, blueprint synthesis,
        and records a persistent snapshot.
        """
        # 1. Contributions & Voice Equity
        contributions = ContributionEngine.analyze_contributions(project_id)

        # 2. Knowledge Graph
        graph = KnowledgeGraphEngine.generate_and_persist_graph(project_id)

        # 3. Silos & Knowledge Gaps
        silos_and_gaps = SiloDetector.detect_silos_and_gaps(project_id)

        # 4. Discussion Intelligence
        raw_discussions = Repository.get_discussions(project_id)
        discussions_intel = [
            DiscussionEngine.analyze_discussion(d).model_dump()
            for d in raw_discussions
        ]

        # 5. Collective Insights with Evidence
        insights = InsightsEngine.generate_and_persist_insights(project_id)

        # 6. Actionable Pair Recommendations
        recommendations = RecommendationEngine.generate_recommendations(project_id, persist=True)

        # 7. Architecture Blueprint
        blueprint = BlueprintEngine.generate_blueprint(project_id, persist=True, regenerate=True)

        # 8. Snapshot creation
        tasks = Repository.get_tasks(project_id)
        completed_tasks_count = len([t for t in tasks if t.get("status") == "done"])

        snapshot_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "gini_coefficient": contributions.gini_coefficient,
            "equity_score": contributions.equity_score,
            "total_contributions": contributions.total_contributions,
            "completed_tasks": completed_tasks_count,
            "total_tasks": len(tasks),
            "silo_count": silos_and_gaps.silo_count,
            "gap_count": silos_and_gaps.gap_count,
            "node_count": graph.node_count,
            "edge_count": graph.edge_count,
            "insight_count": len(insights),
            "recommendation_count": len(recommendations),
        }

        snapshot_record = {
            "id": f"snap-{uuid.uuid4().hex[:8]}",
            "project_id": project_id,
            "analysis_type": "full_project_analysis",
            "data": snapshot_data,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        Repository.save_snapshot(project_id, snapshot_record)

        return {
            "project_id": project_id,
            "analyzed_at": snapshot_data["timestamp"],
            "contributions": contributions.model_dump(),
            "knowledge_graph": graph.model_dump(),
            "silos_and_gaps": silos_and_gaps.model_dump(),
            "discussions": discussions_intel,
            "insights": [i.model_dump() for i in insights],
            "recommendations": [r.model_dump() for r in recommendations],
            "blueprint": blueprint.model_dump(),
            "snapshot": snapshot_record,
        }
