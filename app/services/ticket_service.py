import os, hmac, hashlib, json, base64, uuid
from io import BytesIO
import qrcode
from app.models.models import Ticket

HMAC_SECRET = os.getenv("HMAC_SECRET", "ticket-hmac-secret-change-me")


def sign_payload(payload: dict) -> str:
    msg = json.dumps(payload, sort_keys=True).encode()
    return hmac.new(HMAC_SECRET.encode(), msg, hashlib.sha256).hexdigest()


def generate_qr_base64(data: str) -> str:
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=10, border=4)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


def generate_ticket(booking_id: str, category_id: str, event_id: str, user_id: str) -> Ticket:
    ticket_id = str(uuid.uuid4())
    payload   = {"tid": ticket_id, "bid": booking_id, "cid": category_id, "eid": event_id, "uid": user_id}
    sig       = sign_payload(payload)
    qr_data   = json.dumps({**payload, "sig": sig})
    qr_b64    = generate_qr_base64(qr_data)
    return Ticket(id=ticket_id, booking_id=booking_id, category_id=category_id,
                  qr_payload=qr_b64, hmac_sig=sig)


def validate_ticket(qr_json_str: str) -> dict:
    try:
        data = json.loads(qr_json_str)
        sig  = data.pop("sig", None)
        if not sig:
            return {"valid": False, "reason": "Missing signature"}
        if not hmac.compare_digest(sig, sign_payload(data)):
            return {"valid": False, "reason": "Invalid signature — ticket may be forged"}
        return {"valid": True, "ticket_id": data["tid"], "category_id": data.get("cid"), "event_id": data["eid"]}
    except Exception as e:
        return {"valid": False, "reason": str(e)}
