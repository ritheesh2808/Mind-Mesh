from fastapi import APIRouter, HTTPException
from typing import List
from backend.schemas import ProjectResponse, ProjectCreate
from backend.repository import Repository

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("", response_model=List[ProjectResponse])
def get_projects():
    """Retrieve all active collaborative projects"""
    return Repository.get_projects()

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str):
    """Retrieve specific project details with team roster"""
    project = Repository.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.get("/{project_id}/members")
def get_project_members(project_id: str):
    """Retrieve project team members and their collaborative roles"""
    return Repository.get_project_members(project_id)

@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: str, updates: dict):
    """Update mutable project metadata."""
    project = Repository.update_project(project_id, updates)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.post("", response_model=ProjectResponse)
def create_project(project: ProjectCreate):
    """Create a new project workspace"""
    return Repository.create_project(project.model_dump())
