"""SportZone SaaS seed script — platform admin, sports, demo tenant + owner"""

from decimal import Decimal
from app import create_app, db

app = create_app()

from werkzeug.security import generate_password_hash


# ─────────────────────────────────────────────
# SPORT CATEGORIES
# ─────────────────────────────────────────────
SPORTS = [
    {
        "name": "Football", "slug": "football", "icon": "⚽", "sort_order": 1,
        "metadata_schema": [
            {"key": "home_team", "label": "Home Team", "required": True},
            {"key": "away_team", "label": "Away Team", "required": True},
            {"key": "competition", "label": "Competition", "required": False},
            {"key": "stadium", "label": "Stadium", "required": False},
        ],
    },
    {
        "name": "Basketball", "slug": "basketball", "icon": "🏀", "sort_order": 2,
        "metadata_schema": [
            {"key": "home_team", "label": "Home Team", "required": True},
            {"key": "away_team", "label": "Away Team", "required": True},
            {"key": "league", "label": "League", "required": False},
            {"key": "arena", "label": "Arena", "required": False},
        ],
    },
    {
        "name": "Tennis", "slug": "tennis", "icon": "🎾", "sort_order": 3,
        "metadata_schema": [
            {"key": "player_one", "label": "Player One", "required": True},
            {"key": "player_two", "label": "Player Two", "required": True},
            {"key": "tournament", "label": "Tournament", "required": False},
            {"key": "court", "label": "Court", "required": False},
        ],
    },
    {
        "name": "Boxing", "slug": "boxing", "icon": "🥊", "sort_order": 4,
        "metadata_schema": [
            {"key": "fighter_one", "label": "Fighter One", "required": True},
            {"key": "fighter_two", "label": "Fighter Two", "required": True},
            {"key": "weight_class", "label": "Weight Class", "required": False},
            {"key": "event_name", "label": "Event Name", "required": False},
        ],
    },
    {
        "name": "UFC / MMA", "slug": "mma", "icon": "🏟️", "sort_order": 5,
        "metadata_schema": [
            {"key": "fighter_one", "label": "Fighter One", "required": True},
            {"key": "fighter_two", "label": "Fighter Two", "required": True},
            {"key": "weight_class", "label": "Weight Class", "required": False},
            {"key": "event_name", "label": "Event Name", "required": False},
        ],
    },
    {
        "name": "Formula 1", "slug": "f1", "icon": "🏎️", "sort_order": 6,
        "metadata_schema": [
            {"key": "grand_prix", "label": "Grand Prix", "required": True},
            {"key": "circuit", "label": "Circuit", "required": True},
            {"key": "featured_drivers", "label": "Featured Drivers", "required": False},
        ],
    },
]


# ─────────────────────────────────────────────
# APP CONTEXT
# ─────────────────────────────────────────────
with app.app_context():

    from app.models.models import User, Tenant, SportCategory, Venue

    def hashpw(password: str):
        return generate_password_hash(password)

    print("\n" + "=" * 50)
    print("SportZone SaaS — Seed Script")
    print("=" * 50)


    # ─────────────────────────────────────────────
    # PLATFORM ADMIN
    # ─────────────────────────────────────────────
    admin = User.query.filter_by(email="admin@sportzone.ng").first()

    if not admin:
        admin = User(
            email="admin@sportzone.ng",
            password_hash=hashpw("Admin1234"),
            full_name="Platform Admin",
            role="platform_admin",
        )
        db.session.add(admin)
        print("✓ Platform admin created")
    else:
        admin.password_hash = hashpw("Admin1234")
        admin.role = "platform_admin"
        print("✓ Platform admin reset")

    db.session.commit()


    # ─────────────────────────────────────────────
    # SPORT CATEGORIES
    # ─────────────────────────────────────────────
    for sp in SPORTS:
        existing = SportCategory.query.filter_by(slug=sp["slug"]).first()

        if not existing:
            db.session.add(SportCategory(**sp))
            print(f"  {sp['icon']} {sp['name']} added")

    db.session.commit()
    print("✓ Sports seeded")


    # ─────────────────────────────────────────────
    # DEMO OWNER + TENANT + VENUE
    # ─────────────────────────────────────────────
    demo = User.query.filter_by(email="owner@sportzone.ng").first()

    if not demo:
        demo = User(
            email="owner@sportzone.ng",
            password_hash=hashpw("Owner1234"),
            full_name="Demo Event Owner",
            role="event_owner",
        )
        db.session.add(demo)
        db.session.flush()

        tenant = Tenant(
            owner_id=demo.id,
            business_name="SportZone Lagos",
            slug="sportzone-lagos",
            description="Premier sports viewing centre in Victoria Island",
            city="Lagos",
            state="Lagos",
            country="Nigeria",
            phone="08012345678",
            status="active",
            platform_fee_pct=Decimal("5.00"),
        )
        db.session.add(tenant)
        db.session.flush()

        venue = Venue(
            tenant_id=tenant.id,
            name="SportZone VI",
            address="12 Adeola Odeku St",
            city="Victoria Island",
            state="Lagos",
            total_capacity=200,
        )
        db.session.add(venue)

        db.session.commit()

        print("✓ Demo owner created")
        print("  Email: owner@sportzone.ng")
        print("  Password: Owner1234")

    else:
        print("✓ Demo owner already exists")


    # ─────────────────────────────────────────────
    # SUMMARY
    # ─────────────────────────────────────────────
    print("\n" + "=" * 50)
    print("CREDENTIALS")
    print("=" * 50)
    print("Admin: owner@sportzone.ng  / Owner1234")
    print("Admin: admin@sportzone.ng  / Admin1234")
    print("=" * 50)