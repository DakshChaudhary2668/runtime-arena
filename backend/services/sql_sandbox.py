"""
SQL Sandbox Execution Engine — RunTime Arena (Vault Breach Module)

Security & Execution Model:
1. Fresh, transient in-memory SQLite database (`:memory:`) per execution.
2. Completely isolated from persistent production SQLite/PostgreSQL.
3. Pre-execution query validation (single statement, starts with SELECT/WITH, keyword blacklist).
4. Runtime authorizer restricting execution strictly to read/select/functions.
5. Progress-handler based instruction limiting (guards against infinite recursion / CPU exhaustion).
6. Deterministic normalization & testing (column names, values, count, semantic ordering).
7. Safe error UX without stack traces.
"""

import re
import sqlite3
import time
from services.sql_missions import SQL_MISSIONS, get_sql_mission

FORBIDDEN_SQL_PATTERN = re.compile(
    r"\b(ATTACH|DETACH|DROP|ALTER|VACUUM|PRAGMA|CREATE|INSERT|UPDATE|DELETE|REPLACE|EXEC|EXECUTE|GRANT|REVOKE|LOAD_EXTENSION)\b",
    re.IGNORECASE,
)


def _strip_comments(sql: str) -> str:
    """Remove SQL single-line (-- ...) and multi-line (/* ... */) comments."""
    # Remove multi-line comments
    sql = re.sub(r"/\*.*?\*/", "", sql, flags=re.DOTALL)
    # Remove single-line comments
    sql = re.sub(r"--.*?$", "", sql, flags=re.MULTILINE)
    return sql.strip()


def validate_sql_query(raw_query: str) -> tuple[bool, str, str | None]:
    """
    Validate that the player's query is a safe, single SELECT/WITH statement.
    Returns: (is_safe, error_message, error_type)
    """
    if not raw_query or not raw_query.strip():
        return False, "Query cannot be empty.", "QUERY_REJECTED"

    clean_sql = _strip_comments(raw_query)
    if not clean_sql:
        return False, "Query contains no executable statements.", "QUERY_REJECTED"

    # Strip a single optional trailing semicolon
    if clean_sql.endswith(";"):
        clean_sql = clean_sql[:-1].strip()

    # Reject if any additional semicolon exists outside string literals
    in_quote = False
    quote_char = None
    for char in clean_sql:
        if char in ("'", '"'):
            if not in_quote:
                in_quote = True
                quote_char = char
            elif quote_char == char:
                in_quote = False
                quote_char = None
        elif char == ";" and not in_quote:
            return False, "Multiple SQL statements are not permitted.", "QUERY_REJECTED"

    # Must begin with SELECT or WITH
    first_token_match = re.match(r"^\s*([A-Za-z]+)", clean_sql)
    if not first_token_match:
        return False, "Malformed SQL query.", "SQL_SYNTAX_ERROR"

    first_keyword = first_token_match.group(1).upper()
    if first_keyword not in ("SELECT", "WITH"):
        return (
            False,
            f"Only SELECT or WITH queries are permitted in this mission. Found: {first_keyword}",
            "QUERY_REJECTED",
        )

    # Keyword blacklist check (defense-in-depth)
    forbidden_match = FORBIDDEN_SQL_PATTERN.search(clean_sql)
    if forbidden_match:
        return (
            False,
            f"Operation '{forbidden_match.group(1).upper()}' is rejected by mainframe security policy.",
            "QUERY_REJECTED",
        )

    return True, "", None


