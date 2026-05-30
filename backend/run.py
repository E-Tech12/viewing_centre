import click
from backend.app import create_app, db

app = create_app()


@app.cli.command("seed")
def seed():
    """Seed the database with initial venue, sections, and seats."""
    from app.models import Venue, Section, Seat, User
    from app.routes.auth import hash_password

    # Admin user
    if not User.query.filter_by(email="admin@sportzone.ng").first():
        admin = User(
            email="admin@sportzone.ng",
            password_hash=hash_password("Admin@1234"),
            full_name="SportZone Admin",
            role="admin",
        )
        db.session.add(admin)
        click.echo("Created admin user: admin@sportzone.ng / Admin@1234")

    # Venue
    if not Venue.query.first():
        venue = Venue(
            name="SportZone Lagos",
            location="Victoria Island, Lagos",
            address="12 Adeola Odeku St, Victoria Island, Lagos",
            total_capacity=150,
        )
        db.session.add(venue)
        db.session.flush()

        # Sections
        sections_config = [
            {"name": "VIP Lounge", "category": "VIP", "rows": 3, "per_row": 10, "color": "#F59E0B"},
            {"name": "Regular Floor", "category": "Regular", "rows": 8, "per_row": 10, "color": "#3B82F6"},
            {"name": "Gaming Zone", "category": "Gaming", "rows": 2, "per_row": 5, "color": "#8B5CF6"},
        ]

        row_letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
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

            # Generate seats with grid positions
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

        db.session.commit()
        click.echo(f"Seeded venue: {venue.name} with {venue.total_capacity} seats")
    else:
        click.echo("Database already seeded.")


if __name__ == "__main__":
    app.run(debug=True)