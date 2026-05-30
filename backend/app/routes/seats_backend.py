from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app import db
from backend.app.models import Seat, Event, SeatHold, Ticket, Booking, EventSection

seats_bp = Blueprint("seats", __name__)

# Try Redis — fall back gracefully if not running
try:
    from app.services.redis_service import redis_client, HOLD_TTL
    redis_client.ping()
    REDIS_OK = True
except Exception:
    REDIS_OK = False
    HOLD_TTL = 600


def get_seat_state(seat_id, event_id, current_user_id=None):
    """Returns: available | held | held_by_me | booked"""
    # 1. Redis hold (if available)
    if REDIS_OK:
        try:
            hold_key = f"seat_hold:{event_id}:{seat_id}"
            holder = redis_client.get(hold_key)
            if holder:
                holder_id = holder.decode()
                return "held_by_me" if holder_id == current_user_id else "held"
        except Exception:
            pass

    # 2. DB hold fallback (for when Redis is not available)
    db_hold = SeatHold.query.filter_by(
        seat_id=seat_id, event_id=event_id
    ).order_by(SeatHold.expires_at.desc()).first()

    if db_hold and db_hold.expires_at > datetime.utcnow():
        return "held_by_me" if db_hold.user_id == current_user_id else "held"

    # 3. Confirmed booking
    booked = (
        Ticket.query.join(Booking)
        .filter(
            Ticket.seat_id == seat_id,
            Booking.event_id == event_id,
            Booking.status == "confirmed",
        ).first()
    )
    return "booked" if booked else "available"


@seats_bp.get("/event/<event_id>")
@jwt_required(optional=True)
def event_seat_map(event_id):
    user_id = get_jwt_identity()
    event = Event.query.get_or_404(event_id)

    sections_data = []
    for es in event.event_sections:
        section = es.section
        seats = section.seats.order_by(Seat.row_label, Seat.seat_number).all()
        seats_out = []
        for seat in seats:
            state = get_seat_state(seat.id, event_id, user_id)
            d = seat.to_dict()
            d["state"] = state
            d["price"] = float(es.price)
            seats_out.append(d)

        sections_data.append({
            **section.to_dict(),
            "price": float(es.price),
            "available_count": es.available_count,
            "sold_out": es.available_count == 0,
            "seats": seats_out,
        })

    return jsonify({"event_id": event_id, "sections": sections_data})


@seats_bp.post("/hold")
@jwt_required()
def hold_seats():
    user_id = get_jwt_identity()
    data = request.get_json()
    event_id = data.get("event_id")
    seat_ids = data.get("seat_ids", [])

    if not seat_ids or not event_id:
        return jsonify({"error": "event_id and seat_ids required"}), 400

    held = []
    failed = []

    for seat_id in seat_ids:
        # Check Redis first
        if REDIS_OK:
            try:
                hold_key = f"seat_hold:{event_id}:{seat_id}"
                existing = redis_client.get(hold_key)
                if existing and existing.decode() != user_id:
                    failed.append(seat_id)
                    continue
                redis_client.setex(hold_key, HOLD_TTL, user_id)
            except Exception:
                pass

        # Always write DB hold for reliability
        existing_db = SeatHold.query.filter_by(
            seat_id=seat_id, event_id=event_id, user_id=user_id
        ).first()

        if existing_db:
            existing_db.expires_at = datetime.utcnow() + timedelta(seconds=HOLD_TTL)
        else:
            # Check if another user has a valid hold in DB
            other_hold = SeatHold.query.filter(
                SeatHold.seat_id == seat_id,
                SeatHold.event_id == event_id,
                SeatHold.user_id != user_id,
                SeatHold.expires_at > datetime.utcnow(),
            ).first()
            if other_hold:
                failed.append(seat_id)
                continue

            db_hold = SeatHold(
                seat_id=seat_id,
                event_id=event_id,
                user_id=user_id,
                expires_at=datetime.utcnow() + timedelta(seconds=HOLD_TTL),
            )
            db.session.add(db_hold)

        held.append(seat_id)

    db.session.commit()

    if failed:
        return jsonify({
            "held": held,
            "failed": failed,
            "error": "Some seats are already taken",
        }), 207

    return jsonify({"held": held, "expires_in": HOLD_TTL})


@seats_bp.delete("/hold")
@jwt_required()
def release_hold():
    user_id = get_jwt_identity()
    data = request.get_json()
    event_id = data.get("event_id")
    seat_ids = data.get("seat_ids", [])

    for seat_id in seat_ids:
        if REDIS_OK:
            try:
                hold_key = f"seat_hold:{event_id}:{seat_id}"
                existing = redis_client.get(hold_key)
                if existing and existing.decode() == user_id:
                    redis_client.delete(hold_key)
            except Exception:
                pass

        SeatHold.query.filter_by(
            seat_id=seat_id, event_id=event_id, user_id=user_id
        ).delete()

    db.session.commit()
    return jsonify({"released": seat_ids})
