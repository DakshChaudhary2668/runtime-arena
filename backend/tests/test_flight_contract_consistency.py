"""
Flight 101 Frontend/Backend Mission Contract Consistency Test.
Verifies that frontend scenario declarations and server-side challenge harnesses stay in sync.
"""

import re
import sys
import unittest
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from challenges.flight_101 import CHALLENGES, get_challenge


REPO_ROOT = Path(__file__).resolve().parents[2]
SCENARIOS_JS = REPO_ROOT / "frontend" / "src" / "data" / "scenarios.js"


class FlightContractConsistencyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.assertTrue(SCENARIOS_JS.is_file(), f"scenarios.js missing at {SCENARIOS_JS}")
        content = SCENARIOS_JS.read_text(encoding="utf-8")

        # Extract Flight 101 block
        f1_match = re.search(
            r'id:\s*["\']flight-101["\'].*?missions:\s*\[(.*?)\]\s*\},?\s*\{',
            content,
            re.DOTALL,
        )
        cls.assertIsNotNone(f1_match, "flight-101 block not found in scenarios.js")
        cls.missions_text = f1_match.group(1)

        # Extract each mission object
        # We capture: id, number, topic, and starterCode
        pattern = re.compile(
            r'\{\s*id:\s*["\'](?P<id>[^"\']+)["\'].*?'
            r'number:\s*["\'](?P<num>[^"\']+)["\'].*?'
            r'topic:\s*["\'](?P<topic>[^"\']+)["\'].*?'
            r'starterCode:\s*`(?P<code>[^`]+)`',
            re.DOTALL,
        )
        cls.frontend_missions = [m.groupdict() for m in pattern.finditer(cls.missions_text)]

    def test_mission_count_and_order(self):
        """Verify mission order and count match exactly (01, 02, 03)."""
        self.assertEqual(len(self.frontend_missions), 3, "Flight 101 must have exactly 3 missions")
        ids = [m["id"] for m in self.frontend_missions]
        self.assertEqual(ids, ["01", "02", "03"], "Mission IDs must be ordered 01, 02, 03")
        self.assertEqual(len(set(ids)), len(ids), "Mission IDs must not contain duplicates")

    def test_every_frontend_mission_registered_in_backend(self):
        """Every frontend mission must exist in backend challenges registry."""
        for fm in self.frontend_missions:
            m_id = fm["id"]
            challenge = get_challenge(m_id)
            self.assertIsNotNone(challenge, f"Mission {m_id} missing in backend CHALLENGES registry")
            self.assertEqual(challenge.mission_id, m_id)

    def test_entry_functions_match_starter_code(self):
        """Backend entry function name must match the target function in frontend starter code."""
        for fm in self.frontend_missions:
            m_id = fm["id"]
            challenge = get_challenge(m_id)
            code = fm["code"]
            expected_fn = challenge.entry_function

            # Ensure 'def <entry_function>(' is defined in starterCode
            fn_pattern = rf"\bdef\s+{re.escape(expected_fn)}\s*\("
            self.assertRegex(
                code,
                fn_pattern,
                f"Mission {m_id} starter code must define entry function '{expected_fn}'"
            )

    def test_concept_and_topics_aligned(self):
        """Topic/concept must be semantically aligned between frontend and backend."""
        for fm in self.frontend_missions:
            m_id = fm["id"]
            challenge = get_challenge(m_id)
            frontend_topic = fm["topic"].lower()
            backend_concept = challenge.concept.lower()
            # Concepts share key terms: linked list, graph/bfs, dynamic programming
            key_terms = {
                "01": "linked list",
                "02": "bfs",
                "03": "dynamic programming",
            }
            term = key_terms[m_id]
            self.assertTrue(
                term in frontend_topic or term in backend_concept,
                f"Mission {m_id} concept mismatch: '{fm['topic']}' vs '{challenge.concept}'"
            )


if __name__ == "__main__":
    unittest.main(verbosity=2)
