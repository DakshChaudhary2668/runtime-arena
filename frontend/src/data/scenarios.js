/**
 * Data-Driven Mission Scenarios for RunTime Arena
 * Single Source of Truth for gameplay modules, missions, telemetry, and story narrative.
 */

export const SCENARIOS = [
  {
    id: "flight-101",
    title: "FLIGHT 101",
    track: "DSA",
    level: "BEGINNER",
    status: "unlocked",
    tagline: "CAPTAIN DOWN. SYSTEMS FAILING. YOU HAVE CONTROL.",
    description: "An emergency descent over the Atlantic. The flight control system has defaulted to manual fallback. Your code is the only link between the cockpit and survival.",
    totalMissions: 3,
    badge: "ACTIVE EMERGENCY",
    missions: [
      {
        id: "01",
        number: "01",
        title: "REROUTE FUEL LINE",
        system: "FUEL CONTROL SYSTEM",
        topic: "Linked List Reversal",
        keybinding: "N",
        keyLabel: "NAVIGATION",
        systemHUD: {
          altitude: "18,420 FT",
          oxygen: "72%",
          hull: "91%",
          timeLimit: 300,
          status: "CRITICAL",
          statusColor: "#FF453A"
        },
        narrative: [
          "THE CAPTAIN IS UNRESPONSIVE.",
          "The Boeing 787 is descending through heavy atmospheric turbulence.",
          "Cross-feed valve failure has isolated the starboard fuel manifolds.",
          "The emergency routing computer has reversed its memory sequence.",
          "Invert the fuel routing linked list to reignite the auxiliary turbine."
        ],
        objective: "Reverse the singly linked list representing the fuel line feed nodes to restore starboard turbine pressure.",
        starterCode: `# FLIGHT 101 // MISSION 01: FUEL ROUTING OVERRIDE
# Reverse the singly-linked list to invert the fuel sequence.
# ListNode is provided by the system: ListNode(val=0, next=None)

def reverse_fuel_line(head):
    """
    :type head: ListNode
    :rtype: ListNode
    """
    # TODO: Reverse the linked list and return the new head pointer.
    pass
`,
        aiResponses: {
          observing: "Telemetry nominal. Engine telemetry monitoring activated.",
          attention: "Struggle detected. Starboard manifold pressure dropping.",
          intervention: "Focus on reassigning pointers: retain a temporary reference to current.next before reversing current.next.",
          recovery: "Fuel pressure stabilizing across all combustion chambers.",
          successDebrief: "You stabilized the fuel system before the aircraft entered the lower storm layer."
        }
      },
      {
        id: "02",
        number: "02",
        title: "NAVIGATE THE STORM",
        system: "RADAR VECTOR SYSTEM",
        topic: "Graph Traversal (BFS)",
        keybinding: "F",
        keyLabel: "FUEL & VECTOR",
        systemHUD: {
          altitude: "14,200 FT",
          oxygen: "68%",
          hull: "84%",
          timeLimit: 240,
          status: "TURBULENCE",
          statusColor: "#FFD60A"
        },
        narrative: [
          "CYCLONIC ANOMALY DIRECTLY AHEAD.",
          "Severe microburst winds detected on weather radar.",
          "Flight computer must calculate the minimum hop corridor through waypoint grid.",
          "Any detour beyond optimal flight vector exceeds remaining fuel reserve.",
          "Execute Breadth-First Search to isolate the escape corridor."
        ],
        objective: "Compute the minimum number of waypoint hops between ENTRY and ESCAPE through the radar graph.",
        starterCode: `# FLIGHT 101 // MISSION 02: RADAR ESCAPE CORRIDOR
# Find minimum hops through the waypoint navigation grid.

from collections import deque

def find_escape_vector(graph, start, target):
    """
    :type graph: dict[str, list[str]]
    :type start: str
    :type target: str
    :rtype: int
    """
    # Return the fewest hops, or -1 if the target cannot be reached.
    pass
`,
        aiResponses: {
          observing: "Radar ping active. Analyzing waypoint trajectory.",
          attention: "Aircraft drifted off vector. High-turbulence cell encroaching.",
          intervention: "BFS guarantees shortest path in an unweighted graph. Ensure visited nodes are logged to avoid cyclic loops.",
          recovery: "Course corrected. Clear airspace in sight.",
          successDebrief: "Vector locked. The aircraft threaded the eye of the storm without airframe compromise."
        }
      },
      {
        id: "03",
        number: "03",
        title: "EMERGENCY DESCENT",
        system: "AUTOPILOT GLIDE-SLOPE",
        topic: "Dynamic Programming",
        keybinding: "A",
        keyLabel: "AUTOPILOT OVERRIDE",
        systemHUD: {
          altitude: "7,800 FT",
          oxygen: "62%",
          hull: "79%",
          timeLimit: 180,
          status: "GLIDE SLOPE",
          statusColor: "#FF453A"
        },
        narrative: [
          "RUNWAY 24L VISUAL CONFIRMED AT 12 MILES.",
          "Hydraulic pressure at 38%. Altitude bleed rate is critical.",
          "Every step change in flap and spoiler deployment consumes aerodynamic energy.",
          "Calculate the minimum energy required to traverse the glide-slope step costs.",
          "Touchdown window closes in 180 seconds."
        ],
        objective: "Determine the minimal cumulative descent cost across step stages using dynamic programming.",
        starterCode: `# FLIGHT 101 // MISSION 03: GLIDE-SLOPE ENERGY OPTIMIZATION
# Calculate minimum energy cost to step through glide-slope stages.

def min_descent_energy(step_costs):
    """
    :type step_costs: list[int]
    :rtype: int
    """
    # Reach the top with minimum cumulative cost; you may start at step 0 or 1.
    pass
`,
        aiResponses: {
          observing: "Glide-slope radar active. Rate of descent 1,200 fpm.",
          attention: "Energy curve non-optimal. High sink-rate warning.",
          intervention: "At each step, take the minimum of arriving from 1 step back or 2 steps back. Maintain running state variables.",
          recovery: "Descent angle stabilized at 3 degrees.",
          successDebrief: "Touchdown confirmed on Runway 24L. All passengers and crew accounted for."
        }
      }
    ]
  },
  {
    id: "vault-breach",
    title: "VAULT BREACH",
    track: "SQL",
    level: "INTERMEDIATE",
    status: "locked",
    tagline: "ACCESS THE MAINFRAME. TRACE THE ANOMALIES.",
    description: "A shadowy syndicate has breached the central data repository. Query compromised server logs, correlate employee records, and isolate fraudulent transfers before the trail runs cold.",
    totalMissions: 3,
    badge: "SQL TRACK",
    lockReason: "CLASSIFIED — CLEAR FLIGHT 101 FIRST",
    missions: [
      {
        id: "01",
        number: "01",
        title: "ACCESS LOGS",
        system: "MAINFRAME AUTH GATEWAY",
        topic: "SELECT / WHERE / ORDER BY",
        language: "sql",
        languageId: 82,
        keybinding: "L",
        keyLabel: "SECURITY LOGS",
        systemHUD: {
          altitude: "SECTOR 07",
          oxygen: "MAIN GATEWAY",
          hull: "84% INTACT",
          timeLimit: 300,
          status: "ALERT",
          statusColor: "#FF9F0A"
        },
        narrative: [
          "SECURITY BREACH IN SECTOR 7.",
          "Unauthorized authentication pulses detected across the core bastion gateway.",
          "Intruders attempted credential stuffing from multiple external endpoints.",
          "Query the security access logs to isolate all failed login attempts.",
          "Order the records by most recent attempt to pinpoint the attack vector."
        ],
        objective: "Filter failed authentication attempts (status = 'FAILED') from access_logs. Return username, ip_address, status, and attempt_time, ordered from newest to oldest (attempt_time DESC).",
        publicSchema: [
          {
            table: "access_logs",
            columns: [
              { name: "id", type: "INTEGER PRIMARY KEY" },
              { name: "username", type: "TEXT" },
              { name: "ip_address", type: "TEXT" },
              { name: "status", type: "TEXT ('SUCCESS' | 'FAILED')" },
              { name: "attempt_time", type: "TEXT (YYYY-MM-DD HH:MM:SS)" }
            ]
          }
        ],
        starterCode: `-- VAULT BREACH // MISSION 01: ACCESS LOGS
-- Query failed mainframe authentication attempts.
-- Filter by status = 'FAILED' and order by attempt_time descending.

SELECT username, ip_address, status, attempt_time
FROM access_logs
-- [ADD FILTER AND ORDERING DIRECTIVES]
;
`,
        aiResponses: {
          observing: "Mainframe query console linked. Awaiting relational filter parameters.",
          attention: "Query output mismatch. Ensure you filter strictly on status = 'FAILED' and sort attempt_time DESC.",
          intervention: "Construct your query with: WHERE status = 'FAILED' ORDER BY attempt_time DESC;",
          recovery: "Anomalous authentication vectors isolated. IP addresses cataloged.",
          successDebrief: "You successfully filtered the attack signatures and isolated the intruder's external nodes."
        }
      },
      {
        id: "02",
        number: "02",
        title: "TRACE THE INSIDER",
        system: "PERSONNEL DIRECTORY & AUDIT",
        topic: "JOIN / GROUP BY / COUNT",
        language: "sql",
        languageId: 82,
        keybinding: "I",
        keyLabel: "INSIDER AUDIT",
        systemHUD: {
          altitude: "DIV OPERATIONS",
          oxygen: "INTERNAL VPN",
          hull: "68% INTACT",
          timeLimit: 300,
          status: "CRITICAL",
          statusColor: "#FF453A"
        },
        narrative: [
          "INTERNAL CREDENTIALS WEAPONIZED.",
          "The attack originated from an employee workstation inside the corporate network.",
          "Correlate employee badges with departmental units and mainframe access logs.",
          "Identify which department generated the highest number of failed authentication attempts.",
          "Expose the compromised division to initiate emergency security lockdown."
        ],
        objective: "Join departments, employees, and access_logs. For departments with failed attempts (status = 'FAILED'), return department_name and the count as failed_attempts, ordered by failed_attempts descending.",
        publicSchema: [
          {
            table: "departments",
            columns: [
              { name: "id", type: "INTEGER PRIMARY KEY" },
              { name: "name", type: "TEXT" }
            ]
          },
          {
            table: "employees",
            columns: [
              { name: "id", type: "INTEGER PRIMARY KEY" },
              { name: "name", type: "TEXT" },
              { name: "department_id", type: "INTEGER (FK -> departments.id)" }
            ]
          },
          {
            table: "access_logs",
            columns: [
              { name: "id", type: "INTEGER PRIMARY KEY" },
              { name: "employee_id", type: "INTEGER (FK -> employees.id)" },
              { name: "status", type: "TEXT" },
              { name: "attempt_time", type: "TEXT" }
            ]
          }
        ],
        starterCode: `-- VAULT BREACH // MISSION 02: TRACE THE INSIDER
-- Correlate employees with departments and access logs.
-- Return: department_name, COUNT(a.id) AS failed_attempts
-- Group by department and order by failed_attempts DESC.

SELECT d.name AS department_name, COUNT(a.id) AS failed_attempts
FROM departments d
JOIN employees e ON d.id = e.department_id
-- [COMPLETE JOIN WITH access_logs AND AGGREGATION]
;
`,
        aiResponses: {
          observing: "Relational join telemetry monitoring active. Cross-referencing badges.",
          attention: "Aggregation mismatch. Ensure you join all three tables on matching foreign keys and filter status = 'FAILED'.",
          intervention: "Join access_logs on e.id = a.employee_id, filter WHERE a.status = 'FAILED', and GROUP BY d.name ORDER BY failed_attempts DESC.",
          recovery: "Compromised division identified: Offshore Vault Operations confirmed.",
          successDebrief: "Insider vector pinpointed. Rogue workstation credentials severed."
        }
      },
      {
        id: "03",
        number: "03",
        title: "EXTRACT THE PAYLOAD",
        system: "SECURE ESCROW LEDGER",
        topic: "SUBQUERY / AGGREGATION / MULTI-TABLE",
        language: "sql",
        languageId: 82,
        keybinding: "P",
        keyLabel: "ESCROW LEDGER",
        systemHUD: {
          altitude: "OFFSHORE ESCROW",
          oxygen: "CLEARANCE OMEGA",
          hull: "41% INTACT",
          timeLimit: 300,
          status: "MELTDOWN",
          statusColor: "#FF3B30"
        },
        narrative: [
          "FUNDS DRAIN IN PROGRESS.",
          "The intruder initiated offshore capital transfers across shell accounts.",
          "Target transfers originate from accounts with CRITICAL clearance risk tier.",
          "Only transfers exceeding the average amount of all FLAGGED transfers are unauthorized payloads.",
          "Extract the payload targets immediately to freeze the transfers."
        ],
        objective: "Extract all transfers where status is 'FLAGGED', account clearance maps to risk_tier 'CRITICAL', and amount exceeds the average of all FLAGGED transfers. Return owner_name, target_vault, and amount, ordered by amount descending.",
        publicSchema: [
          {
            table: "clearance_registry",
            columns: [
              { name: "clearance_level", type: "TEXT PRIMARY KEY" },
              { name: "risk_tier", type: "TEXT ('STANDARD' | 'ELEVATED' | 'CRITICAL')" }
            ]
          },
          {
            table: "accounts",
            columns: [
              { name: "id", type: "INTEGER PRIMARY KEY" },
              { name: "owner_name", type: "TEXT" },
              { name: "clearance_level", type: "TEXT (FK -> clearance_registry.clearance_level)" }
            ]
          },
          {
            table: "vault_transfers",
            columns: [
              { name: "id", type: "INTEGER PRIMARY KEY" },
              { name: "account_id", type: "INTEGER (FK -> accounts.id)" },
              { name: "target_vault", type: "TEXT" },
              { name: "amount", type: "REAL" },
              { name: "status", type: "TEXT ('CLEARED' | 'FLAGGED' | 'BLOCKED')" },
              { name: "transfer_time", type: "TEXT" }
            ]
          }
        ],
        starterCode: `-- VAULT BREACH // MISSION 03: EXTRACT THE PAYLOAD
-- Filter transfers with status = 'FLAGGED' from CRITICAL risk clearance accounts
-- where amount > (SELECT AVG(amount) FROM vault_transfers WHERE status = 'FLAGGED')
-- Return: owner_name, target_vault, amount (ordered by amount DESC)

SELECT a.owner_name, vt.target_vault, vt.amount
FROM vault_transfers vt
-- [JOIN accounts AND clearance_registry, THEN APPLY SUBQUERY FILTER]
;
`,
        aiResponses: {
          observing: "Escrow ledger streams decrypted. High-value transfer vectors highlighted.",
          attention: "Subquery validation mismatch. Check that you compute AVG(amount) only on FLAGGED transfers.",
          intervention: "Join clearance_registry through accounts. In the WHERE clause, compare amount > (SELECT AVG(amount) FROM vault_transfers WHERE status = 'FLAGGED').",
          recovery: "Exfiltration transfers intercepted! Offshore ledger accounts frozen.",
          successDebrief: "Vault breach neutralized. Over $20M in compromised capital secured."
        }
      }
    ]
  },
  {
    id: "data-heist",
    title: "DATA HEIST",
    track: "DSA",
    level: "INTERMEDIATE",
    status: "locked",
    tagline: "BYPASS THE FIREWALL. CRACK THE VAULT. ERASE YOUR TRACKS.",
    description: "Infiltrate a mega-corporation's high-frequency trading server using arrays, two-pointer algorithms, and backtracking.",
    totalMissions: 3,
    badge: "SEASON 02",
    lockReason: "AVAILABLE IN A FUTURE SEASON"
  },
  {
    id: "space-rescue",
    title: "SPACE RESCUE",
    track: "DSA",
    level: "ADVANCED",
    status: "coming-soon",
    tagline: "DEEP-SPACE DISTRESS SIGNAL DETECTED.",
    description: "A research vessel has stopped responding beyond the established communication grid. Life-support telemetry remains active. Crew status unknown.",
    totalMissions: 3,
    badge: "COMING SOON",
    lockReason: "MISSION ARCHIVE ENCRYPTED",
    transmission: {
      id: "03-71",
      signal: "12%",
      crew: "UNKNOWN",
      oxygen: "--",
      distance: "2.7 AU",
      sector: "07"
    },
    missions: [
      {
        id: "oxygen-systems",
        number: "01",
        title: "OXYGEN SYSTEMS CHECK",
        topic: "Stack / Queue",
        status: "encrypted",
        description: "Life support priority queue requires reordering."
      },
      {
        id: "chart-course",
        number: "02",
        title: "CHART COURSE HOME",
        topic: "Graph / BFS",
        status: "encrypted",
        description: "Navigation computer pathfinding protocol offline."
      },
      {
        id: "save-the-crew",
        number: "03",
        title: "SAVE THE CREW",
        topic: "MST / Union-Find",
        status: "encrypted",
        description: "Network restoration requires minimum spanning tree."
      }
    ]
  }
];

export function getScenario(id) {
  return SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
}

export function getMission(scenarioId, missionId) {
  const scenario = getScenario(scenarioId);
  if (!scenario || !scenario.missions) return null;
  return scenario.missions.find((m) => m.id === missionId || m.number === missionId) || scenario.missions[0];
}
