#!/usr/bin/env python3
"""
Mind-Mesh Automated Deployment Smoke Test Script
Exercises health checks, CRUD operations, and all Phase 3 deterministic intelligence APIs
against a specified base URL (local dev, staging, or production Render URL).

Usage:
    python backend/smoke_test.py --url http://127.0.0.1:8000
    python backend/smoke_test.py --url https://mind-mesh-backend.onrender.com
"""

import sys
import argparse
import json
import os
import time
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

class SmokeTestRunner:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")
        self.passed = 0
        self.failed = 0
        self.tests_run = 0

    def _request(self, method: str, path: str, payload: dict = None) -> tuple[int, dict]:
        url = f"{self.base_url}{path}"
        headers = {"Content-Type": "application/json", "Accept": "application/json"}
        data = json.dumps(payload).encode("utf-8") if payload is not None else None
        req = Request(url, data=data, headers=headers, method=method)
        try:
            with urlopen(req, timeout=15) as res:
                body = res.read().decode("utf-8")
                return res.status, json.loads(body) if body else {}
        except HTTPError as e:
            body = e.read().decode("utf-8")
            try:
                parsed = json.loads(body)
            except Exception:
                parsed = {"raw": body}
            return e.code, parsed
        except URLError as e:
            return 0, {"error": str(e.reason)}

    def check(self, name: str, condition: bool, details: str = ""):
        self.tests_run += 1
        if condition:
            self.passed += 1
            print(f"  [PASS] {name}")
        else:
            self.failed += 1
            print(f"  [FAIL] {name} - {details}")

    def run_all(self):
        print(f"\n=======================================================")
        print(f"🚀 Running Mind-Mesh Smoke Test on: {self.base_url}")
        print(f"=======================================================\n")

        # 1. Health checks
        status, health = self._request("GET", "/health")
        self.check("Health endpoint root /health", status == 200 and health.get("status") in ("healthy", "degraded"), f"status: {status}, payload: {health}")
        status, v1_health = self._request("GET", "/api/v1/health")
        self.check("Health endpoint /api/v1/health", status == 200, f"status: {status}")

        # 2. List projects
        status, projects = self._request("GET", "/api/v1/projects")
        self.check("List projects /api/v1/projects", status == 200 and isinstance(projects, list), f"status: {status}")

        # 3. Create test project
        owner_id = os.getenv("SMOKE_TEST_OWNER_ID", "u1")
        test_project_payload = {
            "title": f"Smoke Test Project {int(time.time())}",
            "description": "Ephemeral project created by automated smoke test suite",
            "owner_id": owner_id,
            "skills_required": ["Python", "React", "Distributed Systems"]
        }
        status, created_project = self._request("POST", "/api/v1/projects", test_project_payload)
        self.check("Create project POST /api/v1/projects", status == 200 and "id" in created_project, f"status: {status}, body: {created_project}")
        project_id = created_project.get("id")

        # 4. Create task
        task_payload = {
            "project_id": project_id,
            "title": "Smoke Test Automated Deliverable",
            "status": "todo",
            "assignee": "Lead Engineer",
            "assignee_id": owner_id,
            "module": "Core Engine"
        }
        status, created_task = self._request("POST", "/api/v1/tasks", task_payload)
        self.check("Create task POST /api/v1/tasks", status == 200 and "id" in created_task, f"status: {status}")

        # 5. Create discussion
        disc_payload = {
            "project_id": project_id,
            "title": "Architecture Consensus Smoke Thread",
            "content": "Should we standardize on JSON Web Tokens or Session Cookies?",
            "type": "architectural_debate",
            "author_id": owner_id
        }
        status, created_disc = self._request("POST", "/api/v1/discussions", disc_payload)
        self.check("Create discussion POST /api/v1/discussions", status == 200 and "id" in created_disc, f"status: {status}")
        discussion_id = created_disc.get("id")

        # 6. Vote on discussion
        status, voted_disc = self._request("POST", f"/api/v1/discussions/{discussion_id}/vote", {"vote": "pro", "user_id": owner_id})
        self.check("Cast discussion vote POST /discussions/{id}/vote", status == 200 and voted_disc.get("consensus_pro", 0) >= 1, f"status: {status}")

        # 7. Post message
        msg_payload = {"author_id": owner_id, "content": "I recommend JWT with short expiry and refresh rotation."}
        status, created_msg = self._request("POST", f"/api/v1/discussions/{discussion_id}/messages", msg_payload)
        self.check("Post discussion message POST /discussions/{id}/messages", status == 200 and "id" in created_msg, f"status: {status}")

        # 8. Post viewpoint
        vp_payload = {
            "author_id": owner_id,
            "position": "support",
            "argument": "Stateless auth scales seamlessly across distributed edge clusters.",
            "evidence": ["Tested with 10k concurrent sessions"]
        }
        status, created_vp = self._request("POST", f"/api/v1/discussions/{discussion_id}/viewpoints", vp_payload)
        self.check("Post discussion viewpoint POST /discussions/{id}/viewpoints", status == 200 and "id" in created_vp, f"status: {status}")

        # 9. Contribution analytics
        status, contribs = self._request("GET", f"/api/v1/intelligence/contributions/{project_id}")
        self.check("Contribution analytics GET /intelligence/contributions/{id}", status == 200 and "gini_coefficient" in contribs, f"status: {status}")

        # 10. Knowledge graph
        status, kg = self._request("GET", f"/api/v1/intelligence/knowledge/{project_id}")
        self.check("Knowledge graph GET /intelligence/knowledge/{id}", status == 200 and "node_count" in kg and "edge_count" in kg, f"status: {status}")

        # 11. Silos & Gaps
        status, silos = self._request("GET", f"/api/v1/intelligence/silos/{project_id}")
        self.check("Silo & gap detection GET /intelligence/silos/{id}", status == 200 and "silos" in silos and "gaps" in silos, f"status: {status}")

        # 12. Collective insights with evidence
        status, insights = self._request("GET", f"/api/v1/intelligence/insights/{project_id}")
        self.check("Collective insights GET /intelligence/insights/{id}", status == 200 and isinstance(insights, list), f"status: {status}")

        # 13. Detailed recommendations
        status, recs = self._request("GET", f"/api/v1/intelligence/detailed-recommendations/{project_id}")
        self.check("Recommendations GET /intelligence/detailed-recommendations/{id}", status == 200 and isinstance(recs, list), f"status: {status}")

        # 14. Persistent blueprint
        status, bp = self._request("GET", f"/api/v1/intelligence/persistent-blueprint/{project_id}")
        self.check("Persistent blueprint GET /intelligence/persistent-blueprint/{id}", status == 200 and "version" in bp, f"status: {status}")

        # 15. Activity lifecycle and captured impact
        activity_payload = {
            "project_id": project_id,
            "title": "Smoke Test Collaboration Activity",
            "description": "Verify persisted before and after measurements",
            "type": "knowledge_transfer",
            "participants": [owner_id],
        }
        status, activity = self._request("POST", "/api/v1/activities", activity_payload)
        self.check("Create activity POST /api/v1/activities", status == 200 and "id" in activity, f"status: {status}")
        activity_id = activity.get("id")
        status, completed = self._request("POST", f"/api/v1/activities/{activity_id}/complete", {"takeaways": "Smoke test complete"})
        self.check("Complete activity POST /activities/{id}/complete", status == 200 and completed.get("status") == "completed", f"status: {status}")

        # 16. Master re-analysis pipeline
        status, analysis = self._request("POST", f"/api/v1/intelligence/analyze/{project_id}")
        self.check("Re-analysis pipeline POST /intelligence/analyze/{id}", status == 200 and "snapshot" in analysis, f"status: {status}")

        # 17. Activity impact metrics
        status, impact = self._request("GET", f"/api/v1/intelligence/impact/{project_id}/{activity_id}")
        self.check("Activity impact GET /intelligence/impact/{id}/{act_id}", status == 200 and "metric_changes" in impact, f"status: {status}")

        print(f"\n=======================================================")
        print(f"Results: {self.passed}/{self.tests_run} Passed, {self.failed} Failed")
        print(f"=======================================================\n")

        if self.failed > 0:
            print("❌ Smoke test FAILED. Review failures above.")
            sys.exit(1)
        else:
            print("✅ Smoke test PASSED successfully!")
            sys.exit(0)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Mind-Mesh Deployment Smoke Test")
    parser.add_argument("--url", "-u", default="http://127.0.0.1:8000", help="Base URL of Mind-Mesh API service")
    args = parser.parse_args()
    runner = SmokeTestRunner(args.url)
    runner.run_all()
