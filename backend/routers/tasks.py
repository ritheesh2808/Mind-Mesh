from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from backend.schemas import TaskResponse, TaskCreate
from backend.repository import Repository

router = APIRouter(prefix="/tasks", tags=["Tasks & Contributions"])

def _normalize_task_dict(updates: dict) -> dict:
    clean = dict(updates)
    if "status" in clean and isinstance(clean["status"], str):
        s = clean["status"].lower().strip()
        mapping = {
            "completed": "done",
            "in_progress": "in-progress",
            "review": "in-review",
            "backlog": "todo",
        }
        clean["status"] = mapping.get(s, s)
    if "priority" in clean and isinstance(clean["priority"], str):
        p = clean["priority"].lower().strip()
        if p in ("low", "medium", "high", "urgent"):
            clean["priority"] = p
    return clean

@router.get("", response_model=List[TaskResponse])
def get_all_tasks(project_id: Optional[str] = Query(None)):
    """Retrieve all work breakdown tasks, optionally filtered by project"""
    return Repository.get_tasks(project_id)

@router.get("/project/{project_id}", response_model=List[TaskResponse])
def get_project_tasks(project_id: str):
    """Retrieve all work breakdown tasks for a project"""
    return Repository.get_tasks(project_id)

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: str):
    """Retrieve a single task by ID"""
    task = Repository.get_task_by_id(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.post("", response_model=TaskResponse)
def create_task(task: TaskCreate):
    """Create a new deliverable task assigned to a team member"""
    return Repository.create_task(task.model_dump())

@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(task_id: str, updates: dict):
    """Update task status, priority, or assignee"""
    normalized = _normalize_task_dict(updates)
    task = Repository.update_task(task_id, normalized)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.delete("/{task_id}")
def delete_task(task_id: str):
    """Delete a task by ID"""
    deleted = Repository.delete_task(task_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"success": True, "id": task_id}


