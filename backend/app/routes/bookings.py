"""
Bookings — category-based, with idempotency, atomic transactions,
DB-level locking, 5% platform fee, delivery email, food pre-order total.
"""
import os
import hmac as hmac_lib
import hashlib
from decimal import Decimal
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy import select
from app import db
from app.models.models import (
    Booking, Ticket, TicketCategory, Event, Tenant,
    SeatHold, PlatformTransaction, User, FoodOrder, FoodOrderItem, MenuItem
)
from app.services.ticket_service import generate_ticket
from app.services.email_service import send_ticket_email

bookings_bp = Blueprint("bookings", __name__)

PAYSTACK_SECRET = os.getenv("PAYSTACK_SECRET_KEY", "").strip()
HOLD_SECONDS    = 600


# ── Initialize payment ────────────────────────────────────────────
@bookings_bp.post("/initialize")
@jwt_required()
def initialize():
    import requests as req
    user_id = get_jwt_identity()
    data    = request.get_json() or {}

    event_id       = data.get("event_id")
    selections     = data.get("selections", [])   # [{category_id, quantity}]
    idem_key       = data.get("idempotency_key")
    delivery_email = data.get("delivery_email", "").strip()
    food_items     = data.get("food_items", [])   # [{menu_item_id, quantity}]

    if not event_id or not selections:
        return jsonify({"error": "event_id and selections required"}), 400

    if not PAYSTACK_SECRET or PAYSTACK_SECRET.startswith("sk_test_your"):
        return jsonify({"error": "Paystack not configured — add PAYSTACK_SECRET_KEY to .env"}), 500

    # Idempotency check
    if idem_key:
        existing = Booking.query.filter_by(idempotency_key=idem_key).first()
        if existing and existing.status == "confirmed":
            return jsonify({"booking_id": existing.id, "already_confirmed": True})
        if existing and existing.status == "pending" and existing.payment_ref:
            return jsonify({
                "booking_id": existing.id,
                "reference":  existing.payment_ref,
                "already_pending": True,
            })

    event  = Event.query.get_or_404(event_id)
    tenant = event.tenant

    # ── Lock & validate ticket categories ────────────────────────
    total_tickets = Decimal("0")
    validated     = []

    for sel in selections:
        cat_id = sel.get("category_id")
        qty    = int(sel.get("quantity", 1))
        if qty < 1:
            continue

        cat = db.session.execute(
            select(TicketCategory)
            .where(TicketCategory.id == cat_id)
            .where(TicketCategory.event_id == event_id)
            .with_for_update()
        ).scalar_one_or_none()

        if not cat:
            return jsonify({"error": f"Ticket category not found: {cat_id}"}), 404
        if cat.available < qty:
            return jsonify({"error": f"Only {cat.available} tickets left in '{cat.name}'"}), 409

        total_tickets += Decimal(str(cat.price)) * qty
        validated.append({"cat": cat, "qty": qty})

    if total_tickets == 0:
        return jsonify({"error": "Total is zero — check your selections"}), 400

    # ── Validate food items (optional) ───────────────────────────
    food_total = Decimal("0")
    valid_food = []
    for fi in food_items:
        menu_item = MenuItem.query.filter_by(
            id=fi.get("menu_item_id"), tenant_id=tenant.id, is_available=True
        ).first()
        if menu_item:
            qty = int(fi.get("quantity", 1))
            food_total += menu_item.price * qty
            valid_food.append({"item": menu_item, "qty": qty})

    grand_total = total_tickets + food_total

    # ── Platform fee calculation ──────────────────────────────────
    fee_pct    = tenant.platform_fee_pct or Decimal("5.00")
    # Fee only on ticket portion, not food
    fee_amount = (total_tickets * fee_pct / 100).quantize(Decimal("0.01"))
    net_amount = total_tickets - fee_amount
    total_kobo = int(grand_total * 100)

    user = User.query.get(user_id)

    # ── Create pending booking ────────────────────────────────────
    booking = Booking(
        user_id=user_id,
        event_id=event_id,
        tenant_id=tenant.id,
        status="pending",
        amount_paid=grand_total,
        platform_fee=fee_amount,
        net_to_owner=net_amount,
        food_order_total=food_total,
        delivery_email=delivery_email or None,
        idempotency_key=idem_key,
    )
    db.session.add(booking)
    db.session.flush()

    reference      = f"SZ-{booking.id[:8].upper()}"
    booking.payment_ref = reference

    # ── Call Paystack ─────────────────────────────────────────────
    payload = {
        "email":       delivery_email or user.email,
        "amount":      total_kobo,
        "reference":   reference,
        "callback_url":f"{os.getenv('FRONTEND_URL','http://localhost:5173')}/booking/verify",
        "metadata": {
            "booking_id":    booking.id,
            "event_id":      event_id,
            "tenant_id":     tenant.id,
            "selections":    [{"category_id": v["cat"].id, "quantity": v["qty"]} for v in validated],
            "food_items":    [{"menu_item_id": f["item"].id, "quantity": f["qty"]} for f in valid_food],
            "delivery_email":delivery_email,
            "user_id":       user_id,
        },
    }

    try:
        resp = req.post(
            "https://api.paystack.co/transaction/initialize",
            json=payload,
            headers={
                "Authorization": f"Bearer {PAYSTACK_SECRET}",
                "Content-Type":  "application/json",
            },
            timeout=15,
        )
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Could not reach Paystack: {str(e)}"}), 502

    if not resp.ok:
        db.session.rollback()
        try:
            err_msg = resp.json().get("message", "Unknown Paystack error")
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


