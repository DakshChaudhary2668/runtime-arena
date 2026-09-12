"""
Code Execution Route — uses SQLite for student score updates.
"""

from flask import Blueprint, request, jsonify
from services.judge0 import execute_code
from models.database import (
    get_student_by_name,
    record_failed_execution,
    record_mission_completion,
    update_student_score,
)

execute_bp = Blueprint("execute", __name__)


@execute_bp.route("/execute", methods=["POST"])
def run_code():
    """
    Execute code via Judge0 and update student score in DB.
    Body: { code, language_id, student }
    """
    data = request.get_json()

    if not data:
        return jsonify({"error": "Request body required"}), 400

    code = data.get("code", "")
    language_id = data.get("language_id", 71)
    student_name = data.get("student", "")
    user_id = data.get("user_id") or student_name or "guest"
    module_id = data.get("module_id", "")
    mission_id = data.get("mission_id", "")

    if not code.strip():
        return jsonify({"error": "Code cannot be empty"}), 400

    # Execute via Judge0
    result = execute_code(code, language_id)

    # Calculate score
    status = result.get("status", "")
    if status == "Accepted":
        score = 100
    elif "Error" in status:
        score = 0
    else:
        score = 50

    result["score"] = score

    # Update student record in SQLite
    if student_name:
        student = get_student_by_name(student_name)
        if student:
            update_student_score(student_name, score, "submitted")

    # Analytics writes are additive and deliberately isolated from execution.
    if module_id and mission_id:
        try:
            if status == "Accepted":
                record_mission_completion(
                    user_id=user_id,
                    student_name=student_name or "Guest Pilot",
                    module_id=module_id,
                    mission_id=mission_id,
                    topic=data.get("topic", ""),
                    attempts=max(1, int(data.get("attempts", 1))),
                    hint_level=max(0, int(data.get("hint_level", 0))),
                    xp_earned=max(0, int(data.get("xp_earned", 0))),
                    xp_deducted=max(0, int(data.get("xp_deducted", 0))),
                    time_seconds=max(0, int(data.get("time_seconds", 0))),
                )
            else:
                record_failed_execution(
                    user_id=user_id,
                    student_name=student_name or "Guest Pilot",
                    module_id=module_id,
                    mission_id=mission_id,
                    status=status,
                )
        except Exception:
            # Telemetry must never change the code execution response.
            pass

    return jsonify(result)
