from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
from backend.schemas import (
    EquityAnalysisResponse,
    FragmentedDebateItem,
    AIRecommendationItem,
    CoherentBlueprintResponse,
    ContributionAnalyticsResponse,
    KnowledgeGraphResponse,
    SilosAndGapsResponse,
    PersistentInsightResponse,
    DetailedRecommendationResponse,
    BlueprintPersistentResponse,
    AnalysisSnapshotResponse,
    ActivityImpactResponse,
    DiscussionIntelligenceItem,
)
from backend.repository import Repository
from backend.services.ai_engine import CollaborativeAIEngine
from backend.services.contribution_engine import ContributionEngine
from backend.services.knowledge_graph_engine import KnowledgeGraphEngine
from backend.services.silo_detector import SiloDetector
from backend.services.discussion_engine import DiscussionEngine
from backend.services.insights_engine import InsightsEngine
from backend.services.recommendation_engine import RecommendationEngine
from backend.services.blueprint_engine import BlueprintEngine
from backend.services.impact_engine import ImpactEngine
from backend.services.analysis_pipeline import AnalysisPipeline

router = APIRouter(prefix="/intelligence", tags=["AI Learning Intelligence"])

# ---------------------------------------------------------------------------
# Backward-Compatible Endpoints
# ---------------------------------------------------------------------------

@router.get("/equity/{project_id}", response_model=EquityAnalysisResponse)
def get_voice_equity_analysis(project_id: str):
    """
    Analyzes group contributions across tasks, discussions, and documents.
    Calculates Gini coefficient and flags knowledge silos or unequal participation.
    """
    project = Repository.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    members = Repository.get_project_members(project_id)
    tasks = Repository.get_tasks(project_id)
    discussions = Repository.get_discussions(project_id)
    documents = Repository.get_documents(project_id)

    return CollaborativeAIEngine.analyze_equity(
        project_id=project_id,
        members=members,
        tasks=tasks,
        discussions=discussions,
        documents=documents
    )

@router.get("/debates/{project_id}", response_model=List[FragmentedDebateItem])
def get_fragmented_debates(project_id: str):
    """
    Identifies fragmented discussions, unaligned architectural debates,
    and calculates community divergence scores.
    """
    project = Repository.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    discussions = Repository.get_discussions(project_id)
    return CollaborativeAIEngine.detect_fragmented_discussions(discussions)

@router.get("/recommendations/{project_id}", response_model=List[AIRecommendationItem])
def get_collaboration_recommendations(project_id: str):
    """
    Recommends targeted collaboration activities (Pair Programming, Knowledge Transfer,
    Consensus Alignment) based on real-time equity gaps and debate fragmentation.
    """
    project = Repository.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    members = Repository.get_project_members(project_id)
    tasks = Repository.get_tasks(project_id)
    discussions = Repository.get_discussions(project_id)
    documents = Repository.get_documents(project_id)

    equity = CollaborativeAIEngine.analyze_equity(
        project_id=project_id,
        members=members,
        tasks=tasks,
        discussions=discussions,
        documents=documents
    )
    debates = CollaborativeAIEngine.detect_fragmented_discussions(discussions)
    return CollaborativeAIEngine.generate_recommended_activities(project_id, equity, debates)

@router.get("/blueprint/{project_id}", response_model=CoherentBlueprintResponse)
def get_coherent_solution_blueprint(project_id: str):
    """
    Synthesizes individual student contributions, documents, and agreed decisions
    into an integrated, coherent solution blueprint with clear attributions.
    """
    project = Repository.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    members = Repository.get_project_members(project_id)
    tasks = Repository.get_tasks(project_id)
    discussions = Repository.get_discussions(project_id)
    documents = Repository.get_documents(project_id)

    return CollaborativeAIEngine.synthesize_solution_blueprint(
        project_id=project_id,
        project_name=project.get("title") or project.get("name", "Project"),
        members=members,
        tasks=tasks,
        discussions=discussions,
        documents=documents
    )

# ---------------------------------------------------------------------------
# Phase 3 Deterministic ED-03 Intelligence Endpoints
# ---------------------------------------------------------------------------

@router.get("/contributions/{project_id}", response_model=ContributionAnalyticsResponse)
def get_contribution_analytics(project_id: str):
    """
    Calculates detailed contribution analytics, Gini coefficient, voice equity breakdown,
    and identifies concentrated or inactive members.
    """
    project = Repository.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return ContributionEngine.analyze_contributions(project_id)

