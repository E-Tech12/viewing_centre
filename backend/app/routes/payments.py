import os
import hmac as hmac_lib
import hashlib
import json
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app import db
from backend.app.models import Booking, Ticket, Seat, SeatHold, EventSection, User

payments_bp = Blueprint("payments", __name__)

PAYSTACK_SECRET = os.getenv("PAYSTACK_SECRET_KEY", "").strip()

# ── Pure DB helpers — no Redis needed ─────────────────────────────────────────

def verify_seat_held_by_user(seat_id, event_id, user_id):
    """Check DB only — works without Redis."""
    hold = SeatHold.query.filter(
        SeatHold.seat_id == seat_id,
        SeatHold.event_id == event_id,
        SeatHold.user_id == user_id,
        SeatHold.expires_at > datetime.utcnow(),
    ).first()
    return hold is not None


def calculate_total(seat_ids, event_id):
    total = 0
    for seat_id in seat_ids:
        seat = Seat.query.get(seat_id)
        if not seat:
            continue
        es = EventSection.query.filter_by(
            event_id=event_id, section_id=seat.section_id
        ).first()
        total += float(es.price) if es else 0
    return total


def cleanup_holds(seat_ids, event_id):
    """Remove DB holds after payment confirmed."""
    for seat_id in seat_ids:
        SeatHold.query.filter_by(
            seat_id=seat_id, event_id=event_id
        ).delete()
    db.session.flush()

    # Try Redis cleanup silently — doesn't matter if it fails
    try:
        from app.services.redis_service import redis_client
        for seat_id in seat_ids:
            redis_client.delete(f"seat_hold:{event_id}:{seat_id}")
    except Exception:
        pass


# ── Routes ────────────────────────────────────────────────────────────────────

@payments_bp.post("/initialize")
@jwt_required()
def initialize_payment():
    import requests as req

    user_id  = get_jwt_identity()
    data     = request.get_json()
    event_id = data.get("event_id")
    seat_ids = data.get("seat_ids", [])

    # Validate inputs
    if not event_id or not seat_ids:
        return jsonify({"error": "event_id and seat_ids required"}), 400

    # Validate Paystack key
    if not PAYSTACK_SECRET or PAYSTACK_SECRET.startswith("sk_test_your"):
        return jsonify({
            "error": "Paystack secret key is not configured. Add PAYSTACK_SECRET_KEY to your .env file."
        }), 500

    # Verify seats are held by this user in DB
    # If hold has expired we still allow payment — user already selected the seat
    # Just verify the seat isn't booked by someone else
    for seat_id in seat_ids:
        already_booked = (
            Ticket.query.join(Booking)
            .filter(
                Ticket.seat_id == seat_id,
                Booking.event_id == event_id,
                Booking.status == "confirmed",
            ).first()
        )
        if already_booked:
            return jsonify({
                "error": "One or more seats have already been booked. Please go back and reselect."
            }), 409

    # Calculate total
    total_ngn  = calculate_total(seat_ids, event_id)
    total_kobo = int(total_ngn * 100)

    if total_kobo == 0:
        return jsonify({"error": "Could not calculate ticket price. Check event section pricing."}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Create pending booking
    booking = Booking(
        user_id=user_id,
        event_id=event_id,
        status="pending",
        amount_paid=total_ngn,
    )
    db.session.add(booking)
    db.session.flush()

    reference = f"SZ-{booking.id[:8].upper()}"
    booking.payment_ref = reference

    # Call Paystack
    payload = {
        "email":        user.email,
        "amount":       total_kobo,
        "reference":    reference,
        "callback_url": f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/booking/verify",
        "metadata": {
            "booking_id": booking.id,
            "event_id":   event_id,
            "seat_ids":   seat_ids,
            "user_id":    user_id,
        },
    }

    try:
        resp = req.post(
            "https://api.paystack.co/transaction/initialize",
            json=payload,
            headers={
                "Authorization": f"Bearer {PAYSTACK_SECRET}",
                "Content-Type": "application/json",
            },
            timeout=15,
        )
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Could not reach Paystack: {str(e)}"}), 502

    if not resp.ok:
        db.session.rollback()
        try:
            err_msg = resp.json().get("message", "Unknown error")
        except Exception:
            err_msg = resp.text
        return jsonify({"error": f"Paystack: {err_msg}"}), 502

    ps_data = resp.json().get("data", {})
    if not ps_data.get("authorization_url"):
        db.session.rollback()
        return jsonify({"error": "Paystack did not return a payment URL"}), 502

    db.session.commit()

    return jsonify({
        "booking_id":        booking.id,
        "authorization_url": ps_data["authorization_url"],
        "reference":         reference,
    })


@payments_bp.post("/webhook")
def webhook():
    """Paystack webhook — confirms payment and issues tickets."""
    sig      = request.headers.get("X-Paystack-Signature", "")
    body     = request.get_data()
    expected = hmac_lib.new(
        PAYSTACK_SECRET.encode(), body, hashlib.sha512
    ).hexdigest()

    if not hmac_lib.compare_digest(sig, expected):
        return jsonify({"error": "Invalid signature"}), 400

    event = json.loads(body)
    if event.get("event") != "charge.success":
        return jsonify({"status": "ignored"}), 200

    ref     = event["data"]["reference"]
    booking = Booking.query.filter_by(payment_ref=ref).first()
    if not booking or booking.status == "confirmed":
        return jsonify({"status": "ok"}), 200

    _confirm_booking(booking, event["data"])
    return jsonify({"status": "ok"}), 200


@payments_bp.get("/verify/<reference>")
@jwt_required()
def verify_payment(reference):
    """
    Called by frontend after Paystack redirect.
    Also auto-confirms if webhook was missed.
    """
    import requests as req

    try:
        resp = req.get(
            f"https://api.paystack.co/transaction/verify/{reference}",
            headers={"Authorization": f"Bearer {PAYSTACK_SECRET}"},
            timeout=15,
        )
    except Exception as e:
        return jsonify({"error": f"Could not reach Paystack: {str(e)}"}), 502

    if not resp.ok:
        return jsonify({"error": "Verification failed"}), 502

    ps_data = resp.json()["data"]
    booking = Booking.query.filter_by(payment_ref=reference).first()

    # Auto-confirm if webhook was missed
    if ps_data["status"] == "success" and booking and booking.status == "pending":
        _confirm_booking(booking, ps_data)

    return jsonify({
        "status":  ps_data["status"],
        "booking": booking.to_dict(include_tickets=True) if booking else None,
    })


def _confirm_booking(booking, ps_data):
    """Shared logic: confirm booking, generate tickets, clean up holds."""
    from app.services.ticket_service import generate_ticket

    metadata = ps_data.get("metadata", {})
    seat_ids = metadata.get("seat_ids", [])
    event_id = metadata.get("event_id") or booking.event_id

    booking.status      = "confirmed"
    booking.amount_paid = ps_data.get("amount", 0) / 100

    for seat_id in seat_ids:
        # Don't double-generate tickets
        existing = Ticket.query.filter_by(
            booking_id=booking.id, seat_id=seat_id
        ).first()
        if not existing:
            ticket = generate_ticket(booking.id, seat_id, event_id, booking.user_id)
            db.session.add(ticket)

        # Decrement available count
        seat = Seat.query.get(seat_id)
        if seat:
            es = EventSection.query.filter_by(
                event_id=event_id, section_id=seat.section_id
            ).first()
            if es and es.available_count > 0:
                es.available_count -= 1

    cleanup_holds(seat_ids, event_id)
    db.session.commit()
