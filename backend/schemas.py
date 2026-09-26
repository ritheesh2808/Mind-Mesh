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
    author_id: Optional[str] = Field(None, validation_alias=AliasChoices("author_id", "authorId"))

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
    author_id: Optional[str] = Field(None, validation_alias=AliasChoices("author_id", "authorId", "uploadedBy", "uploaded_by"))

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

# -----------------------------------------------------------------------------
# ED-03 Intelligence Schemas (Phase 3)
# -----------------------------------------------------------------------------

# Contributions
class ContributionItem(AppBaseModel):
    id: str
    project_id: str
    user_id: str
    action_type: str
    entity_type: str
    entity_id: str
    weight: int = 1
    metadata: Dict[str, Any] = {}
    created_at: Optional[str] = None

class ContributionSummary(AppBaseModel):
    user_id: str
    name: str
    total_weight: int
    count: int
    percentage: float
    by_type: Dict[str, int] = {}
    status: str = "active"

class ContributionAnalyticsResponse(AppBaseModel):
    project_id: str
    total_contributions: int
    active_contributors: int
    participation_rate: float
    gini_coefficient: float
    equity_score: float
    equity_interpretation: str
    member_summaries: List[ContributionSummary]
    inactive_members: List[str]
    concentrated_members: List[str]
    recent_events: List[ContributionItem] = []

# Knowledge Graph
class KnowledgeNodeSchema(AppBaseModel):
    id: str
    project_id: Optional[str] = None
    node_type: str # person, skill, topic, document, task, decision, discussion
    label: str
    description: Optional[str] = None
    metadata: Dict[str, Any] = {}

class KnowledgeEdgeSchema(AppBaseModel):
    id: str
    project_id: Optional[str] = None
    source_node_id: str
    target_node_id: str
    edge_type: str # knows, contributed_to, discussed, supports, depends_on, related_to, authored, reviewed, participated_in
    weight: int = 1
    confidence: float = 1.0
    evidence_count: int = 1
    metadata: Dict[str, Any] = {}

class KnowledgeGraphResponse(AppBaseModel):
    project_id: str
    node_count: int
    edge_count: int
    nodes: List[KnowledgeNodeSchema]
    edges: List[KnowledgeEdgeSchema]

# Silos & Gaps
class SiloItem(AppBaseModel):
    id: str
    topic: str
    risk: str # single_owner, bottleneck, isolated_contributor
    owners: List[str]
    supporting_evidence: List[str]
    recommended_action: str

class KnowledgeGapItem(AppBaseModel):
    id: str
    skill_or_topic: str
    gap_type: str # missing_skill, unassigned_module, undocumented_system
    impact: str
    recommended_action: str

class SilosAndGapsResponse(AppBaseModel):
    project_id: str
    silo_count: int
    gap_count: int
    silos: List[SiloItem]
    gaps: List[KnowledgeGapItem]

# Collective Insights & Evidence
class InsightEvidenceItem(AppBaseModel):
    source_type: str
    source_id: str
    description: str
    metric: Optional[str] = None
    value: Optional[float] = None

class PersistentInsightResponse(AppBaseModel):
    id: str
    project_id: str
    insight_type: str
    title: str
    summary: str
    severity: str
    confidence: float
    status: str = "active"
    evidence: List[InsightEvidenceItem] = []
    action_items: List[str] = []
    created_at: Optional[str] = None

# Recommendations with Participants & Sources
class RecommendationParticipantSchema(AppBaseModel):
    user_id: str
    name: Optional[str] = None
    role: Optional[str] = None

class RecommendationSourceSchema(AppBaseModel):
    source_type: str
    source_id: str
    reason: Optional[str] = None

