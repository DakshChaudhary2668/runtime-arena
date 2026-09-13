"""
Idempotent Mission Completion & XP Persistence Test.
Verifies that repeat correct submissions do not create duplicate completion records,
do not inflate XP, and do not distort player analytics or progression state.
"""

import os
import sys
import unittest
import uuid
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app import create_app
from models.database import get_player_analytics


CORRECT_01 = """
def reverse_fuel_line(head):
    prev, curr = None, head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev
"""


class IdempotentCompletionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = create_app().test_client()

    def test_repeat_submission_does_not_duplicate_xp_or_completion(self):
        test_user = f"pilot_repeat_{uuid.uuid4().hex[:8]}"
        student_name = f"Cadet {test_user}"

        # 1. Fresh state check
        initial_analytics = get_player_analytics(test_user)
        self.assertEqual(initial_analytics["completed_missions"], 0)
        self.assertEqual(initial_analytics["xp_earned"], 0)

        payload = {
            "module_id": "flight-101",
            "mission_id": "01",
            "code": CORRECT_01,
            "language_id": 71,
            "user_id": test_user,
            "student": student_name,
            "topic": "Linked List Reversal",
            "attempts": 1,
            "hint_level": 0,
            "xp_earned": 250,
            "xp_deducted": 0,
            "time_seconds": 45,
        }

        # 2. First submission (correct)
        resp1 = self.client.post("/api/execute", json=payload)
        self.assertEqual(resp1.status_code, 200)
        data1 = resp1.json
        self.assertEqual(data1["status"], "ACCEPTED")
        self.assertTrue(data1["passed"])
        self.assertEqual(data1["score"], 100)

        analytics_after_first = get_player_analytics(test_user)
        self.assertEqual(analytics_after_first["completed_missions"], 1)
        self.assertEqual(analytics_after_first["xp_earned"], 250)
        self.assertEqual(len(analytics_after_first["missions"]), 1)

        # 3. Second submission (same correct code submitted again)
        # Frontend might calculate attempts=2, projected XP=225 or send 250 again
        payload2 = dict(payload)
        payload2["attempts"] = 2
        payload2["xp_earned"] = 225
        payload2["time_seconds"] = 60

        resp2 = self.client.post("/api/execute", json=payload2)
        self.assertEqual(resp2.status_code, 200)
        data2 = resp2.json
        self.assertEqual(data2["status"], "ACCEPTED")
        self.assertTrue(data2["passed"])
        self.assertEqual(data2["score"], 100)

        # 4. Assert XP and completion count are completely unchanged
        analytics_after_second = get_player_analytics(test_user)
        self.assertEqual(
            analytics_after_second["completed_missions"],
            1,
            "completed_missions count MUST remain 1 on repeat submission"
        )
        self.assertEqual(
            analytics_after_second["xp_earned"],
            250,
            "xp_earned MUST remain at the initial 250, never duplicated or inflated"
        )
        self.assertEqual(
            len(analytics_after_second["missions"]),
            1,
            "mission_completion table MUST have exactly 1 record for this mission"
        )

        # 5. Third submission (rapid re-submission)
        resp3 = self.client.post("/api/execute", json=payload)
        self.assertEqual(resp3.status_code, 200)
        analytics_after_third = get_player_analytics(test_user)
        self.assertEqual(analytics_after_third["completed_missions"], 1)
        self.assertEqual(analytics_after_third["xp_earned"], 250)
        self.assertEqual(len(analytics_after_third["missions"]), 1)


if __name__ == "__main__":
    unittest.main(verbosity=2)
