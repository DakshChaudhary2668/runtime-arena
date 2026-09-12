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

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def reverse_fuel_line(head):
    """
    :type head: ListNode
    :rtype: ListNode
    """
    prev = None
    curr = head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev

# System telemetry verification
def verify_system():
    # Primary sequence: 1 -> 2 -> 3 -> 4
    head = ListNode(1, ListNode(2, ListNode(3, ListNode(4))))
    reversed_head = reverse_fuel_line(head)
    
    result = []
    curr = reversed_head
    while curr:
        result.append(curr.val)
        curr = curr.next
        
    assert result == [4, 3, 2, 1], f"Telemetry check failed: Expected [4,3,2,1], got {result}"
    print("STATUS: FUEL FLOW EQUALIZED. MANIFOLD BALANCED. [4, 3, 2, 1] VERIFIED.")

verify_system()
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

# System telemetry verification
def verify_vector():
    radar_map = {
        'ENTRY': ['WAYPOINT_A', 'WAYPOINT_B'],
        'WAYPOINT_A': ['WAYPOINT_C'],
        'WAYPOINT_B': ['WAYPOINT_C', 'WAYPOINT_D'],
        'WAYPOINT_C': ['ESCAPE'],
        'WAYPOINT_D': ['ESCAPE'],
        'ESCAPE': []
    }
    hops = find_escape_vector(radar_map, 'ENTRY', 'ESCAPE')
    assert hops == 3, f"Navigation mismatch: Expected 3, got {hops}"
    print("STATUS: VECTOR LOCKED. RADAR CORRIDOR RESOLVED (3 HOPS).")

verify_vector()
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
    n = len(step_costs)
    if n <= 1:
        return 0
    dp0, dp1 = 0, 0
    for i in range(2, n + 1):
        curr = min(dp1 + step_costs[i - 1], dp0 + step_costs[i - 2])
        dp0, dp1 = dp1, curr
    return dp1

# System telemetry verification
def verify_landing():
    stage_energy = [10, 15, 20, 10, 5]
    energy = min_descent_energy(stage_energy)
    assert energy == 25, f"Energy over-expended: Expected 25, got {energy}"
    print("STATUS: GLIDE-SLOPE CALCULATED. SAFE TOUCHDOWN ACHIEVED (ENERGY: 25).")

verify_landing()
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
    description: "A shadowy syndicate has embezzled billions. Query the relational mainframe, join transaction ledgers, and freeze the offshore vault before the timer expires.",
    totalMissions: 3,
    badge: "SQL TRACK",
    lockReason: "CLASSIFIED — CLEAR FLIGHT 101 FIRST"
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
