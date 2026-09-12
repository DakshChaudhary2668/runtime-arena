from flask import Blueprint, request, jsonify
from models.database import get_all_students, upsert_student, get_student_by_name

students_bp = Blueprint("students", __name__)


@students_bp.route("/students", methods=["GET"])
def list_students():
    """List all students/pilots with telemetry statistics."""
    students = get_all_students()
    return jsonify(students)


@students_bp.route("/students", methods=["POST"])
def update_student():
    """Log keystroke telemetry delta and activity state."""
    data = request.get_json() or {}
    name = data.get("student") or data.get("name")
    if not name:
        return jsonify({"error": "Pilot/student name required"}), 400

    keystrokes = int(data.get("keystrokes", 0))
    score = int(data.get("score", 0))
    activity = data.get("activity", "idle")
    role = data.get("role", "")

    student = upsert_student(name, keystrokes, score, activity, role)
    return jsonify(student)


@students_bp.route("/students/<name>", methods=["GET"])
def get_student(name):
    """Fetch telemetry for a specific pilot."""
    student = get_student_by_name(name)
    if not student:
        return jsonify({"error": "Pilot not found"}), 404
    return jsonify(student)