# ── Paystack webhook ──────────────────────────────────────────────
@bookings_bp.post("/webhook/paystack")
def paystack_webhook():
    sig      = request.headers.get("X-Paystack-Signature", "")
    body     = request.get_data()
    expected = hmac_lib.new(PAYSTACK_SECRET.encode(), body, hashlib.sha512).hexdigest()

    if not hmac_lib.compare_digest(sig, expected):
        return jsonify({"error": "Invalid signature"}), 400

    import json
    event = json.loads(body)
    if event.get("event") != "charge.success":
        return jsonify({"status": "ignored"}), 200

    ref     = event["data"]["reference"]
    booking = Booking.query.filter_by(payment_ref=ref).first()
    if not booking or booking.status == "confirmed":
        return jsonify({"status": "ok"}), 200

    _confirm_booking(booking, event["data"])
    return jsonify({"status": "ok"}), 200


# ── Verify after redirect ─────────────────────────────────────────
@bookings_bp.get("/verify/<reference>")
@jwt_required()
def verify(reference):
    import requests as req
    try:
        resp = req.get(
            f"https://api.paystack.co/transaction/verify/{reference}",
            headers={"Authorization": f"Bearer {PAYSTACK_SECRET}"},
            timeout=15,
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 502

    if not resp.ok:
        return jsonify({"error": "Verification failed"}), 502

    ps_data = resp.json()["data"]
    booking = Booking.query.filter_by(payment_ref=reference).first()

    if ps_data["status"] == "success" and booking and booking.status == "pending":
        _confirm_booking(booking, ps_data)

    return jsonify({
        "status":  ps_data["status"],
        "booking": booking.to_dict(include_tickets=True) if booking else None,
    })


# ── User: booking history ─────────────────────────────────────────
@bookings_bp.get("/mine")
@jwt_required()
def my_bookings():
    user_id  = get_jwt_identity()
    bookings = Booking.query.filter_by(
        user_id=user_id, status="confirmed"
    ).order_by(Booking.booked_at.desc()).all()
    return jsonify([b.to_dict(include_tickets=True) for b in bookings])


# ── Owner: bookings ───────────────────────────────────────────────
@bookings_bp.get("/owner/bookings")
@jwt_required()
def owner_bookings():
    user_id  = get_jwt_identity()
    tenant   = Tenant.query.filter_by(owner_id=user_id).first_or_404()
    event_id = request.args.get("event_id")
    q = Booking.query.filter_by(tenant_id=tenant.id, status="confirmed")
    if event_id:
        q = q.filter_by(event_id=event_id)
    return jsonify([b.to_dict() for b in q.order_by(Booking.booked_at.desc()).all()])


# ── Owner: analytics ─────────────────────────────────────────────
@bookings_bp.get("/owner/analytics")
@jwt_required()
def owner_analytics():
    from sqlalchemy import func
    user_id = get_jwt_identity()
    tenant  = Tenant.query.filter_by(owner_id=user_id).first_or_404()

    total_revenue  = db.session.query(func.sum(Booking.amount_paid)).filter_by(tenant_id=tenant.id, status="confirmed").scalar() or 0
    total_fees     = db.session.query(func.sum(Booking.platform_fee)).filter_by(tenant_id=tenant.id, status="confirmed").scalar() or 0
    total_food     = db.session.query(func.sum(Booking.food_order_total)).filter_by(tenant_id=tenant.id, status="confirmed").scalar() or 0
    total_bookings = Booking.query.filter_by(tenant_id=tenant.id, status="confirmed").count()
    total_tickets  = db.session.query(func.count(Ticket.id)).join(Booking).filter(Booking.tenant_id == tenant.id, Booking.status == "confirmed").scalar() or 0
    tickets_used   = db.session.query(func.count(Ticket.id)).join(Booking).filter(Booking.tenant_id == tenant.id, Booking.status == "confirmed", Ticket.status == "used").scalar() or 0

    by_event = db.session.query(
        Event.title, Event.starts_at,
        func.count(Booking.id).label("bookings"),
        func.sum(Booking.amount_paid).label("revenue"),
    ).join(Booking, Booking.event_id == Event.id).filter(
        Booking.tenant_id == tenant.id, Booking.status == "confirmed"
    ).group_by(Event.id, Event.title, Event.starts_at).order_by(
        func.sum(Booking.amount_paid).desc()
    ).limit(10).all()

    return jsonify({
        "total_revenue":    float(total_revenue),
        "total_fees_paid":  float(total_fees),
        "net_revenue":      float(total_revenue) - float(total_fees),
        "food_revenue":     float(total_food),
        "total_bookings":   total_bookings,
        "total_tickets":    total_tickets,
        "tickets_used":     tickets_used,
        "check_in_rate":    round(tickets_used / total_tickets * 100, 1) if total_tickets else 0,
        "top_events": [{
            "title":    r[0],
            "starts_at":r[1].isoformat(),
            "bookings": r[2],
            "revenue":  float(r[3] or 0),
        } for r in by_event],
    })


# ── Ticket scanning ───────────────────────────────────────────────
@bookings_bp.post("/scan")
@jwt_required()
def scan_ticket():
    claims  = get_jwt()
    user_id = get_jwt_identity()
    role    = claims.get("role")

    if role not in ("event_owner", "platform_admin"):
        return jsonify({"error": "Event owner access required"}), 403

    from app.services.ticket_service import validate_ticket
    qr_data = (request.get_json() or {}).get("qr_data")
    if not qr_data:
        return jsonify({"error": "qr_data required"}), 400

    result = validate_ticket(qr_data)
    if not result["valid"]:
        return jsonify({"valid": False, "reason": result["reason"]}), 200

    ticket = Ticket.query.get(result["ticket_id"])
    if not ticket:
        return jsonify({"valid": False, "reason": "Ticket not found"}), 200

    if role == "event_owner":
        tenant = Tenant.query.filter_by(owner_id=user_id).first()
        if not tenant or ticket.booking.event.tenant_id != tenant.id:
            return jsonify({"valid": False, "reason": "Ticket not for your event"}), 200

    if ticket.status == "used":
        return jsonify({
            "valid":      False,
            "reason":     "Ticket already used",
            "scanned_at": ticket.scanned_at.isoformat(),
        }), 200

    ticket.status     = "used"
    ticket.scanned_at = datetime.utcnow()
    ticket.scanned_by = user_id
    db.session.commit()

    return jsonify({
        "valid":       True,
        "ticket_id":   ticket.id,
        "category":    ticket.category.name if ticket.category else None,
        "holder_name": ticket.booking.user.full_name if ticket.booking.user else None,
        "event_title": ticket.booking.event.display_title() if ticket.booking.event else None,
    })


# ── Platform admin analytics ──────────────────────────────────────
@bookings_bp.get("/admin/analytics")
@jwt_required()
def platform_analytics():
    from sqlalchemy import func
    claims = get_jwt()
    if claims.get("role") != "platform_admin":
        return jsonify({"error": "Platform admin only"}), 403

    total_revenue  = db.session.query(func.sum(Booking.amount_paid)).filter_by(status="confirmed").scalar() or 0
    total_fees     = db.session.query(func.sum(Booking.platform_fee)).filter_by(status="confirmed").scalar() or 0
    total_bookings = Booking.query.filter_by(status="confirmed").count()
    total_tenants  = Tenant.query.filter_by(status="active").count()
    total_events   = Event.query.count()

    return jsonify({
        "total_platform_revenue": float(total_fees),
        "total_gmv":              float(total_revenue),
        "total_bookings":         total_bookings,
        "active_tenants":         total_tenants,
        "total_events":           total_events,
    })


# ── Shared confirm logic ──────────────────────────────────────────
def _confirm_booking(booking, ps_data):
    metadata    = ps_data.get("metadata", {})
    selections  = metadata.get("selections", [])
    food_items  = metadata.get("food_items", [])
    del_email   = metadata.get("delivery_email", "")

    booking.status         = "confirmed"
    booking.amount_paid    = Decimal(str(ps_data.get("amount", 0))) / 100
    booking.delivery_email = del_email or None

    fee_pct    = booking.tenant.platform_fee_pct or Decimal("5.00")
    food_total = booking.food_order_total or Decimal("0")
    ticket_amt = booking.amount_paid - food_total
    fee_amount = (ticket_amt * fee_pct / 100).quantize(Decimal("0.01"))
    net_amount = ticket_amt - fee_amount

    booking.platform_fee = fee_amount
    booking.net_to_owner = net_amount

    # Generate tickets
    all_tickets = []
    for sel in selections:
        cat_id = sel["category_id"]
        qty    = int(sel["quantity"])
        cat    = TicketCategory.query.get(cat_id)

        for _ in range(qty):
            ticket = generate_ticket(
                booking_id=booking.id,
                category_id=cat_id,
                event_id=booking.event_id,
                user_id=booking.user_id,
            )
            db.session.add(ticket)
            all_tickets.append(ticket)

        if cat and cat.available >= qty:
            cat.available -= qty

    # Create food order if items present
    if food_items:
        fo = FoodOrder(
            booking_id=booking.id,
            tenant_id=booking.tenant_id,
        )
        db.session.add(fo)
        db.session.flush()
        food_total_calc = Decimal("0")
        for fi in food_items:
            menu_item = MenuItem.query.get(fi["menu_item_id"])
            if menu_item:
                qty = int(fi["quantity"])
                foi = FoodOrderItem(
                    order_id=fo.id,
                    menu_item_id=menu_item.id,
                    quantity=qty,
                    unit_price=menu_item.price,
                )
                db.session.add(foi)
                food_total_calc += menu_item.price * qty
        fo.total = food_total_calc

    # Platform transaction record
    txn = PlatformTransaction(
        booking_id=booking.id,
        tenant_id=booking.tenant_id,
        gross_amount=booking.amount_paid,
        fee_pct=fee_pct,
        fee_amount=fee_amount,
        net_amount=net_amount,
    )
    db.session.add(txn)

    # Update tenant totals
    booking.tenant.total_revenue = (booking.tenant.total_revenue or 0) + booking.amount_paid
    booking.tenant.total_fees    = (booking.tenant.total_fees or 0) + fee_amount

    db.session.commit()

    # Send ticket email (non-fatal if it fails)
    try:
        send_ticket_email(booking, all_tickets)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Email send failed: {e}")
