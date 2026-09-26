from typing import List, Dict, Any, Optional
import math
from datetime import datetime, timezone
from backend.schemas import (
    ContributionItem,
    ContributionSummary,
    ContributionAnalyticsResponse
)

class ContributionEngine:
    """
    Deterministic contribution event and participation equity analytics engine.
    Computes Gini coefficient, Voice Equity index, activity frequency, and participation concentration.
    """

    @staticmethod
    def calculate_gini(values: List[float]) -> float:
        """
        Calculates mathematical Gini coefficient for non-negative values.
        0.0 = perfect equality, 1.0 = total inequality.
        """
        if not values or len(values) <= 1:
            return 0.0
        total = sum(values)
        if total == 0:
            return 0.0
        n = len(values)
        sorted_vals = sorted(values)
        numerator = sum((i + 1) * y for i, y in enumerate(sorted_vals))
        gini = (2.0 * numerator) / (n * total) - (n + 1.0) / n
        return max(0.0, min(1.0, round(gini, 3)))

    @classmethod
    def analyze_contributions(
        cls,
        project_id: str,
        members: Optional[List[Dict[str, Any]]] = None,
        contributions: Optional[List[Dict[str, Any]]] = None,
        tasks: Optional[List[Dict[str, Any]]] = None,
        discussions: Optional[List[Dict[str, Any]]] = None,
        documents: Optional[List[Dict[str, Any]]] = None
    ) -> ContributionAnalyticsResponse:
        """
        Aggregates explicit contribution events (and synthesizes from tasks/discussions/documents
        if explicit events are not yet logged) to compute comprehensive, explainable equity metrics.
        """
        from backend.repository import Repository
        if members is None:
            members = Repository.get_project_members(project_id)
        if contributions is None:
            contributions = Repository.get_contributions(project_id)
        if tasks is None:
            tasks = Repository.get_tasks(project_id)
        if discussions is None:
            discussions = Repository.get_discussions(project_id)
        if documents is None:
            documents = Repository.get_documents(project_id)

        user_stats: Dict[str, Dict[str, Any]] = {}
        for m in members:
            uid = str(m.get("user_id") or m.get("id") or m.get("userId"))
            name = m.get("name") or f"Member {uid}"
            user_stats[uid] = {
                "name": name,
                "weight": 0,
                "count": 0,
                "by_type": {
                    "task": 0,
                    "discussion": 0,
                    "document": 0,
                    "activity": 0,
                    "vote": 0
                }
            }

        # 1. Process explicit contributions if available
        if contributions:
            for c in contributions:
                uid = str(c.get("user_id", ""))
                if uid not in user_stats:
                    user_stats[uid] = {
                        "name": f"User {uid}",
                        "weight": 0,
                        "count": 0,
                        "by_type": {"task": 0, "discussion": 0, "document": 0, "activity": 0, "vote": 0}
                    }
                w = int(c.get("weight", 1))
                etype = str(c.get("entity_type", "task")).lower()
                user_stats[uid]["weight"] += w
                user_stats[uid]["count"] += 1
                if etype in user_stats[uid]["by_type"]:
                    user_stats[uid]["by_type"][etype] += 1
                else:
                    user_stats[uid]["by_type"][etype] = 1

        # 2. Synthesize baseline contributions from tasks, discussions, documents if contributions table is sparse
        if not contributions or sum(u["weight"] for u in user_stats.values()) == 0:
            for t in tasks:
                assignee = str(t.get("assignee_id") or t.get("assigneeId") or "")
                if assignee in user_stats:
                    w = 3 if t.get("status") in ("done", "completed") else 1
                    user_stats[assignee]["weight"] += w
                    user_stats[assignee]["count"] += 1
                    user_stats[assignee]["by_type"]["task"] += 1

            for d in discussions:
                author = str(d.get("author_id") or d.get("authorId") or "")
                if author in user_stats:
                    user_stats[author]["weight"] += 2
                    user_stats[author]["count"] += 1
                    user_stats[author]["by_type"]["discussion"] += 1

            for doc in documents:
                author = str(doc.get("author_id") or doc.get("authorId") or "")
                if author in user_stats:
                    user_stats[author]["weight"] += 2
                    user_stats[author]["count"] += 1
                    user_stats[author]["by_type"]["document"] += 1
                for contrib in doc.get("contributors", []):
                    c_str = str(contrib)
                    if c_str in user_stats and c_str != author:
                        user_stats[c_str]["weight"] += 1
                        user_stats[c_str]["count"] += 1
                        user_stats[c_str]["by_type"]["document"] += 1

        grand_total_weight = sum(u["weight"] for u in user_stats.values())
        grand_total_count = sum(u["count"] for u in user_stats.values())
        team_size = max(len(members), 1)
        expected_share = 100.0 / team_size

        member_summaries: List[ContributionSummary] = []
        inactive_members: List[str] = []
        concentrated_members: List[str] = []

        for uid, data in user_stats.items():
            pct = round((data["weight"] / grand_total_weight * 100.0), 1) if grand_total_weight > 0 else round(expected_share, 1)
            status = "balanced"
            if team_size >= 3:
                if (pct > (expected_share * 1.75) and pct > 35.0) or (grand_total_weight > 0 and data["weight"] / grand_total_weight > 0.5):
                    status = "overloaded_bottleneck"
                    concentrated_members.append(data["name"])
                elif pct < (expected_share * 0.45) or data["weight"] <= 1:
                    status = "under_represented"
                    inactive_members.append(data["name"])

            member_summaries.append(
                ContributionSummary(
                    user_id=uid,
                    name=data["name"],
                    total_weight=data["weight"],
                    count=data["count"],
                    percentage=pct,
                    by_type=data["by_type"],
                    status=status
                )
            )

        weights = [float(u["weight"]) for u in user_stats.values()]
        gini = cls.calculate_gini(weights)
        equity_score = round(max(0.0, min(100.0, (1.0 - gini) * 100.0)), 1)

        if equity_score >= 80:
            equity_interp = "Balanced Voice Equity"
        elif equity_score >= 60:
            equity_interp = "Moderate Contribution Asymmetry"
        else:
            equity_interp = "Severe Knowledge Concentration"

        active_count = len([u for u in user_stats.values() if u["count"] > 0])
        part_rate = round(active_count / team_size, 2) if team_size > 0 else 1.0

        recent_items: List[ContributionItem] = []
        for c in (contributions[:10] if contributions else []):
            recent_items.append(
                ContributionItem(
                    id=str(c.get("id")),
                    project_id=str(c.get("project_id", project_id)),
                    user_id=str(c.get("user_id")),
                    action_type=str(c.get("action_type", "")),
                    entity_type=str(c.get("entity_type", "")),
                    entity_id=str(c.get("entity_id", "")),
                    weight=int(c.get("weight", 1)),
                    metadata=c.get("metadata", {}) or {},
                    created_at=c.get("created_at")
                )
            )

        return ContributionAnalyticsResponse(
            project_id=project_id,
            total_contributions=grand_total_count,
            active_contributors=active_count,
            participation_rate=part_rate,
            gini_coefficient=gini,
            equity_score=equity_score,
            equity_interpretation=equity_interp,
            member_summaries=member_summaries,
            inactive_members=inactive_members,
            concentrated_members=concentrated_members,
            recent_events=recent_items
        )
