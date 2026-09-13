"""
SQL Challenge Missions Definition — RunTime Arena (Vault Breach Module)
Authoritative challenge schemas, seed data, and deterministic expected outcomes.
Expected queries and results are kept strictly server-side.
"""

SQL_MISSIONS = {
    "01": {
        "id": "01",
        "title": "ACCESS LOGS",
        "topic": "SELECT / WHERE / ORDER BY",
        "objective": (
            "Filter the security access logs to retrieve all failed login attempts (status = 'FAILED'). "
            "Return username, ip_address, status, and attempt_time, ordered from newest to oldest (attempt_time DESC)."
        ),
        "check_order": True,
        "required_columns": ["username", "ip_address", "status", "attempt_time"],
        "schema_ddl": """
            CREATE TABLE access_logs (
                id INTEGER PRIMARY KEY,
                username TEXT NOT NULL,
                ip_address TEXT NOT NULL,
                status TEXT NOT NULL,
                attempt_time TEXT NOT NULL
            );
        """,
        "seed_sql": """
            INSERT INTO access_logs (id, username, ip_address, status, attempt_time) VALUES
                (1, 'admin', '192.168.1.45', 'SUCCESS', '2026-09-12 04:12:00'),
                (2, 'guest_ops', '10.0.0.12', 'FAILED', '2026-09-12 04:14:22'),
                (3, 'sec_daemon', '172.16.4.99', 'SUCCESS', '2026-09-12 04:15:01'),
                (4, 'root_shadow', '45.33.32.156', 'FAILED', '2026-09-12 04:18:45'),
                (5, 'sys_analyst', '192.168.1.101', 'SUCCESS', '2026-09-12 04:20:10'),
                (6, 'root_shadow', '45.33.32.156', 'FAILED', '2026-09-12 04:22:04'),
                (7, 'db_crawler', '185.220.101.5', 'FAILED', '2026-09-12 04:25:30');
        """,
        "expected_sql": """
            SELECT username, ip_address, status, attempt_time
            FROM access_logs
            WHERE status = 'FAILED'
            ORDER BY attempt_time DESC;
        """,
        "public_schema": [
            {
                "table": "access_logs",
                "columns": [
                    {"name": "id", "type": "INTEGER PRIMARY KEY"},
                    {"name": "username", "type": "TEXT"},
                    {"name": "ip_address", "type": "TEXT"},
                    {"name": "status", "type": "TEXT ('SUCCESS' | 'FAILED')"},
                    {"name": "attempt_time", "type": "TEXT (YYYY-MM-DD HH:MM:SS)"},
                ],
            }
        ],
    },
    "02": {
        "id": "02",
        "title": "TRACE THE INSIDER",
        "topic": "JOIN / GROUP BY / COUNT",
        "objective": (
            "Correlate employee department profiles with failed security attempts. "
            "For every department that experienced failed login attempts (status = 'FAILED'), "
            "return the department name as 'department_name' and the total count of failed attempts as 'failed_attempts', "
            "ordered by failed_attempts descending."
        ),
        "check_order": True,
        "required_columns": ["department_name", "failed_attempts"],
        "schema_ddl": """
            CREATE TABLE departments (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL
            );
            CREATE TABLE employees (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                department_id INTEGER NOT NULL
            );
            CREATE TABLE access_logs (
                id INTEGER PRIMARY KEY,
                employee_id INTEGER NOT NULL,
                status TEXT NOT NULL,
                attempt_time TEXT NOT NULL
            );
        """,
        "seed_sql": """
            INSERT INTO departments (id, name) VALUES
                (1, 'Core Infrastructure'),
                (2, 'Financial Clearing'),
                (3, 'Offshore Vault Operations'),
                (4, 'Public Relations');

            INSERT INTO employees (id, name, department_id) VALUES
                (101, 'V. Mercer', 3),
                (102, 'T. Vance', 2),
                (103, 'K. Cross', 3),
                (104, 'M. Sterling', 1),
                (105, 'D. Reyes', 3),
                (106, 'H. Patel', 2);

            INSERT INTO access_logs (id, employee_id, status, attempt_time) VALUES
                (1, 101, 'FAILED', '2026-09-12 05:01:10'),
                (2, 101, 'FAILED', '2026-09-12 05:02:14'),
                (3, 102, 'SUCCESS', '2026-09-12 05:05:00'),
                (4, 103, 'FAILED', '2026-09-12 05:07:33'),
                (5, 104, 'FAILED', '2026-09-12 05:09:12'),
                (6, 105, 'FAILED', '2026-09-12 05:10:45'),
                (7, 106, 'FAILED', '2026-09-12 05:12:01'),
                (8, 101, 'FAILED', '2026-09-12 05:15:20');
        """,
        "expected_sql": """
            SELECT d.name AS department_name, COUNT(a.id) AS failed_attempts
            FROM departments d
            JOIN employees e ON d.id = e.department_id
            JOIN access_logs a ON e.id = a.employee_id
            WHERE a.status = 'FAILED'
            GROUP BY d.name
            ORDER BY failed_attempts DESC;
        """,
        "public_schema": [
            {
                "table": "departments",
                "columns": [
                    {"name": "id", "type": "INTEGER PRIMARY KEY"},
                    {"name": "name", "type": "TEXT"},
                ],
            },
            {
                "table": "employees",
                "columns": [
                    {"name": "id", "type": "INTEGER PRIMARY KEY"},
                    {"name": "name", "type": "TEXT"},
                    {"name": "department_id", "type": "INTEGER (FK -> departments.id)"},
                ],
            },
            {
                "table": "access_logs",
                "columns": [
                    {"name": "id", "type": "INTEGER PRIMARY KEY"},
                    {"name": "employee_id", "type": "INTEGER (FK -> employees.id)"},
                    {"name": "status", "type": "TEXT ('SUCCESS' | 'FAILED')"},
                    {"name": "attempt_time", "type": "TEXT"},
                ],
            },
        ],
    },
    "03": {
        "id": "03",
        "title": "EXTRACT THE PAYLOAD",
        "topic": "SUBQUERY / AGGREGATION / MULTI-TABLE",
        "objective": (
            "Isolate compromised transfers originating from high-risk accounts. "
            "Filter transfers where status is 'FLAGGED', the account clearance level maps to risk_tier 'CRITICAL', "
            "and the transfer amount exceeds the average amount of all FLAGGED transfers. "
            "Return owner_name, target_vault, and amount, ordered by amount descending."
        ),
        "check_order": True,
        "required_columns": ["owner_name", "target_vault", "amount"],
        "schema_ddl": """
            CREATE TABLE clearance_registry (
                clearance_level TEXT PRIMARY KEY,
                risk_tier TEXT NOT NULL
            );
            CREATE TABLE accounts (
                id INTEGER PRIMARY KEY,
                owner_name TEXT NOT NULL,
                clearance_level TEXT NOT NULL
            );
            CREATE TABLE vault_transfers (
                id INTEGER PRIMARY KEY,
                account_id INTEGER NOT NULL,
                target_vault TEXT NOT NULL,
                amount REAL NOT NULL,
                status TEXT NOT NULL,
                transfer_time TEXT NOT NULL
            );
        """,
        "seed_sql": """
            INSERT INTO clearance_registry (clearance_level, risk_tier) VALUES
                ('ALPHA', 'STANDARD'),
                ('BETA', 'ELEVATED'),
                ('OMEGA', 'CRITICAL');

            INSERT INTO accounts (id, owner_name, clearance_level) VALUES
                (1, 'Ghost_01', 'OMEGA'),
                (2, 'Legit_Holding', 'ALPHA'),
                (3, 'Shadow_Syndicate', 'OMEGA'),
                (4, 'Transit_Escrow', 'BETA'),
                (5, 'Cipher_Vault_Corp', 'OMEGA');

            INSERT INTO vault_transfers (id, account_id, target_vault, amount, status, transfer_time) VALUES
                (101, 1, 'VAULT-ZURICH-9', 2400000.00, 'FLAGGED', '2026-09-12 05:40:00'),
                (102, 2, 'VAULT-TOKYO-3', 150000.00, 'CLEARED', '2026-09-12 05:41:10'),
                (103, 3, 'VAULT-CAYMAN-7', 8900000.00, 'FLAGGED', '2026-09-12 05:43:25'),
                (104, 4, 'VAULT-BERLIN-1', 450000.00, 'FLAGGED', '2026-09-12 05:45:00'),
                (105, 5, 'VAULT-GENEVA-4', 5200000.00, 'FLAGGED', '2026-09-12 05:48:12'),
                (106, 1, 'VAULT-LONDON-2', 800000.00, 'FLAGGED', '2026-09-12 05:50:30'),
                (107, 3, 'VAULT-PANAMA-8', 12000000.00, 'FLAGGED', '2026-09-12 05:55:00');
        """,
        "expected_sql": """
            SELECT a.owner_name, vt.target_vault, vt.amount
            FROM vault_transfers vt
            JOIN accounts a ON vt.account_id = a.id
            JOIN clearance_registry cr ON a.clearance_level = cr.clearance_level
            WHERE vt.status = 'FLAGGED'
              AND cr.risk_tier = 'CRITICAL'
              AND vt.amount > (SELECT AVG(amount) FROM vault_transfers WHERE status = 'FLAGGED')
            ORDER BY vt.amount DESC;
        """,
        "public_schema": [
            {
                "table": "clearance_registry",
                "columns": [
                    {"name": "clearance_level", "type": "TEXT PRIMARY KEY"},
                    {"name": "risk_tier", "type": "TEXT ('STANDARD' | 'ELEVATED' | 'CRITICAL')"},
                ],
            },
            {
                "table": "accounts",
                "columns": [
                    {"name": "id", "type": "INTEGER PRIMARY KEY"},
                    {"name": "owner_name", "type": "TEXT"},
                    {"name": "clearance_level", "type": "TEXT (FK -> clearance_registry.clearance_level)"},
                ],
            },
            {
                "table": "vault_transfers",
                "columns": [
                    {"name": "id", "type": "INTEGER PRIMARY KEY"},
                    {"name": "account_id", "type": "INTEGER (FK -> accounts.id)"},
                    {"name": "target_vault", "type": "TEXT"},
                    {"name": "amount", "type": "REAL"},
                    {"name": "status", "type": "TEXT ('CLEARED' | 'FLAGGED' | 'BLOCKED')"},
                    {"name": "transfer_time", "type": "TEXT"},
                ],
            },
        ],
    },
}


def get_sql_mission(mission_id: str) -> dict:
    mid = str(mission_id).lstrip("0") or "1"
    formatted_id = mid.padStart(2, "0") if hasattr(mid, "padStart") else f"{int(mid):02d}"
    return SQL_MISSIONS.get(formatted_id)
