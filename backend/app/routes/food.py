"""
Food & drinks pre-order routes.
- Public: get menu for an event's tenant
- User: add food order to a booking
- Owner: manage menu items, view food orders, update status
"""
from decimal import Decimal
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models.models import MenuItem, FoodOrder, FoodOrderItem, Booking, Tenant, Event

food_bp = Blueprint("food", __name__)


# ── Public: get menu for an event ────────────────────────────────
@food_bp.get("/menu/event/<event_id>")
def event_menu(event_id):
    event = Event.query.get_or_404(event_id)
    items = MenuItem.query.filter_by(
        tenant_id=event.tenant_id, is_available=True
    ).order_by(MenuItem.category, MenuItem.sort_order).all()

    # Group by category
    grouped = {}
    for item in items:
        grouped.setdefault(item.category, []).append(item.to_dict())

    return jsonify({
        "event_id":  event_id,
        "tenant_id": event.tenant_id,
        "menu":      grouped,
        "has_menu":  len(items) > 0,
    })


# ── User: place food pre-order on a confirmed booking ─────────────
@food_bp.post("/order/<booking_id>")
@jwt_required()
def place_order(booking_id):
    user_id = get_jwt_identity()
    booking = Booking.query.get_or_404(booking_id)

    if booking.user_id != user_id:
        return jsonify({"error": "Forbidden"}), 403
    if booking.status != "confirmed":
        return jsonify({"error": "Can only add food order to a confirmed booking"}), 400

    # Check no duplicate order
    if booking.food_order:
        return jsonify({"error": "Food order already placed for this booking"}), 409

    data  = request.get_json() or {}
    items = data.get("items", [])  # [{menu_item_id, quantity}]
    notes = data.get("notes", "")

    if not items:
        return jsonify({"error": "No items provided"}), 400

    total = Decimal("0")
    order = FoodOrder(
        booking_id=booking_id,
        tenant_id=booking.tenant_id,
        notes=notes,
    )
    db.session.add(order)
    db.session.flush()

    for line in items:
        menu_item = MenuItem.query.filter_by(
            id=line["menu_item_id"], tenant_id=booking.tenant_id, is_available=True
        ).first()
        if not menu_item:
            db.session.rollback()
            return jsonify({"error": f"Menu item not found: {line['menu_item_id']}"}), 404

        qty = int(line.get("quantity", 1))
        if qty < 1:
            continue

        item = FoodOrderItem(
            order_id=order.id,
            menu_item_id=menu_item.id,
            quantity=qty,
            unit_price=menu_item.price,
        )
        db.session.add(item)
        total += menu_item.price * qty

    order.total = total
    booking.food_order_total = total
    db.session.commit()

    return jsonify(order.to_dict()), 201


# ── User: get their food order for a booking ──────────────────────
@food_bp.get("/order/<booking_id>")
@jwt_required()
def get_order(booking_id):
    user_id = get_jwt_identity()
    booking = Booking.query.get_or_404(booking_id)

    if booking.user_id != user_id:
        return jsonify({"error": "Forbidden"}), 403

    if not booking.food_order:
        return jsonify({"has_order": False})

    return jsonify({"has_order": True, **booking.food_order.to_dict()})


# ── Owner: manage menu ────────────────────────────────────────────
@food_bp.get("/owner/menu")
@jwt_required()
def owner_menu():
    user_id = get_jwt_identity()
    tenant  = Tenant.query.filter_by(owner_id=user_id).first_or_404()
    items   = MenuItem.query.filter_by(tenant_id=tenant.id).order_by(
        MenuItem.category, MenuItem.sort_order
    ).all()
    return jsonify([i.to_dict() for i in items])


@food_bp.post("/owner/menu")
@jwt_required()
def create_menu_item():
    user_id = get_jwt_identity()
    tenant  = Tenant.query.filter_by(owner_id=user_id).first_or_404()
    data    = request.get_json() or {}

    if not data.get("name") or not data.get("price"):
        return jsonify({"error": "name and price required"}), 400

    item = MenuItem(
        tenant_id=tenant.id,
        name=data["name"],
        description=data.get("description", ""),
        price=Decimal(str(data["price"])),
        category=data.get("category", "food"),
        emoji=data.get("emoji", "🍽️"),
        sort_order=data.get("sort_order", 0),
    )
    db.session.add(item)
    db.session.commit()
    return jsonify(item.to_dict()), 201


@food_bp.patch("/owner/menu/<item_id>")
@jwt_required()
def update_menu_item(item_id):
    user_id = get_jwt_identity()
    tenant  = Tenant.query.filter_by(owner_id=user_id).first_or_404()
    item    = MenuItem.query.filter_by(id=item_id, tenant_id=tenant.id).first_or_404()
    data    = request.get_json() or {}

    for field in ["name", "description", "category", "emoji", "sort_order", "is_available"]:
        if field in data:
            setattr(item, field, data[field])
    if "price" in data:
        item.price = Decimal(str(data["price"]))

    db.session.commit()
    return jsonify(item.to_dict())


@food_bp.delete("/owner/menu/<item_id>")
@jwt_required()
def delete_menu_item(item_id):
    user_id = get_jwt_identity()
    tenant  = Tenant.query.filter_by(owner_id=user_id).first_or_404()
    item    = MenuItem.query.filter_by(id=item_id, tenant_id=tenant.id).first_or_404()
    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Deleted"})


# ── Owner: view food orders for an event ─────────────────────────
@food_bp.get("/owner/orders")
@jwt_required()
def owner_orders():
    user_id  = get_jwt_identity()
    tenant   = Tenant.query.filter_by(owner_id=user_id).first_or_404()
    event_id = request.args.get("event_id")

    q = FoodOrder.query.filter_by(tenant_id=tenant.id)
    if event_id:
        q = q.join(Booking).filter(Booking.event_id == event_id)

    orders = q.order_by(FoodOrder.created_at.desc()).all()
    return jsonify([o.to_dict() for o in orders])


# ── Owner: update food order status ──────────────────────────────
@food_bp.patch("/owner/orders/<order_id>/status")
@jwt_required()
def update_order_status(order_id):
    user_id = get_jwt_identity()
    tenant  = Tenant.query.filter_by(owner_id=user_id).first_or_404()
    order   = FoodOrder.query.filter_by(id=order_id, tenant_id=tenant.id).first_or_404()
    data    = request.get_json() or {}
    status  = data.get("status")

    if status not in ("pending", "preparing", "ready", "delivered"):
        return jsonify({"error": "Invalid status"}), 400

    order.status = status
    db.session.commit()
    return jsonify(order.to_dict())
