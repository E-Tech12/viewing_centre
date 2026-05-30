import json
import time
from flask import Blueprint, Response, request
from backend.app.services.redis_service import redis_client

sse_bp = Blueprint("sse", __name__)


@sse_bp.get("/seats/<event_id>")
def seat_updates(event_id):
    """Server-Sent Events stream for real-time seat state changes."""
    def event_stream():
        pubsub = redis_client.pubsub()
        pubsub.subscribe(f"seat_updates:{event_id}")
        # Send initial heartbeat
        yield f"data: {json.dumps({'type': 'connected', 'event_id': event_id})}\n\n"
        try:
            for message in pubsub.listen():
                if message["type"] == "message":
                    data = message["data"]
                    if isinstance(data, bytes):
                        data = data.decode()
                    yield f"data: {data}\n\n"
                # Heartbeat every 15s
                time.sleep(0)
        except GeneratorExit:
            pubsub.unsubscribe()

    return Response(
        event_stream(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