def _format_ascii_table(columns: list[str], rows: list[tuple], max_rows: int = 25) -> str:
    """Format tabular query output for terminal display."""
    if not columns:
        return "(0 columns returned)\n"

    # Stringify values
    str_rows = [[str(val) if val is not None else "NULL" for val in row] for row in rows[:max_rows]]

    # Compute column widths
    widths = [len(col) for col in columns]
    for row in str_rows:
        for idx, val in enumerate(row):
            widths[idx] = max(widths[idx], len(val))

    # Build header
    header = " | ".join(col.ljust(widths[i]) for i, col in enumerate(columns))
    divider = "-+-".join("-" * widths[i] for i in range(len(columns)))

    lines = [header, divider]
    for row in str_rows:
        lines.append(" | ".join(row[i].ljust(widths[i]) for i in range(len(columns))))

    if len(rows) > max_rows:
        lines.append(f"... ({len(rows) - max_rows} additional rows omitted)")

    lines.append(f"\n({len(rows)} row{'s' if len(rows) != 1 else ''} returned)")
    return "\n".join(lines)


def _normalize_row_value(val):
    """Normalize numeric and string types for comparison."""
    if val is None:
        return None
    if isinstance(val, float):
        return round(val, 4)
    if isinstance(val, int):
        return val
    return str(val).strip()


