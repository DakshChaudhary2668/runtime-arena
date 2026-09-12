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
    return jsonify(start_voice_session(
        channel=data.get("channel"),
        user_uid=data.get("uid"),
        mission=data.get("mission") or {},
        hint_level=int(data.get("hint_level", 0)),
        context=data.get("context") or {},
    ))


@voice_bp.route("/voice/context", methods=["POST"])
def voice_context():
    data = request.get_json(silent=True) or {}
    agent_id = data.get("agent_id")
    context = data.get("context") or {}
    success = False
    if agent_id:
        from services.voice_agent import update_voice_context
        success = update_voice_context(agent_id, context)
    return jsonify({"updated": success})


@voice_bp.route("/voice/speak", methods=["POST"])
def voice_speak():
    data = request.get_json(silent=True) or {}
    agent_id = data.get("agent_id")
    text = data.get("text", "")
    success = False
    if agent_id and text:
        from services.voice_agent import speak_voice_agent
        success = speak_voice_agent(agent_id, text)
    return jsonify({"spoken": success})


@voice_bp.route("/voice/stop", methods=["POST"])
def voice_stop():
    data = request.get_json(silent=True) or {}
    if data.get("agent_id"):
        stop_voice_session(data["agent_id"])
    return jsonify({"stopped": True})
