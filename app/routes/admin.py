from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from sqlalchemy import func
from app import db
from app.models.models import User, Event, Booking, Ticket, Venue, Section

admin_bp = Blueprint("admin", __name__)


def require_admin():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin only"}), 403
    return None


@admin_bp.get("/stats")
@jwt_required()
def stats():
    err = require_admin()
    if err:
        return err

    total_users = User.query.count()
    total_events = Event.query.count()
    total_bookings = Booking.query.filter_by(status="confirmed").count()
    total_tickets = Ticket.query.count()
    tickets_scanned = Ticket.query.filter_by(scanned=True).count()

    revenue = db.session.query(
        func.sum(Booking.amount_paid)
    ).filter_by(status="confirmed").scalar() or 0

    # Revenue by event
    by_event = (
        db.session.query(
            Event.title,
            func.count(Booking.id).label("bookings"),
            func.sum(Booking.amount_paid).label("revenue"),
        )
        .join(Booking, Booking.event_id == Event.id)
        .filter(Booking.status == "confirmed")
        .group_by(Event.id, Event.title)
        .order_by(func.sum(Booking.amount_paid).desc())
        .limit(10)
        .all()
    )

    return jsonify({
        "total_users": total_users,
        "total_events": total_events,
        "total_bookings": total_bookings,
        "total_tickets": total_tickets,
        "tickets_scanned": tickets_scanned,
        "total_revenue": float(revenue),
        "top_events": [
            {"title": r[0], "bookings": r[1], "revenue": float(r[2] or 0)}
            for r in by_event
        ],
    })


@admin_bp.get("/users")
@jwt_required()
def list_users():
    err = require_admin()
    if err:
        return err

    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 20))
    search = request.args.get("search", "")

    q = User.query
    if search:
        q = q.filter(
            (User.email.ilike(f"%{search}%")) | (User.full_name.ilike(f"%{search}%"))
        )
    paginated = q.order_by(User.created_at.desc()).paginate(page=page, per_page=per_page)

    return jsonify({
        "users": [u.to_dict() for u in paginated.items],
        "total": paginated.total,
    })


@admin_bp.patch("/users/<user_id>/role")
@jwt_required()
def set_role(user_id):
    err = require_admin()
    if err:
        return err

    user = User.query.get_or_404(user_id)
    data = request.get_json()
    role = data.get("role")
    if role not in ("user", "staff", "admin"):
        return jsonify({"error": "Invalid role"}), 400

    user.role = role
    db.session.commit()
    return jsonify(user.to_dict())


@admin_bp.get("/attendance/<event_id>")
@jwt_required()
def attendance(event_id):
    claims = get_jwt()
    if claims.get("role") not in ("admin", "staff"):
        return jsonify({"error": "Staff access required"}), 403

    total = Ticket.query.join(Booking).filter(
        Booking.event_id == event_id, Booking.status == "confirmed"
    ).count()
    scanned = Ticket.query.join(Booking).filter(
        Booking.event_id == event_id, Booking.status == "confirmed", Ticket.scanned == True
    ).count()

    return jsonify({
        "event_id": event_id,
        "total_tickets": total,
        "checked_in": scanned,
        "remaining": total - scanned,
        "percentage": round(scanned / total * 100, 1) if total else 0,
    })


@admin_bp.get("/venues")
@jwt_required()
def list_venues():
    """All venues with their sections. Used by the admin event creation form."""
    venues = Venue.query.all()
    result = []
    for v in venues:
        d = v.to_dict()
        d["sections"] = [s.to_dict() for s in v.sections]
        result.append(d)
    return jsonify(result)
