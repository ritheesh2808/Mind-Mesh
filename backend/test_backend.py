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

if __name__ == "__main__":
    unittest.main()