@router.get("/knowledge/{project_id}", response_model=KnowledgeGraphResponse)
def get_knowledge_graph(project_id: str):
    """
    Returns the multi-relational knowledge graph connecting team members, skills,
    topics, tasks, documents, discussions, and decisions.
    """
    project = Repository.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return KnowledgeGraphEngine.generate_and_persist_graph(project_id)

@router.get("/silos/{project_id}", response_model=SilosAndGapsResponse)
def get_silos_and_gaps(project_id: str):
    """
    Detects single-owner module silos, unreviewed document silos, isolated members,
    and missing skills/knowledge gaps with actionable evidence.
    """
    project = Repository.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return SiloDetector.detect_silos_and_gaps(project_id)

@router.get("/insights/{project_id}", response_model=List[PersistentInsightResponse])
def get_collective_insights(project_id: str):
    """
    Generates and returns persistent collective insights with structured evidence citations.
    """
    project = Repository.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return InsightsEngine.generate_and_persist_insights(project_id)

@router.get("/detailed-recommendations/{project_id}", response_model=List[DetailedRecommendationResponse])
def get_detailed_recommendations(project_id: str):
    """
    Generates actionable pair recommendations with exact participants, evidence sources,
    and structured agendas.
    """
    project = Repository.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return RecommendationEngine.generate_recommendations(project_id, persist=True)

@router.get("/persistent-blueprint/{project_id}", response_model=BlueprintPersistentResponse)
def get_persistent_blueprint(project_id: str):
    """
    Retrieves or generates a versioned, persistent solution blueprint.
    """
    project = Repository.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return BlueprintEngine.generate_blueprint(project_id, persist=True)

@router.get("/snapshots/{project_id}", response_model=List[AnalysisSnapshotResponse])
def get_project_snapshots(project_id: str):
    """
    Retrieves historical analysis snapshots for timeline tracking and impact measurement.
    """
    project = Repository.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    snapshots = Repository.get_snapshots(project_id)
    return [AnalysisSnapshotResponse(**s) for s in snapshots]

@router.post("/snapshots/{project_id}", response_model=AnalysisSnapshotResponse)
def create_project_snapshot(project_id: str, payload: Optional[Dict[str, Any]] = None):
    """
    Creates and records a snapshot of current project metrics.
    """
    project = Repository.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    analytics = ContributionEngine.analyze_contributions(project_id)
    tasks = Repository.get_tasks(project_id)
    completed_count = len([t for t in tasks if t.get("status") == "done"])

    data = (payload or {}).get("data") or {
        "gini_coefficient": analytics.gini_coefficient,
        "equity_score": analytics.equity_score,
        "total_contributions": analytics.total_contributions,
        "completed_tasks": completed_count,
        "total_tasks": len(tasks),
    }

    import uuid
    from datetime import datetime, timezone
    snapshot_record = {
        "id": f"snap-{uuid.uuid4().hex[:8]}",
        "project_id": project_id,
        "analysis_type": (payload or {}).get("analysis_type", "manual_snapshot"),
        "data": data,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    saved = Repository.save_snapshot(project_id, snapshot_record)
    return AnalysisSnapshotResponse(**saved)

@router.post("/analyze/{project_id}")
def trigger_full_project_analysis(project_id: str):
    """
    Master re-analysis pipeline executing all intelligence engines and recording a snapshot.
    """
    project = Repository.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return AnalysisPipeline.run_project_analysis(project_id)

@router.get("/impact/{project_id}/{activity_id}", response_model=ActivityImpactResponse)
def get_activity_impact(project_id: str, activity_id: str):
    """
    Measures and returns before/after impact of a completed collaboration activity.
    """
    project = Repository.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return ImpactEngine.calculate_activity_impact(project_id, activity_id)

@router.get("/discussions-intel/{project_id}", response_model=List[DiscussionIntelligenceItem])
def get_discussions_intelligence(project_id: str):
    """
    Analyzes all discussions for a project: consensus status, vote divergence, and unresolved questions.
    """
    project = Repository.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    discussions = Repository.get_discussions(project_id)
    return [DiscussionEngine.analyze_discussion(d) for d in discussions]
