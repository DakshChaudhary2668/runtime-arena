"""
Privacy & Telemetry Leak Prevention Test for Flight 101.
Verifies that hidden test inputs, solutions, and harness details never leak into
API responses, stdout, stderr, or AI Game Director prompts.
"""

import json
import os
import sys
import unittest
import uuid
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app import create_app
from challenges.flight_101 import CHALLENGES
from services.python_sandbox import execute_python_mission


class HiddenTestPrivacyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = create_app().test_client()

    def test_hidden_test_structure_in_api_response(self):
        """Hidden test results in API response must contain ONLY 'name' and 'passed'."""
        # Intentionally wrong code that runs all public and hidden cases
        wrong_code = "def reverse_fuel_line(head): return head"
        resp = self.client.post("/api/execute", json={
            "module_id": "flight-101",
            "mission_id": "01",
            "code": wrong_code,
            "language_id": 71,
            "user_id": f"privacy_{uuid.uuid4().hex[:8]}",
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json

        # Validate hiddenTests section
        hidden = data.get("hiddenTests")
        self.assertIsNotNone(hidden)
        self.assertEqual(hidden["total"], len(CHALLENGES["01"].hidden_tests))
        for item in hidden["results"]:
            self.assertEqual(
                set(item.keys()),
                {"name", "passed"},
                f"Hidden test leaked unexpected keys: {item.keys()}"
            )
            self.assertIsInstance(item["passed"], bool)

    def test_probe_cannot_leak_hidden_inputs_via_stdout(self):
        """A player's print() during hidden tests must be discarded by NullWriter."""
        # Code attempts to print every node it encounters
        probe_code = """
def reverse_fuel_line(head):
    curr = head
    while curr:
        print(f"SECRET_PROBE_VAL_{curr.val}")
        curr = curr.next
    return head
"""
        result = execute_python_mission("01", probe_code)
        stdout = result.get("stdout", "")

        # Public tests for Mission 01 are [1, 2, 3] and [1]
        # Hidden tests include: [5, 9], [4, 4, 2, 4], [-3, 0, 7, -1, 8, 12]
        # The hidden values (e.g. 5, 9, -3, 7, 8, 12) must NOT appear in stdout
        self.assertIn("SECRET_PROBE_VAL_1", stdout, "Public test output should appear in stdout")
        self.assertNotIn("SECRET_PROBE_VAL_9", stdout, "Hidden test values must NOT leak to stdout")
        self.assertNotIn("SECRET_PROBE_VAL_-3", stdout, "Hidden test values must NOT leak to stdout")
        self.assertNotIn("SECRET_PROBE_VAL_12", stdout, "Hidden test values must NOT leak to stdout")

    def test_hidden_graph_does_not_leak_in_mission_02(self):
        """Graph probe cannot leak hidden graph topology."""
        probe_code = """
def find_escape_vector(graph, start, target):
    print(f"PROBE_GRAPH:{list(graph.keys())}")
    return -1
"""
        result = execute_python_mission("02", probe_code)
        stdout = result.get("stdout", "")

        # Public tests use ENTRY, A, EXIT, S, B, C, D, T
        # Hidden tests use special node names like 'HOME'
        self.assertNotIn("HOME", stdout, "Hidden node 'HOME' must NOT leak to stdout")
        self.assertNotIn("PROBE_GRAPH:['HOME'", stdout)

    def test_hidden_costs_do_not_leak_in_mission_03(self):
        """Cost probe cannot leak hidden DP costs."""
        probe_code = """
def min_descent_energy(step_costs):
    print(f"PROBE_COSTS:{step_costs}")
    return 0
"""
        result = execute_python_mission("03", probe_code)
        stdout = result.get("stdout", "")

        # Hidden test has specific cost pattern [1, 100, 1, 1, 1, 100, 1, 1, 100, 1]
        self.assertNotIn("[1, 100, 1, 1, 1, 100, 1, 1, 100, 1]", stdout)

    def test_forbidden_keys_not_present_in_api_response(self):
        """Response must never contain raw hidden test definitions or harness source."""
        for mission_id in ("01", "02", "03"):
            result = execute_python_mission(mission_id, "def dummy(): pass")
            response_json = json.dumps(result)
            # Ensure internal harness keys are absent
            self.assertNotIn("hidden_tests", response_json)
            self.assertNotIn("hidden_cases", response_json)
            self.assertNotIn("challenge.json", response_json)


if __name__ == "__main__":
    unittest.main(verbosity=2)
