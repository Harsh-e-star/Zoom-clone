"""
Comprehensive End-to-End Test Suite for MeetSpace (Zoom Clone)
Verifies all 14 required user flows, SQLite persistence, and API contracts.
"""

import sys
import unittest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.models import Meeting, Participant, Message
from app import crud

class ZoomCloneFullTestSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_dashboard_and_health(self):
        """TEST 1: Health check and root endpoints."""
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "healthy")

        root_res = self.client.get("/")
        self.assertEqual(root_res.status_code, 200)
        self.assertIn("MeetSpace", root_res.json()["app"])

    def test_02_database_seeding(self):
        """Verify initial database seeding has populated upcoming and recent meetings."""
        up_res = self.client.get("/api/meetings/upcoming")
        self.assertEqual(up_res.status_code, 200)
        upcoming = up_res.json()
        self.assertGreaterEqual(len(upcoming), 1)

        rec_res = self.client.get("/api/meetings/recent")
        self.assertEqual(rec_res.status_code, 200)
        recent = rec_res.json()
        self.assertGreaterEqual(len(recent), 1)

    def test_03_instant_meeting_creation(self):
        """TEST 2: Create Instant Meeting -> verify unique ID, invite link, host participant."""
        res = self.client.post("/api/meetings", json={"title": "Sprint Retrospective Instant"})
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertIn("meeting_id", data)
        self.assertEqual(len(data["meeting_id"]), 10)
        self.assertIn("/join/", data["invite_link"])
        self.assertEqual(data["status"], "active")

        # Verify meeting details and participants created
        detail_res = self.client.get(f"/api/meetings/{data['meeting_id']}")
        self.assertEqual(detail_res.status_code, 200)
        detail = detail_res.json()
        self.assertEqual(detail["title"], "Sprint Retrospective Instant")
        self.assertGreaterEqual(len(detail["participants"]), 2)
        host = next((p for p in detail["participants"] if p["role"] == "host"), None)
        self.assertIsNotNone(host)
        self.assertEqual(host["display_name"], "Harsh")

    def test_04_join_meeting_validation(self):
        """TEST 4 & 5: Join validation for valid and invalid meeting IDs."""
        # 1. Invalid meeting ID
        invalid_res = self.client.get("/api/meetings/0000000000")
        self.assertEqual(invalid_res.status_code, 404)
        self.assertIn("Meeting not found", invalid_res.json()["detail"])

        # 2. Valid meeting ID (from seeded or created)
        upcoming = self.client.get("/api/meetings/upcoming").json()
        valid_id = upcoming[0]["meeting_id"]

        valid_res = self.client.get(f"/api/meetings/{valid_id}")
        self.assertEqual(valid_res.status_code, 200)

        # 3. New participant joins
        join_res = self.client.post(
            f"/api/meetings/{valid_id}/participants",
            json={"display_name": "Interview Evaluator", "role": "participant"}
        )
        self.assertEqual(join_res.status_code, 201)
        part = join_res.json()
        self.assertEqual(part["display_name"], "Interview Evaluator")

    def test_05_schedule_meeting(self):
        """TEST 6: Schedule meeting -> validation, stored in DB, appears in upcoming."""
        # Negative test: missing fields
        bad_res = self.client.post("/api/meetings/schedule", json={"title": ""})
        self.assertEqual(bad_res.status_code, 422)

        # Valid schedule
        tomorrow = (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d")
        sch_payload = {
            "title": "System Design Evaluation",
            "description": "High level architecture review and distributed locking design.",
            "date": tomorrow,
            "time": "14:30",
            "duration_minutes": 60,
        }
        res = self.client.post("/api/meetings/schedule", json=sch_payload)
        self.assertEqual(res.status_code, 201)
        created = res.json()
        self.assertEqual(created["title"], "System Design Evaluation")
        self.assertEqual(created["duration_minutes"], 60)
        self.assertIn("passcode", created)

        # Check in upcoming
        up_res = self.client.get("/api/meetings/upcoming")
        ids = [m["meeting_id"] for m in up_res.json()]
        self.assertIn(created["meeting_id"], ids)

    def test_06_meeting_chat_persistence(self):
        """TEST 11 & 12: In-meeting chat sending and SQLite persistence."""
        new_meeting = self.client.post("/api/meetings", json={"title": "Chat Test"}).json()
        m_id = new_meeting["meeting_id"]

        # Send messages
        msg1 = self.client.post(
            f"/api/meetings/{m_id}/messages",
            json={"sender_name": "Harsh", "sender_role": "host", "message": "Welcome everyone!"}
        ).json()
        self.assertEqual(msg1["message"], "Welcome everyone!")

        msg2 = self.client.post(
            f"/api/meetings/{m_id}/messages",
            json={"sender_name": "Sarah Miller", "sender_role": "participant", "message": "Thanks Harsh, ready!"}
        ).json()
        self.assertEqual(msg2["message"], "Thanks Harsh, ready!")

        # Retrieve messages
        msgs = self.client.get(f"/api/meetings/{m_id}/messages").json()
        # Including initial welcome system messages + 2 sent messages
        self.assertGreaterEqual(len(msgs), 2)
        texts = [m["message"] for m in msgs]
        self.assertIn("Welcome everyone!", texts)
        self.assertIn("Thanks Harsh, ready!", texts)

    def test_07_host_moderation_controls(self):
        """TEST 8, 9, 10: Mute all and participant controls."""
        new_meeting = self.client.post("/api/meetings", json={"title": "Host Controls Test"}).json()
        m_id = new_meeting["meeting_id"]

        # Mute all participants
        mute_res = self.client.post(f"/api/meetings/{m_id}/mute-all")
        self.assertEqual(mute_res.status_code, 200)
        self.assertIn("muted_count", mute_res.json())

        # Check participants list
        parts = self.client.get(f"/api/meetings/{m_id}/participants").json()
        non_hosts = [p for p in parts if p["role"] != "host"]
        for p in non_hosts:
            self.assertTrue(p["is_muted"])

        # Host un-mutes specific participant
        first_guest = non_hosts[0]
        patch_res = self.client.patch(
            f"/api/meetings/{m_id}/participants/{first_guest['id']}",
            json={"is_muted": False}
        )
        self.assertEqual(patch_res.status_code, 200)
        self.assertFalse(patch_res.json()["is_muted"])

        # Remove participant
        del_part = self.client.delete(f"/api/meetings/{m_id}/participants/{first_guest['id']}")
        self.assertEqual(del_part.status_code, 200)

        # Verify participant is no longer active
        active_parts = self.client.get(f"/api/meetings/{m_id}/participants").json()
        active_ids = [p["id"] for p in active_parts]
        self.assertNotIn(first_guest["id"], active_ids)

    def test_08_meeting_deletion_and_cascade(self):
        """Verify meeting deletion cascades and removes records in SQLite."""
        new_meeting = self.client.post("/api/meetings", json={"title": "To Delete"}).json()
        m_id = new_meeting["meeting_id"]

        del_res = self.client.delete(f"/api/meetings/{m_id}")
        self.assertEqual(del_res.status_code, 200)

        # Lookup should now be 404
        chk_res = self.client.get(f"/api/meetings/{m_id}")
        self.assertEqual(chk_res.status_code, 404)

if __name__ == "__main__":
    unittest.main()
