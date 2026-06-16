import uuid
from datetime import datetime
from decimal import Decimal
from app import db


def generate_uuid():
    return str(uuid.uuid4())


# ─────────────────────────────────────────────────────────────────────────────
# USERS
# role: "user" | "event_owner" | "platform_admin"
# ─────────────────────────────────────────────────────────────────────────────
class User(db.Model):
    __tablename__ = "users"

    id            = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    email         = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name     = db.Column(db.String(255), nullable=False)
    phone         = db.Column(db.String(20))
    role          = db.Column(db.String(20), nullable=False, default="user")
    loyalty_points= db.Column(db.Integer, default=0)
    is_active     = db.Column(db.Boolean, default=True)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at    = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    bookings   = db.relationship("Booking",   back_populates="user",         lazy="dynamic")
    seat_holds = db.relationship("SeatHold",  back_populates="user",         lazy="dynamic")
    tenant     = db.relationship("Tenant",    back_populates="owner",        uselist=False)

    def to_dict(self):
        return {
            "id":             self.id,
            "email":          self.email,
            "full_name":      self.full_name,
            "phone":          self.phone,
            "role":           self.role,
            "loyalty_points": self.loyalty_points,
            "is_active":      self.is_active,
            "created_at":     self.created_at.isoformat(),
        }


# ─────────────────────────────────────────────────────────────────────────────
# TENANTS  (one per event_owner — the SaaS isolation layer)
# ─────────────────────────────────────────────────────────────────────────────
class Tenant(db.Model):
    __tablename__ = "tenants"

    id           = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    owner_id     = db.Column(db.String(36), db.ForeignKey("users.id"), unique=True, nullable=False)
    business_name= db.Column(db.String(255), nullable=False)
    slug         = db.Column(db.String(100), unique=True, nullable=False, index=True)
    description  = db.Column(db.Text)
    logo_url     = db.Column(db.String(500))
    address      = db.Column(db.Text)
    city         = db.Column(db.String(100))
    state        = db.Column(db.String(100))
    country      = db.Column(db.String(100), default="Nigeria")
    phone        = db.Column(db.String(20))
    # SaaS financial
    platform_fee_pct  = db.Column(db.Numeric(5, 2), default=Decimal("5.00"))  # 5%
    paystack_subaccount = db.Column(db.String(100))   # for split payments in future
    total_revenue= db.Column(db.Numeric(12, 2), default=0)
    total_fees   = db.Column(db.Numeric(12, 2), default=0)
    # Status
    status       = db.Column(db.String(20), default="pending")  # pending|active|suspended
    approved_at  = db.Column(db.DateTime)
    approved_by  = db.Column(db.String(36), db.ForeignKey("users.id"))
    created_at   = db.Column(db.DateTime, default=datetime.utcnow)

    owner    = db.relationship("User", back_populates="tenant",  foreign_keys=[owner_id])
    venues   = db.relationship("Venue",  back_populates="tenant", lazy="dynamic", cascade="all, delete-orphan")
    events   = db.relationship("Event",  back_populates="tenant", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id":               self.id,
            "owner_id":         self.owner_id,
            "business_name":    self.business_name,
            "slug":             self.slug,
            "description":      self.description,
            "logo_url":         self.logo_url,
            "address":          self.address,
            "city":             self.city,
            "state":            self.state,
            "country":          self.country,
            "phone":            self.phone,
            "platform_fee_pct": float(self.platform_fee_pct),
            "total_revenue":    float(self.total_revenue),
            "total_fees":       float(self.total_fees),
            "status":           self.status,
            "created_at":       self.created_at.isoformat(),
        }


