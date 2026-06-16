"""
Email service — sends ticket confirmation emails with QR codes embedded.
Uses Flask-Mail (SMTP). Gracefully skips if mail is not configured.
"""
import os
import base64
from io import BytesIO
from flask import current_app
from flask_mail import Message
from app import mail


def _mail_configured() -> bool:
    return bool(os.getenv("MAIL_USERNAME") and os.getenv("MAIL_PASSWORD"))


def send_ticket_email(booking, tickets) -> bool:
    """
    Send a booking confirmation email with QR ticket images.
    Returns True on success, False on failure (non-fatal).
    """
    if not _mail_configured():
        current_app.logger.warning("Email not configured — skipping ticket email")
        return False

    recipient  = booking.delivery_email or booking.user.email
    user_name  = booking.user.full_name
    event      = booking.event
    event_title= event.display_title() if event else "Your Event"
    venue_name = event.venue.name      if event and event.venue  else ""
    venue_city = event.venue.city      if event and event.venue  else ""
    sport_icon = event.sport.icon      if event and event.sport  else "🏆"
    starts_at  = event.starts_at.strftime("%A, %d %B %Y at %H:%M") if event else ""

    # Build food order summary if present
    food_html = ""
    if hasattr(booking, "food_order") and booking.food_order:
        fo = booking.food_order
        rows = "".join(
            f"<tr><td style='padding:4px 8px'>{i.emoji} {i.name}</td>"
            f"<td style='padding:4px 8px;text-align:right'>x{i.quantity}</td>"
            f"<td style='padding:4px 8px;text-align:right'>₦{i.subtotal:,.0f}</td></tr>"
            for i in fo.items
        )
        food_html = f"""
        <div style="margin-top:24px;border-top:1px solid #1c2e42;padding-top:16px">
          <p style="font-family:monospace;font-size:11px;color:#c8f135;text-transform:uppercase;letter-spacing:2px;margin:0 0 10px">
            Food & Drinks Pre-Order
          </p>
          <table style="width:100%;font-size:13px;color:#e2e8f0">
            {rows}
            <tr style="border-top:1px solid #1c2e42">
              <td colspan="2" style="padding:6px 8px;font-weight:bold">Total</td>
              <td style="padding:6px 8px;text-align:right;color:#c8f135;font-weight:bold">
                ₦{float(fo.total):,.0f}
              </td>
            </tr>
          </table>
          <p style="font-size:11px;color:#475569;margin-top:8px">
            Your order will be prepared and ready for collection at the venue.
          </p>
        </div>
        """

    # Build QR ticket blocks
    ticket_blocks = ""
    for i, ticket in enumerate(tickets, 1):
        qr_cid  = f"qr_{ticket.id}"
        cat_name= ticket.category.name if ticket.category else f"Ticket {i}"
        ticket_blocks += f"""
        <div style="background:#0d1a24;border:1px solid #1c2e42;border-radius:4px;padding:16px;margin-bottom:12px">
          <p style="font-family:monospace;font-size:10px;color:#c8f135;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px">
            {cat_name} &nbsp;·&nbsp; Ticket {i} of {len(tickets)}
          </p>
          <div style="background:white;display:inline-block;padding:8px;border-radius:4px">
            <img src="cid:{qr_cid}" width="160" height="160" alt="QR Code" />
          </div>
          <p style="font-size:11px;color:#475569;margin:8px 0 0">
            Present this QR code at the entrance. Do not share.
          </p>
        </div>
        """

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8" /></head>
    <body style="margin:0;padding:0;background:#020408;font-family:'DM Sans',Arial,sans-serif">
      <div style="max-width:560px;margin:0 auto;padding:32px 16px">

        <!-- Header -->
        <div style="text-align:center;margin-bottom:32px">
          <div style="display:inline-block;background:#c8f135;padding:8px 16px;border-radius:2px">
            <span style="font-weight:900;font-size:18px;color:#020408;letter-spacing:3px;text-transform:uppercase">
              SPORT<span style="color:#060d14">ZONE</span>
            </span>
          </div>
        </div>

        <!-- Greeting -->
        <h1 style="color:#ffffff;font-size:22px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px">
          Booking Confirmed! {sport_icon}
        </h1>
        <p style="color:#64748b;font-size:13px;margin:0 0 24px">
          Hey {user_name.split()[0]}, your tickets are ready.
        </p>

        <!-- Event card -->
        <div style="background:#060d14;border:1px solid #1c2e42;border-left:3px solid #c8f135;border-radius:4px;padding:20px;margin-bottom:24px">
          <p style="font-family:monospace;font-size:10px;color:#c8f135;text-transform:uppercase;letter-spacing:2px;margin:0 0 6px">
            Event
          </p>
          <h2 style="color:#ffffff;font-size:18px;font-weight:900;text-transform:uppercase;margin:0 0 12px">
            {event_title}
          </h2>
          <table style="font-size:12px;color:#94a3b8;width:100%">
            <tr>
              <td style="padding:3px 0">📅</td>
              <td style="padding:3px 0">{starts_at}</td>
            </tr>
            {"<tr><td style='padding:3px 0'>📍</td><td style='padding:3px 0'>" + venue_name + (", " + venue_city if venue_city else "") + "</td></tr>" if venue_name else ""}
            <tr>
              <td style="padding:3px 0">🎟️</td>
              <td style="padding:3px 0">{len(tickets)} ticket{'s' if len(tickets) > 1 else ''} · ₦{float(booking.amount_paid):,.0f}</td>
            </tr>
            <tr>
              <td style="padding:3px 0">🔖</td>
              <td style="padding:3px 0;font-family:monospace;font-size:11px">{booking.payment_ref}</td>
            </tr>
          </table>
        </div>

        <!-- QR Tickets -->
        <p style="font-family:monospace;font-size:11px;color:#c8f135;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px">
          Your Tickets
        </p>
        {ticket_blocks}

        {food_html}

        <!-- Footer -->
        <div style="margin-top:32px;padding-top:20px;border-top:1px solid #0d1a24;text-align:center">
          <p style="font-size:11px;color:#334155;margin:0">
            SportZone · Victoria Island, Lagos · support@sportzone.ng
          </p>
          <p style="font-size:10px;color:#1e293b;margin:6px 0 0;font-family:monospace">
            Ref: {booking.payment_ref}
          </p>
        </div>
      </div>
    </body>
    </html>
    """

    # Plain text fallback
    text_body = (
        f"BookING CONFIRMED — {event_title}\n"
        f"Date: {starts_at}\n"
        f"Venue: {venue_name}\n"
        f"Tickets: {len(tickets)} · ₦{float(booking.amount_paid):,.0f}\n"
        f"Ref: {booking.payment_ref}\n\n"
        f"Log in to sportzone.ng to view your QR tickets.\n"
    )

    try:
        msg = Message(
            subject=f"🎟️ Your SportZone Tickets — {event_title}",
            recipients=[recipient],
            html=html_body,
            body=text_body,
        )

        # Attach QR images as inline images (CID)
        for ticket in tickets:
            raw_png = base64.b64decode(ticket.qr_payload)
            msg.attach(
                filename=f"ticket_{ticket.id[:8]}.png",
                content_type="image/png",
                data=raw_png,
                disposition="inline",
                headers={"Content-ID": f"<qr_{ticket.id}>"},
            )

        mail.send(msg)
        current_app.logger.info(f"Ticket email sent to {recipient} for booking {booking.id}")
        return True

    except Exception as e:
        current_app.logger.error(f"Failed to send ticket email: {e}")
        return False
