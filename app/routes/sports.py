"""
Sport categories — read-only for public/owners, managed by platform admin.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app import db
from app.models.models import SportCategory

sports_bp = Blueprint("sports", __name__)


@sports_bp.get("/")
def list_sports():
    sports = SportCategory.query.filter_by(is_active=True).order_by(SportCategory.sort_order).all()
    return jsonify([s.to_dict() for s in sports])


@sports_bp.get("/<sport_id>")
def get_sport(sport_id):
    sport = SportCategory.query.get_or_404(sport_id)
    return jsonify(sport.to_dict())


@sports_bp.post("/")
@jwt_required()
def create_sport():
    claims = get_jwt()
    if claims.get("role") != "platform_admin":
        return jsonify({"error": "Platform admin only"}), 403
    data = request.get_json()
    sport = SportCategory(
        name=data["name"],
        slug=data["slug"],
        icon=data.get("icon", "🏆"),
        metadata_schema=data.get("metadata_schema", []),
        sort_order=data.get("sort_order", 0),
    )
    db.session.add(sport)
    db.session.commit()
    return jsonify(sport.to_dict()), 201
