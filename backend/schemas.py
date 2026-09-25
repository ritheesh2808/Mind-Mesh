from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, AliasChoices, field_validator, model_validator
from datetime import datetime

class AppBaseModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

# -----------------------------------------------------------------------------
# User Profile Schemas
# -----------------------------------------------------------------------------
class ProfileBase(AppBaseModel):
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
class ProjectMemberSchema(AppBaseModel):
    user_id: str = Field(..., validation_alias=AliasChoices("user_id", "userId"))
    role: str = "Member"
    joined_at: Optional[str] = None
    name: Optional[str] = None

class ProjectBase(AppBaseModel):
    title: str = ""
    name: Optional[str] = None
    description: str = ""
    status: str = "in-progress"
    progress: int = 0
    deadline: Optional[str] = None
    skills_required: List[str] = Field([], validation_alias=AliasChoices("skills_required", "skillsRequired"))
    tags: List[str] = []

    @model_validator(mode="before")
    @classmethod
    def sync_title_and_name(cls, data: Any) -> Any:
        if isinstance(data, dict):
            val = data.get("title") or data.get("name") or "Untitled Project"
            data["title"] = val
            data["name"] = val
        return data

class ProjectCreate(ProjectBase):
    owner_id: str = Field(..., validation_alias=AliasChoices("owner_id", "ownerId"))

class ProjectResponse(ProjectBase):
    id: str
    owner_id: Optional[str] = None
    members: List[ProjectMemberSchema] = []
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

# -----------------------------------------------------------------------------
# Discussion Schemas
# -----------------------------------------------------------------------------
class DiscussionBase(AppBaseModel):
    title: str = ""
    content: str = ""
    type: str = "general" # 'general' | 'architectural_debate' | 'unresolved_blocker'
    status: str = "open" # 'open' | 'resolved' | 'divergent' | 'fragmented'
    resolution: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def sync_title_and_topic(cls, data: Any) -> Any:
        if isinstance(data, dict):
            val = data.get("title") or data.get("topic") or "General Discussion"
            data["title"] = val
        return data

class DiscussionCreate(DiscussionBase):
    project_id: str = Field(..., validation_alias=AliasChoices("project_id", "projectId"))
    author_id: str = Field("u1", validation_alias=AliasChoices("author_id", "authorId"))

class DiscussionVoteRequest(AppBaseModel):
    vote: str # 'pro' | 'con'
    user_id: str = Field(..., validation_alias=AliasChoices("user_id", "userId"))

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
class TaskBase(AppBaseModel):
    title: str
    description: Optional[str] = None
    status: str = "todo"
    priority: str = "medium"
    due_date: Optional[str] = Field(None, validation_alias=AliasChoices("due_date", "dueDate"))
    module: Optional[str] = None
    tags: List[str] = Field([], validation_alias=AliasChoices("tags"))


    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, v: Any) -> Any:
        if not isinstance(v, str): return v
        s = v.lower().strip()
        mapping = {
            "completed": "done",
            "in_progress": "in-progress",
            "review": "in-review",
            "backlog": "todo",
        }
        return mapping.get(s, s)

    @field_validator("priority", mode="before")
    @classmethod
    def normalize_priority(cls, v: Any) -> Any:
        if not isinstance(v, str): return v
        p = v.lower().strip()
        if p not in ("low", "medium", "high", "urgent"):
            return "medium"
        return p

class TaskCreate(TaskBase):
    project_id: str = Field(..., validation_alias=AliasChoices("project_id", "projectId"))
    assignee_id: Optional[str] = Field(None, validation_alias=AliasChoices("assignee_id", "assigneeId"))

class TaskResponse(TaskBase):
    id: str
    project_id: str
    assignee_id: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

