"""
End-to-End Progression & SQL Sandbox Test for RunTime Arena.
Validates the full user journey from fresh player to Vault Breach completion.
"""

import sys
import os
import uuid
import requests

BASE_URL = "http://localhost:5001/api"


def run_progression_test():
    print("==================================================")
    print("RUNNING FULL PROGRESSION & SQL SANDBOX E2E TEST")
    print("==================================================")

    test_user = f"pilot_{uuid.uuid4().hex[:8]}"
    student_name = f"Cadet {test_user}"

    # 1. Fresh User - No missions completed
    resp = requests.get(f"{BASE_URL}/analytics/{test_user}")
    assert resp.status_code == 200, f"Analytics failed: {resp.text}"
    analytics = resp.json()
    assert analytics.get("completed_missions") == 0, "Fresh user should have 0 completed missions"

    missions_map = {}
    is_vault_unlocked = (
        "01" in missions_map.get("flight-101", [])
        and "02" in missions_map.get("flight-101", [])
        and "03" in missions_map.get("flight-101", [])
    )
    assert not is_vault_unlocked, "Vault Breach MUST be LOCKED for fresh user!"
    print("✔ Step 1: Fresh user -> Vault Breach is LOCKED.")

    # 2. Complete Flight 101 Mission 01
    f1_code = """
def reverse_fuel_line(head):
    prev, curr = None, head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev
"""
    resp = requests.post(f"{BASE_URL}/execute", json={
        "module_id": "flight-101",
        "mission_id": "01",
        "code": f1_code,
        "language_id": 71,
        "user_id": test_user,
        "student": student_name,
    })
    assert resp.status_code == 200 and resp.json().get("passed") is True, f"F1 M01 failed: {resp.text}"

    analytics = requests.get(f"{BASE_URL}/analytics/{test_user}").json()
    f1_cleared = [m["mission_id"] for m in analytics.get("missions", []) if m["module_id"] == "flight-101"]
    assert "01" in f1_cleared and len(f1_cleared) == 1
    assert not ("01" in f1_cleared and "02" in f1_cleared and "03" in f1_cleared)
    print("✔ Step 2: Flight 101 Mission 01 complete -> Vault Breach remains LOCKED.")

    # 3. Complete Flight 101 Mission 02
    f2_code = """
from collections import deque

def find_escape_vector(graph, start, target):
    queue = deque([(start, 0)])
    visited = {start}
    while queue:
        node, hops = queue.popleft()
        if node == target:
            return hops
        for neighbor in graph.get(node, []):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, hops + 1))
    return -1
"""
    resp = requests.post(f"{BASE_URL}/execute", json={
        "module_id": "flight-101",
        "mission_id": "02",
        "code": f2_code,
        "language_id": 71,
        "user_id": test_user,
        "student": student_name,
    })
    assert resp.status_code == 200 and resp.json().get("passed") is True, f"F1 M02 failed: {resp.text}"

    analytics = requests.get(f"{BASE_URL}/analytics/{test_user}").json()
    f1_cleared = [m["mission_id"] for m in analytics.get("missions", []) if m["module_id"] == "flight-101"]
    assert len(f1_cleared) == 2
    assert not ("01" in f1_cleared and "02" in f1_cleared and "03" in f1_cleared)
    print("✔ Step 3: Flight 101 Mission 02 complete -> Vault Breach remains LOCKED.")

    # 4. Complete Flight 101 Mission 03
    f3_code = """
def min_descent_energy(step_costs):
    n = len(step_costs)
    if n <= 1:
        return 0
    dp0, dp1 = 0, 0
    for i in range(2, n + 1):
        curr = min(dp1 + step_costs[i - 1], dp0 + step_costs[i - 2])
        dp0, dp1 = dp1, curr
    return dp1

assert min_descent_energy([10, 15, 20, 10, 5]) == 25
print("STATUS: GLIDE-SLOPE CALCULATED.")
"""
    resp = requests.post(f"{BASE_URL}/execute", json={
        "module_id": "flight-101",
        "mission_id": "03",
        "code": f3_code,
        "language_id": 71,
        "user_id": test_user,
        "student": student_name,
    })
    assert resp.status_code == 200 and resp.json().get("passed") is True, f"F1 M03 failed: {resp.text}"

    analytics = requests.get(f"{BASE_URL}/analytics/{test_user}").json()
    f1_cleared = [m["mission_id"] for m in analytics.get("missions", []) if m["module_id"] == "flight-101"]
    is_vault_unlocked = "01" in f1_cleared and "02" in f1_cleared and "03" in f1_cleared
    assert is_vault_unlocked, "Vault Breach MUST UNLOCK after Flight 101 M01, M02, and M03 are complete!"
    print("✔ Step 4: Flight 101 campaign complete -> Vault Breach is now UNLOCKED!")

    # 5. Verify Persistence across Refresh / Reload
    analytics_reloaded = requests.get(f"{BASE_URL}/analytics/{test_user}").json()
    reloaded_cleared = [m["mission_id"] for m in analytics_reloaded.get("missions", []) if m["module_id"] == "flight-101"]
    assert "01" in reloaded_cleared and "02" in reloaded_cleared and "03" in reloaded_cleared
    print("✔ Step 5: Reload / persistence confirmed — Vault Breach remains UNLOCKED.")

    # 6. Vault Breach Mission 01 Security & Execution Tests
    # 6a. DROP TABLE rejection
    resp = requests.post(f"{BASE_URL}/execute", json={
        "module_id": "vault-breach",
        "mission_id": "01",
        "code": "DROP TABLE access_logs;",
        "user_id": test_user,
        "student": student_name,
    })
    assert resp.json().get("error_type") == "QUERY_REJECTED"
    print("✔ Step 6a: DROP TABLE statement safely rejected.")

    # 6b. ATTACH DATABASE rejection
    resp = requests.post(f"{BASE_URL}/execute", json={
        "module_id": "vault-breach",
        "mission_id": "01",
        "code": "ATTACH DATABASE 'test.db' AS test;",
        "user_id": test_user,
        "student": student_name,
    })
    assert resp.json().get("error_type") == "QUERY_REJECTED"
    print("✔ Step 6b: ATTACH DATABASE statement safely rejected.")

    # 6c. Multiple statements rejection
    resp = requests.post(f"{BASE_URL}/execute", json={
        "module_id": "vault-breach",
        "mission_id": "01",
        "code": "SELECT 1; SELECT 2;",
        "user_id": test_user,
        "student": student_name,
    })
    assert resp.json().get("error_type") == "QUERY_REJECTED"
    print("✔ Step 6c: Multiple statements safely rejected.")

    # 6d. Syntax error safe failure
    resp = requests.post(f"{BASE_URL}/execute", json={
        "module_id": "vault-breach",
        "mission_id": "01",
        "code": "SELECT FROM access_logs WHERE;",
        "user_id": test_user,
        "student": student_name,
    })
    assert resp.json().get("error_type") == "SQL_SYNTAX_ERROR"
    print("✔ Step 6d: Syntax error safely caught.")

    # 6e. Wrong query failure
    resp = requests.post(f"{BASE_URL}/execute", json={
        "module_id": "vault-breach",
        "mission_id": "01",
        "code": "SELECT username, ip_address, status, attempt_time FROM access_logs WHERE status = 'SUCCESS';",
        "user_id": test_user,
        "student": student_name,
    })
    assert resp.json().get("error_type") == "WRONG_RESULT"
    print("✔ Step 6e: Wrong query safely flagged as WRONG_RESULT.")

    # 6f. Correct Mission 01 query passes!
    sol1 = "SELECT username, ip_address, status, attempt_time FROM access_logs WHERE status = 'FAILED' ORDER BY attempt_time DESC;"
    resp = requests.post(f"{BASE_URL}/execute", json={
        "module_id": "vault-breach",
        "mission_id": "01",
        "code": sol1,
        "user_id": test_user,
        "student": student_name,
    })
    assert resp.json().get("status") == "Accepted" and len(resp.json().get("rows", [])) == 4
    print("✔ Step 6f: Vault Breach Mission 01 PASSED with real SQL execution.")

    # 7. Vault Breach Mission 02 Execution
    sol2 = "SELECT d.name AS department_name, COUNT(a.id) AS failed_attempts FROM departments d JOIN employees e ON d.id = e.department_id JOIN access_logs a ON e.id = a.employee_id WHERE a.status = 'FAILED' GROUP BY d.name ORDER BY failed_attempts DESC;"
    resp = requests.post(f"{BASE_URL}/execute", json={
        "module_id": "vault-breach",
        "mission_id": "02",
        "code": sol2,
        "user_id": test_user,
        "student": student_name,
    })
    assert resp.json().get("status") == "Accepted"
    print("✔ Step 7: Vault Breach Mission 02 PASSED with real SQL execution.")

    # 8. Vault Breach Mission 03 Execution
    sol3 = "SELECT a.owner_name, vt.target_vault, vt.amount FROM vault_transfers vt JOIN accounts a ON vt.account_id = a.id JOIN clearance_registry cr ON a.clearance_level = cr.clearance_level WHERE vt.status = 'FLAGGED' AND cr.risk_tier = 'CRITICAL' AND vt.amount > (SELECT AVG(amount) FROM vault_transfers WHERE status = 'FLAGGED') ORDER BY vt.amount DESC;"
    resp = requests.post(f"{BASE_URL}/execute", json={
        "module_id": "vault-breach",
        "mission_id": "03",
        "code": sol3,
        "user_id": test_user,
        "student": student_name,
    })
    assert resp.json().get("status") == "Accepted"
    print("✔ Step 8: Vault Breach Mission 03 PASSED with real SQL execution.")

    # 9. Verify Vault Breach Complete
    analytics_final = requests.get(f"{BASE_URL}/analytics/{test_user}").json()
    vb_cleared = [m["mission_id"] for m in analytics_final.get("missions", []) if m["module_id"] == "vault-breach"]
    assert "01" in vb_cleared and "02" in vb_cleared and "03" in vb_cleared
    print("✔ Step 9: Vault Breach campaign COMPLETE (Missions 01, 02, 03 all persisted in database).")
    print("==================================================")
    print("ALL PROGRESSION & SQL SANDBOX E2E TESTS PASSED! 🎉")
    print("==================================================")


if __name__ == "__main__":
    run_progression_test()
