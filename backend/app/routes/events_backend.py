from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from backend.app import db
from backend.app.models import Event, Venue, EventSection, Section

events_bp = Blueprint("events", __name__)


def admin_required():
    claims = get_jwt()
    if claims.get("role") not in ("admin", "staff"):
        return jsonify({"error": "Admin access required"}), 403
    return None


@events_bp.get("/")
def list_events():
    category = request.args.get("category")
    status = request.args.get("status", "upcoming")
    featured = request.args.get("featured")
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 12))

    q = Event.query
    if category:
        q = q.filter_by(category=category)
    if status:
        q = q.filter_by(status=status)
    if featured:
        q = q.filter_by(is_featured=True)

    q = q.order_by(Event.starts_at.asc())
    paginated = q.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "events": [e.to_dict() for e in paginated.items],
        "total": paginated.total,
        "pages": paginated.pages,
        "page": page,
    })



@events_bp.get("/<event_id>")
def get_event(event_id):
    event = Event.query.get_or_404(event_id)
    return jsonify(event.to_dict(include_sections=True))


@events_bp.post("/")
@jwt_required()
def create_event():
    err = admin_required()
    if err:
        return err

    data = request.get_json()
    from datetime import datetime

    event = Event(
        venue_id=data["venue_id"],
        title=data["title"],
        description=data.get("description"),
        match_teams=data.get("match_teams"),
        competition=data.get("competition"),
        starts_at=datetime.fromisoformat(data["starts_at"]),
        doors_open_at=datetime.fromisoformat(data["doors_open_at"]) if data.get("doors_open_at") else None,
        banner_url=data.get("banner_url"),
        category=data.get("category", "football"),
        is_featured=data.get("is_featured", False),
    )
    db.session.add(event)
    db.session.flush()

    for sec_data in data.get("sections", []):
        section = Section.query.get(sec_data["section_id"])
        if section:
            es = EventSection(
                event_id=event.id,
                section_id=sec_data["section_id"],
                price=sec_data["price"],
                available_count=section.capacity,
                total_count=section.capacity,
            )
            db.session.add(es)

    db.session.commit()
    return jsonify(event.to_dict(include_sections=True)), 201


@events_bp.patch("/<event_id>")
@jwt_required()
def update_event(event_id):
    err = admin_required()
    if err:
        return err

    event = Event.query.get_or_404(event_id)
    data = request.get_json()
    from datetime import datetime

    for field in ["title", "description", "match_teams", "competition", "banner_url", "category", "status", "is_featured"]:
        if field in data:
            setattr(event, field, data[field])
    if "starts_at" in data:
        event.starts_at = datetime.fromisoformat(data["starts_at"])

    if "sections" in data:
        EventSection.query.filter_by(event_id=event.id).delete()
        for sec_data in data["sections"]:
            section = Section.query.get(sec_data["section_id"])
            if section:
                es = EventSection(
                    event_id=event.id,
                    section_id=sec_data["section_id"],
                    price=sec_data["price"],
                    available_count=section.capacity,
                    total_count=section.capacity,
                )
                db.session.add(es)

    db.session.commit()
    return jsonify(event.to_dict(include_sections=True))


@events_bp.delete("/<event_id>")
@jwt_required()
def delete_event(event_id):
    err = admin_required()
    if err:
        return err

    event = Event.query.get_or_404(event_id)
    db.session.delete(event)
    db.session.commit()
    return jsonify({"message": "Event deleted"})