# ─────────────────────────────────────────────────────────────────────────────
# VENUES  (scoped to tenant)
# ─────────────────────────────────────────────────────────────────────────────
class Venue(db.Model):
    __tablename__ = "venues"

    id             = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    tenant_id      = db.Column(db.String(36), db.ForeignKey("tenants.id"), nullable=False, index=True)
    name           = db.Column(db.String(255), nullable=False)
    address        = db.Column(db.Text)
    city           = db.Column(db.String(100))
    state          = db.Column(db.String(100))
    total_capacity = db.Column(db.Integer, nullable=False, default=0)
    is_active      = db.Column(db.Boolean, default=True)
    created_at     = db.Column(db.DateTime, default=datetime.utcnow)

    tenant = db.relationship("Tenant", back_populates="venues")
    events = db.relationship("Event",  back_populates="venue",  lazy="dynamic")

    def to_dict(self):
        return {
            "id":             self.id,
            "tenant_id":      self.tenant_id,
            "name":           self.name,
            "address":        self.address,
            "city":           self.city,
            "state":          self.state,
            "total_capacity": self.total_capacity,
            "is_active":      self.is_active,
        }


# ─────────────────────────────────────────────────────────────────────────────
# SPORT CATEGORIES  (seeded — extensible)
# ─────────────────────────────────────────────────────────────────────────────
class SportCategory(db.Model):
    __tablename__ = "sport_categories"

    id          = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name        = db.Column(db.String(100), unique=True, nullable=False)  # Football, Basketball…
    slug        = db.Column(db.String(100), unique=True, nullable=False)  # football, basketball…
    icon        = db.Column(db.String(10))    # emoji
    # JSON schema of extra fields shown during event creation
    # e.g. [{"key":"home_team","label":"Home Team","required":true}, ...]
    metadata_schema = db.Column(db.JSON, default=list)
    sort_order  = db.Column(db.Integer, default=0)
    is_active   = db.Column(db.Boolean, default=True)

    events = db.relationship("Event", back_populates="sport", lazy="dynamic")

    def to_dict(self):
        return {
            "id":              self.id,
            "name":            self.name,
            "slug":            self.slug,
            "icon":            self.icon,
            "metadata_schema": self.metadata_schema,
            "sort_order":      self.sort_order,
        }


# ─────────────────────────────────────────────────────────────────────────────
# EVENTS  (scoped to tenant, sport-agnostic)
# ─────────────────────────────────────────────────────────────────────────────
class Event(db.Model):
    __tablename__ = "events"

    id          = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    tenant_id   = db.Column(db.String(36), db.ForeignKey("tenants.id"), nullable=False, index=True)
    venue_id    = db.Column(db.String(36), db.ForeignKey("venues.id"), nullable=False)
    sport_id    = db.Column(db.String(36), db.ForeignKey("sport_categories.id"), nullable=False)
    created_by  = db.Column(db.String(36), db.ForeignKey("users.id"))

    # Generic fields
    title       = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    banner_url  = db.Column(db.String(500))
    starts_at   = db.Column(db.DateTime, nullable=False)
    doors_open_at = db.Column(db.DateTime)
    status      = db.Column(db.String(20), default="upcoming")  # draft|upcoming|live|ended|cancelled

    # Sport-specific metadata stored as JSON
    # Football: {home_team, away_team, competition, stadium}
    # Boxing:   {fighter_one, fighter_two, weight_class, event_name}
    # F1:       {grand_prix, circuit, featured_drivers}
    sport_meta  = db.Column(db.JSON, default=dict)

    is_featured = db.Column(db.Boolean, default=False)
    is_public   = db.Column(db.Boolean, default=True)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at  = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    tenant         = db.relationship("Tenant",        back_populates="events")
    venue          = db.relationship("Venue",         back_populates="events")
    sport          = db.relationship("SportCategory", back_populates="events")
    ticket_categories = db.relationship("TicketCategory", back_populates="event",
                                        lazy="dynamic", cascade="all, delete-orphan",
                                        order_by="TicketCategory.sort_order")
    bookings       = db.relationship("Booking",       back_populates="event",  lazy="dynamic")
    holds          = db.relationship("SeatHold",      back_populates="event",  lazy="dynamic")

    def display_title(self):
        """Best human-readable title from sport_meta or title field."""
        m = self.sport_meta or {}
        if m.get("home_team") and m.get("away_team"):
            return f"{m['home_team']} vs {m['away_team']}"
        if m.get("fighter_one") and m.get("fighter_two"):
            return f"{m['fighter_one']} vs {m['fighter_two']}"
        if m.get("player_one") and m.get("player_two"):
            return f"{m['player_one']} vs {m['player_two']}"
        return self.title

    def to_dict(self, include_categories=False):
        data = {
            "id":           self.id,
            "tenant_id":    self.tenant_id,
            "venue_id":     self.venue_id,
            "venue_name":   self.venue.name if self.venue else None,
            "venue_city":   self.venue.city if self.venue else None,
            "sport_id":     self.sport_id,
            "sport_name":   self.sport.name if self.sport else None,
            "sport_slug":   self.sport.slug if self.sport else None,
            "sport_icon":   self.sport.icon if self.sport else None,
            "title":        self.title,
            "display_title":self.display_title(),
            "description":  self.description,
            "banner_url":   self.banner_url,
            "starts_at":    self.starts_at.isoformat(),
            "doors_open_at":self.doors_open_at.isoformat() if self.doors_open_at else None,
            "status":       self.status,
            "sport_meta":   self.sport_meta,
            "is_featured":  self.is_featured,
            "is_public":    self.is_public,
            "tenant_name":  self.tenant.business_name if self.tenant else None,
        }
        if include_categories:
            data["ticket_categories"] = [tc.to_dict() for tc in self.ticket_categories]
        return data


