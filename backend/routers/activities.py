from fastapi import APIRouter, HTTPException
from typing import List
from backend.schemas import ActivityResponse, ActivityCreate, ActivityCompleteRequest
from backend.repository import Repository

router = APIRouter(prefix="/activities", tags=["Collaborative Activities"])

@router.get("/project/{project_id}", response_model=List[ActivityResponse])
def get_project_activities(project_id: str):
    """Retrieve scheduled and active collaboration rooms/activities"""
    return Repository.get_activities(project_id)

@router.post("", response_model=ActivityResponse)
def create_activity(activity: ActivityCreate):
    """Create a new AI-guided collaborative session activity"""
    return Repository.create_activity(activity.model_dump())

@router.post("/{activity_id}/complete", response_model=ActivityResponse)
def complete_activity(activity_id: str, payload: ActivityCompleteRequest):
    """Conclude an activity, record shared takeaways, and mark linked deliverables complete"""
    updated = Repository.complete_activity(activity_id, payload.takeaways, payload.completed_task_ids, payload.notes)
    if not updated:
        raise HTTPException(status_code=404, detail="Activity not found")
    return updated
