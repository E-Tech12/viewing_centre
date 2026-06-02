"""
Events — multi-tenant, sport-agnostic.
Event owners manage their own events only.
Public can browse published events.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt, verify_jwt_in_request
from app import db
from app.models.models import Event, Tenant, Venue, SportCategory, TicketCategory

events_bp = Blueprint("events", __name__)


def get_owner_tenant(user_id):
    tenant = Tenant.query.filter_by(owner_id=user_id).first()
    if not tenant:
        return None, (jsonify({"error": "Event owner account not found"}), 403)
    if tenant.status != "active":
        return None, (jsonify({"error": "Your account is pending approval"}), 403)
    return tenant, None


# ── Public event discovery ────────────────────────────────────────
@events_bp.get("/")
def list_events():
    sport    = request.args.get("sport")
    city     = request.args.get("city")
    status   = request.args.get("status", "upcoming")
    featured = request.args.get("featured")
    tenant_slug = request.args.get("tenant")
    page     = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 12))

    q = Event.query.filter_by(is_public=True)

    if status:
        q = q.filter(Event.status.in_(status.split(",")))
    if sport:
        from app.models.models import SportCategory as SC
        sc = SC.query.filter_by(slug=sport).first()
        if sc:
            q = q.filter_by(sport_id=sc.id)
    if city:
        q = q.join(Venue).filter(Venue.city.ilike(f"%{city}%"))
    if featured:
        q = q.filter_by(is_featured=True)
    if tenant_slug:
        t = Tenant.query.filter_by(slug=tenant_slug).first()
        if t:
            q = q.filter_by(tenant_id=t.id)

    # Only show events from active tenants
    q = q.join(Tenant).filter(Tenant.status == "active")
    q = q.order_by(Event.starts_at.asc())

    paginated = q.paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        "events": [e.to_dict() for e in paginated.items],
        "total": paginated.total,
        "pages": paginated.pages,
        "page":  page,
    })


@events_bp.get("/<event_id>")
def get_event(event_id):
    event = Event.query.get_or_404(event_id)
    return jsonify(event.to_dict(include_categories=True))


# ── Event owner: manage own events ───────────────────────────────
@events_bp.get("/owner/mine")
@jwt_required()
def owner_events():
    user_id = get_jwt_identity()
    tenant, err = get_owner_tenant(user_id)
    if err: return err

    status = request.args.get("status")
    q = Event.query.filter_by(tenant_id=tenant.id)
    if status:
        q = q.filter_by(status=status)
    events = q.order_by(Event.starts_at.desc()).all()
    return jsonify([e.to_dict(include_categories=True) for e in events])


@events_bp.post("/owner/create")
@jwt_required()
def create_event():
    user_id = get_jwt_identity()
    tenant, err = get_owner_tenant(user_id)
    if err: return err

    data = request.get_json()
    required = ["title", "sport_id", "venue_id", "starts_at", "ticket_categories"]
    if missing := [f for f in required if not data.get(f)]:
        return jsonify({"error": f"Missing: {', '.join(missing)}"}), 400

    # Verify venue belongs to this tenant
    venue = Venue.query.filter_by(id=data["venue_id"], tenant_id=tenant.id).first()
    if not venue:
        return jsonify({"error": "Venue not found or does not belong to your account"}), 404

    from datetime import datetime
    event = Event(
        tenant_id=tenant.id,
        venue_id=data["venue_id"],
        sport_id=data["sport_id"],
        created_by=user_id,
        title=data["title"],
        description=data.get("description"),
        banner_url=data.get("banner_url"),
        starts_at=datetime.fromisoformat(data["starts_at"]),
        doors_open_at=datetime.fromisoformat(data["doors_open_at"]) if data.get("doors_open_at") else None,
        status=data.get("status", "upcoming"),
        sport_meta=data.get("sport_meta", {}),
        is_featured=data.get("is_featured", False),
        is_public=data.get("is_public", True),
    )
    db.session.add(event)
    db.session.flush()

    # Create ticket categories
    for i, cat in enumerate(data["ticket_categories"]):
        cap = int(cat["capacity"])
        tc = TicketCategory(
            event_id=event.id,
            name=cat["name"],
            description=cat.get("description", ""),
            price=cat["price"],
            capacity=cap,
            available=cap,
            color_hex=cat.get("color_hex", "#3B82F6"),
            sort_order=cat.get("sort_order", i),
        )
        db.session.add(tc)

    db.session.commit()
    return jsonify(event.to_dict(include_categories=True)), 201


@events_bp.patch("/owner/<event_id>")
@jwt_required()
def update_event(event_id):
    user_id = get_jwt_identity()
    tenant, err = get_owner_tenant(user_id)
    if err: return err

    event = Event.query.filter_by(id=event_id, tenant_id=tenant.id).first_or_404()
    data = request.get_json()
    from datetime import datetime

    for field in ["title", "description", "banner_url", "status", "sport_meta",
                  "is_featured", "is_public"]:
        if field in data:
            setattr(event, field, data[field])
    if "starts_at" in data:
        event.starts_at = datetime.fromisoformat(data["starts_at"])

    # Update ticket categories if provided
    if "ticket_categories" in data:
        # Remove old ones, add new
        TicketCategory.query.filter_by(event_id=event.id).delete()
        for i, cat in enumerate(data["ticket_categories"]):
            cap = int(cat["capacity"])
            tc = TicketCategory(
                event_id=event.id,
                name=cat["name"],
                description=cat.get("description", ""),
                price=cat["price"],
                capacity=cap,
                available=cap,
                color_hex=cat.get("color_hex", "#3B82F6"),
                sort_order=cat.get("sort_order", i),
            )
            db.session.add(tc)

    db.session.commit()
    return jsonify(event.to_dict(include_categories=True))


@events_bp.delete("/owner/<event_id>")
@jwt_required()
def delete_event(event_id):
    user_id = get_jwt_identity()
    tenant, err = get_owner_tenant(user_id)
    if err: return err

    event = Event.query.filter_by(id=event_id, tenant_id=tenant.id).first_or_404()
    db.session.delete(event)
    db.session.commit()
    return jsonify({"message": "Event deleted"})


# ── Platform admin: see all events ───────────────────────────────
@events_bp.get("/admin/all")
@jwt_required()
def admin_all_events():
    claims = get_jwt()
    if claims.get("role") != "platform_admin":
        return jsonify({"error": "Platform admin only"}), 403
    page = int(request.args.get("page", 1))
    events = Event.query.order_by(Event.created_at.desc()).paginate(page=page, per_page=20)
    return jsonify({
        "events": [e.to_dict() for e in events.items],
        "total": events.total,
    })
