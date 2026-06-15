"""
Tenant (Event Owner) routes.
- Public: register as event owner
- Owner: manage their own tenant profile & venues
- Platform Admin: approve/suspend tenants, view all
"""
import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models.models import User, Tenant, Venue, Event

tenants_bp = Blueprint("tenants", __name__)


def slugify(text):
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return re.sub(r"^-+|-+$", "", text)


def get_tenant_or_403(user_id):
    tenant = Tenant.query.filter_by(owner_id=user_id).first()
    if not tenant:
        return None, jsonify({"error": "No tenant found for this account"}), 403
    return tenant, None, None


# ── Register as event owner ───────────────────────────────────────
@tenants_bp.post("/register")
@jwt_required()
def register_tenant():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)

    if Tenant.query.filter_by(owner_id=user_id).first():
        return jsonify({"error": "You already have an event owner account"}), 409

    data = request.get_json()
    required = ["business_name", "city", "phone"]
    if missing := [f for f in required if not data.get(f)]:
        return jsonify({"error": f"Missing: {', '.join(missing)}"}), 400

    base_slug = slugify(data["business_name"])
    slug = base_slug
    counter = 1
    while Tenant.query.filter_by(slug=slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    tenant = Tenant(
        owner_id=user_id,
        business_name=data["business_name"],
        slug=slug,
        description=data.get("description"),
        address=data.get("address"),
        city=data["city"],
        state=data.get("state"),
        phone=data["phone"],
    )
    db.session.add(tenant)

    # Upgrade role
    user.role = "event_owner"
    db.session.commit()

    return jsonify({
        "message": "Event owner account created. Pending platform approval.",
        "tenant": tenant.to_dict(),
    }), 201


# ── Get own tenant profile ────────────────────────────────────────
@tenants_bp.get("/me")
@jwt_required()
def my_tenant():
    user_id = get_jwt_identity()
    tenant = Tenant.query.filter_by(owner_id=user_id).first()
    if not tenant:
        return jsonify({"error": "No tenant found"}), 404
    return jsonify(tenant.to_dict())


# ── Update own tenant profile ─────────────────────────────────────
@tenants_bp.patch("/me")
@jwt_required()
def update_tenant():
    user_id = get_jwt_identity()
    tenant = Tenant.query.filter_by(owner_id=user_id).first_or_404()

    data = request.get_json()
    for field in ["business_name", "description", "address", "city", "state", "phone", "logo_url"]:
        if field in data:
            setattr(tenant, field, data[field])
    db.session.commit()
    return jsonify(tenant.to_dict())


# ── Tenant venues CRUD ────────────────────────────────────────────
@tenants_bp.get("/me/venues")
@jwt_required()
def my_venues():
    user_id = get_jwt_identity()
    tenant = Tenant.query.filter_by(owner_id=user_id).first_or_404()
    return jsonify([v.to_dict() for v in tenant.venues])


@tenants_bp.post("/me/venues")
@jwt_required()
def create_venue():
    user_id = get_jwt_identity()
    tenant = Tenant.query.filter_by(owner_id=user_id).first_or_404()

    if tenant.status != "active":
        return jsonify({"error": "Your account must be approved before creating venues"}), 403

    data = request.get_json()
    venue = Venue(
        tenant_id=tenant.id,
        name=data["name"],
        address=data.get("address"),
        city=data.get("city"),
        state=data.get("state"),
        total_capacity=data.get("total_capacity", 0),
    )
    db.session.add(venue)
    db.session.commit()
    return jsonify(venue.to_dict()), 201


@tenants_bp.patch("/me/venues/<venue_id>")
@jwt_required()
def update_venue(venue_id):
    user_id = get_jwt_identity()
    tenant = Tenant.query.filter_by(owner_id=user_id).first_or_404()
    venue = Venue.query.filter_by(id=venue_id, tenant_id=tenant.id).first_or_404()
    data = request.get_json()
    for field in ["name", "address", "city", "state", "total_capacity"]:
        if field in data:
            setattr(venue, field, data[field])
    db.session.commit()
    return jsonify(venue.to_dict())


# ── Platform admin: list & approve tenants ────────────────────────
@tenants_bp.get("/")
@jwt_required()
def list_tenants():
    claims = get_jwt()
    if claims.get("role") != "platform_admin":
        return jsonify({"error": "Platform admin only"}), 403

    status = request.args.get("status")
    q = Tenant.query
    if status:
        q = q.filter_by(status=status)
    tenants = q.order_by(Tenant.created_at.desc()).all()
    return jsonify([t.to_dict() for t in tenants])


@tenants_bp.post("/<tenant_id>/approve")
@jwt_required()
def approve_tenant(tenant_id):
    claims = get_jwt()
    if claims.get("role") != "platform_admin":
        return jsonify({"error": "Platform admin only"}), 403

    from datetime import datetime
    admin_id = get_jwt_identity()
    tenant = Tenant.query.get_or_404(tenant_id)
    tenant.status = "active"
    tenant.approved_at = datetime.utcnow()
    tenant.approved_by = admin_id
    db.session.commit()
    return jsonify({"message": "Tenant approved", "tenant": tenant.to_dict()})


@tenants_bp.post("/<tenant_id>/suspend")
@jwt_required()
def suspend_tenant(tenant_id):
    claims = get_jwt()
    if claims.get("role") != "platform_admin":
        return jsonify({"error": "Platform admin only"}), 403

    tenant = Tenant.query.get_or_404(tenant_id)
    tenant.status = "suspended"
    db.session.commit()
    return jsonify({"message": "Tenant suspended"})