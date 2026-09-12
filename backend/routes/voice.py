"""Optional voice-agent and shared AI Director HTTP routes."""

from flask import Blueprint, jsonify, request

from services.director import generate_hint
from services.voice_agent import (
    start_voice_session,
    stop_voice_session,
    voice_capability,
)

voice_bp = Blueprint("voice", __name__)


@voice_bp.route("/director/hint", methods=["POST"])
def director_hint():
    data = request.get_json(silent=True) or {}
    message = generate_hint(
        question=data.get("question", ""),
        mission=data.get("mission") or {},
        code=data.get("code", ""),
        hint_level=int(data.get("hint_level", 0)),
        fallback=data.get("fallback", ""),
    )
    return jsonify({"message": message})


@voice_bp.route("/voice/config", methods=["GET"])
def voice_config():
    return jsonify(voice_capability())


@voice_bp.route("/voice/start", methods=["POST"])
def voice_start():
    data = request.get_json(silent=True) or {}
    if not data.get("channel") or not data.get("uid"):
        return jsonify({
            "available": False,
            "reason": "INVALID_PARAMS",
            "message": "channel and uid are required",
            "fallback": "text",
        }), 400
    return jsonify(start_voice_session(
        channel=data["channel"],
        user_uid=data["uid"],
        mission=data.get("mission") or {},
        hint_level=int(data.get("hint_level", 0)),
    ))


@voice_bp.route("/voice/stop", methods=["POST"])
def voice_stop():
    data = request.get_json(silent=True) or {}
    if data.get("agent_id"):
        stop_voice_session(data["agent_id"])
    return jsonify({"stopped": True})
