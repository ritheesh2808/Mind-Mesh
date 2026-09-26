from typing import Dict, Any
from fastapi import HTTPException
from backend.schemas import ActivityImpactResponse
from backend.repository import Repository
from backend.services.contribution_engine import ContributionEngine
from backend.services.knowledge_graph_engine import KnowledgeGraphEngine
from backend.services.silo_detector import SiloDetector

class ImpactEngine:
    @staticmethod
    def capture_project_metrics(project_id: str) -> Dict[str, Any]:
        analytics = ContributionEngine.analyze_contributions(project_id)
        tasks = Repository.get_tasks(project_id)
        discussions = Repository.get_discussions(project_id)
        graph = KnowledgeGraphEngine.generate_and_persist_graph(project_id, persist=False)
        silos = SiloDetector.detect_silos_and_gaps(project_id)

        return {
            "gini_coefficient": analytics.gini_coefficient,
            "equity_score": analytics.equity_score,
            "total_contributions": analytics.total_contributions,
            "active_contributors": analytics.active_contributors,
            "participation_rate": analytics.participation_rate,
            "completed_tasks": sum(task.get("status") in ("done", "completed") for task in tasks),
            "total_tasks": len(tasks),
            "discussion_count": len(discussions),
            "knowledge_nodes": graph.node_count,
            "knowledge_edges": graph.edge_count,
            "silo_count": silos.silo_count,
        }

    @staticmethod
    def calculate_activity_impact(project_id: str, activity_id: str) -> ActivityImpactResponse:
        activity = Repository.get_activity(project_id, activity_id)
        if not activity:
            raise HTTPException(status_code=404, detail="Activity not found")
        if activity.get("status") != "completed":
            raise HTTPException(status_code=409, detail="Activity impact is available after completion")

        title = activity.get("title", "Collaboration Session")
        participants = activity.get("participants", [])
        outcome = Repository.get_activity_outcome(project_id, activity_id)
        before_snap = (outcome or {}).get("before_snapshot")
        after_snap = (outcome or {}).get("after_snapshot")
        if not isinstance(before_snap, dict) or not isinstance(after_snap, dict):
            raise HTTPException(status_code=409, detail="Activity has no persisted before/after metrics")

        before_gini = float(before_snap.get("gini_coefficient", 0.0))
        after_gini = float(after_snap.get("gini_coefficient", 0.0))
        gini_delta = round(after_gini - before_gini, 4)

        before_equity = float(before_snap.get("equity_score", 0.0))
        after_equity = float(after_snap.get("equity_score", 0.0))
        equity_delta = round(after_equity - before_equity, 2)

        before_done = int(before_snap.get("completed_tasks", 0))
        after_done = int(after_snap.get("completed_tasks", 0))
        tasks_delta = after_done - before_done

        before_contrib = int(before_snap.get("total_contributions", 0))
        after_contrib = int(after_snap.get("total_contributions", 0))
        contrib_delta = after_contrib - before_contrib

        metric_changes = {
            "gini_delta": gini_delta,
            "equity_score_delta": equity_delta,
            "completed_tasks_delta": tasks_delta,
            "total_contributions_delta": contrib_delta,
            "improved_equity": gini_delta < 0,
        }

        # Construct deterministic narrative
        narrative_parts = [
            f"Activity '{title}' engaged {len(participants)} team member(s) ({', '.join(participants) if participants else 'cross-functional'}).",
        ]
        narrative_parts.append(
            f"After the activity, the Gini coefficient changed by {gini_delta:+.3f} and the equity score changed by {equity_delta:+.1f} points. These are observed changes, not proof of causation."
        )

        if tasks_delta > 0:
            narrative_parts.append(f"{tasks_delta} linked deliverable(s) progressed to completed status.")

        narrative_summary = " ".join(narrative_parts)

        return ActivityImpactResponse(
            activity_id=activity_id,
            project_id=project_id,
            activity_title=title,
            before_snapshot=before_snap,
            after_snapshot=after_snap,
            metric_changes=metric_changes,
            narrative_summary=narrative_summary,
        )
