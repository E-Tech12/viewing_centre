from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
)

from werkzeug.security import generate_password_hash, check_password_hash

from app import db
from app.models import User

auth_bp = Blueprint("auth", __name__)


# -------------------------
# Password Helpers
# -------------------------
def hash_password(password: str) -> str:
    return generate_password_hash(password)


def check_password(password: str, hashed: str) -> bool:
    return check_password_hash(hashed, password)


# -------------------------
# REGISTER
# -------------------------
@auth_bp.post("/register")
def register():
    data = request.get_json()

    required = ["email", "password", "full_name"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    if User.query.filter_by(email=data["email"].lower()).first():
        return jsonify({"error": "Email already registered"}), 409

    user = User(
        email=data["email"].lower(),
        password_hash=hash_password(data["password"]),
        full_name=data["full_name"],
        phone=data.get("phone"),
        role="user",
    )

    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=user.id, additional_claims={"role": user.role})
    refresh_token = create_refresh_token(identity=user.id)

    return jsonify({
        "user": user.to_dict(),
        "access_token": access_token,
        "refresh_token": refresh_token,
    }), 201


# -------------------------
# LOGIN
# -------------------------
@auth_bp.post("/login")
def login():
    data = request.get_json()

    user = User.query.filter_by(email=data.get("email", "").lower()).first()

    if not user or not check_password(data.get("password", ""), user.password_hash):
        return jsonify({"error": "Invalid credentials"}), 401

    access_token = create_access_token(identity=user.id, additional_claims={"role": user.role})
    refresh_token = create_refresh_token(identity=user.id)

    return jsonify({
        "user": user.to_dict(),
        "access_token": access_token,
        "refresh_token": refresh_token,
    })


# -------------------------
# REFRESH TOKEN
# -------------------------
@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    access_token = create_access_token(identity=user.id, additional_claims={"role": user.role})

    return jsonify({"access_token": access_token})


# -------------------------
# GET CURRENT USER
# -------------------------
@auth_bp.get("/me")
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)

    return jsonify(user.to_dict())


# -------------------------
# UPDATE USER
# -------------------------
@auth_bp.patch("/me")
@jwt_required()
def update_me():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)

    data = request.get_json()

    if "full_name" in data:
        user.full_name = data["full_name"]

    if "phone" in data:
        user.phone = data["phone"]

    if "password" in data and data.get("current_password"):
        if not check_password(data["current_password"], user.password_hash):
            return jsonify({"error": "Current password incorrect"}), 400

        user.password_hash = hash_password(data["password"])

    db.session.commit()

    return jsonify(user.to_dict())