class DetailedRecommendationResponse(AppBaseModel):
    id: str
    project_id: str
    type: str
    title: str
    reason: str
    priority: str
    confidence: float = 1.0
    status: str = "pending"
    participants: List[RecommendationParticipantSchema] = []
    sources: List[RecommendationSourceSchema] = []
    suggested_agenda: List[str] = []
    expected_outcome: Optional[str] = None
    created_at: Optional[str] = None

# Discussion Intelligence & Messages
class DiscussionMessageCreate(AppBaseModel):
    author_id: str = Field(..., validation_alias=AliasChoices("author_id", "authorId"))
    content: str
    reply_to_id: Optional[str] = Field(None, validation_alias=AliasChoices("reply_to_id", "replyToId"))

class DiscussionMessageResponse(AppBaseModel):
    id: str
    discussion_id: str
    author_id: Optional[str] = None
    content: str
    reply_to_id: Optional[str] = None
    created_at: Optional[str] = None

class DiscussionViewpointCreate(AppBaseModel):
    author_id: str = Field(..., validation_alias=AliasChoices("author_id", "authorId"))
    position: str # support, oppose, neutral, alternative
    argument: str
    evidence: List[str] = []

class DiscussionViewpointResponse(AppBaseModel):
    id: str
    discussion_id: str
    author_id: str
    position: str
    argument: str
    evidence: List[str] = []
    created_at: Optional[str] = None

class DiscussionIntelligenceItem(AppBaseModel):
    id: str
    title: str
    type: str
    status: str
    message_count: int
    participant_count: int
    viewpoint_count: int
    vote_count: int
    pro_votes: int
    con_votes: int
    divergence_score: float
    consensus_status: str
    unresolved_questions: List[str]
    suggested_resolution: Optional[str] = None

# Blueprints
class BlueprintModuleItem(AppBaseModel):
    name: str
    owner: str
    owner_id: Optional[str] = None
    status: str
    summary: str
    deliverables: List[str] = []
    source_type: Optional[str] = None
    source_id: Optional[str] = None

class BlueprintSourceItem(AppBaseModel):
    source_type: str
    source_id: str
    relationship: Optional[str] = None

class BlueprintPersistentResponse(AppBaseModel):
    id: str
    project_id: str
    title: str
    summary: str
    version: int = 1
    problem_statement: Optional[str] = None
    modules: List[BlueprintModuleItem] = []
    sources: List[BlueprintSourceItem] = []
    agreed_consensus: List[str] = []
    unresolved_risks: List[str] = []
    action_plan: List[str] = []
    expected_measurable_changes: List[str] = []
    created_at: Optional[str] = None

# Analysis Snapshots & Activity Impact
class AnalysisSnapshotResponse(AppBaseModel):
    id: str
    project_id: str
    analysis_type: str
    data: Dict[str, Any]
    created_at: Optional[str] = None


class ActivityImpactResponse(AppBaseModel):
    activity_id: str
    project_id: str
    activity_title: str
    before_snapshot: Dict[str, Any]
    after_snapshot: Dict[str, Any]
    metric_changes: Dict[str, Any]
    narrative_summary: str


# =============================================================================
# PHASE 1: NEW PYDANTIC SCHEMAS
# Create / Response pairs for all new Phase 1 entities.
# =============================================================================

# -----------------------------------------------------------------------------
# Contributions (Phase 1)
# -----------------------------------------------------------------------------
class ContributionCreate(AppBaseModel):
    project_id: str
    user_id: str
    type: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    weight: float = 1.0
    metadata: Optional[Dict[str, Any]] = None

class ContributionResponse(ContributionCreate):
    id: str
    created_at: Optional[str] = None

# -----------------------------------------------------------------------------
# Knowledge Graph – Nodes (Phase 1)
# -----------------------------------------------------------------------------
class KnowledgeNodeCreate(AppBaseModel):
    project_id: str
    node_type: str  # person | skill | topic | document | task | decision | discussion | concept
    label: str
    metadata: Optional[Dict[str, Any]] = None

class KnowledgeNodeResponse(KnowledgeNodeCreate):
    id: str
    created_at: Optional[str] = None

