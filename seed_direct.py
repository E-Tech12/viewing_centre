"""python seed_direct.py — seeds platform admin, sport categories, demo tenant."""
from decimal import Decimal
from app import create_app, db

app = create_app()

SPORTS = [
    {
        "name": "Football", "slug": "football", "icon": "⚽", "sort_order": 1,
        "metadata_schema": [
            {"key": "home_team",   "label": "Home Team",   "required": True},
            {"key": "away_team",   "label": "Away Team",   "required": True},
            {"key": "competition", "label": "Competition", "required": False},
            {"key": "stadium",     "label": "Stadium",     "required": False},
        ],
    },
    {
        "name": "Basketball", "slug": "basketball", "icon": "🏀", "sort_order": 2,
        "metadata_schema": [
            {"key": "home_team", "label": "Home Team", "required": True},
            {"key": "away_team", "label": "Away Team", "required": True},
            {"key": "league",    "label": "League",    "required": False},
            {"key": "arena",     "label": "Arena",     "required": False},
        ],
    },
    {
        "name": "Tennis", "slug": "tennis", "icon": "🎾", "sort_order": 3,
        "metadata_schema": [
            {"key": "player_one", "label": "Player One",  "required": True},
            {"key": "player_two", "label": "Player Two",  "required": True},
            {"key": "tournament", "label": "Tournament",  "required": False},
            {"key": "court",      "label": "Court",       "required": False},
        ],
    },
    {
        "name": "Boxing", "slug": "boxing", "icon": "🥊", "sort_order": 4,
        "metadata_schema": [
            {"key": "fighter_one",  "label": "Fighter One",  "required": True},
            {"key": "fighter_two",  "label": "Fighter Two",  "required": True},
            {"key": "weight_class", "label": "Weight Class", "required": False},
            {"key": "event_name",   "label": "Event Name",   "required": False},
        ],
    },
    {
        "name": "UFC / MMA", "slug": "mma", "icon": "🏟️", "sort_order": 5,
        "metadata_schema": [
            {"key": "fighter_one",  "label": "Fighter One",  "required": True},
            {"key": "fighter_two",  "label": "Fighter Two",  "required": True},
            {"key": "weight_class", "label": "Weight Class", "required": False},
            {"key": "event_name",   "label": "Event Name",   "required": False},
        ],
    },
    {
        "name": "Formula 1", "slug": "f1", "icon": "🏎️", "sort_order": 6,
        "metadata_schema": [
            {"key": "grand_prix",        "label": "Grand Prix",        "required": True},
            {"key": "circuit",           "label": "Circuit",           "required": True},
            {"key": "featured_drivers",  "label": "Featured Drivers",  "required": False},
        ],
    },
]

with app.app_context():
    from app.models.models import User, Tenant, SportCategory, Venue
    from werkzeug.security import generate_password_hash

    def hashpw(p):
        return generate_password_hash(p)

    print("=" * 50)
    print("SportZone SaaS — Database Seed")
    print("=" * 50)

    # Platform admin
    admin = User.query.filter_by(email="admin@sportzone.ng").first()
    if not admin:
        admin = User(email="admin@sportzone.ng", password_hash=hashpw("Admin1234"),
                     full_name="Platform Admin", role="platform_admin")
        db.session.add(admin)
        db.session.commit()
        print("✓ Platform admin created")
    else:
        admin.password_hash = hashpw("Admin1234")
        admin.role = "platform_admin"
        db.session.commit()
        print("✓ Platform admin updated (password reset to Admin1234)")

    # Sport categories
    for sp in SPORTS:
        existing = SportCategory.query.filter_by(slug=sp["slug"]).first()
        if not existing:
            s = SportCategory(**sp)
            db.session.add(s)
            print(f"  {sp['icon']} {sp['name']} added")
    db.session.commit()
    print("✓ Sport categories seeded")

    # Demo event owner + tenant (for testing)
    demo = User.query.filter_by(email="owner@sportzone.ng").first()
    if not demo:
        demo = User(email="owner@sportzone.ng", password_hash=hashpw("Owner1234"),
                    full_name="Demo Event Owner", role="event_owner")
        db.session.add(demo)
        db.session.flush()

        tenant = Tenant(
            owner_id=demo.id,
            business_name="SportZone Lagos",
            slug="sportzone-lagos",
            description="Premier sports viewing centre in Victoria Island",
            city="Lagos", state="Lagos", country="Nigeria",
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
        print("✓ Demo event owner created: owner@sportzone.ng / Owner1234")
        print(f"  Tenant: SportZone Lagos (slug: sportzone-lagos)")
        print(f"  Venue:  SportZone VI, Victoria Island")
    else:
        print("✓ Demo owner already exists")

    print()
    print("Credentials:")
    print("  Platform Admin: admin@sportzone.ng  / Admin1234")
    print("  Event Owner:    owner@sportzone.ng  / Owner1234")
    print()
    print("Next steps:")
    print("  1. flask db migrate -m 'saas evolution'")
    print("  2. flask db upgrade")
    print("  3. python seed_direct.py")
    print("  4. Start building events from the owner dashboard")
