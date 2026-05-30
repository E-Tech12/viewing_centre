from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from backend.app.models import Booking

bookings_bp = Blueprint("bookings", __name__)


@bookings_bp.get("/")
@jwt_required()
def my_bookings():
    user_id = get_jwt_identity()
    claims = get_jwt()

    if claims.get("role") in ("admin", "staff"):
        # Admins see all
        event_id = request.args.get("event_id")
        q = Booking.query
        if event_id:
            q = q.filter_by(event_id=event_id)
        bookings = q.order_by(Booking.booked_at.desc()).all()
    else:
        bookings = Booking.query.filter_by(user_id=user_id).order_by(Booking.booked_at.desc()).all()

    return jsonify([b.to_dict() for b in bookings])


@bookings_bp.get("/<booking_id>")
@jwt_required()
def get_booking(booking_id):
    user_id = get_jwt_identity()
    claims = get_jwt()
    booking = Booking.query.get_or_404(booking_id)

    if claims.get("role") not in ("admin", "staff") and booking.user_id != user_id:
        return jsonify({"error": "Forbidden"}), 403

    return jsonify(booking.to_dict(include_tickets=True))