# -----------------------------------------------------------------------------
# Knowledge Graph – Edges (Phase 1)
# -----------------------------------------------------------------------------
class KnowledgeEdgeCreate(AppBaseModel):
    project_id: str
    source_node_id: str
    target_node_id: str
    edge_type: str  # knows | contributed_to | discussed | supports | depends_on | related_to | authored | reviewed | participated_in
    weight: float = 1.0

class KnowledgeEdgeResponse(KnowledgeEdgeCreate):
    id: str
    created_at: Optional[str] = None

# NOTE: KnowledgeGraphResponse is already defined above (at the original schema location)
# and is used by the intelligence router. The Phase 1 variant below is an alias only;
# use KnowledgeGraphResponse directly from the original definition.

# -----------------------------------------------------------------------------
# Insights (Phase 1)
# -----------------------------------------------------------------------------
class InsightCreate(AppBaseModel):
    project_id: str
    type: str
    title: str
    description: str
    confidence: float = 0.8
    status: str = "active"

class InsightEvidenceCreate(AppBaseModel):
    insight_id: str
    entity_type: str
    entity_id: str
    description: str

class InsightEvidenceResponse(InsightEvidenceCreate):
    id: str
    created_at: Optional[str] = None

class InsightResponse(InsightCreate):
    id: str
    created_at: Optional[str] = None
    evidence: List[Dict[str, Any]] = []

# -----------------------------------------------------------------------------
# Recommendations (Phase 1)
# -----------------------------------------------------------------------------
class RecommendationCreate(AppBaseModel):
    project_id: str
    type: str
    title: str
    reason: str
    priority: str = "medium"
    status: str = "pending"

class RecommendationResponse(RecommendationCreate):
    id: str
    created_at: Optional[str] = None
    participants: List[Dict[str, Any]] = []
    sources: List[Dict[str, Any]] = []

# -----------------------------------------------------------------------------
# Blueprints (Phase 1)
# -----------------------------------------------------------------------------
class BlueprintCreate(AppBaseModel):
    project_id: str
    version: int = 1
    title: str
    architectural_summary: str
    agreed_consensus: Optional[Any] = None
    unresolved_risks: Optional[Any] = None
    action_plan: Optional[Any] = None

class BlueprintModuleCreate(AppBaseModel):
    blueprint_id: str
    name: str
    owner_id: str = ""
    status: str = "planned"
    summary: str = ""
    deliverables: Optional[Any] = None

class BlueprintResponse(BlueprintCreate):
    id: str
    created_at: Optional[str] = None
    modules: List[Dict[str, Any]] = []

# -----------------------------------------------------------------------------
# Analysis Snapshots (Phase 1) – already exists as AnalysisSnapshotResponse above,
# but we add a Create schema for completeness.
# -----------------------------------------------------------------------------
class AnalysisSnapshotCreate(AppBaseModel):
    project_id: str
    snapshot_type: str = "full"
    data: Dict[str, Any] = {}

# DiscussionMessage / Viewpoint Phase 1 shapes (user_id instead of author_id)
class DiscussionMessageCreateV2(AppBaseModel):
    """Phase 1 variant: uses user_id field (mirrors v2 schema column name)."""
    discussion_id: str
    project_id: Optional[str] = None
    user_id: str
    content: str

class DiscussionMessageResponseV2(DiscussionMessageCreateV2):
    id: str
    created_at: Optional[str] = None

class DiscussionViewpointCreateV2(AppBaseModel):
    """Phase 1 variant: uses user_id and viewpoint_type (mirrors v2 schema)."""
    discussion_id: str
    user_id: str
    viewpoint_type: str  # support | oppose | neutral | alternative
    message_id: Optional[str] = None

class DiscussionViewpointResponseV2(DiscussionViewpointCreateV2):
    id: str
    created_at: Optional[str] = None
