import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity
)
from werkzeug.security import generate_password_hash, check_password_hash

from app import db
from app.models.models import User, Tenant


auth_bp = Blueprint("auth", __name__)


# ── Password helpers ──────────────────────────────────────────────
def hash_password(p: str) -> str:
    return generate_password_hash(p)


def check_password(p: str, hashed: str) -> bool:
    return check_password_hash(hashed, p)


def validate_password(p: str):
    errors = []
    if len(p) < 8:
        errors.append("At least 8 characters required")
    if not re.search(r"[A-Z]", p):
        errors.append("At least one uppercase letter required")
    if not re.search(r"[0-9]", p):
        errors.append("At least one number required")
    return errors


def make_tokens(user):
    access = create_access_token(
        identity=user.id,
        additional_claims={
            "role": user.role
        }
    )

    refresh = create_refresh_token(
        identity=user.id,
        additional_claims={
            "role": user.role
        }
    )

    return access, refresh


# ── Register ──────────────────────────────────────────────────────
@auth_bp.post("/register")
def register():
    data = request.get_json() or {}

    required = ["email", "password", "full_name"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    email = data["email"].lower().strip()

    if not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email):
        return jsonify({"error": "Invalid email address"}), 400

    pw_errors = validate_password(data["password"])
    if pw_errors:
        return jsonify({"error": pw_errors[0]}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email already exists"}), 409

    user = User(
        email=email,
        password_hash=hash_password(data["password"]),
        full_name=data["full_name"].strip(),
        phone=data.get("phone", "").strip() or None,
        role="user",
    )

    db.session.add(user)
    db.session.commit()

    access, refresh = make_tokens(user)

    return jsonify({
        "user": user.to_dict(),
        "access_token": access,
        "refresh_token": refresh,
    }), 201


# ── Login ─────────────────────────────────────────────────────────
@auth_bp.post("/login")
def login():
    data = request.get_json() or {}

    email = data.get("email", "").lower().strip()
    pw = data.get("password", "")

    if not email or not pw:
        return jsonify({"error": "Email and password required"}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not check_password(pw, user.password_hash):
        return jsonify({"error": "Invalid email or password"}), 401

    if not user.is_active:
        return jsonify({"error": "Your account has been suspended. Contact support."}), 403

    access, refresh = make_tokens(user)

    extra = {}
    if user.role == "event_owner":
        tenant = Tenant.query.filter_by(owner_id=user.id).first()
        if tenant:
            extra["tenant_status"] = tenant.status
            extra["tenant_slug"] = tenant.slug

    return jsonify({
        "user": {**user.to_dict(), **extra},
        "access_token": access,
        "refresh_token": refresh,
    })


# ── Refresh token ─────────────────────────────────────────────────
@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    if not user.is_active:
        return jsonify({"error": "Account suspended"}), 403

    access = create_access_token(identity=user.id)

    return jsonify({"access_token": access})


# ── Current user ──────────────────────────────────────────────────
@auth_bp.get("/me")
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)

    data = user.to_dict()

    if user.role == "event_owner":
        tenant = Tenant.query.filter_by(owner_id=user_id).first()
        if tenant:
            data["tenant_status"] = tenant.status
            data["tenant_slug"] = tenant.slug
            data["tenant_id"] = tenant.id
            data["business_name"] = tenant.business_name

    return jsonify(data)


# ── Update profile ────────────────────────────────────────────────
@auth_bp.patch("/me")
@jwt_required()
def update_me():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)

    data = request.get_json() or {}

    if "full_name" in data and data["full_name"].strip():
        user.full_name = data["full_name"].strip()

    if "phone" in data:
        user.phone = data["phone"].strip() or None

    if "password" in data:
        if not data.get("current_password"):
            return jsonify({"error": "current_password required"}), 400

        if not check_password(data["current_password"], user.password_hash):
            return jsonify({"error": "Current password is incorrect"}), 400

        pw_errors = validate_password(data["password"])
        if pw_errors:
            return jsonify({"error": pw_errors[0]}), 400

        user.password_hash = hash_password(data["password"])

    db.session.commit()

    return jsonify(user.to_dict())