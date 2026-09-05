"""Comprehensive automated end-to-end test suite for SIH26044 Portal."""
import unittest
import json
from fastapi.testclient import TestClient

from backend.main import app
from backend.matching import calculate_match
from backend.resume_parser import parse_resume_text

class TestPortalE2E(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_health_check(self):
        resp = self.client.get("/api/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "healthy")

    def test_02_demo_logins_all_four_roles(self):
        roles = ["student", "institution", "recruiter", "admin"]
        for role in roles:
            resp = self.client.post(f"/api/auth/demo-login/{role}")
            self.assertEqual(resp.status_code, 200, f"Failed demo login for role {role}")
            body = resp.json()
            self.assertIn("access_token", body)
            self.assertEqual(body["user"]["role"], role)

    def test_03_matching_engine_explainability(self):
        student_skills = [
            {"skill_name": "Python", "proficiency": "Expert", "endorsed": True},
            {"skill_name": "FastAPI", "proficiency": "Expert", "endorsed": True},
            {"skill_name": "Docker", "proficiency": "Intermediate", "endorsed": False}
        ]
        job_skills = ["Python", "FastAPI", "Docker", "React", "PostgreSQL"]

        result = calculate_match(
            student_skills=student_skills,
            job_required_skills=job_skills,
            job_title="Full Stack Software Engineer",
            job_description="Seeking a FastAPI and React developer with container knowledge."
        )

        self.assertIn("score", result)
        self.assertIn("tier", result)
        self.assertIn("matched_skills", result)
        self.assertIn("missing_skills", result)
        self.assertIn("explanation", result)

        matched_names = [m["skill"].lower() for m in result["matched_skills"]]
        self.assertIn("python", matched_names)
        self.assertIn("fastapi", matched_names)
        self.assertIn("docker", matched_names)

        missing_names = [m["skill"].lower() for m in result["missing_skills"]]
        self.assertIn("react", missing_names)
        self.assertIn("postgresql", missing_names)

        # Faculty endorsement count verification
        self.assertEqual(result["endorsed_count"], 2)
        self.assertGreater(result["score"], 50)

    def test_04_resume_parser_taxonomy_matching(self):
        sample_resume = """
        Arjun Sharma
        Email: arjun.sharma@example.edu | Phone: +91 9876543210
        GitHub: https://github.com/arjun-sharma

        Professional Summary:
        Aspiring Software Engineer with expertise in Python, FastAPI, Docker, and PostgreSQL.
        Built full-stack applications with React and Tailwind CSS.
        Familiar with Kubernetes, Machine Learning pipelines, and CI/CD.
        """
        parsed = parse_resume_text(sample_resume)

        self.assertEqual(parsed["email"], "arjun.sharma@example.edu")
        self.assertIn("github.com", parsed["github"])

        extracted_skill_names = [s["skill_name"].lower() for s in parsed["extracted_skills"]]
        self.assertIn("python", extracted_skill_names)
        self.assertIn("fastapi", extracted_skill_names)
        self.assertIn("docker", extracted_skill_names)
        self.assertIn("postgresql", extracted_skill_names)
        self.assertIn("react", extracted_skill_names)

    def test_05_student_workflow_and_skill_gap(self):
        # 1. Login as Student
        login_resp = self.client.post("/api/auth/demo-login/student")
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get Profile
        prof_resp = self.client.get("/api/students/profile", headers=headers)
        self.assertEqual(prof_resp.status_code, 200)
        self.assertEqual(prof_resp.json()["full_name"], "Arjun Sharma")

        # 3. Add a new skill
        add_resp = self.client.post("/api/students/skills", json={"skill_name": "Kubernetes", "proficiency": "Intermediate"}, headers=headers)
        self.assertEqual(add_resp.status_code, 200)

        # 4. Check Skill Gap against Job 1
        gap_resp = self.client.get("/api/students/skill-gap/1", headers=headers)
        self.assertEqual(gap_resp.status_code, 200)
        gap_data = gap_resp.json()
        self.assertIn("analysis", gap_data)
        self.assertIn("matched_skills", gap_data["analysis"])

        # 5. List applications
        apps_resp = self.client.get("/api/students/applications", headers=headers)
        self.assertEqual(apps_resp.status_code, 200)
        self.assertIsInstance(apps_resp.json(), list)

    def test_06_recruiter_pipeline_and_feedback(self):
        # 1. Login as Recruiter
        rec_login = self.client.post("/api/auth/demo-login/recruiter")
        rec_token = rec_login.json()["access_token"]
        rec_headers = {"Authorization": f"Bearer {rec_token}"}

        # 2. Get Postings
        postings_resp = self.client.get("/api/recruiters/postings", headers=rec_headers)
        self.assertEqual(postings_resp.status_code, 200)
        postings = postings_resp.json()
        self.assertGreater(len(postings), 0)

        # Find job with applicants
        target_job = next((j for j in postings if j["total_applicants"] > 0), postings[0])
        job_id = target_job["id"]

        # 3. View Ranked Candidates
        cand_resp = self.client.get(f"/api/recruiters/postings/{job_id}/candidates", headers=rec_headers)
        self.assertEqual(cand_resp.status_code, 200)
        cand_data = cand_resp.json()
        self.assertIn("candidates", cand_data)
        self.assertGreater(len(cand_data["candidates"]), 0)

        app_id = cand_data["candidates"][0]["application_id"]

        # 4. Advance status: Shortlisted -> Interview -> Offer
        status_resp = self.client.put(
            f"/api/recruiters/applications/{app_id}/status",
            json={"status": "offer", "recruiter_notes": "Exceptional technical assessment scores."},
            headers=rec_headers
        )
        self.assertEqual(status_resp.status_code, 200)
        self.assertEqual(status_resp.json()["status"], "offer")

        # 5. Submit hiring accuracy rating
        fb_resp = self.client.post(
            f"/api/recruiters/applications/{app_id}/feedback",
            json={"rating": 5, "match_accuracy_comment": "Score matched candidate actual proficiency perfectly."},
            headers=rec_headers
        )
        self.assertEqual(fb_resp.status_code, 200)

    def test_07_institution_endorsement_and_analytics(self):
        # 1. Login as Institution
        inst_login = self.client.post("/api/auth/demo-login/institution")
        inst_token = inst_login.json()["access_token"]
        inst_headers = {"Authorization": f"Bearer {inst_token}"}

        # 2. View cohort analytics
        analytics_resp = self.client.get("/api/institutions/analytics", headers=inst_headers)
        self.assertEqual(analytics_resp.status_code, 200)
        adata = analytics_resp.json()
        self.assertIn("placement_rate", adata)
        self.assertIn("sector_distribution", adata)
        self.assertIn("skill_gap_heatmap", adata)

        # 3. View pending skill endorsements
        endorse_resp = self.client.get("/api/institutions/endorsements", headers=inst_headers)
        self.assertEqual(endorse_resp.status_code, 200)
        skills = endorse_resp.json()
        self.assertIsInstance(skills, list)
        if skills:
            skill_id = skills[0]["skill_id"]
            action_resp = self.client.post(f"/api/institutions/endorse/{skill_id}", headers=inst_headers)
            self.assertEqual(action_resp.status_code, 200)
            self.assertTrue(action_resp.json()["endorsed"])

    def test_08_admin_metrics_and_csv_export(self):
        # 1. Login as Admin
        admin_login = self.client.post("/api/auth/demo-login/admin")
        admin_token = admin_login.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # 2. Fetch national metrics
        metrics_resp = self.client.get("/api/admin/metrics", headers=admin_headers)
        self.assertEqual(metrics_resp.status_code, 200)
        mdata = metrics_resp.json()
        self.assertIn("kpis", mdata)
        self.assertGreater(mdata["kpis"]["total_students"], 0)

        # 3. Fetch skill trends
        trends_resp = self.client.get("/api/admin/skill-trends", headers=admin_headers)
        self.assertEqual(trends_resp.status_code, 200)
        self.assertIsInstance(trends_resp.json(), list)

        # 4. Export CSV report
        export_resp = self.client.get("/api/admin/export-report", headers=admin_headers)
        self.assertEqual(export_resp.status_code, 200)
        self.assertIn("text/csv", export_resp.headers["content-type"])
        self.assertIn("Full Name", export_resp.text)
        self.assertIn("Verified Skills", export_resp.text)

if __name__ == "__main__":
    unittest.main()
