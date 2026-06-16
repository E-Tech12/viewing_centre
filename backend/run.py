from app import create_app, db

app = create_app()

with app.app_context():
    from app.models import (
        User, Tenant, Venue, SportCategory, Event,
        TicketCategory, SeatHold, Booking, Ticket,
        PlatformTransaction, Section, Seat,
        MenuItem, FoodOrder, FoodOrderItem,
    )

if __name__ == "__main__":
    app.run(debug=True)
