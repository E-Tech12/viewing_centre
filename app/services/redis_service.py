import os
import redis

HOLD_TTL = 600  # 10 minutes in seconds

redis_client = redis.Redis.from_url(
    os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    decode_responses=False,
)


def publish_seat_update(event_id: str, seat_id: str, state: str):
    """Publish seat state change to Redis pub/sub for SSE broadcast."""
    import json
    redis_client.publish(
        f"seat_updates:{event_id}",
        json.dumps({"seat_id": seat_id, "state": state}),
    )