# ─────────────────────────────────────────────────────────────────────────────
# TICKET CATEGORIES  (dynamic per event — replaces hardcoded sections)
# ─────────────────────────────────────────────────────────────────────────────
class TicketCategory(db.Model):
    __tablename__ = "ticket_categories"

    id             = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    event_id       = db.Column(db.String(36), db.ForeignKey("events.id"), nullable=False, index=True)
    name           = db.Column(db.String(100), nullable=False)   # VIP, VVIP, Regular, Balcony…
    description    = db.Column(db.String(255))
    price          = db.Column(db.Numeric(10, 2), nullable=False)
    capacity       = db.Column(db.Integer, nullable=False)
    available      = db.Column(db.Integer, nullable=False)       # decrements on booking
    color_hex      = db.Column(db.String(7), default="#3B82F6")
    sort_order     = db.Column(db.Integer, default=0)            # display order
    is_active      = db.Column(db.Boolean, default=True)

    event   = db.relationship("Event",   back_populates="ticket_categories")
    tickets = db.relationship("Ticket",  back_populates="category", lazy="dynamic")
    holds   = db.relationship("SeatHold", back_populates="category", lazy="dynamic")

    def to_dict(self):
        return {
            "id":          self.id,
            "event_id":    self.event_id,
            "name":        self.name,
            "description": self.description,
            "price":       float(self.price),
            "capacity":    self.capacity,
            "available":   self.available,
            "sold_out":    self.available <= 0,
            "color_hex":   self.color_hex,
            "sort_order":  self.sort_order,
        }


