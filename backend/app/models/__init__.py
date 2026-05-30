import uuid
from datetime import datetime
from backend.app.app import db


def generate_uuid():
    return str(uuid.uuid4())


# ── Users ────────────────────────────────────────────────────────────────────
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20))
    role = db.Column(db.String(20), nullable=False, default="user")  # user | staff | admin
    loyalty_points = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    bookings = db.relationship("Booking", back_populates="user", lazy="dynamic")
    seat_holds = db.relationship("SeatHold", back_populates="user", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "phone": self.phone,
            "role": self.role,
            "loyalty_points": self.loyalty_points,
            "created_at": self.created_at.isoformat(),
        }


# ── Venues ───────────────────────────────────────────────────────────────────
class Venue(db.Model):
    __tablename__ = "venues"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(255), nullable=False)
    location = db.Column(db.String(500))
    address = db.Column(db.Text)
    total_capacity = db.Column(db.Integer, nullable=False)
    layout_config = db.Column(db.JSON, default=dict)  # SVG layout metadata
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    sections = db.relationship("Section", back_populates="venue", lazy="dynamic")
    events = db.relationship("Event", back_populates="venue", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "location": self.location,
            "address": self.address,
            "total_capacity": self.total_capacity,
            "layout_config": self.layout_config,
        }


# ── Sections ─────────────────────────────────────────────────────────────────
class Section(db.Model):
    __tablename__ = "sections"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    venue_id = db.Column(db.String(36), db.ForeignKey("venues.id"), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)  # VIP | Regular | Gaming
    capacity = db.Column(db.Integer, nullable=False)
    color_hex = db.Column(db.String(7), default="#3B82F6")  # for seat map rendering
    row_count = db.Column(db.Integer, nullable=False, default=1)
    seats_per_row = db.Column(db.Integer, nullable=False, default=10)

    venue = db.relationship("Venue", back_populates="sections")
    seats = db.relationship("Seat", back_populates="section", lazy="dynamic")
    event_sections = db.relationship("EventSection", back_populates="section", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "venue_id": self.venue_id,
            "name": self.name,
            "category": self.category,
            "capacity": self.capacity,
            "color_hex": self.color_hex,
            "row_count": self.row_count,
            "seats_per_row": self.seats_per_row,
        }


# ── Seats ─────────────────────────────────────────────────────────────────────
class Seat(db.Model):
    __tablename__ = "seats"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    section_id = db.Column(db.String(36), db.ForeignKey("sections.id"), nullable=False)
    row_label = db.Column(db.String(5), nullable=False)   # A, B, C ...
    seat_number = db.Column(db.Integer, nullable=False)
    pos_x = db.Column(db.Float, nullable=False, default=0)
    pos_y = db.Column(db.Float, nullable=False, default=0)
    is_accessible = db.Column(db.Boolean, default=False)

    section = db.relationship("Section", back_populates="seats")
    tickets = db.relationship("Ticket", back_populates="seat", lazy="dynamic")
    holds = db.relationship("SeatHold", back_populates="seat", lazy="dynamic")

    @property
    def label(self):
        return f"{self.row_label}{self.seat_number}"

    def to_dict(self):
        return {
            "id": self.id,
            "section_id": self.section_id,
            "row_label": self.row_label,
            "seat_number": self.seat_number,
            "label": self.label,
            "pos_x": self.pos_x,
            "pos_y": self.pos_y,
            "is_accessible": self.is_accessible,
        }


# ── Events ────────────────────────────────────────────────────────────────────
class Event(db.Model):
    __tablename__ = "events"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    venue_id = db.Column(db.String(36), db.ForeignKey("venues.id"), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    match_teams = db.Column(db.String(255))      # "Arsenal vs Chelsea"
    competition = db.Column(db.String(100))      # "Premier League"
    starts_at = db.Column(db.DateTime, nullable=False)
    doors_open_at = db.Column(db.DateTime)
    status = db.Column(db.String(20), default="upcoming")  # upcoming|live|ended|cancelled
    banner_url = db.Column(db.String(500))
    category = db.Column(db.String(50), default="football")  # football|gaming|entertainment
    is_featured = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.String(36), db.ForeignKey("users.id"))

    venue = db.relationship("Venue", back_populates="events")
    event_sections = db.relationship("EventSection", back_populates="event", lazy="dynamic", cascade="all, delete-orphan")
    bookings = db.relationship("Booking", back_populates="event", lazy="dynamic")
    holds = db.relationship("SeatHold", back_populates="event", lazy="dynamic")

    def to_dict(self, include_sections=False):
        data = {
            "id": self.id,
            "venue_id": self.venue_id,
            "venue_name": self.venue.name if self.venue else None,
            "title": self.title,
            "description": self.description,
            "match_teams": self.match_teams,
            "competition": self.competition,
            "starts_at": self.starts_at.isoformat(),
            "doors_open_at": self.doors_open_at.isoformat() if self.doors_open_at else None,
            "status": self.status,
            "banner_url": self.banner_url,
            "category": self.category,
            "is_featured": self.is_featured,
        }
        if include_sections:
            data["sections"] = [es.to_dict() for es in self.event_sections]
        return data