def execute_sql_mission(mission_id: str, player_query: str) -> dict:
    """
    Execute player's SQL query in a fresh in-memory SQLite sandbox against
    the mission's schema and seed data. Compare against canonical expected result.
    """
    mission = get_sql_mission(mission_id)
    if not mission:
        return {
            "stdout": "",
            "stderr": f"Unknown SQL mission identifier: {mission_id}",
            "status": "Error",
            "error_type": "QUERY_REJECTED",
            "time": "0.00",
            "memory": "0",
            "columns": [],
            "rows": [],
        }

    start_time = time.perf_counter()

    # 1. Pre-execution static safety check
    is_safe, err_msg, err_type = validate_sql_query(player_query)
    if not is_safe:
        return {
            "stdout": "",
            "stderr": f"QUERY REJECTED: {err_msg}",
            "status": "Wrong Answer",
            "error_type": err_type or "QUERY_REJECTED",
            "time": "0.00",
            "memory": "0",
            "columns": [],
            "rows": [],
        }

    conn = None
    try:
        # 2. Spin up transient isolated in-memory DB
        conn = sqlite3.connect(":memory:")

        # 3. Apply schema DDL and deterministic seed data
        conn.executescript(mission["schema_ddl"])
        conn.executescript(mission["seed_sql"])
        conn.commit()

        # 4. Progress handler to interrupt runaway queries / infinite loops
        step_counter = [0]

        def _progress_handler():
            step_counter[0] += 1
            if step_counter[0] > 10000:
                return 1  # Interrupt query execution
            return 0

        conn.set_progress_handler(_progress_handler, 50)

        # 5. Authorizer: allow only select, read, function, recursive CTE
        def _authorizer(action_code, arg1, arg2, db_name, trigger_name):
            allowed_actions = {
                sqlite3.SQLITE_SELECT,
                sqlite3.SQLITE_READ,
                sqlite3.SQLITE_FUNCTION,
                getattr(sqlite3, "SQLITE_RECURSIVE", 33),
            }
            if action_code in allowed_actions:
                return sqlite3.SQLITE_OK
            return sqlite3.SQLITE_DENY

        conn.set_authorizer(_authorizer)

        # 6. Execute player's query
        cursor = conn.cursor()
        cursor.execute(player_query)
        player_columns = [desc[0] for desc in cursor.description] if cursor.description else []
        player_rows = cursor.fetchall()

        # 7. Execute expected reference query
        ref_cursor = conn.cursor()
        ref_cursor.execute(mission["expected_sql"])
        expected_columns = [desc[0] for desc in ref_cursor.description]
        expected_rows = ref_cursor.fetchall()

        elapsed = time.perf_counter() - start_time
        player_table = _format_ascii_table(player_columns, player_rows)

        # 8. Result normalization & comparison
        # Compare required column names if specified
        required_cols = [c.lower() for c in mission.get("required_columns", [])]
        actual_cols_lower = [c.lower() for c in player_columns]

        if required_cols:
            missing_cols = [rc for rc in required_cols if rc not in actual_cols_lower]
            if missing_cols:
                return {
                    "stdout": player_table,
                    "stderr": f"RESULT MISMATCH: Missing required column(s): {', '.join(missing_cols)}",
                    "status": "Wrong Answer",
                    "error_type": "WRONG_RESULT",
                    "time": f"{elapsed:.2f}",
                    "memory": "0",
                    "columns": player_columns,
                    "rows": [list(r) for r in player_rows[:50]],
                }

        # Normalize rows
        norm_player_rows = [
            tuple(_normalize_row_value(v) for v in row)
            for row in player_rows
        ]
        norm_expected_rows = [
            tuple(_normalize_row_value(v) for v in row)
            for row in expected_rows
        ]

        if len(norm_player_rows) != len(norm_expected_rows):
            return {
                "stdout": player_table,
                "stderr": (
                    f"RESULT MISMATCH: Expected {len(norm_expected_rows)} row(s), "
                    f"but query returned {len(norm_player_rows)} row(s)."
                ),
                "status": "Wrong Answer",
                "error_type": "WRONG_RESULT",
                "time": f"{elapsed:.2f}",
                "memory": "0",
                "columns": player_columns,
                "rows": [list(r) for r in player_rows[:50]],
            }

        # Compare row content
        if mission.get("check_order", False):
            matches = norm_player_rows == norm_expected_rows
            if not matches:
                return {
                    "stdout": player_table,
                    "stderr": "RESULT MISMATCH: Rows returned do not match expected records or ordering.",
                    "status": "Wrong Answer",
                    "error_type": "WRONG_RESULT",
                    "time": f"{elapsed:.2f}",
                    "memory": "0",
                    "columns": player_columns,
                    "rows": [list(r) for r in player_rows[:50]],
                }
        else:
            matches = sorted(norm_player_rows) == sorted(norm_expected_rows)
            if not matches:
                return {
                    "stdout": player_table,
                    "stderr": "RESULT MISMATCH: Rows returned do not match expected records.",
                    "status": "Wrong Answer",
                    "error_type": "WRONG_RESULT",
                    "time": f"{elapsed:.2f}",
                    "memory": "0",
                    "columns": player_columns,
                    "rows": [list(r) for r in player_rows[:50]],
                }

        # Success!
        return {
            "stdout": player_table,
            "stderr": "",
            "status": "Accepted",
            "error_type": None,
            "time": f"{elapsed:.2f}",
            "memory": "0",
            "columns": player_columns,
            "rows": [list(r) for r in player_rows[:50]],
        }

    except sqlite3.Error as db_err:
        err_str = str(db_err)
        elapsed = time.perf_counter() - start_time
        if "interrupted" in err_str.lower():
            return {
                "stdout": "",
                "stderr": "QUERY TIMEOUT: Execution exceeded maximum allowed operations limit.",
                "status": "Time Limit Exceeded",
                "error_type": "QUERY_TIMEOUT",
                "time": f"{elapsed:.2f}",
                "memory": "0",
                "columns": [],
                "rows": [],
            }
        elif "not authorized" in err_str.lower():
            return {
                "stdout": "",
                "stderr": "QUERY REJECTED: Mainframe security authorizer denied this statement.",
                "status": "Wrong Answer",
                "error_type": "QUERY_REJECTED",
                "time": f"{elapsed:.2f}",
                "memory": "0",
                "columns": [],
                "rows": [],
            }
        else:
            return {
                "stdout": "",
                "stderr": f"SYNTAX ERROR: {err_str}",
                "status": "Runtime Error",
                "error_type": "SQL_SYNTAX_ERROR",
                "time": f"{elapsed:.2f}",
                "memory": "0",
                "columns": [],
                "rows": [],
            }
    except Exception as exc:
        elapsed = time.perf_counter() - start_time
        return {
            "stdout": "",
            "stderr": f"EXECUTION ERROR: {str(exc)}",
            "status": "Runtime Error",
            "error_type": "SQL_SYNTAX_ERROR",
            "time": f"{elapsed:.2f}",
            "memory": "0",
            "columns": [],
            "rows": [],
        }
    finally:
        if conn:
            try:
                conn.close()
            except Exception:
                pass
