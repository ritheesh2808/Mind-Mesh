from fastapi import APIRouter, HTTPException
from typing import List
from backend.schemas import (
    EquityAnalysisResponse,
    FragmentedDebateItem,
    AIRecommendationItem,
    CoherentBlueprintResponse
)
from backend.repository import Repository
from backend.services.ai_engine import CollaborativeAIEngine

router = APIRouter(prefix="/intelligence", tags=["AI Learning Intelligence"])

@router.get("/equity/{project_id}", response_model=EquityAnalysisResponse)
def get_voice_equity_analysis(project_id: str):
    """
    Analyzes group contributions across tasks, discussions, and documents.
    Calculates Gini coefficient and flags knowledge silos or unequal participation.
    """
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
    discussions = Repository.get_discussions(project_id)
    return CollaborativeAIEngine.detect_fragmented_discussions(discussions)

@router.get("/recommendations/{project_id}", response_model=List[AIRecommendationItem])
def get_collaboration_recommendations(project_id: str):
    """
    Recommends targeted collaboration activities (Pair Programming, Knowledge Transfer,
    Consensus Alignment) based on real-time equity gaps and debate fragmentation.
    """
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