# ─────────────────────────────────────────────────────────────────────────────
# SEAT HOLDS  (updated — category-based, no seat_id required)
# ─────────────────────────────────────────────────────────────────────────────
class SeatHold(db.Model):
    __tablename__ = "seat_holds"

    id          = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    event_id    = db.Column(db.String(36), db.ForeignKey("events.id"),          nullable=False)
    category_id = db.Column(db.String(36), db.ForeignKey("ticket_categories.id"), nullable=False)
    user_id     = db.Column(db.String(36), db.ForeignKey("users.id"),           nullable=False)
    quantity    = db.Column(db.Integer, nullable=False, default=1)
    expires_at  = db.Column(db.DateTime, nullable=False)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    # Legacy compat — seat_id optional (kept for existing rows)
    seat_id     = db.Column(db.String(36), db.ForeignKey("seats.id"), nullable=True)

    event    = db.relationship("Event",          back_populates="holds")
    category = db.relationship("TicketCategory", back_populates="holds")
    user     = db.relationship("User",           back_populates="seat_holds")
    seat     = db.relationship("Seat",           back_populates="holds", foreign_keys=[seat_id])

    @property
    def is_expired(self):
        return datetime.utcnow() > self.expires_at

    def to_dict(self):
        return {
            "id":          self.id,
            "event_id":    self.event_id,
            "category_id": self.category_id,
            "user_id":     self.user_id,
            "quantity":    self.quantity,
            "expires_at":  self.expires_at.isoformat(),
        }


# ─────────────────────────────────────────────────────────────────────────────
# BOOKINGS
# ─────────────────────────────────────────────────────────────────────────────
class Booking(db.Model):
    __tablename__ = "bookings"

    id               = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id          = db.Column(db.String(36), db.ForeignKey("users.id"),   nullable=False)
    event_id         = db.Column(db.String(36), db.ForeignKey("events.id"),  nullable=False)
    tenant_id        = db.Column(db.String(36), db.ForeignKey("tenants.id"), nullable=False, index=True)
    status           = db.Column(db.String(20), default="pending")  # pending|confirmed|cancelled|refunded
    amount_paid      = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    platform_fee     = db.Column(db.Numeric(10, 2), nullable=False, default=0)  # 5% cut
    net_to_owner     = db.Column(db.Numeric(10, 2), nullable=False, default=0)  # amount_paid - fee
    payment_ref      = db.Column(db.String(255), unique=True)
    payment_provider = db.Column(db.String(50), default="paystack")
    idempotency_key  = db.Column(db.String(255), unique=True, index=True)  # prevent duplicates
    delivery_email   = db.Column(db.String(255))   # where to send tickets (may differ from account email)
    food_order_total = db.Column(db.Numeric(10, 2), default=0)  # sum of food pre-order
    booked_at        = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at       = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user    = db.relationship("User",   back_populates="bookings")
    event   = db.relationship("Event",  back_populates="bookings")
    tenant  = db.relationship("Tenant")
    tickets = db.relationship("Ticket", back_populates="booking", lazy="dynamic",
                               cascade="all, delete-orphan")

    def to_dict(self, include_tickets=False):
        data = {
            "id":            self.id,
            "user_id":       self.user_id,
            "event_id":      self.event_id,
            "tenant_id":     self.tenant_id,
            "event_title":   self.event.display_title() if self.event else None,
            "event_starts_at": self.event.starts_at.isoformat() if self.event else None,
            "sport_icon":    self.event.sport.icon if self.event and self.event.sport else None,
            "venue_name":    self.event.venue.name if self.event and self.event.venue else None,
            "status":        self.status,
            "amount_paid":   float(self.amount_paid),
            "platform_fee":  float(self.platform_fee),
            "net_to_owner":  float(self.net_to_owner),
            "payment_ref":   self.payment_ref,
            "booked_at":     self.booked_at.isoformat(),
            "ticket_count":  self.tickets.count(),
        }
        if include_tickets:
            data["tickets"] = [t.to_dict() for t in self.tickets]
        return data


