import unittest
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.ai_engine import CollaborativeAIEngine

class TestMindMeshBackend(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_endpoint(self):
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "healthy")
        res2 = self.client.get("/api/v1/health")
        self.assertEqual(res2.status_code, 200)
        self.assertEqual(res2.json()["status"], "healthy")

    def test_projects_endpoint(self):
        res = self.client.get("/api/v1/projects")
        self.assertEqual(res.status_code, 200)
        self.assertGreaterEqual(len(res.json()), 1)

    def test_gini_calculation_edge_cases(self):
        # Empty
        self.assertEqual(CollaborativeAIEngine.calculate_gini_coefficient([]), 0.0)
        # Single element
        self.assertEqual(CollaborativeAIEngine.calculate_gini_coefficient([42.0]), 0.0)
        # All identical
        self.assertEqual(CollaborativeAIEngine.calculate_gini_coefficient([5.0, 5.0, 5.0]), 0.0)
        # Extreme inequality
        gini = CollaborativeAIEngine.calculate_gini_coefficient([0.0, 0.0, 100.0])
        self.assertGreater(gini, 0.5)

    def test_intelligence_equity(self):
        res = self.client.get("/api/v1/intelligence/equity/p1")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("gini_coefficient", data)
        self.assertIn("equity_score", data)
        self.assertIn("members", data)

    def test_intelligence_debates(self):
        res = self.client.get("/api/v1/intelligence/debates/p1")
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.json(), list)

    def test_intelligence_recommendations(self):
        res = self.client.get("/api/v1/intelligence/recommendations/p1")
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.json(), list)

    def test_intelligence_blueprint(self):
        res = self.client.get("/api/v1/intelligence/blueprint/p1")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("modules", data)
        self.assertIn("agreed_consensus", data)

    def test_discussion_vote(self):
        res = self.client.post("/api/v1/discussions/d1/vote", json={"vote": "pro", "user_id": "u1"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreaterEqual(data["consensus_pro"], 1)

    def test_activity_lifecycle(self):
        # Create
        res = self.client.post("/api/v1/activities", json={
            "project_id": "p1",
            "title": "CI Verification Session",
            "description": "Integration test for activity lifecycle",
            "type": "consensus_workshop",
            "participants": ["Ritheesh"],
            "agenda": ["Verify test suite"]
        })
        self.assertEqual(res.status_code, 200)
        act_id = res.json()["id"]

        # Complete with notes and takeaways
        res = self.client.post(f"/api/v1/activities/{act_id}/complete", json={
            "takeaways": "Verification completed successfully",
            "notes": "Detailed session notes recorded during team collaboration",
            "completed_task_ids": []
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "completed")
        self.assertEqual(data["notes"], "Detailed session notes recorded during team collaboration")

    def test_blueprint_p2_endpoint(self):
        res = self.client.get("/api/v1/intelligence/blueprint/p2")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["project_id"], "p2")
        self.assertIn("modules", data)

    def test_project_create_endpoint(self):
        res = self.client.post("/api/v1/projects", json={
            "title": "Quantum Cryptography Workspace",
            "description": "Post-quantum key exchange protocol simulation",
            "owner_id": "u1",
            "status": "in-progress",
            "skills_required": ["Python", "Cryptography"]
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["title"], "Quantum Cryptography Workspace")
        self.assertIn("id", data)

    def test_task_crud_lifecycle(self):
        # Create
        res = self.client.post("/api/v1/tasks", json={
            "project_id": "p1",
            "title": "Verify Diffie-Hellman Key Exchange",
            "description": "Unit test encryption routines",
            "priority": "high",
            "status": "todo",
            "assignee_id": "u4"
        })
        self.assertEqual(res.status_code, 200)
        task_id = res.json()["id"]

        # Update
        patch_res = self.client.patch(f"/api/v1/tasks/{task_id}", json={
            "status": "done",
            "priority": "urgent"
        })
        self.assertEqual(patch_res.status_code, 200)
        self.assertEqual(patch_res.json()["status"], "done")

    def test_discussion_create_endpoint(self):
        res = self.client.post("/api/v1/discussions", json={
            "project_id": "p1",
            "author_id": "u2",
            "title": "Database Indexing Strategy",
            "content": "Should we use B-tree or GiST for spatial event indexing?",
            "type": "architectural_debate",
            "status": "open",
            "resolution": "Use B-tree for primary time-series lookups"
        })
        self.assertEqual(res.status_code, 200)
        self.assertIn("id", res.json())

    def test_document_create_endpoint(self):
        res = self.client.post("/api/v1/documents", json={
            "project_id": "p1",
            "author_id": "u3",
            "title": "Threat Modeling Specification v2",
            "content_text": "Updated threat matrix covering side-channel attacks",
            "file_type": "markdown",
            "contributors": ["u3", "u4"]
        })
        self.assertEqual(res.status_code, 200)
        self.assertIn("id", res.json())

    def test_missing_project_404(self):
        res = self.client.get("/api/v1/projects/non-existent-p999")
        self.assertEqual(res.status_code, 404)

    def test_missing_project_intelligence_404(self):
        for ep in ["equity", "debates", "recommendations", "blueprint"]:
            res = self.client.get(f"/api/v1/intelligence/{ep}/non-existent-p999")
            self.assertEqual(res.status_code, 404)

    def test_task_status_normalization(self):
        # Create with camelCase & "in_progress" status
        res = self.client.post("/api/v1/tasks", json={
            "projectId": "p1",
            "title": "Normalized Status Task",
            "status": "in_progress",
            "priority": "high",
            "assigneeId": "u1"
        })
        self.assertEqual(res.status_code, 200)
        task_id = res.json()["id"]
        self.assertEqual(res.json()["status"], "in-progress")

        # Update with "completed" status -> should normalize to "done"
        patch_res = self.client.patch(f"/api/v1/tasks/{task_id}", json={
            "status": "completed"
        })
        self.assertEqual(patch_res.status_code, 200)
        self.assertEqual(patch_res.json()["status"], "done")

    def test_task_patch_404(self):
        res = self.client.patch("/api/v1/tasks/non-existent-t999", json={"status": "done"})
        self.assertEqual(res.status_code, 404)

    def test_discussion_vote_validation(self):
        # Invalid vote choice
        res = self.client.post("/api/v1/discussions/d1/vote", json={"vote": "maybe", "user_id": "u1"})
        self.assertEqual(res.status_code, 400)

        # Non-existent discussion 404
        res = self.client.post("/api/v1/discussions/non-existent-d999/vote", json={"vote": "pro", "user_id": "u1"})
        self.assertEqual(res.status_code, 404)

    def test_activity_completes_linked_task(self):
        # Create a task to link
        t_res = self.client.post("/api/v1/tasks", json={
            "project_id": "p1",
            "title": "Task to be linked to activity",
            "status": "todo"
        })
        self.assertEqual(t_res.status_code, 200)
        t_id = t_res.json()["id"]
        self.assertEqual(t_res.json()["status"], "todo")

        # Create activity linking this task
        a_res = self.client.post("/api/v1/activities", json={
            "project_id": "p1",
            "title": "Pairing on Linked Task",
            "description": "Collaborative session",
            "type": "pair_programming",
            "linked_task_id": t_id,
            "participants": ["u1", "u2"]
        })
        self.assertEqual(a_res.status_code, 200)
        a_id = a_res.json()["id"]

        # Complete activity without explicit task list -> linked_task_id should still be completed!
        comp_res = self.client.post(f"/api/v1/activities/{a_id}/complete", json={
            "takeaways": "Resolved together",
            "notes": "Good progress made"
        })
        self.assertEqual(comp_res.status_code, 200)
        self.assertEqual(comp_res.json()["status"], "completed")

        # Verify linked task is now done
        tasks = self.client.get(f"/api/v1/tasks/project/p1").json()
        linked_task = next((t for t in tasks if t["id"] == t_id), None)
        self.assertIsNotNone(linked_task)
        self.assertEqual(linked_task["status"], "done")

    def test_get_endpoints_with_and_without_query_param(self):
        # Tasks
        self.assertEqual(self.client.get("/api/v1/tasks").status_code, 200)
        self.assertEqual(self.client.get("/api/v1/tasks?project_id=p1").status_code, 200)

        # Discussions
        self.assertEqual(self.client.get("/api/v1/discussions").status_code, 200)
        self.assertEqual(self.client.get("/api/v1/discussions?project_id=p1").status_code, 200)

        # Documents
        self.assertEqual(self.client.get("/api/v1/documents").status_code, 200)
        self.assertEqual(self.client.get("/api/v1/documents?project_id=p1").status_code, 200)

        # Activities
        self.assertEqual(self.client.get("/api/v1/activities").status_code, 200)
        self.assertEqual(self.client.get("/api/v1/activities?project_id=p1").status_code, 200)

    def test_new_project_end_to_end_intelligence_lifecycle(self):
        # 1. Create a brand new project
        p_res = self.client.post("/api/v1/projects", json={
            "title": "Autonomous Robotics Workspace",
            "description": "Simulating SLAM navigation algorithms",
            "owner_id": "u5",
            "status": "in-progress",
            "skills_required": ["C++", "ROS", "Python"]
        })
        self.assertEqual(p_res.status_code, 200)
        p_data = p_res.json()
        new_pid = p_data["id"]

        # 2. Intelligence on empty project should return valid responses without crashing (0 items edge case)
        eq_res = self.client.get(f"/api/v1/intelligence/equity/{new_pid}")
        self.assertEqual(eq_res.status_code, 200)
        deb_res = self.client.get(f"/api/v1/intelligence/debates/{new_pid}")
        self.assertEqual(deb_res.status_code, 200)
        self.assertEqual(deb_res.json(), [])
        rec_res = self.client.get(f"/api/v1/intelligence/recommendations/{new_pid}")
        self.assertEqual(rec_res.status_code, 200)
        bp_res = self.client.get(f"/api/v1/intelligence/blueprint/{new_pid}")
        self.assertEqual(bp_res.status_code, 200)
        self.assertEqual(bp_res.json()["project_id"], new_pid)

        # 3. Add a task to this new project
        t_res = self.client.post("/api/v1/tasks", json={
            "project_id": new_pid,
            "title": "Implement LiDAR Odometry",
            "priority": "high",
            "status": "todo",
            "assignee_id": "u5"
        })
        self.assertEqual(t_res.status_code, 200)
        new_tid = t_res.json()["id"]

        # 4. Add a discussion to this new project
        d_res = self.client.post("/api/v1/discussions", json={
            "project_id": new_pid,
            "author_id": "u5",
            "title": "Extended Kalman Filter vs Particle Filter",
            "content": "Which state estimation model works best in GPS-denied environments?",
            "type": "architectural_debate",
            "status": "open",
            "resolution": "Evaluate EKF first on simulated indoor track"
        })
        self.assertEqual(d_res.status_code, 200)
        new_did = d_res.json()["id"]

        # 5. Vote on this discussion
        v_res = self.client.post(f"/api/v1/discussions/{new_did}/vote", json={
            "vote": "pro",
            "user_id": "u5"
        })
        self.assertEqual(v_res.status_code, 200)
        self.assertEqual(v_res.json()["consensus_pro"], 1)

        # 6. Add a document
        doc_res = self.client.post("/api/v1/documents", json={
            "project_id": new_pid,
            "author_id": "u5",
            "title": "SLAM Benchmarking Report",
            "content_text": "Comprehensive analysis of trajectory errors",
            "file_type": "markdown",
            "contributors": ["u5"]
        })
        self.assertEqual(doc_res.status_code, 200)

        # 7. Add and complete an activity linked to the task
        act_res = self.client.post("/api/v1/activities", json={
            "project_id": new_pid,
            "title": "Review LiDAR Algorithm",
            "description": "Cross-check filter drift",
            "type": "peer_review",
            "linked_task_id": new_tid,
            "participants": ["u5"]
        })
        self.assertEqual(act_res.status_code, 200)
        new_aid = act_res.json()["id"]

        comp_act = self.client.post(f"/api/v1/activities/{new_aid}/complete", json={
            "takeaways": "LiDAR odometry pipeline passed validation",
            "notes": "Latency was within 15ms target"
        })
        self.assertEqual(comp_act.status_code, 200)

        # Verify linked task is automatically marked done
        tasks = self.client.get(f"/api/v1/tasks/project/{new_pid}").json()
        target_t = next((t for t in tasks if t["id"] == new_tid), None)
        self.assertIsNotNone(target_t)
        self.assertEqual(target_t["status"], "done")

        # 8. Verify blueprint now reflects the populated components
        bp_after = self.client.get(f"/api/v1/intelligence/blueprint/{new_pid}").json()
        self.assertEqual(len(bp_after["modules"]), 2)
        module_names = [m["name"] for m in bp_after["modules"]]
        self.assertIn("Core System Foundation", module_names)
        self.assertIn("SLAM Benchmarking Report", module_names)
        core_mod = next(m for m in bp_after["modules"] if m["name"] == "Core System Foundation")
        self.assertIn("Implement LiDAR Odometry", core_mod["deliverables"])

    def test_task_deletion_and_404(self):
        # Create task
        res = self.client.post("/api/v1/tasks", json={
            "project_id": "p1",
            "title": "Temporary Task for Deletion",
            "status": "todo",
            "priority": "low"
        })
        self.assertEqual(res.status_code, 200)
        t_id = res.json()["id"]

        # Delete task
        del_res = self.client.delete(f"/api/v1/tasks/{t_id}")
        self.assertEqual(del_res.status_code, 200)
        self.assertEqual(del_res.json()["success"], True)

        # Deleting again should 404
        del_again = self.client.delete(f"/api/v1/tasks/{t_id}")
        self.assertEqual(del_again.status_code, 404)

        # Deleting non-existent task
        del_fake = self.client.delete("/api/v1/tasks/t-non-existent-999")
        self.assertEqual(del_fake.status_code, 404)

    def test_document_deletion_and_404(self):
        # Create document
        res = self.client.post("/api/v1/documents", json={
            "project_id": "p1",
            "author_id": "u1",
            "title": "Disposable Documentation",
            "content_text": "To be removed",
            "file_type": "text"
        })
        self.assertEqual(res.status_code, 200)
        d_id = res.json()["id"]

        # Delete document
        del_res = self.client.delete(f"/api/v1/documents/{d_id}")
        self.assertEqual(del_res.status_code, 200)
        self.assertEqual(del_res.json()["success"], True)

        # Deleting again should 404
        del_again = self.client.delete(f"/api/v1/documents/{d_id}")
        self.assertEqual(del_again.status_code, 404)

        # Deleting non-existent document
        del_fake = self.client.delete("/api/v1/documents/doc-non-existent-999")
        self.assertEqual(del_fake.status_code, 404)

    def test_task_tags_roundtrip(self):
        res = self.client.post("/api/v1/tasks", json={
            "project_id": "p1",
            "title": "Tagged Infrastructure Task",
            "status": "todo",
            "priority": "medium",
            "tags": ["cloud", "devops", "monitoring"]
        })
        self.assertEqual(res.status_code, 200)
        task = res.json()
        self.assertEqual(task["tags"], ["cloud", "devops", "monitoring"])

    def test_single_resource_get_endpoints_and_404s(self):
        # Task
        res = self.client.get("/api/v1/tasks/t1")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["id"], "t1")
        res_404 = self.client.get("/api/v1/tasks/t-non-existent")
        self.assertEqual(res_404.status_code, 404)

        # Document
        res = self.client.get("/api/v1/documents/doc1")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["id"], "doc1")
        res_404 = self.client.get("/api/v1/documents/doc-non-existent")
        self.assertEqual(res_404.status_code, 404)

        # Discussion
        res = self.client.get("/api/v1/discussions/d1")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["id"], "d1")
        res_404 = self.client.get("/api/v1/discussions/d-non-existent")
        self.assertEqual(res_404.status_code, 404)

        # Activity
        res = self.client.get("/api/v1/activities/act-1")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["id"], "act-1")
        res_404 = self.client.get("/api/v1/activities/act-non-existent")
        self.assertEqual(res_404.status_code, 404)

    def test_memory_fallback_disabled_raises_503(self):
        from backend.config import settings
        from backend.supabase_client import get_supabase_client
        # If no real Supabase is connected and fallback is turned off, operations must return 503
        if get_supabase_client() is None:
            original = settings.USE_MEMORY_FALLBACK
            try:
                settings.USE_MEMORY_FALLBACK = False
                res = self.client.get("/api/v1/projects")
                self.assertEqual(res.status_code, 503)
                self.assertIn("Database unavailable", res.json()["detail"])
            finally:
                settings.USE_MEMORY_FALLBACK = original

if __name__ == "__main__":
    unittest.main()


