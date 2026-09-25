from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

# -----------------------------------------------------------------------------
# User Profile Schemas
# -----------------------------------------------------------------------------
class ProfileBase(BaseModel):
    id: str
    name: str
    email: str
    avatar: Optional[str] = None
    department: Optional[str] = "Computer Science"
    role: Optional[str] = "Student"
    skills: List[str] = []
    bio: Optional[str] = None

class ProfileResponse(ProfileBase):
    created_at: Optional[str] = None

# -----------------------------------------------------------------------------
# Project Schemas
# -----------------------------------------------------------------------------
class ProjectMemberSchema(BaseModel):
    user_id: str
    role: str = "Member"
    joined_at: Optional[str] = None

class ProjectBase(BaseModel):
    title: str
    description: str
    status: str = "in-progress"
    progress: int = 0
    deadline: Optional[str] = None
    skills_required: List[str] = []
    tags: List[str] = []

class ProjectCreate(ProjectBase):
    owner_id: str

class ProjectResponse(ProjectBase):
    id: str
    owner_id: Optional[str] = None
    members: List[ProjectMemberSchema] = []
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

# -----------------------------------------------------------------------------
# Discussion Schemas
# -----------------------------------------------------------------------------
class DiscussionBase(BaseModel):
    title: str
    content: str
    type: str = "general" # 'general' | 'architectural_debate' | 'unresolved_blocker'
    status: str = "open" # 'open' | 'resolved' | 'divergent' | 'fragmented'
    resolution: Optional[str] = None

class DiscussionCreate(DiscussionBase):
    project_id: str
    author_id: str

class DiscussionVoteRequest(BaseModel):
    vote: str # 'pro' | 'con'
    user_id: str

class DiscussionResponse(DiscussionBase):
    id: str
    project_id: str
    author_id: Optional[str] = None
    consensus_pro: int = 0
    consensus_con: int = 0
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

# -----------------------------------------------------------------------------
# Task Schemas
# -----------------------------------------------------------------------------
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "todo" # 'todo' | 'in-progress' | 'in-review' | 'done'
    priority: str = "medium" # 'low' | 'medium' | 'high' | 'urgent'
    due_date: Optional[str] = None
    module: Optional[str] = None

class TaskCreate(TaskBase):
    project_id: str
    assignee_id: Optional[str] = None

class TaskResponse(TaskBase):
    id: str
    project_id: str
    assignee_id: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

# -----------------------------------------------------------------------------
# Document Schemas
# -----------------------------------------------------------------------------
class DocumentBase(BaseModel):
    title: str
    content_text: Optional[str] = None
    file_type: str = "markdown"
    contributors: List[str] = []

class DocumentCreate(DocumentBase):
    project_id: str
    author_id: str

class DocumentResponse(DocumentBase):
    id: str
    project_id: str
    author_id: Optional[str] = None
    created_at: Optional[str] = None

# -----------------------------------------------------------------------------
# Collaboration Activity Schemas
# -----------------------------------------------------------------------------
class ActivityBase(BaseModel):
    title: str
    description: str
    type: str = "knowledge_transfer"
    participants: List[str] = []
    agenda: List[str] = []
    linked_task_id: Optional[str] = None
    notes: Optional[str] = None

class ActivityCreate(ActivityBase):
    project_id: str

class ActivityCompleteRequest(BaseModel):
    takeaways: Optional[str] = None
    notes: Optional[str] = None
    completed_task_ids: List[str] = []

class ActivityResponse(ActivityBase):
    id: str
    project_id: str
    status: str = "pending" # 'pending' | 'in-progress' | 'completed'
    takeaways: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[str] = None
    completed_at: Optional[str] = None

# -----------------------------------------------------------------------------
# Intelligence & Problem Statement AI Analysis Schemas
# -----------------------------------------------------------------------------
class VoiceEquityItem(BaseModel):
    user_id: str
    name: str
    task_count: int
    discussion_count: int
    doc_count: int
    total_contributions: int
    contribution_percentage: float
    status: str # 'balanced' | 'overloaded_bottleneck' | 'under_represented'

class EquityAnalysisResponse(BaseModel):
    project_id: str
    gini_coefficient: float
    equity_score: float
    equity_status: str # 'High Equity' | 'Moderate Imbalance' | 'Severe Asymmetry'
    members: List[VoiceEquityItem]
    bottlenecks: List[str]
    isolated_members: List[str]
    ai_recommendation: str

class FragmentedDebateItem(BaseModel):
    id: str
    title: str
    status: str
    divergence_score: float
    pro_votes: int
    con_votes: int
    suggested_resolution: str

class CollectiveInsightItem(BaseModel):
    id: str
    category: str
    title: str
    summary: str
    confidence: float
    contributors: List[str]

class SolutionModule(BaseModel):
    name: str
    owner: str
    status: str
    summary: str
    deliverables: List[str]

class CoherentBlueprintResponse(BaseModel):
    project_id: str
    project_name: str
    generated_at: str
    architectural_summary: str
    modules: List[SolutionModule]
    agreed_consensus: List[str]
    unresolved_risks: List[str]
    action_plan: List[str]

class AIRecommendationItem(BaseModel):
    id: str
    type: str
    title: str
    reason: str
    priority: str
    target_members: List[str]
    suggested_agenda: List[str]
    expected_outcome: str
