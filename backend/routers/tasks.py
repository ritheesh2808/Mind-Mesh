from fastapi import APIRouter, HTTPException
from typing import List
from backend.schemas import TaskResponse, TaskCreate
from backend.repository import Repository

router = APIRouter(prefix="/tasks", tags=["Tasks & Contributions"])

@router.get("/project/{project_id}", response_model=List[TaskResponse])
def get_project_tasks(project_id: str):
    """Retrieve all work breakdown tasks for a project"""
    return Repository.get_tasks(project_id)

@router.post("", response_model=TaskResponse)
def create_task(task: TaskCreate):
    """Create a new deliverable task assigned to a team member"""
    return Repository.create_task(task.model_dump())

@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(task_id: str, updates: dict):
    """Update task status, priority, or assignee"""
    task = Repository.update_task(task_id, updates)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task
