from __future__ import annotations

import asyncio
import json
import logging
import os
from typing import Any, Dict, Set

try:  # pragma: no cover - optional convenience dependency
    from dotenv import load_dotenv
except Exception:  # pragma: no cover
    def load_dotenv() -> bool:  # type: ignore[no-redef]
        return False

logger = logging.getLogger(__name__)

load_dotenv()

try:  # pragma: no cover - optional dependency, intentionally graceful
    import redis.asyncio as redis
except Exception:  # pragma: no cover
    redis = None

AIINSIGHT_PREDICTION_CHANNEL = "aiinsight:predictions"


class AIInsightPredictionBus:
    """Shared bus for AI Insight prediction events.

    Uses Redis Pub/Sub when REDIS_URL is configured. When Redis is unavailable
    or unreachable, it falls back to an in-process asyncio queue bus so the
    same-process synthetic writer and WebSocket server can still exchange events.
    """

    def __init__(self, redis_url: str | None = None) -> None:
        self._redis_url = redis_url or os.getenv("REDIS_URL")
        self._redis_client = None
        if redis is not None and self._redis_url:
            try:
                self._redis_client = redis.Redis.from_url(self._redis_url, decode_responses=True)
            except Exception as exc:  # pragma: no cover - depends on runtime config
                logger.warning("Redis unavailable for AI Insight event bus: %s", exc)
                self._redis_client = None

        self._local_queues: Set[asyncio.Queue[str]] = set()
        self._local_tasks: Dict[asyncio.Queue[str], asyncio.Task[None]] = {}

    def subscribe(self) -> asyncio.Queue[str]:
        queue: asyncio.Queue[str] = asyncio.Queue()
        self._local_queues.add(queue)

        if self._redis_client is not None:
            task = asyncio.create_task(self._redis_listener(queue))
            self._local_tasks[queue] = task

        return queue

    def unsubscribe(self, queue: asyncio.Queue[str]) -> None:
        self._local_queues.discard(queue)
        task = self._local_tasks.pop(queue, None)
        if task and not task.done():
            task.cancel()

    async def publish(self, payload: Dict[str, Any]) -> None:
        encoded = json.dumps(payload, default=str)

        if self._redis_client is not None:
            try:
                await self._redis_client.publish(AIINSIGHT_PREDICTION_CHANNEL, encoded)
                return
            except Exception as exc:  # pragma: no cover - fallback below keeps runtime resilient
                logger.warning("Failed to publish AI Insight event to Redis: %s", exc)

        for queue in list(self._local_queues):
            try:
                await queue.put(encoded)
            except Exception:
                self.unsubscribe(queue)

    async def _redis_listener(self, queue: asyncio.Queue[str]) -> None:
        if self._redis_client is None:
            return

        pubsub = self._redis_client.pubsub()
        try:
            await pubsub.subscribe(AIINSIGHT_PREDICTION_CHANNEL)
            while True:
                try:
                    message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=0.5)
                except asyncio.CancelledError:
                    raise
                except Exception as exc:  # pragma: no cover - defensive handling
                    logger.warning("Redis AI Insight subscriber error: %s", exc)
                    await asyncio.sleep(0.5)
                    continue

                if message is not None:
                    data = message.get("data")
                    if isinstance(data, bytes):
                        data = data.decode("utf-8")
                    if isinstance(data, str) and data:
                        await queue.put(data)
        finally:
            try:
                await pubsub.close()
            except Exception:  # pragma: no cover
                pass
            self.unsubscribe(queue)


aiinsight_event_bus = AIInsightPredictionBus()
