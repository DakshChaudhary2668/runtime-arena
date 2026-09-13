"""Read-only and interactive Runtime Arena analytics with Groq AI Game Director."""

from flask import Blueprint, jsonify, request

from models.database import get_player_analytics
from services.director import generate_performance_summary, generate_director_observation

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.route("/analytics/<user_id>", methods=["GET"])
def player_analytics(user_id):
    analytics = get_player_analytics(user_id)
    # Check if a custom Groq key was passed via query param or header
    custom_groq_key = request.headers.get("X-Groq-Api-Key") or request.args.get("groq_key")
    if not analytics.get("observation"):
        analytics["observation"] = generate_director_observation(analytics, custom_groq_key=custom_groq_key)
    analytics["summary"] = generate_performance_summary(analytics)
    return jsonify(analytics)


@analytics_bp.route("/analytics/observe", methods=["POST"])
def live_observation():
    """Request a fresh live neural observation from Groq API."""
    data = request.get_json() or {}
    user_id = data.get("user_id", "s2")
    custom_groq_key = data.get("groq_api_key") or request.headers.get("X-Groq-Api-Key")
    analytics = get_player_analytics(user_id)
    observation = generate_director_observation(analytics, custom_groq_key=custom_groq_key)
    return jsonify({"observation": observation, "status": "ok"})