# ── Event Sections (pricing bridge) ──────────────────────────────────────────
class EventSection(db.Model):
    __tablename__ = "event_sections"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    event_id = db.Column(db.String(36), db.ForeignKey("events.id"), nullable=False)
    section_id = db.Column(db.String(36), db.ForeignKey("sections.id"), nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    available_count = db.Column(db.Integer, nullable=False)
    total_count = db.Column(db.Integer, nullable=False)

    event = db.relationship("Event", back_populates="event_sections")
    section = db.relationship("Section", back_populates="event_sections")

    def to_dict(self):
        return {
            "id": self.id,
            "event_id": self.event_id,
            "section_id": self.section_id,
            "section_name": self.section.name if self.section else None,
            "section_category": self.section.category if self.section else None,
            "price": float(self.price),
            "available_count": self.available_count,
            "total_count": self.total_count,
            "sold_out": self.available_count == 0,
        }


# ── Seat Holds (reservation locks) ───────────────────────────────────────────
class SeatHold(db.Model):
    __tablename__ = "seat_holds"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    seat_id = db.Column(db.String(36), db.ForeignKey("seats.id"), nullable=False)
    event_id = db.Column(db.String(36), db.ForeignKey("events.id"), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    seat = db.relationship("Seat", back_populates="holds")
    event = db.relationship("Event", back_populates="holds")
    user = db.relationship("User", back_populates="seat_holds")

    @property
    def is_expired(self):
        return datetime.utcnow() > self.expires_at

    def to_dict(self):
        return {
            "id": self.id,
            "seat_id": self.seat_id,
            "seat_label": self.seat.label if self.seat else None,
            "event_id": self.event_id,
            "user_id": self.user_id,
            "expires_at": self.expires_at.isoformat(),
        }


# ── Bookings ──────────────────────────────────────────────────────────────────
class Booking(db.Model):
    __tablename__ = "bookings"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    event_id = db.Column(db.String(36), db.ForeignKey("events.id"), nullable=False)
    status = db.Column(db.String(20), default="pending")  # pending|confirmed|cancelled|refunded
    amount_paid = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    payment_ref = db.Column(db.String(255), unique=True)
    payment_provider = db.Column(db.String(50), default="paystack")
    booked_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", back_populates="bookings")
    event = db.relationship("Event", back_populates="bookings")
    tickets = db.relationship("Ticket", back_populates="booking", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self, include_tickets=False):
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "event_id": self.event_id,
            "event_title": self.event.title if self.event else None,
            "event_starts_at": self.event.starts_at.isoformat() if self.event else None,
            "status": self.status,
            "amount_paid": float(self.amount_paid),
            "payment_ref": self.payment_ref,
            "booked_at": self.booked_at.isoformat(),
            "ticket_count": self.tickets.count(),
        }
        if include_tickets:
            data["tickets"] = [t.to_dict() for t in self.tickets]
        return data


# ── Tickets ───────────────────────────────────────────────────────────────────
class Ticket(db.Model):
    __tablename__ = "tickets"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    booking_id = db.Column(db.String(36), db.ForeignKey("bookings.id"), nullable=False)
    seat_id = db.Column(db.String(36), db.ForeignKey("seats.id"), nullable=False)
    qr_payload = db.Column(db.Text, nullable=False)   # base64 QR image
    hmac_sig = db.Column(db.String(255), nullable=False)  # HMAC-SHA256 signature
    scanned = db.Column(db.Boolean, default=False)
    scanned_at = db.Column(db.DateTime)
    scanned_by = db.Column(db.String(36), db.ForeignKey("users.id"))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    booking = db.relationship("Booking", back_populates="tickets")
    seat = db.relationship("Seat", back_populates="tickets")

    def to_dict(self):
        return {
            "id": self.id,
            "booking_id": self.booking_id,
            "seat_id": self.seat_id,
            "seat_label": self.seat.label if self.seat else None,
            "qr_payload": self.qr_payload,
            "scanned": self.scanned,
            "scanned_at": self.scanned_at.isoformat() if self.scanned_at else None,
        }