# -----------------------------------------------------------------------------
# Document Schemas
# -----------------------------------------------------------------------------
class DocumentBase(AppBaseModel):
    title: str = ""
    content_text: Optional[str] = Field(None, validation_alias=AliasChoices("content_text", "contentPreview", "content"))
    file_type: str = Field("markdown", validation_alias=AliasChoices("file_type", "type"))
    contributors: List[str] = []

    @model_validator(mode="before")
    @classmethod
    def sync_title_and_name(cls, data: Any) -> Any:
        if isinstance(data, dict):
            val = data.get("title") or data.get("name") or "Untitled Document"
            data["title"] = val
        return data

class DocumentCreate(DocumentBase):
    project_id: str = Field(..., validation_alias=AliasChoices("project_id", "projectId"))
    author_id: str = Field("u1", validation_alias=AliasChoices("author_id", "authorId", "uploadedBy", "uploaded_by"))

class DocumentResponse(DocumentBase):
    id: str
    project_id: str
    author_id: Optional[str] = None
    created_at: Optional[str] = None

# -----------------------------------------------------------------------------
# Collaboration Activity Schemas
# -----------------------------------------------------------------------------
class ActivityBase(AppBaseModel):
    title: str
    description: str = ""
    type: str = "knowledge_transfer"
    participants: List[str] = []
    agenda: List[str] = Field([], validation_alias=AliasChoices("agenda", "agendaItems"))
    linked_task_id: Optional[str] = Field(None, validation_alias=AliasChoices("linked_task_id", "linkedTaskId"))
    notes: Optional[str] = None
    takeaways: Optional[str] = None

    @field_validator("type", mode="before")
    @classmethod
    def normalize_type(cls, v: Any) -> Any:
        if not isinstance(v, str): return v
        return v.lower().strip().replace(" ", "_")

class ActivityCreate(ActivityBase):
    project_id: str = Field(..., validation_alias=AliasChoices("project_id", "projectId"))

class ActivityCompleteRequest(AppBaseModel):
    takeaways: Optional[str] = None
    notes: Optional[str] = None
    completed_task_ids: List[str] = Field([], validation_alias=AliasChoices("completed_task_ids", "completedTaskIds"))

class ActivityResponse(ActivityBase):
    id: str
    project_id: str
    status: str = "pending" # 'pending' | 'in-progress' | 'completed' | 'scheduled'
    takeaways: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[str] = None
    completed_at: Optional[str] = None

# -----------------------------------------------------------------------------
# Intelligence & Problem Statement AI Analysis Schemas
# -----------------------------------------------------------------------------
class VoiceEquityItem(AppBaseModel):
    user_id: str
    name: str
    task_count: int
    discussion_count: int
    doc_count: int
    total_contributions: int
    contribution_percentage: float
    status: str # 'balanced' | 'overloaded_bottleneck' | 'under_represented'

class EquityAnalysisResponse(AppBaseModel):
    project_id: str
    gini_coefficient: float
    equity_score: float
    equity_status: str # 'High Equity' | 'Moderate Imbalance' | 'Severe Asymmetry'
    members: List[VoiceEquityItem]
    bottlenecks: List[str]
    isolated_members: List[str]
    ai_recommendation: str

class FragmentedDebateItem(AppBaseModel):
    id: str
    title: str
    status: str
    divergence_score: float
    pro_votes: int
    con_votes: int
    suggested_resolution: str

class CollectiveInsightItem(AppBaseModel):
    id: str
    category: str
    title: str
    summary: str
    confidence: float
    contributors: List[str]

class SolutionModule(AppBaseModel):
    name: str
    owner: str
    status: str
    summary: str
    deliverables: List[str]

class CoherentBlueprintResponse(AppBaseModel):
    project_id: str
    project_name: str
    generated_at: str
    architectural_summary: str
    modules: List[SolutionModule]
    agreed_consensus: List[str]
    unresolved_risks: List[str]
    action_plan: List[str]

class AIRecommendationItem(AppBaseModel):
    id: str
    type: str
    title: str
    reason: str
    priority: str
    target_members: List[str]
    suggested_agenda: List[str]
    expected_outcome: str
