"""Flight 101 verifier cases; this module is server-side only."""

from dataclasses import dataclass


@dataclass(frozen=True)
class Challenge:
    mission_id: str
    entry_function: str
    concept: str
    public_tests: tuple
    hidden_tests: tuple
    timeout: float = 3.0


CHALLENGES = {
    "01": Challenge(
        mission_id="01",
        entry_function="reverse_fuel_line",
        concept="Linked List Reversal",
        public_tests=(
            {"values": [1, 2, 3]},
            {"values": [1]},
        ),
        hidden_tests=(
            {"values": []},
            {"values": [5, 9]},
            {"values": [4, 4, 2, 4]},
            {"values": [-3, 0, 7, -1, 8, 12]},
            {"values": list(range(1, 25))},
        ),
    ),
    "02": Challenge(
        mission_id="02",
        entry_function="find_escape_vector",
        concept="Graph Traversal (BFS)",
        public_tests=(
            {"graph": {"ENTRY": ["A"], "A": ["EXIT"], "EXIT": []}, "start": "ENTRY", "target": "EXIT", "expected": 2},
            {"graph": {"S": ["A", "B"], "A": ["C"], "C": ["D"], "D": ["T"], "B": ["T"], "T": []}, "start": "S", "target": "T", "expected": 2},
        ),
        hidden_tests=(
            {"graph": {"S": ["A"], "A": [], "T": []}, "start": "S", "target": "T", "expected": -1},
            {"graph": {"HOME": ["A"], "A": []}, "start": "HOME", "target": "HOME", "expected": 0},
            {"graph": {"A": ["B"], "B": ["C"], "C": ["A", "D"], "D": ["E"], "E": []}, "start": "A", "target": "E", "expected": 4},
            {"graph": {"START": ["P1", "P2"], "P1": ["MID1"], "P2": ["MID2"], "MID1": ["END"], "MID2": ["END"], "END": []}, "start": "START", "target": "END", "expected": 3},
            {"graph": {"S": ["A", "B"], "A": ["C"], "B": ["D"], "C": ["E"], "D": ["E"], "E": ["F"], "F": ["G"], "G": ["H"], "H": ["T"], "T": []}, "start": "S", "target": "T", "expected": 7},
        ),
    ),
    "03": Challenge(
        mission_id="03",
        entry_function="min_descent_energy",
        concept="Dynamic Programming",
        public_tests=(
            {"costs": [10, 15, 20, 10, 5], "expected": 25},
            {"costs": [4, 9], "expected": 4},
        ),
        hidden_tests=(
            {"costs": [], "expected": 0},
            {"costs": [7], "expected": 0},
            {"costs": [0, 0, 0, 1], "expected": 0},
            {"costs": [5, 5, 5, 5], "expected": 10},
            {"costs": [1, 100, 1, 1, 1, 100, 1, 1, 100, 1], "expected": 6},
            {"costs": [2] * 30, "expected": 30},
        ),
    ),
}


def get_challenge(mission_id):
    return CHALLENGES.get(str(mission_id).zfill(2))
