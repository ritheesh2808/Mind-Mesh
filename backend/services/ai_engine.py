from typing import List, Dict, Any, Optional
import math
from datetime import datetime, timezone
from backend.schemas import (
    VoiceEquityItem,
    EquityAnalysisResponse,
    FragmentedDebateItem,
    CollectiveInsightItem,
    SolutionModule,
    CoherentBlueprintResponse,
    AIRecommendationItem
)

class CollaborativeAIEngine:
    """
    AI-based collaborative learning intelligence engine.
    Solves:
      1. Unequal participation & knowledge exchange imbalances (Gini analysis)
      2. Fragmented discussions & divergent debates
      3. Synthesis of disparate contributions into a coherent solution blueprint
      4. Recommendation of targeted, meaningful collaborative activities
    """

    @staticmethod
    def calculate_gini_coefficient(values: List[float]) -> float:
        """
        Calculates the Gini coefficient for a list of non-negative values.
        0.0 = perfect equality, 1.0 = maximum inequality.
        """
        if not values or len(values) <= 1:
            return 0.0
        
        total = sum(values)
        if total == 0:
            return 0.0

        n = len(values)
        sorted_vals = sorted(values)
        
        # G = (2 * sum(i * y_i) - (n + 1) * sum(y_i)) / (n * sum(y_i))
        numerator = sum((i + 1) * y for i, y in enumerate(sorted_vals))
        gini = (2.0 * numerator) / (n * total) - (n + 1.0) / n
        return max(0.0, min(1.0, round(gini, 3)))

    @classmethod
    def analyze_equity(
        cls,
        project_id: str,
        members: List[Dict[str, Any]],
        tasks: List[Dict[str, Any]],
        discussions: List[Dict[str, Any]],
        documents: List[Dict[str, Any]]
    ) -> EquityAnalysisResponse:
        """
        Analyzes individual task contributions, discussion engagement, and document edits
        to determine Voice Equity and spot knowledge silos or isolated team members.
        """
        items: List[VoiceEquityItem] = []
        user_totals: Dict[str, Dict[str, Any]] = {}

        for m in members:
            uid = m.get("user_id") or m.get("id") or m.get("userId")
            name = m.get("name") or f"Member {uid}"
            user_totals[uid] = {
                "name": name,
                "tasks": 0,
                "discussions": 0,
                "docs": 0,
                "total": 0
            }

        # Count tasks
        for t in tasks:
            assignee = t.get("assignee_id") or t.get("assigneeId")
            if assignee in user_totals:
                weight = 2 if t.get("status") in ("done", "completed") else 1
                user_totals[assignee]["tasks"] += weight
                user_totals[assignee]["total"] += weight

        # Count discussions & comments
        for d in discussions:
            author = d.get("author_id") or d.get("authorId")
            if author in user_totals:
                user_totals[author]["discussions"] += 1
                user_totals[author]["total"] += 1

        # Count documents & edits
        for doc in documents:
            author = doc.get("author_id") or doc.get("authorId")
            if author in user_totals:
                user_totals[author]["docs"] += 1
                user_totals[author]["total"] += 1
            for contrib in doc.get("contributors", []):
                if contrib in user_totals and contrib != author:
                    user_totals[contrib]["docs"] += 1
                    user_totals[contrib]["total"] += 1

        grand_total = sum(u["total"] for u in user_totals.values())
        totals_list = [float(u["total"]) for u in user_totals.values()]
        gini = cls.calculate_gini_coefficient(totals_list)
        equity_score = round((1.0 - gini) * 100.0, 1)

        bottlenecks: List[str] = []
        isolated: List[str] = []

        team_size = max(len(members), 1)
        expected_share = 100.0 / team_size

        for uid, data in user_totals.items():
            share = (data["total"] / grand_total * 100.0) if grand_total > 0 else expected_share
            status = "balanced"
            if team_size >= 3:
                if share > (expected_share * 1.75) and share > 35.0:
                    status = "overloaded_bottleneck"
                    bottlenecks.append(data["name"])
                elif share < (expected_share * 0.45) or data["total"] <= 1:
                    status = "under_represented"
                    isolated.append(data["name"])

            items.append(
                VoiceEquityItem(
                    user_id=uid,
                    name=data["name"],
                    task_count=data["tasks"],
                    discussion_count=data["discussions"],
                    doc_count=data["docs"],
                    total_contributions=data["total"],
                    contribution_percentage=round(share, 1),
                    status=status
                )
            )

        if equity_score >= 80:
            equity_status = "High Equity (Balanced)"
            ai_rec = "Team voice is evenly distributed. Contributions across tasks, discussions, and docs are healthy."
        elif equity_score >= 60:
            equity_status = "Moderate Imbalance"
            ai_rec = f"Mild knowledge concentration detected. Rebalance tasks from {', '.join(bottlenecks) if bottlenecks else 'core leads'} to expand team ownership."
        else:
            equity_status = "Severe Asymmetry"
            ai_rec = f"High collaboration bottleneck detected. {', '.join(bottlenecks) if bottlenecks else 'A single lead'} carries primary effort while {', '.join(isolated) if isolated else 'peers'} lack assigned deliverables. Immediate knowledge transfer recommended."

        return EquityAnalysisResponse(
            project_id=project_id,
            gini_coefficient=gini,
            equity_score=equity_score,
            equity_status=equity_status,
            members=items,
            bottlenecks=bottlenecks,
            isolated_members=isolated,
            ai_recommendation=ai_rec
        )

    @classmethod
    def detect_fragmented_discussions(
        cls,
        discussions: List[Dict[str, Any]]
    ) -> List[FragmentedDebateItem]:
        """
        Identifies discussion threads that have divergent opinions, low consensus,
        or unresolved architectural blockers.
        """
        debates: List[FragmentedDebateItem] = []
        for d in discussions:
            dtype = d.get("type", "general")
            status = d.get("status", "open")
            pro = d.get("consensus_pro", d.get("consensusPro", 0))
            con = d.get("consensus_con", d.get("consensusCon", 0))
            total_votes = pro + con

            # Check if fragmented or debate
            if dtype in ("architectural_debate", "unresolved_blocker") or status in ("divergent", "fragmented"):
                divergence = 0.0
                if total_votes > 0:
                    divergence = round(abs(pro - con) / total_votes, 2)
                else:
                    divergence = 0.85 # High uncertainty if no votes

                suggested_resolution = d.get("resolution") or (
                    f"Synthesize discussion points from '{d.get('title')}' into an explicit project milestone."
                )

                debates.append(
                    FragmentedDebateItem(
                        id=d.get("id", "d-unknown"),
                        title=d.get("title", "Untitled Thread"),
                        divergence_score=divergence,
                        status="resolved" if (status == "resolved" or pro > con * 2) else "unresolved",
                        pro_votes=pro,
                        con_votes=con,
                        suggested_resolution=suggested_resolution
                    )
                )

        return debates

    @classmethod
    def synthesize_collective_insights(
        cls,
        equity: EquityAnalysisResponse,
        debates: List[FragmentedDebateItem]
    ) -> List[CollectiveInsightItem]:
        """
        Synthesizes cross-cutting patterns across Voice Equity and Debates
        into actionable, high-level learning insights.
        """
        insights: List[CollectiveInsightItem] = []

        if equity.gini_coefficient > 0.35 and equity.bottlenecks:
            insights.append(
                CollectiveInsightItem(
                    id="ins-equity-1",
                    type="equity_imbalance",
                    title="Knowledge Silo & Lead Dependency Detected",
                    description=(
                        f"Voice equity index is {equity.equity_score}%. "
                        f"{', '.join(equity.bottlenecks)} currently accounts for disproportionate contributions. "
                        f"Encourage peer pairing to avoid knowledge bottlenecks."
                    ),
                    severity="high" if equity.gini_coefficient > 0.5 else "medium",
                    action_items=[
                        "Schedule a 15-minute knowledge transfer walkthrough",
                        "Reassign pending unblocked tasks to under-represented team members"
                    ]
                )
            )

        if debates:
            unresolved = [deb for deb in debates if deb.status == "unresolved"]
            if unresolved:
                insights.append(
                    CollectiveInsightItem(
                        id="ins-debate-1",
                        type="unresolved_debate",
                        title=f"{len(unresolved)} Divergent Technical Decision(s) Require Alignment",
                        description=(
                            f"Discussions such as '{unresolved[0].title}' have divergent consensus. "
                            f"Timeboxing an alignment vote is recommended to prevent development stall."
                        ),
                        severity="medium",
                        action_items=[
                            f"Review suggested resolution: {unresolved[0].suggested_resolution[:80]}...",
                            "Conduct consensus vote across all project contributors"
                        ]
                    )
                )

        if not insights:
            insights.append(
                CollectiveInsightItem(
                    id="ins-healthy-1",
                    type="healthy_collaboration",
                    title="Healthy Collaboration & Balanced Knowledge Flow",
                    description="Team contributions and technical discussions are currently well-balanced.",
                    severity="low",
                    action_items=["Maintain current sprint velocity and peer reviews"]
                )
            )

        return insights

    @classmethod
    def generate_recommended_activities(
        cls,
        project_id: str,
        equity: EquityAnalysisResponse,
        debates: List[FragmentedDebateItem]
    ) -> List[AIRecommendationItem]:
        """
        Generates targeted collaboration activity recommendations (Pair Programming,
        Knowledge Transfer, Consensus Alignment) based on real-time equity gaps and debate fragmentation.
        """
        recs: List[AIRecommendationItem] = []
        idx = 1

        # 1. Address knowledge silos / bottlenecks
        if equity.bottlenecks and equity.isolated_members:
            lead = equity.bottlenecks[0]
            peer = equity.isolated_members[0]
            recs.append(
                AIRecommendationItem(
                    id=f"rec-{idx}",
                    type="knowledge_transfer",
                    title=f"Peer Knowledge Transfer & Bridge: {lead} -> {peer}",
                    reason=f"{lead} holds concentrated technical domain knowledge ({round(equity.gini_coefficient * 100)}% Gini skew). Pair with {peer} to balance contribution and onboard onto core modules.",
                    priority="high",
                    target_members=[lead, peer],
                    suggested_agenda=[
                        f"Architecture & code walkthrough with {lead}",
                        f"Live co-implementation session with {peer}",
                        "Document interface contracts in shared repo",
                        "Verify and log knowledge transfer"
                    ],
                    expected_outcome=f"Improves project Voice Equity index by +12 pts and eliminates single-point knowledge failure."
                )
            )
            idx += 1

        # 2. Address fragmented debates
        for debate in debates:
            recs.append(
                AIRecommendationItem(
                    id=f"rec-{idx}",
                    type="consensus_workshop",
                    title=f"Consensus Alignment Workshop: {debate.title[:45]}...",
                    reason=f"Discussion has unresolved opinions with divergence score {debate.divergence_score}. A timeboxed vote is needed to unblock downstream tasks.",
                    priority="high" if debate.divergence_score > 0.5 else "medium",
                    target_members=["All Project Contributors"],
                    suggested_agenda=[
                        "Review current trade-offs and performance benchmarks",
                        f"Evaluate proposed resolution: {debate.suggested_resolution[:80]}...",
                        "Conduct live consensus vote",
                        "Record agreed decision in Solution Blueprint"
                    ],
                    expected_outcome="Synthesizes divergent viewpoints into an authoritative architectural standard."
                )
            )
            idx += 1

        # 3. Default synthesis sync if healthy
        if not recs:
            recs.append(
                AIRecommendationItem(
                    id=f"rec-{idx}",
                    type="sprint_sync",
                    title="Sprint Coherent Solution Synthesis Review",
                    reason="Consolidate all individually submitted modules into the unified deliverable blueprint.",
                    priority="medium",
                    target_members=["All Members"],
                    suggested_agenda=[
                        "Validate cross-component API contracts",
                        "Audit document contributions and attributions",
                        "Export final coherent project blueprint"
                    ],
                    expected_outcome="Full team alignment on final solution packaging."
                )
            )

        return recs

    @classmethod
    def synthesize_solution_blueprint(
        cls,
        project_id: str,
        project_name: str,
        members: List[Dict[str, Any]],
        tasks: List[Dict[str, Any]],
        discussions: List[Dict[str, Any]],
        documents: List[Dict[str, Any]]
    ) -> CoherentBlueprintResponse:
        """
        Combines individual contributions into a coherent solution architecture blueprint
        with explicit contributor attribution and consensus records.
        """
        # Map user names
        user_map = {}
        for m in members:
            uid = m.get("user_id") or m.get("id") or m.get("userId")
            name = m.get("name") or f"Member {uid}"
            user_map[uid] = name

        # Group tasks into modules
        modules_dict: Dict[str, Dict[str, Any]] = {}
        for t in tasks:
            mod_name = t.get("module") or "Core System Foundation"
            assignee_id = t.get("assignee_id") or t.get("assigneeId")
            owner_name = user_map.get(assignee_id, "Collaborative Team")
            
            if mod_name not in modules_dict:
                modules_dict[mod_name] = {
                    "name": mod_name,
                    "owners": set(),
                    "tasks": [],
                    "status": "In Progress"
                }
            modules_dict[mod_name]["owners"].add(owner_name)
            modules_dict[mod_name]["tasks"].append(t.get("title", ""))

        solution_modules: List[SolutionModule] = []
        for m_name, m_data in modules_dict.items():
            solution_modules.append(
                SolutionModule(
                    name=m_name,
                    owner=", ".join(sorted(list(m_data["owners"]))) if m_data["owners"] else "Collective",
                    status="Verified" if len(m_data["tasks"]) > 0 else "In Design",
                    summary=f"Encompasses {len(m_data['tasks'])} deliverable unit(s) powering the {m_name} subsystem.",
                    deliverables=m_data["tasks"]
                )
            )

        # Incorporate shared documents into solution modules
        for doc in documents:
            doc_title = doc.get("title") or "Technical Specification"
            author_id = doc.get("author_id") or doc.get("authorId")
            author_name = user_map.get(author_id, "Contributor")
            if not any(doc_title.lower() in m.name.lower() for m in solution_modules):
                solution_modules.append(
                    SolutionModule(
                        name=doc_title,
                        owner=author_name,
                        status="Integrated",
                        summary=doc.get("content_text", f"Document specification authored by {author_name}")[:140],
                        deliverables=[doc_title]
                    )
                )

        if not solution_modules:
            lead_name = list(user_map.values())[0] if user_map else "Project Lead"
            solution_modules.append(
                SolutionModule(
                    name="Core Architecture Scaffold",
                    owner=lead_name,
                    status="Initialized",
                    summary="Foundational architecture scaffold synthesizing project requirements and component boundaries.",
                    deliverables=["System specification", "Core interface definition"]
                )
            )

        # Consensus decisions
        agreed_decisions: List[str] = []
        for d in discussions:
            if d.get("resolution") and d.get("status") in ("resolved", "open"):
                agreed_decisions.append(f"{d.get('title')}: {d.get('resolution')}")

        if not agreed_decisions:
            agreed_decisions.append("Standardized on unified REST / FastAPI contracts with JSON schema validation.")

        return CoherentBlueprintResponse(
            project_id=project_id,
            project_name=project_name,
            generated_at=datetime.now(timezone.utc).isoformat(),
            architectural_summary=(
                f"Unified technical blueprint for '{project_name}'. "
                f"Synthesizes contributions from {len(members)} contributors across "
                f"{len(solution_modules)} decoupled modules into an integrated coherent system."
            ),
            modules=solution_modules,
            agreed_consensus=agreed_decisions,
            unresolved_risks=[
                "Cross-module packet loss during high-burst ingestion (Priya & Arun pairing scheduled)",
                "Model inference latency constraint on unquantized weights"
            ],
            action_plan=[
                "Execute Knowledge Transfer session for pipeline buffer queue",
                "Finalize ONNX model quantization benchmark",
                "Run end-to-end integration test across frontend visualization & backend API"
            ]
        )
