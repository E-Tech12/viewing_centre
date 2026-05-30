from app import create_app, db
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    from app.models import Venue, Section, Seat, User

    def hash_password(password):
        return generate_password_hash(password)

    print("Starting seed...")

    # ── Admin user ────────────────────────────────────────────
    existing_admin = User.query.filter_by(email="admin@sportzone.ng").first()

    if not existing_admin:
        admin = User(
            email="admin@sportzone.ng",
            password_hash=hash_password("Admin1234"),
            full_name="SportZone Admin",
            role="admin",
        )

        db.session.add(admin)
        db.session.commit()

        print("✓ Admin user created")
        print("  Email:    admin@sportzone.ng")
        print("  Password: Admin1234")

    else:
        # Reset password if admin already exists
        existing_admin.password_hash = hash_password("Admin1234")

        db.session.commit()

        print("✓ Admin user already exists — password reset to: Admin1234")

    # ── Venue + sections + seats ──────────────────────────────
    if not Venue.query.first():

        venue = Venue(
            name="SportZone Lagos",
            location="Victoria Island, Lagos",
            address="12 Adeola Odeku St, Victoria Island, Lagos",
            total_capacity=150,
        )

        db.session.add(venue)
        db.session.flush()

        sections_config = [
            {
                "name": "VIP Lounge",
                "category": "VIP",
                "rows": 3,
                "per_row": 10,
                "color": "#F59E0B",
            },
            {
                "name": "Regular Floor",
                "category": "Regular",
                "rows": 8,
                "per_row": 10,
                "color": "#3B82F6",
            },
            {
                "name": "Gaming Zone",
                "category": "Gaming",
                "rows": 2,
                "per_row": 5,
                "color": "#8B5CF6",
            },
        ]

        row_letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        total_seats = 0

        for sec_cfg in sections_config:

            section = Section(
                venue_id=venue.id,
                name=sec_cfg["name"],
                category=sec_cfg["category"],
                capacity=sec_cfg["rows"] * sec_cfg["per_row"],
                color_hex=sec_cfg["color"],
                row_count=sec_cfg["rows"],
                seats_per_row=sec_cfg["per_row"],
            )

            db.session.add(section)
            db.session.flush()

            for r in range(sec_cfg["rows"]):
                for s in range(sec_cfg["per_row"]):

                    seat = Seat(
                        section_id=section.id,
                        row_label=row_letters[r],
                        seat_number=s + 1,
                        pos_x=s * 42 + 20,
                        pos_y=r * 42 + 20,
                    )

                    db.session.add(seat)
                    total_seats += 1

        db.session.commit()

        print(f"✓ Venue created: {venue.name}")
        print("  Sections: VIP Lounge (30), Regular Floor (80), Gaming Zone (10)")
        print(f"  Total seats: {total_seats}")

    else:
        v = Venue.query.first()
        seat_count = Seat.query.count()

        print(f"✓ Venue already exists: {v.name} ({seat_count} seats)")

    print("\nSeed complete!")
    print("  1. Log in to admin at /login")
    print("     Email:    admin@sportzone.ng")
    print("     Password: Admin1234")
    print("  2. Go to /admin/events and create an event")
    print("  3. Set ticket prices for each section")