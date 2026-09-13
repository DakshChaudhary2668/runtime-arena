"""
Unit & Security Tests for RunTime Arena SQL Sandbox Engine.
"""

import sys
import os

# Ensure backend root is on Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.sql_sandbox import execute_sql_mission, validate_sql_query
from services.sql_missions import SQL_MISSIONS


def test_sql_sandbox():
    print("Testing SQL Sandbox Security & Execution Engine...")

    # ── 1. Security Checks ──
    # Reject empty
    is_safe, msg, err = validate_sql_query("")
    assert not is_safe, "Empty query must be rejected"

    # Reject DROP TABLE
    is_safe, msg, err = validate_sql_query("DROP TABLE access_logs;")
    assert not is_safe and err == "QUERY_REJECTED", f"DROP TABLE must be rejected, got {msg}"

    # Reject ATTACH DATABASE
    is_safe, msg, err = validate_sql_query("ATTACH DATABASE 'test.db' AS test;")
    assert not is_safe and err == "QUERY_REJECTED", f"ATTACH DATABASE must be rejected, got {msg}"

    # Reject Multiple Statements
    is_safe, msg, err = validate_sql_query("SELECT 1; SELECT 2;")
    assert not is_safe and err == "QUERY_REJECTED", f"Multiple statements must be rejected, got {msg}"

    # Reject INSERT
    is_safe, msg, err = validate_sql_query("INSERT INTO access_logs VALUES (9, 'x', 'x', 'x', 'x');")
    assert not is_safe and err == "QUERY_REJECTED", f"INSERT must be rejected, got {msg}"

    # Reject UPDATE
    is_safe, msg, err = validate_sql_query("UPDATE access_logs SET status = 'SUCCESS';")
    assert not is_safe and err == "QUERY_REJECTED", f"UPDATE must be rejected, got {msg}"

    # Reject non-SELECT/WITH
    is_safe, msg, err = validate_sql_query("DELETE FROM access_logs WHERE 1=1;")
    assert not is_safe and err == "QUERY_REJECTED", f"DELETE must be rejected, got {msg}"

    # Allow valid SELECT
    is_safe, msg, err = validate_sql_query("SELECT username FROM access_logs WHERE status = 'FAILED';")
    assert is_safe, f"Valid SELECT should pass validation, got {msg}"

    # Allow valid WITH ... SELECT
    is_safe, msg, err = validate_sql_query("WITH cte AS (SELECT * FROM access_logs) SELECT * FROM cte;")
    assert is_safe, f"Valid WITH should pass validation, got {msg}"

    print("✔ Static Security Validation passed.")

    # ── 2. Mission 01 Execution ──
    # Correct solution
    sol1 = SQL_MISSIONS["01"]["expected_sql"]
    res1 = execute_sql_mission("01", sol1)
    assert res1["status"] == "Accepted", f"Mission 01 solution failed: {res1['stderr']}"
    assert len(res1["rows"]) == 4, f"Expected 4 failed attempts, got {len(res1['rows'])}"
    assert res1["rows"][0][0] == "db_crawler", f"Newest failure must be db_crawler, got {res1['rows'][0][0]}"

    # Wrong query (missing status filter)
    wrong_q = "SELECT username, ip_address, status, attempt_time FROM access_logs ORDER BY attempt_time DESC;"
    res_wrong = execute_sql_mission("01", wrong_q)
    assert res_wrong["status"] == "Wrong Answer", f"Wrong query should fail, got: {res_wrong['status']}"

    # Syntax error
    res_syntax = execute_sql_mission("01", "SELECT FROM access_logs WHERE;")
    assert res_syntax["status"] == "Runtime Error" and res_syntax["error_type"] == "SQL_SYNTAX_ERROR"

    # Malicious injection attempt executed in sandbox
    res_inject = execute_sql_mission("01", "SELECT * FROM access_logs; DROP TABLE access_logs;")
    assert res_inject["status"] == "Wrong Answer" and res_inject["error_type"] == "QUERY_REJECTED"

    print("✔ Mission 01 correctness and rejection verified.")

    # ── 3. Mission 02 Execution ──
    sol2 = SQL_MISSIONS["02"]["expected_sql"]
    res2 = execute_sql_mission("02", sol2)
    assert res2["status"] == "Accepted", f"Mission 02 solution failed: {res2['stderr']}"
    # Top department should be Offshore Vault Operations with 5 failed attempts
    assert res2["rows"][0][0] == "Offshore Vault Operations"
    assert res2["rows"][0][1] == 5

    print("✔ Mission 02 correctness verified.")

    # ── 4. Mission 03 Execution ──
    sol3 = SQL_MISSIONS["03"]["expected_sql"]
    res3 = execute_sql_mission("03", sol3)
    assert res3["status"] == "Accepted", f"Mission 03 solution failed: {res3['stderr']}"
    assert len(res3["rows"]) == 3, f"Expected 3 high-risk transfers above average, got {len(res3['rows'])}"
    assert res3["rows"][0][0] == "Shadow_Syndicate"
    assert res3["rows"][0][2] == 12000000.0

    print("✔ Mission 03 correctness verified.")

    # ── 5. Runaway Query Protection ──
    runaway_sql = "WITH RECURSIVE cnt(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM cnt) SELECT * FROM cnt;"
    res_runaway = execute_sql_mission("01", runaway_sql)
    assert res_runaway["error_type"] == "QUERY_TIMEOUT", f"Runaway query should time out, got {res_runaway}"

    print("✔ Runaway progress-handler protection verified.")
    print("\nALL SQL SANDBOX TESTS PASSED! 🚀")


if __name__ == "__main__":
    test_sql_sandbox()