# ─────────────────────────────────────────────────────────────────────────────
# TICKETS
# ─────────────────────────────────────────────────────────────────────────────
class Ticket(db.Model):
    __tablename__ = "tickets"

    id          = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    booking_id  = db.Column(db.String(36), db.ForeignKey("bookings.id"), nullable=False)
    category_id = db.Column(db.String(36), db.ForeignKey("ticket_categories.id"), nullable=False)
    qr_payload  = db.Column(db.Text,       nullable=False)   # base64 QR PNG
    hmac_sig    = db.Column(db.String(255), nullable=False)  # HMAC-SHA256
    status      = db.Column(db.String(20), default="unused")  # unused | used | cancelled
    scanned_at  = db.Column(db.DateTime)
    scanned_by  = db.Column(db.String(36), db.ForeignKey("users.id"))
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    # Legacy compat
    seat_id     = db.Column(db.String(36), db.ForeignKey("seats.id"), nullable=True)

    booking  = db.relationship("Booking",        back_populates="tickets")
    category = db.relationship("TicketCategory", back_populates="tickets")
    seat     = db.relationship("Seat",           back_populates="tickets", foreign_keys=[seat_id])

    def to_dict(self):
        return {
            "id":            self.id,
            "booking_id":    self.booking_id,
            "category_id":   self.category_id,
            "category_name": self.category.name if self.category else None,
            "qr_payload":    self.qr_payload,
            "status":        self.status,
            "scanned":       self.status == "used",
            "scanned_at":    self.scanned_at.isoformat() if self.scanned_at else None,
        }


# ─────────────────────────────────────────────────────────────────────────────
# PLATFORM TRANSACTIONS  (audit trail of all revenue splits)
# ─────────────────────────────────────────────────────────────────────────────
class PlatformTransaction(db.Model):
    __tablename__ = "platform_transactions"

    id           = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    booking_id   = db.Column(db.String(36), db.ForeignKey("bookings.id"), nullable=False)
    tenant_id    = db.Column(db.String(36), db.ForeignKey("tenants.id"),  nullable=False, index=True)
    gross_amount = db.Column(db.Numeric(10, 2), nullable=False)
    fee_pct      = db.Column(db.Numeric(5, 2),  nullable=False)
    fee_amount   = db.Column(db.Numeric(10, 2), nullable=False)
    net_amount   = db.Column(db.Numeric(10, 2), nullable=False)
    created_at   = db.Column(db.DateTime, default=datetime.utcnow)

    booking = db.relationship("Booking")
    tenant  = db.relationship("Tenant")

    def to_dict(self):
        return {
            "id":           self.id,
            "booking_id":   self.booking_id,
            "tenant_id":    self.tenant_id,
            "gross_amount": float(self.gross_amount),
            "fee_pct":      float(self.fee_pct),
            "fee_amount":   float(self.fee_amount),
            "net_amount":   float(self.net_amount),
            "created_at":   self.created_at.isoformat(),
        }


# ─────────────────────────────────────────────────────────────────────────────
# LEGACY — kept for backward compat with existing seeded data
# ─────────────────────────────────────────────────────────────────────────────
class Section(db.Model):
    __tablename__ = "sections"

    id           = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    venue_id     = db.Column(db.String(36), db.ForeignKey("venues.id"), nullable=False)
    name         = db.Column(db.String(100), nullable=False)
    category     = db.Column(db.String(50), nullable=False)
    capacity     = db.Column(db.Integer, nullable=False)
    color_hex    = db.Column(db.String(7), default="#3B82F6")
    row_count    = db.Column(db.Integer, nullable=False, default=1)
    seats_per_row= db.Column(db.Integer, nullable=False, default=10)

    venue = db.relationship("Venue")
    seats = db.relationship("Seat", back_populates="section", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id, "venue_id": self.venue_id, "name": self.name,
            "category": self.category, "capacity": self.capacity,
            "color_hex": self.color_hex,
        }


class Seat(db.Model):
    __tablename__ = "seats"

    id           = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    section_id   = db.Column(db.String(36), db.ForeignKey("sections.id"), nullable=False)
    row_label    = db.Column(db.String(5),  nullable=False)
    seat_number  = db.Column(db.Integer,    nullable=False)
    pos_x        = db.Column(db.Float, default=0)
    pos_y        = db.Column(db.Float, default=0)
    is_accessible= db.Column(db.Boolean, default=False)

    section = db.relationship("Section", back_populates="seats")
    tickets = db.relationship("Ticket",  back_populates="seat",  lazy="dynamic",
                               foreign_keys="Ticket.seat_id")
    holds   = db.relationship("SeatHold", back_populates="seat", lazy="dynamic",
                               foreign_keys="SeatHold.seat_id")

    @property
    def label(self):
        return f"{self.row_label}{self.seat_number}"

    def to_dict(self):
        return {
            "id": self.id, "section_id": self.section_id,
            "row_label": self.row_label, "seat_number": self.seat_number,
            "label": self.label,
        }


