from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from backend.app.app import db
from app.models import Ticket, Booking
from app.services.ticket_service import validate_ticket

tickets_bp = Blueprint("tickets", __name__)


@tickets_bp.get("/my")
@jwt_required()
def my_tickets():
    user_id = get_jwt_identity()
    bookings = Booking.query.filter_by(user_id=user_id, status="confirmed").all()
    tickets = []
    for b in bookings:
        for t in b.tickets:
            d = t.to_dict()
            d["event_title"] = b.event.title if b.event else None
            d["event_starts_at"] = b.event.starts_at.isoformat() if b.event else None
            d["match_teams"] = b.event.match_teams if b.event else None
            d["venue_name"] = b.event.venue.name if b.event and b.event.venue else None
            tickets.append(d)
    return jsonify(tickets)


@tickets_bp.post("/scan")
@jwt_required()
def scan_ticket():
    """PWA scanner calls this endpoint after reading a QR code."""
    claims = get_jwt()
    if claims.get("role") not in ("admin", "staff"):
        return jsonify({"error": "Staff access required"}), 403

    staff_id = get_jwt_identity()
    data = request.get_json()
    qr_data = data.get("qr_data")

    if not qr_data:
        return jsonify({"error": "qr_data required"}), 400

    # 1. Validate HMAC signature
    result = validate_ticket(qr_data)
    if not result["valid"]:
        return jsonify({"valid": False, "reason": result["reason"]}), 200

    ticket_id = result["ticket_id"]

    # 2. Check DB state
    ticket = Ticket.query.get(ticket_id)
    if not ticket:
        return jsonify({"valid": False, "reason": "Ticket not found in database"}), 200

    if ticket.scanned:
        return jsonify({
            "valid": False,
            "reason": "Ticket already scanned",
            "scanned_at": ticket.scanned_at.isoformat(),
        }), 200

    booking = ticket.booking
    if booking.status != "confirmed":
        return jsonify({"valid": False, "reason": "Booking not confirmed"}), 200

    # 3. Mark as scanned
    ticket.scanned = True
    ticket.scanned_at = datetime.utcnow()
    ticket.scanned_by = staff_id
    db.session.commit()

    return jsonify({
        "valid": True,
        "ticket_id": ticket.id,
        "seat_label": ticket.seat.label if ticket.seat else None,
        "holder_name": booking.user.full_name if booking.user else None,
        "event_title": booking.event.title if booking.event else None,
    })
