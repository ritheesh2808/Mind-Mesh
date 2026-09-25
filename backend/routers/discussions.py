from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from backend.schemas import DiscussionResponse, DiscussionVoteRequest, DiscussionCreate
from backend.repository import Repository

router = APIRouter(prefix="/discussions", tags=["Discussions & Debates"])

@router.get("", response_model=List[DiscussionResponse])
def get_all_discussions(project_id: Optional[str] = Query(None)):
    """Retrieve discussions, optionally filtered by project"""
    return Repository.get_discussions(project_id)

@router.get("/project/{project_id}", response_model=List[DiscussionResponse])
def get_project_discussions(project_id: str):
    """Retrieve discussions and debate threads for a project"""
    return Repository.get_discussions(project_id)

@router.get("/{discussion_id}", response_model=DiscussionResponse)
def get_discussion(discussion_id: str):
    """Retrieve a single discussion by ID"""
    disc = Repository.get_discussion_by_id(discussion_id)
    if not disc:
        raise HTTPException(status_code=404, detail="Discussion not found")
    return disc

@router.post("", response_model=DiscussionResponse)
def create_discussion(discussion: DiscussionCreate):
    """Create a new discussion or debate thread"""
    return Repository.create_discussion(discussion.model_dump())

@router.post("/{discussion_id}/vote", response_model=DiscussionResponse)
def vote_on_resolution(discussion_id: str, payload: DiscussionVoteRequest):
    """Cast a pro/con consensus vote on an AI suggested discussion resolution"""
    if payload.vote not in ("pro", "con"):
        raise HTTPException(status_code=400, detail="Vote must be 'pro' or 'con'")
    
    updated = Repository.vote_discussion(discussion_id, payload.vote, payload.user_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Discussion thread not found")
    return updated


