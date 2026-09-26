import unittest
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.ai_engine import CollaborativeAIEngine

class TestMindMeshBackend(unittest.TestCase):
    def setUp(self):
        from backend.config import settings
        self.original_memory_fallback = settings.USE_MEMORY_FALLBACK
        settings.USE_MEMORY_FALLBACK = True
        self.client = TestClient(app)

    def tearDown(self):
        from backend.config import settings
        settings.USE_MEMORY_FALLBACK = self.original_memory_fallback

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

        patch_res = self.client.patch(f"/api/v1/projects/{data['id']}", json={
            "title": "Quantum Cryptography Workspace v2",
            "progress": 25,
        })
        self.assertEqual(patch_res.status_code, 200)
        get_res = self.client.get(f"/api/v1/projects/{data['id']}")
        self.assertEqual(get_res.status_code, 200)
        self.assertEqual(get_res.json()["title"], "Quantum Cryptography Workspace v2")
        self.assertEqual(get_res.json()["progress"], 25)

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

    def test_health_is_unavailable_without_database_or_memory(self):
        from backend.config import settings
        from backend.supabase_client import get_supabase_client
        if get_supabase_client() is None:
            original = settings.USE_MEMORY_FALLBACK
            try:
                settings.USE_MEMORY_FALLBACK = False
                response = self.client.get("/health")
                self.assertEqual(response.status_code, 503)
                self.assertEqual(response.json()["database"], "database_unavailable")
                self.assertFalse(response.json()["memory_fallback_active"])
            finally:
                settings.USE_MEMORY_FALLBACK = original

    # -------------------------------------------------------------------------
    # Phase 3 ED-03 Intelligence Tests
    # -------------------------------------------------------------------------

    def test_contribution_analytics_and_events(self):
        # 1. Fetch contribution analytics for p1
        res = self.client.get("/api/v1/intelligence/contributions/p1")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["project_id"], "p1")
        self.assertIn("gini_coefficient", data)
        self.assertIn("equity_score", data)
        self.assertIn("equity_interpretation", data)
        self.assertIn("member_summaries", data)
        self.assertIn("participation_rate", data)
        self.assertGreaterEqual(len(data["member_summaries"]), 1)

        # 2. Completing an assigned task records a contribution
        init_contribs = data["total_contributions"]
        res_task = self.client.post("/api/v1/tasks", json={
            "project_id": "p1",
            "title": "Contribution Tracking Verification Task",
            "status": "todo",
            "assignee": "Ritheesh",
            "assignee_id": "u1"
        })
        self.assertEqual(res_task.status_code, 200)
        task_id = res_task.json()["id"]
        complete_task = self.client.patch(f"/api/v1/tasks/{task_id}", json={"status": "done"})
        self.assertEqual(complete_task.status_code, 200)
        
        res_after = self.client.get("/api/v1/intelligence/contributions/p1")
        self.assertEqual(res_after.status_code, 200)
        self.assertGreaterEqual(res_after.json()["total_contributions"], init_contribs + 1)

    def test_contribution_edge_cases(self):
        from backend.services.contribution_engine import ContributionEngine
        # Test empty project edge case
        empty_res = ContributionEngine.analyze_contributions("p-non-existent")
        self.assertEqual(empty_res.total_contributions, 0)
        self.assertEqual(empty_res.gini_coefficient, 0.0)
        self.assertEqual(empty_res.equity_score, 100.0)

    def test_knowledge_graph_endpoints(self):
        res = self.client.get("/api/v1/intelligence/knowledge/p1")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["project_id"], "p1")
        self.assertGreaterEqual(data["node_count"], 1)
        self.assertGreaterEqual(data["edge_count"], 1)

        node_types = {n["node_type"] for n in data["nodes"]}
        self.assertTrue(node_types.intersection({"person", "task", "document", "discussion"}))

        edge_types = {e["edge_type"] for e in data["edges"]}
        self.assertTrue(edge_types.intersection({"assigned_to", "authored", "participated_in", "contributed_to"}))

    def test_silo_and_gap_detection(self):
        res = self.client.get("/api/v1/intelligence/silos/p1")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["project_id"], "p1")
        self.assertIn("silos", data)
        self.assertIn("gaps", data)
        self.assertGreaterEqual(data["silo_count"], 1)

        for s in data["silos"]:
            self.assertIn("topic", s)
            self.assertIn("risk", s)
            self.assertIn("owners", s)
            self.assertGreaterEqual(len(s["supporting_evidence"]), 1)
            self.assertIn("recommended_action", s)

        for g in data["gaps"]:
            self.assertIn("skill_or_topic", g)
            self.assertIn("gap_type", g)
            self.assertIn("impact", g)
            self.assertIn("recommended_action", g)

    def test_discussion_messages_and_viewpoints(self):
        # 1. Post and get messages
        res_msg = self.client.post("/api/v1/discussions/d1/messages", json={
            "author_id": "u1",
            "content": "Proposing WebSockets with fallback to SSE."
        })
        self.assertEqual(res_msg.status_code, 200)
        msg_data = res_msg.json()
        self.assertEqual(msg_data["content"], "Proposing WebSockets with fallback to SSE.")

        res_list = self.client.get("/api/v1/discussions/d1/messages")
        self.assertEqual(res_list.status_code, 200)
        self.assertGreaterEqual(len(res_list.json()), 1)

        # 2. Post and get viewpoints
        res_vp = self.client.post("/api/v1/discussions/d1/viewpoints", json={
            "author_id": "u2",
            "position": "support",
            "argument": "WebSockets enable true bidirectional streaming with lower header overhead.",
            "evidence": ["Benchmark tests show 40ms lower latency"]
        })
        self.assertEqual(res_vp.status_code, 200)
        vp_data = res_vp.json()
        self.assertEqual(vp_data["position"], "support")

        res_vp_list = self.client.get("/api/v1/discussions/d1/viewpoints")
        self.assertEqual(res_vp_list.status_code, 200)
        self.assertGreaterEqual(len(res_vp_list.json()), 1)

        # 3. Discussion intelligence summary
        res_intel = self.client.get("/api/v1/intelligence/discussions-intel/p1")
        self.assertEqual(res_intel.status_code, 200)
        intel_data = res_intel.json()
        self.assertGreaterEqual(len(intel_data), 1)
        self.assertIn("consensus_status", intel_data[0])
        self.assertIn("divergence_score", intel_data[0])

    def test_collective_insights_with_evidence(self):
        res = self.client.get("/api/v1/intelligence/insights/p1")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 1)

        # Verify evidence citations (answers: "Why did Mind-Mesh generate this insight?")
        for ins in data:
            self.assertIn("insight_type", ins)
            self.assertIn("title", ins)
            self.assertIn("summary", ins)
            self.assertIn("evidence", ins)
            self.assertGreaterEqual(len(ins["evidence"]), 1)
            first_ev = ins["evidence"][0]
            self.assertIn("source_type", first_ev)
            self.assertIn("source_id", first_ev)
            self.assertIn("description", first_ev)

    def test_detailed_recommendations(self):
        res = self.client.get("/api/v1/intelligence/detailed-recommendations/p1")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 1)

        first_rec = data[0]
        self.assertIn("type", first_rec)
        self.assertIn("title", first_rec)
        self.assertIn("reason", first_rec)
        self.assertIn("participants", first_rec)
        self.assertIn("sources", first_rec)
        self.assertIn("suggested_agenda", first_rec)
        self.assertGreaterEqual(len(first_rec["participants"]), 1)
        self.assertIn("user_id", first_rec["participants"][0])

    def test_persistent_blueprint_and_versioning(self):
        res = self.client.get("/api/v1/intelligence/persistent-blueprint/p1")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["project_id"], "p1")
        self.assertGreaterEqual(data["version"], 1)
        self.assertIn("modules", data)
        self.assertIn("agreed_consensus", data)
        self.assertIn("unresolved_risks", data)
        self.assertIn("action_plan", data)
        self.assertGreaterEqual(len(data["modules"]), 1)

        repeated = self.client.get("/api/v1/intelligence/persistent-blueprint/p1")
        self.assertEqual(repeated.status_code, 200)
        self.assertEqual(repeated.json()["version"], data["version"])

    def test_snapshots_and_reanalysis_pipeline(self):
        # 1. Trigger full re-analysis pipeline
        res_analyze = self.client.post("/api/v1/intelligence/analyze/p1")
        self.assertEqual(res_analyze.status_code, 200)
        analysis = res_analyze.json()
        self.assertEqual(analysis["project_id"], "p1")
        self.assertIn("contributions", analysis)
        self.assertIn("knowledge_graph", analysis)
        self.assertIn("silos_and_gaps", analysis)
        self.assertIn("insights", analysis)
        self.assertIn("recommendations", analysis)
        self.assertIn("blueprint", analysis)
        self.assertIn("snapshot", analysis)
        self.assertEqual(analysis["blueprint"]["version"], 2)

        # 2. Get snapshots
        res_snaps = self.client.get("/api/v1/intelligence/snapshots/p1")
        self.assertEqual(res_snaps.status_code, 200)
        snaps = res_snaps.json()
        self.assertGreaterEqual(len(snaps), 1)

        # 3. Post manual snapshot
        res_create_snap = self.client.post("/api/v1/intelligence/snapshots/p1", json={
            "analysis_type": "sprint_checkpoint",
            "data": {"sprint": 1, "velocity": 12}
        })
        self.assertEqual(res_create_snap.status_code, 200)
        snap_item = res_create_snap.json()
        self.assertEqual(snap_item["analysis_type"], "sprint_checkpoint")

    def test_activity_impact_metrics(self):
        not_completed = self.client.get("/api/v1/intelligence/impact/p1/act-1")
        self.assertEqual(not_completed.status_code, 409)

        created = self.client.post("/api/v1/activities", json={
            "project_id": "p1",
            "title": "Measured impact session",
            "description": "Capture actual before and after metrics",
            "participants": ["u1"],
        })
        self.assertEqual(created.status_code, 200)
        activity_id = created.json()["id"]

        before_completion = self.client.get(f"/api/v1/intelligence/impact/p1/{activity_id}")
        self.assertEqual(before_completion.status_code, 409)

        completed = self.client.post(f"/api/v1/activities/{activity_id}/complete", json={
            "takeaways": "Recorded outcomes",
            "completed_task_ids": [],
        })
        self.assertEqual(completed.status_code, 200)

        res = self.client.get(f"/api/v1/intelligence/impact/p1/{activity_id}")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["project_id"], "p1")
        self.assertEqual(data["activity_id"], activity_id)
        self.assertIn("before_snapshot", data)
        self.assertIn("after_snapshot", data)
        self.assertIn("knowledge_edges", data["before_snapshot"])
        self.assertIn("silo_count", data["after_snapshot"])
        self.assertIn("metric_changes", data)
        self.assertIn("narrative_summary", data)
        self.assertIn("gini_delta", data["metric_changes"])

    def test_skewed_and_single_member_equity_edge_cases(self):
        from backend.services.contribution_engine import ContributionEngine
        # 1. Single member project
        single_res = ContributionEngine.analyze_contributions(
            project_id="test_single",
            members=[{"id": "u1", "name": "Solo Founder"}],
            contributions=[{"id": "c1", "user_id": "u1", "weight": 5}],
            tasks=[],
            discussions=[],
            documents=[]
        )
        self.assertEqual(single_res.gini_coefficient, 0.0)
        self.assertEqual(single_res.equity_score, 100.0)

        # 2. Skewed 3-member team (1 heavy contributor, 2 zero contributors)
        skewed_res = ContributionEngine.analyze_contributions(
            project_id="test_skewed",
            members=[
                {"id": "u1", "name": "Overworked Lead"},
                {"id": "u2", "name": "Inactive Member A"},
                {"id": "u3", "name": "Inactive Member B"}
            ],
            contributions=[
                {"id": f"c_{i}", "user_id": "u1", "weight": 3} for i in range(10)
            ],
            tasks=[],
            discussions=[],
            documents=[]
        )
        self.assertGreater(skewed_res.gini_coefficient, 0.5)
        self.assertLess(skewed_res.equity_score, 50.0)
        self.assertIn("Overworked Lead", skewed_res.concentrated_members)
        self.assertEqual(len(skewed_res.inactive_members), 2)

    def test_discussion_polarized_divergence_edge_cases(self):
        from backend.services.discussion_engine import DiscussionEngine
        # 1. 50/50 polarized vote (e.g. 5 pro, 5 con)
        polarized_res = DiscussionEngine.analyze_discussion({
            "id": "disc_polar",
            "title": "SQL vs NoSQL debate",
            "consensus_pro": 5,
            "consensus_con": 5,
            "status": "open",
            "type": "architectural_debate"
        })
        self.assertEqual(polarized_res.divergence_score, 0.0)
        self.assertEqual(polarized_res.consensus_status, "unresolved_disagreement")

        # 2. Discussion with 0 votes recorded
        zero_vote_res = DiscussionEngine.analyze_discussion({
            "id": "disc_empty",
            "title": "Unvoted topic",
            "consensus_pro": 0,
            "consensus_con": 0,
            "status": "open"
        })
        self.assertEqual(zero_vote_res.consensus_status, "needs_vote")
        self.assertEqual(zero_vote_res.divergence_score, 0.85)

    def test_empty_project_reanalysis(self):
        # Create an empty project
        res_create = self.client.post("/api/v1/projects", json={
            "title": "Minimal Brand New Project",
            "description": "Empty project for testing deterministic re-analysis resilience",
            "owner_id": "u1",
        })
        self.assertEqual(res_create.status_code, 200)
        pid = res_create.json()["id"]

        # Run full analysis on empty project
        res_analyze = self.client.post(f"/api/v1/intelligence/analyze/{pid}")
        self.assertEqual(res_analyze.status_code, 200)
        data = res_analyze.json()
        self.assertEqual(data["project_id"], pid)
        self.assertIn("blueprint", data)
        self.assertIn("knowledge_graph", data)
        self.assertIn("snapshot", data)
        self.assertEqual(data["insights"], [])
        self.assertEqual(data["recommendations"], [])
        self.assertEqual(data["blueprint"]["modules"], [])

    def test_production_mode_503_on_intelligence_endpoints(self):
        from backend.config import settings
        from backend.supabase_client import get_supabase_client
        if get_supabase_client() is None:
            original = settings.USE_MEMORY_FALLBACK
            try:
                settings.USE_MEMORY_FALLBACK = False
                res_contrib = self.client.get("/api/v1/intelligence/contributions/p1")
                self.assertEqual(res_contrib.status_code, 503)

                res_graph = self.client.get("/api/v1/intelligence/knowledge/p1")
                self.assertEqual(res_graph.status_code, 503)

                res_silos = self.client.get("/api/v1/intelligence/silos/p1")
                self.assertEqual(res_silos.status_code, 503)

                res_snaps = self.client.get("/api/v1/intelligence/snapshots/p1")
                self.assertEqual(res_snaps.status_code, 503)
            finally:
                settings.USE_MEMORY_FALLBACK = original

    def test_duplicate_graph_edge_handling(self):
        from backend.services.knowledge_graph_engine import KnowledgeGraphEngine
        # Construct graph with duplicate tasks or contributors on same document
        graph = KnowledgeGraphEngine.build_graph(
            project_id="test_dup",
            project={"id": "test_dup", "title": "Test Duplicate Project", "skills_required": ["Python"]},
            members=[{"user_id": "u10", "name": "Alice", "role": "Engineer", "skills": ["Python"]}],
            tasks=[
                {"id": "t10", "title": "Task A", "assignee_id": "u10", "module": "Backend", "status": "done"},
                {"id": "t11", "title": "Task B", "assignee_id": "u10", "module": "Backend", "status": "done"},
            ],
            discussions=[],
            documents=[
                {"id": "doc10", "title": "Spec 1", "author_id": "u10", "contributors": ["u10", "u10"]},
            ]
        )
        edge_ids = [e.id for e in graph.edges]
        self.assertEqual(len(edge_ids), len(set(edge_ids)), "All graph edges must have unique IDs")

    def test_isolated_knowledge_node(self):
        from backend.services.knowledge_graph_engine import KnowledgeGraphEngine
        from backend.services.silo_detector import SiloDetector
        # Required skill that no team member has
        graph = KnowledgeGraphEngine.build_graph(
            project_id="test_iso",
            project={"id": "test_iso", "title": "Iso Project", "skills_required": ["Rust", "Kubernetes"]},
            members=[{"user_id": "u20", "name": "Bob", "role": "Frontend", "skills": ["CSS"]}],
            tasks=[],
            discussions=[],
            documents=[]
        )
        skill_nodes = [n for n in graph.nodes if n.node_type == "skill"]
        self.assertTrue(any(n.label == "Rust" for n in skill_nodes))
        # Ensure SiloDetector flags missing skill as a gap
        gaps_res = SiloDetector.detect_silos_and_gaps(
            project_id="test_iso",
            project={"id": "test_iso", "title": "Iso Project", "skills_required": ["Rust"]},
            members=[{"user_id": "u20", "name": "Bob", "skills": ["CSS"]}],
            tasks=[],
            discussions=[],
            documents=[]
        )
        self.assertTrue(any(g.skill_or_topic == "Rust" and g.gap_type == "missing_skill" for g in gaps_res.gaps))

    def test_one_sided_discussion_consensus(self):
        from backend.services.discussion_engine import DiscussionEngine
        res = DiscussionEngine.analyze_discussion({
            "id": "disc_onesided",
            "title": "Adopt TypeScript across all UI components",
            "consensus_pro": 7,
            "consensus_con": 0,
            "status": "open",
            "type": "consensus_decision",
            "resolution": "Adopt TypeScript strict mode across frontend"
        })
        self.assertEqual(res.consensus_status, "consensus_reached")
        self.assertEqual(res.pro_votes, 7)
        self.assertEqual(res.con_votes, 0)
        self.assertEqual(res.divergence_score, 1.0)

    def test_viewpoints_positions_and_consensus(self):
        from backend.services.discussion_engine import DiscussionEngine
        disc = {
            "id": "disc_vp",
            "title": "Database Engine Choice",
            "consensus_pro": 3,
            "consensus_con": 1,
            "status": "open",
            "type": "architectural_debate"
        }
        vps = [
            {"discussion_id": "disc_vp", "author_id": "u1", "position": "support", "argument": "PostgreSQL is battle-tested"},
            {"discussion_id": "disc_vp", "author_id": "u2", "position": "alternative", "argument": "Consider CockroachDB for multi-region"},
            {"discussion_id": "disc_vp", "author_id": "u3", "position": "neutral", "argument": "Depends on read-to-write ratios"},
        ]
        res = DiscussionEngine.analyze_discussions([disc], viewpoints=vps)[0]
        self.assertEqual(res.viewpoint_count, 3)
        self.assertGreaterEqual(res.participant_count, 3)

    def test_activity_impact_uncompleted_raises_409(self):
        # Create a pending activity
        res_create = self.client.post("/api/v1/activities", json={
            "project_id": "p1",
            "title": "Pending Activity Impact Test",
            "description": "Checking 409 when uncompleted",
            "type": "knowledge_transfer",
            "participants": ["u1", "u2"],
        })
        self.assertEqual(res_create.status_code, 200)
        act_id = res_create.json()["id"]

        # Attempt to get impact before completion -> must raise 409
        res_impact = self.client.get(f"/api/v1/intelligence/impact/p1/{act_id}")
        self.assertEqual(res_impact.status_code, 409)

if __name__ == "__main__":
    unittest.main()




