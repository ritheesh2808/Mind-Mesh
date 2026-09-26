import os
import uuid

import pytest
from fastapi.testclient import TestClient

from backend.config import settings
from backend.main import app
from backend.supabase_client import get_supabase_client, reset_supabase_client


pytestmark = pytest.mark.skipif(
    os.getenv("RUN_SUPABASE_INTEGRATION") != "true",
    reason="Set RUN_SUPABASE_INTEGRATION=true to run against a real Supabase project.",
)


def test_real_supabase_crud_and_persistence_after_client_reset():
    original_memory_fallback = settings.USE_MEMORY_FALLBACK
    settings.USE_MEMORY_FALLBACK = False
    reset_supabase_client()
    supabase = get_supabase_client()
    assert supabase is not None, "Supabase must connect and query public.projects"

    user_id = str(uuid.uuid4())
    project_id = None
    try:
        supabase.table("profiles").insert({
            "id": user_id,
            "name": "Integration Test User",
            "email": f"{user_id}@integration.invalid",
        }).execute()

        with TestClient(app) as client:
            created_project = client.post("/api/v1/projects", json={
                "title": "Supabase integration project",
                "description": "Temporary real-database integration fixture",
                "owner_id": user_id,
            })
            assert created_project.status_code == 200, created_project.text
            project_id = created_project.json()["id"]
            assert client.get(f"/api/v1/projects/{project_id}").status_code == 200

            members = client.get(f"/api/v1/projects/{project_id}/members")
            assert members.status_code == 200
            assert any(member["user_id"] == user_id for member in members.json())

            updated_project = client.patch(f"/api/v1/projects/{project_id}", json={"progress": 20})
            assert updated_project.status_code == 200
            assert client.get(f"/api/v1/projects/{project_id}").json()["progress"] == 20

            task = client.post("/api/v1/tasks", json={
                "project_id": project_id,
                "title": "Integration task",
                "assignee_id": user_id,
            })
            assert task.status_code == 200, task.text
            task_id = task.json()["id"]
            task_update = client.patch(f"/api/v1/tasks/{task_id}", json={"status": "done"})
            assert task_update.status_code == 200
            assert client.delete(f"/api/v1/tasks/{task_id}").status_code == 200

            discussion = client.post("/api/v1/discussions", json={
                "project_id": project_id,
                "author_id": user_id,
                "title": "Integration discussion",
                "content": "Real database vote check",
            })
            assert discussion.status_code == 200, discussion.text
            discussion_id = discussion.json()["id"]
            vote = client.post(f"/api/v1/discussions/{discussion_id}/vote", json={
                "user_id": user_id,
                "vote": "pro",
            })
            assert vote.status_code == 200, vote.text
            assert client.get(f"/api/v1/discussions/{discussion_id}").json()["consensus_pro"] == 1
            replacement_vote = client.post(f"/api/v1/discussions/{discussion_id}/vote", json={
                "user_id": user_id,
                "vote": "con",
            })
            assert replacement_vote.status_code == 200, replacement_vote.text
            current_vote = client.get(f"/api/v1/discussions/{discussion_id}").json()
            assert current_vote["consensus_pro"] == 0
            assert current_vote["consensus_con"] == 1

            document = client.post("/api/v1/documents", json={
                "project_id": project_id,
                "author_id": user_id,
                "title": "Integration document",
                "content_text": "Metadata persistence check",
            })
            assert document.status_code == 200, document.text
            document_id = document.json()["id"]
            assert client.get(f"/api/v1/documents/{document_id}").status_code == 200
            assert client.delete(f"/api/v1/documents/{document_id}").status_code == 200

            activity = client.post("/api/v1/activities", json={
                "project_id": project_id,
                "title": "Integration activity",
                "description": "Before and after snapshot check",
                "participants": [user_id],
            })
            assert activity.status_code == 200, activity.text
            activity_id = activity.json()["id"]
            completed = client.post(f"/api/v1/activities/{activity_id}/complete", json={})
            assert completed.status_code == 200, completed.text
            impact = client.get(f"/api/v1/intelligence/impact/{project_id}/{activity_id}")
            assert impact.status_code == 200, impact.text
            assert impact.json()["before_snapshot"]
            assert impact.json()["after_snapshot"]

            reset_supabase_client()
            persisted_project = client.get(f"/api/v1/projects/{project_id}")
            assert persisted_project.status_code == 200
            assert persisted_project.json()["id"] == project_id
    finally:
        reset_supabase_client()
        cleanup_client = get_supabase_client()
        if cleanup_client is not None:
            if project_id:
                cleanup_client.table("projects").delete().eq("id", project_id).execute()
            cleanup_client.table("profiles").delete().eq("id", user_id).execute()
        settings.USE_MEMORY_FALLBACK = original_memory_fallback
        reset_supabase_client()