# ─────────────────────────────────────────────────────────────────────────────
# MENU ITEMS  (per tenant — food & drinks pre-order)
# ─────────────────────────────────────────────────────────────────────────────
class MenuItem(db.Model):
    __tablename__ = "menu_items"

    id          = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    tenant_id   = db.Column(db.String(36), db.ForeignKey("tenants.id"), nullable=False, index=True)
    name        = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255))
    price       = db.Column(db.Numeric(10, 2), nullable=False)
    category    = db.Column(db.String(50), default="food")  # food | drinks | snacks
    emoji       = db.Column(db.String(5), default="🍽️")
    is_available= db.Column(db.Boolean, default=True)
    sort_order  = db.Column(db.Integer, default=0)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    tenant      = db.relationship("Tenant")
    order_items = db.relationship("FoodOrderItem", back_populates="menu_item", lazy="dynamic")

    def to_dict(self):
        return {
            "id":          self.id,
            "tenant_id":   self.tenant_id,
            "name":        self.name,
            "description": self.description,
            "price":       float(self.price),
            "category":    self.category,
            "emoji":       self.emoji,
            "is_available":self.is_available,
            "sort_order":  self.sort_order,
        }


# ─────────────────────────────────────────────────────────────────────────────
# FOOD ORDERS  (one per booking, optional)
# ─────────────────────────────────────────────────────────────────────────────
class FoodOrder(db.Model):
    __tablename__ = "food_orders"

    id          = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    booking_id  = db.Column(db.String(36), db.ForeignKey("bookings.id"), nullable=False, unique=True)
    tenant_id   = db.Column(db.String(36), db.ForeignKey("tenants.id"),  nullable=False, index=True)
    total       = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    status      = db.Column(db.String(20), default="pending")  # pending|preparing|ready|delivered
    notes       = db.Column(db.Text)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    booking     = db.relationship("Booking",       backref=db.backref("food_order", uselist=False))
    tenant      = db.relationship("Tenant")
    items       = db.relationship("FoodOrderItem", back_populates="order",
                                   lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id":         self.id,
            "booking_id": self.booking_id,
            "total":      float(self.total),
            "status":     self.status,
            "notes":      self.notes,
            "items":      [i.to_dict() for i in self.items],
        }


# ─────────────────────────────────────────────────────────────────────────────
# FOOD ORDER ITEMS
# ─────────────────────────────────────────────────────────────────────────────
class FoodOrderItem(db.Model):
    __tablename__ = "food_order_items"

    id           = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    order_id     = db.Column(db.String(36), db.ForeignKey("food_orders.id"),  nullable=False)
    menu_item_id = db.Column(db.String(36), db.ForeignKey("menu_items.id"),   nullable=False)
    quantity     = db.Column(db.Integer, nullable=False, default=1)
    unit_price   = db.Column(db.Numeric(10, 2), nullable=False)

    order       = db.relationship("FoodOrder",  back_populates="items")
    menu_item   = db.relationship("MenuItem",   back_populates="order_items")

    def to_dict(self):
        return {
            "id":           self.id,
            "menu_item_id": self.menu_item_id,
            "name":         self.menu_item.name  if self.menu_item else None,
            "emoji":        self.menu_item.emoji if self.menu_item else None,
            "quantity":     self.quantity,
            "unit_price":   float(self.unit_price),
            "subtotal":     float(self.unit_price) * self.quantity,
        }
