import os
import hmac
import hashlib
import json
import base64
from io import BytesIO
import qrcode
from backend.app.models import Ticket


HMAC_SECRET = os.getenv("HMAC_SECRET", "ticket-hmac-secret-change-me")


def build_payload(ticket_id: str, booking_id: str, seat_id: str, event_id: str, user_id: str) -> dict:
    return {
        "tid": ticket_id,
        "bid": booking_id,
        "sid": seat_id,
        "eid": event_id,
        "uid": user_id,
    }


def sign_payload(payload: dict) -> str:
    msg = json.dumps(payload, sort_keys=True).encode()
    return hmac.new(HMAC_SECRET.encode(), msg, hashlib.sha256).hexdigest()


def generate_qr_base64(data: str) -> str:
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


def generate_ticket(booking_id: str, seat_id: str, event_id: str, user_id: str) -> Ticket:
    from uuid import uuid4
    ticket_id = str(uuid4())
    payload = build_payload(ticket_id, booking_id, seat_id, event_id, user_id)
    sig = sign_payload(payload)

    # QR encodes: payload JSON + signature
    qr_data = json.dumps({**payload, "sig": sig})
    qr_b64 = generate_qr_base64(qr_data)

    return Ticket(
        id=ticket_id,
        booking_id=booking_id,
        seat_id=seat_id,
        qr_payload=qr_b64,
        hmac_sig=sig,
    )


def validate_ticket(qr_json_str: str) -> dict:
    """
    Returns: {valid: bool, ticket_id: str, reason: str}
    Safe to call offline — only needs HMAC_SECRET.
    """
    try:
        data = json.loads(qr_json_str)
        sig = data.pop("sig", None)
        if not sig:
            return {"valid": False, "reason": "Missing signature"}

        expected = sign_payload(data)
        if not hmac.compare_digest(sig, expected):
            return {"valid": False, "reason": "Invalid signature — ticket may be forged"}

        return {"valid": True, "ticket_id": data["tid"], "seat_id": data["sid"], "event_id": data["eid"]}

    except Exception as e:
        return {"valid": False, "reason": str(e)}
