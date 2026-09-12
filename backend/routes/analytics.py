"""Read-only, single-player Runtime Arena analytics."""

from flask import Blueprint, jsonify

from models.database import get_player_analytics
from services.director import generate_performance_summary

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.route("/analytics/<user_id>", methods=["GET"])
def player_analytics(user_id):
    analytics = get_player_analytics(user_id)
    analytics["summary"] = generate_performance_summary(analytics)
    return jsonify(analytics)
