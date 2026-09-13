"""Flight 101 verifier and real /api/execute route regression tests."""

import json
import os
import sys
import unittest
import uuid

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.python_sandbox import MAX_OUTPUT_BYTES, REPOSITORY, _macos_sandbox_available, execute_python_mission
from services.judge0 import _mock_execution


CORRECT_01 = '''
class ListNode:
    def __init__(self, val=0, next=None):
        self.val, self.next = val, next

def reverse_fuel_line(head):
    previous = None
    while head:
        following = head.next
        head.next = previous
        previous, head = head, following
    return previous
'''

CORRECT_02 = '''
from collections import deque

def find_escape_vector(graph, start, target):
    queue = deque([(start, 0)])
    seen = {start}
    while queue:
        node, distance = queue.popleft()
        if node == target:
            return distance
        for neighbor in graph.get(node, []):
            if neighbor not in seen:
                seen.add(neighbor)
                queue.append((neighbor, distance + 1))
    return -1
'''

CORRECT_03 = '''
def min_descent_energy(step_costs):
    previous_two = previous_one = 0
    for step in range(2, len(step_costs) + 1):
        current = min(previous_one + step_costs[step - 1], previous_two + step_costs[step - 2])
        previous_two, previous_one = previous_one, current
    return previous_one
'''

WRONG_01 = '''
class ListNode:
    def __init__(self, val=0, next=None):
        self.val, self.next = val, next

def reverse_fuel_line(head):
    return head
'''
WRONG_02 = "def find_escape_vector(graph, start, target): return 2"
WRONG_03 = "def min_descent_energy(step_costs): return 0"


class PythonSandboxTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from app import create_app
        cls.client = create_app().test_client()

    def assert_alive(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["status"], "operational")

    def submit(self, mission_id, code, **extra):
        response = self.client.post("/api/execute", json={
            "module_id": "flight-101", "mission_id": mission_id,
            "language_id": 71, "code": code,
            "user_id": f"sandbox_test_{uuid.uuid4().hex}",
            **extra,
        })
        self.assertEqual(response.status_code, 200, response.json)
        return response.json

    def test_all_missions_wrong_then_correct(self):
        for mission, wrong, correct in (("01", WRONG_01, CORRECT_01),
                                        ("02", WRONG_02, CORRECT_02),
                                        ("03", WRONG_03, CORRECT_03)):
            with self.subTest(mission=mission):
                failed = execute_python_mission(mission, wrong)
                self.assertEqual(failed["status"], "FAILED_TESTS", failed)
                self.assertFalse(failed["passed"])
                accepted = execute_python_mission(mission, correct)
                self.assertEqual(accepted["status"], "ACCEPTED", accepted)
                self.assertTrue(accepted["passed"])
                self.assertEqual(accepted["testsPassed"], accepted["totalTests"])

    def test_syntax_runtime_exit_loop_and_spam(self):
        cases = (
            ("def reverse_fuel_line(:\n    pass", "SYNTAX_ERROR"),
            ("raise RuntimeError('boom')", "RUNTIME_ERROR"),
            ("import sys\nsys.exit(0)", "RUNTIME_ERROR"),
            ("while True: pass", "TIMEOUT"),
            ("for _ in range(10000000): print('A' * 1000)", "OUTPUT_LIMIT"),
        )
        for source, expected in cases:
            with self.subTest(expected=expected, source=source[:24]):
                result = execute_python_mission("01", source)
                self.assertEqual(result["status"], expected, result)
                self.assertFalse(result["passed"])
                self.assertLessEqual(len(result["stdout"].encode("utf-8")), MAX_OUTPUT_BYTES)
                self.assert_alive()

    def test_hidden_cases_remain_private(self):
        from challenges.flight_101 import CHALLENGES
        source = WRONG_01.replace("    return head", "    print(head.val if head else 'EMPTY')\n    return head")
        result = self.submit("01", source)
        hidden = result["hiddenTests"]
        self.assertEqual(hidden["total"], len(CHALLENGES["01"].hidden_tests))
        for item in hidden["results"]:
            self.assertEqual(set(item), {"name", "passed"})
            self.assertTrue(item["name"].startswith("Hidden Test "))
        response_text = json.dumps(result)
        self.assertNotIn("-3", response_text)
        self.assertNotIn("12", result["stdout"])

    def test_mission_01_without_listnode_boilerplate_passes(self):
        """Player only needs to implement reverse_fuel_line; ListNode is provided by harness."""
        code_without_listnode = '''
def reverse_fuel_line(head):
    previous = None
    while head:
        following = head.next
        head.next = previous
        previous, head = head, following
    return previous
'''
        result = execute_python_mission("01", code_without_listnode)
        self.assertEqual(result["status"], "ACCEPTED", result)
        self.assertTrue(result["passed"])
        self.assertEqual(result["verdict_label"], "ACCEPTED")

    def test_mission_01_with_custom_listnode_still_passes(self):
        """Submissions that still define their own ListNode class continue to work safely."""
        result = execute_python_mission("01", CORRECT_01)
        self.assertEqual(result["status"], "ACCEPTED", result)
        self.assertTrue(result["passed"])

    def test_invalid_return_verdict_on_wrong_structural_types(self):
        """Returning non-ListNode, cycle, or wrong type produces clear INVALID_RETURN verdict."""
        # 1. Returning an int instead of ListNode
        int_return = "def reverse_fuel_line(head): return 42"
        res1 = execute_python_mission("01", int_return)
        self.assertEqual(res1["status"], "INVALID_RETURN", res1)
        self.assertFalse(res1["passed"])
        self.assertEqual(res1["verdict_label"], "INVALID RETURN")

        # 2. Returning a cycle
        cycle_return = '''
def reverse_fuel_line(head):
    if head and head.next:
        head.next.next = head
    return head
'''
        res2 = execute_python_mission("01", cycle_return)
        self.assertEqual(res2["status"], "INVALID_RETURN", res2)
        self.assertFalse(res2["passed"])

        # 3. Mission 02 returning str instead of int
        str_return = 'def find_escape_vector(graph, start, target): return "2"'
        res3 = execute_python_mission("02", str_return)
        self.assertEqual(res3["status"], "INVALID_RETURN", res3)
        self.assertFalse(res3["passed"])

    def test_consecutive_submissions_and_api_authority(self):
        user_id = f"judge_{uuid.uuid4().hex}"
        for source, expected in (
            (WRONG_01, "FAILED_TESTS"),
            ("def reverse_fuel_line(:", "SYNTAX_ERROR"),
            ("while True: pass", "TIMEOUT"),
        ):
            result = self.submit("01", source, user_id=user_id)
            self.assertEqual(result["status"], expected)
            self.assertFalse(result["passed"])
            self.assert_alive()
        before = self.client.get(f"/api/analytics/{user_id}").json
        self.assertEqual(before["completed_missions"], 0)
        accepted = self.submit("01", CORRECT_01, user_id=user_id)
        self.assertEqual(accepted["status"], "ACCEPTED", accepted)
        self.assertTrue(accepted["passed"])
        after = self.client.get(f"/api/analytics/{user_id}").json
        self.assertEqual(after["completed_missions"], 1)
        self.assert_alive()

    def test_flight_cannot_be_routed_through_sql(self):
        result = self.submit("01", WRONG_01, language_id=82)
        self.assertEqual(result["status"], "FAILED_TESTS")
        self.assertFalse(result["passed"])

    def test_direct_environment_and_process_imports_are_unavailable(self):
        for module in ("os", "subprocess", "sys"):
            with self.subTest(module=module):
                result = execute_python_mission("01", f"import {module}")
                self.assertEqual(result["status"], "RUNTIME_ERROR")
                self.assertEqual(result["error_type"], "ImportError")
                self.assert_alive()

    def test_environment_access_does_not_leak_secrets(self):
        """Child environment must not contain application API keys or certificates."""
        # Attempt sneakily inspecting os.environ via collections module reflection
        source = '''
import collections
env_dict = {}
try:
    os_mod = collections._sys.modules.get("os")
    if os_mod:
        env_dict = dict(os_mod.environ)
except Exception:
    pass
for k in env_dict:
    print(f"ENV_KEY:{k}")
def reverse_fuel_line(head): return head
'''
        result = execute_python_mission("01", source)
        stdout = result.get("stdout", "")
        for secret_name in ("AGORA", "GROQ", "OPENAI", "ANTHROPIC", "DATABASE_URL", "JWT_SECRET"):
            self.assertNotIn(secret_name, stdout, f"Secret {secret_name} must not be exposed in child env")

    def test_macos_sandbox_blocks_repository_reads_when_available(self):
        if not _macos_sandbox_available():
            self.skipTest("macOS seatbelt unavailable in this execution environment")
        marker = REPOSITORY / "backend" / ".env.example"
        source = f'''import collections
try:
    collections._sys.modules["builtins"].open({str(marker)!r}).read()
    print("REPOSITORY_READ_ALLOWED")
except Exception:
    print("REPOSITORY_READ_BLOCKED")
def find_escape_vector(graph, start, target): return 0
'''
        result = execute_python_mission("02", source)
        self.assertIn("REPOSITORY_READ_BLOCKED", result["stdout"])
        self.assertNotIn("REPOSITORY_READ_ALLOWED", result["stdout"])

    def test_security_regression_filesystem_and_env_files(self):
        """Attempt to read .env, ../.env, or backend/.env must be denied or fail safely."""
        source = '''
import collections
try:
    opener = collections._sys.modules["builtins"].open
    for path in (".env", "../.env", "backend/.env", "/etc/shadow"):
        try:
            content = opener(path).read()
            print(f"FILE_READ_SUCCESS:{path}")
        except Exception:
            print(f"FILE_READ_DENIED:{path}")
except Exception:
    print("OPEN_UNAVAILABLE")
def reverse_fuel_line(head): return head
'''
        result = execute_python_mission("01", source)
        stdout = result.get("stdout", "")
        self.assertNotIn("FILE_READ_SUCCESS:", stdout, "Sensitive file reads must not succeed")

    def test_security_regression_network_socket_blocked(self):
        """Network access from isolated execution must fail."""
        source = '''
import collections
try:
    sock_mod = collections._sys.modules.get("socket")
    if sock_mod:
        s = sock_mod.socket(sock_mod.AF_INET, sock_mod.SOCK_STREAM)
        s.settimeout(1)
        s.connect(("8.8.8.8", 53))
        print("NETWORK_CONNECTED")
    else:
        print("SOCKET_UNAVAILABLE")
except Exception:
    print("NETWORK_BLOCKED")
def reverse_fuel_line(head): return head
'''
        result = execute_python_mission("01", source)
        stdout = result.get("stdout", "")
        self.assertNotIn("NETWORK_CONNECTED", stdout, "Network connections must be blocked")

    def test_security_regression_child_process_creation(self):
        """Child process spawning must be prevented."""
        source = '''
import collections
try:
    sub = collections._sys.modules.get("subprocess")
    if sub:
        sub.run(["/bin/echo", "PWNED"], check=True)
        print("SUBPROCESS_SUCCESS")
    else:
        print("SUBPROCESS_UNAVAILABLE")
except Exception:
    print("SUBPROCESS_BLOCKED")
def reverse_fuel_line(head): return head
'''
        result = execute_python_mission("01", source)
        stdout = result.get("stdout", "")
        self.assertNotIn("SUBPROCESS_SUCCESS", stdout, "Spawning subprocesses must fail")

    def test_sandbox_mode_diagnostic_present(self):
        """Result must contain sandbox_mode diagnostic and clear verdict_label."""
        result = execute_python_mission("01", CORRECT_01)
        self.assertIn("sandbox_mode", result)
        self.assertIn(result["sandbox_mode"], {"macos_os_sandbox", "subprocess_limits_only"})
        self.assertEqual(result["verdict_label"], "ACCEPTED")

    def test_generic_python_workspace_is_out_of_process(self):
        accepted = _mock_execution("print(1 + 1)", 71)
        self.assertEqual(accepted["status"], "Accepted")
        self.assertEqual(accepted["stdout"], "2\n")
        timeout = _mock_execution("while True: pass", 71)
        self.assertEqual(timeout["status"], "Time Limit Exceeded")
        self.assert_alive()


if __name__ == "__main__":
    unittest.main(verbosity=2)
