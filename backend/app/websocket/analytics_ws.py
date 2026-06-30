"""
Analytics WebSocket Module — /ws/analytics/*

Four persistent WebSocket channels:

  1. /ws/analytics/live      — Live dashboard KPIs pushed every 5 seconds
  2. /ws/analytics/ctr       — Single CTR chart data point pushed every 3 seconds
  3. /ws/analytics/fraud     — Latest fraud event pushed every 4 seconds
  4. /ws/analytics/terminal  — Latest AI terminal log pushed every 5 seconds

Design principles:
  - Singleton ConnectionManager handles client lifecycle (connect / disconnect)
  - Each channel runs its own async push loop
  - Graceful disconnect on WebSocketDisconnect or any send failure
  - Structured logging on every lifecycle event
  - Fresh AsyncSession created per tick — sessions never span push intervals
  - Future-ready: swap DB poll for Kafka consumer or Redis pub/sub per channel

NOTE: Register these routes on the FastAPI app instance (not APIRouter)
because WebSocket routes must be mounted at the app level:

    from app.websocket.analytics_ws import router as analytics_ws_router
    app.include_router(analytics_ws_router)
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Optional, Set

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.db.session import AsyncSessionLocal
from app.services.analytics_service import AnalyticsService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Analytics WebSocket"])

# ---------------------------------------------------------------------------
# Push intervals (seconds)
# ---------------------------------------------------------------------------

LIVE_PUSH_INTERVAL: float = 5.0
CTR_PUSH_INTERVAL: float = 3.0
FRAUD_PUSH_INTERVAL: float = 4.0
TERMINAL_PUSH_INTERVAL: float = 5.0


# ---------------------------------------------------------------------------
# Connection Manager
# ---------------------------------------------------------------------------


class ConnectionManager:
    """
    Manages active WebSocket clients per named channel.

    Thread-safe for asyncio single-threaded event loop use.
    For multi-worker deployments, replace the in-process Set with a
    Redis pub/sub fan-out so all Uvicorn workers share state.

    TODO (Redis): on connect, subscribe worker to Redis channel;
                  on disconnect, unsubscribe. Publish from a single
                  background producer instead of per-worker DB polling.
    """

    def __init__(self) -> None:
        # channel_name -> set of active WebSocket connections
        self._channels: Dict[str, Set[WebSocket]] = {}

    def _ensure_channel(self, channel: str) -> None:
        """Lazily initialise the set for a channel if it doesn't exist yet."""
        if channel not in self._channels:
            self._channels[channel] = set()

    async def connect(self, channel: str, websocket: WebSocket) -> None:
        """Accept the WebSocket handshake and register the client on the channel."""
        await websocket.accept()
        self._ensure_channel(channel)
        self._channels[channel].add(websocket)
        logger.info(
            "WS client connected  | channel=%s | total=%d",
            channel,
            len(self._channels[channel]),
        )

    def disconnect(self, channel: str, websocket: WebSocket) -> None:
        """Remove the client from the channel registry."""
        self._ensure_channel(channel)
        self._channels[channel].discard(websocket)
        logger.info(
            "WS client disconnected | channel=%s | remaining=%d",
            channel,
            len(self._channels[channel]),
        )

    async def send_json(self, channel: str, websocket: WebSocket, payload: dict) -> None:
        """
        Send a JSON payload to a single client.

        On any send failure the client is silently removed from the channel
        so the push loop does not retry a dead connection.
        """
        try:
            await websocket.send_json(payload)
        except Exception as exc:
            logger.warning("WS send failed | channel=%s | error=%s", channel, exc)
            self.disconnect(channel, websocket)

    async def broadcast(self, channel: str, payload: dict) -> None:
        """Broadcast a JSON payload to every client registered on a channel."""
        clients: List[WebSocket] = list(self._channels.get(channel, set()))
        if not clients:
            return
        dead: List[WebSocket] = []
        for ws in clients:
            try:
                await ws.send_json(payload)
            except Exception as exc:
                logger.warning(
                    "WS broadcast failed | channel=%s | error=%s", channel, exc
                )
                dead.append(ws)
        for ws in dead:
            self.disconnect(channel, ws)

    def client_count(self, channel: str) -> int:
        """Return the number of active clients on the given channel."""
        return len(self._channels.get(channel, set()))


# Singleton — one manager instance per process
manager = ConnectionManager()


# ---------------------------------------------------------------------------
# Channel 1 — /ws/analytics/live
# ---------------------------------------------------------------------------


@router.websocket("/ws/analytics/live")
async def ws_analytics_live(websocket: WebSocket) -> None:
    """
    Push aggregated live analytics KPIs every 5 seconds.

    Opens a fresh AsyncSession on each tick so that reads always reflect
    the latest committed data and sessions are never held open between ticks.

    TODO (Redis): cache AnalyticsService.get_live_update() result for 2 s
                  to reduce DB pressure when many clients are connected.

    Payload::

        {
            "active_users": 14200,
            "events_per_second": 8420.0,
            "avg_bid_latency_ms": 24.3,
            "fraud_rate": 1.8,
            "current_ctr": 3.42,
            "timestamp": "2025-08-01T10:32:10.000000"
        }
    """
    channel = "analytics-live"
    await manager.connect(channel, websocket)
    try:
        while True:
            try:
                async with AsyncSessionLocal() as session:
                    service = AnalyticsService(db=session)
                    update = await service.get_live_update()

                payload = update.model_dump()
                await manager.send_json(channel, websocket, payload)

                # If the client was removed during send, exit the loop cleanly
                if websocket not in manager._channels.get(channel, set()):
                    break

            except (WebSocketDisconnect, ConnectionResetError):
                break
            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.warning("ws_analytics_live push error: %s", exc)
                # Continue the loop on DB or serialization errors — retry next tick

            await asyncio.sleep(LIVE_PUSH_INTERVAL)

    except (WebSocketDisconnect, ConnectionResetError, asyncio.CancelledError):
        pass
    finally:
        manager.disconnect(channel, websocket)
        logger.info("ws_analytics_live: connection closed")


# ---------------------------------------------------------------------------
# Channel 2 — /ws/analytics/ctr
# ---------------------------------------------------------------------------


@router.websocket("/ws/analytics/ctr")
async def ws_analytics_ctr(websocket: WebSocket) -> None:
    """
    Push a single CTR chart data point every 3 seconds.

    Clients append each incoming point to the live CTR trend chart without
    requiring a full page reload or REST poll.

    TODO (Redis): publish CTR tick to a Redis sorted set on the producer side;
                  replace the DB query with a ZRANGE read here.

    Payload::

        {
            "time": "10:32:10",
            "ctr": 3.42,
            "events": 5200
        }
    """
    channel = "analytics-ctr"
    await manager.connect(channel, websocket)
    try:
        while True:
            try:
                async with AsyncSessionLocal() as session:
                    service = AnalyticsService(db=session)
                    point = await service.get_ctr_update()

                payload = point.model_dump()
                await manager.send_json(channel, websocket, payload)

                if websocket not in manager._channels.get(channel, set()):
                    break

            except (WebSocketDisconnect, ConnectionResetError):
                break
            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.warning("ws_analytics_ctr push error: %s", exc)

            await asyncio.sleep(CTR_PUSH_INTERVAL)

    except (WebSocketDisconnect, ConnectionResetError, asyncio.CancelledError):
        pass
    finally:
        manager.disconnect(channel, websocket)
        logger.info("ws_analytics_ctr: connection closed")


# ---------------------------------------------------------------------------
# Channel 3 — /ws/analytics/fraud
# ---------------------------------------------------------------------------


@router.websocket("/ws/analytics/fraud")
async def ws_analytics_fraud(websocket: WebSocket) -> None:
    """
    Push the latest fraud event every 4 seconds.

    Duplicate suppression is enforced by comparing the incoming event's
    timestamp string against the last pushed timestamp. The push is skipped
    when no new event has arrived since the previous tick.

    In production, replace the DB poll with a Kafka consumer subscribed to
    the ``fraud-events`` topic so new events are pushed within milliseconds
    of detection rather than on a fixed timer.

    TODO (Kafka): ``consumer = AIOKafkaConsumer('fraud-events', ...)``
                  Replace the sleep loop with ``async for msg in consumer``.

    Payload::

        {
            "timestamp": "2025-08-01T10:32:10.000000",
            "ip_address": "192.168.4.21",
            "fraud_score": 0.94,
            "category": "Bot Traffic",
            "action": "Blocked"
        }
    """
    channel = "analytics-fraud"
    await manager.connect(channel, websocket)

    try:
        while True:
            try:
                async with AsyncSessionLocal() as session:
                    service = AnalyticsService(db=session)
                    event = await service.get_latest_fraud()

                event_ts = (
                    event.timestamp.isoformat()
                    if isinstance(event.timestamp, datetime)
                    else str(event.timestamp)
                )
                payload = event.model_dump()
                payload["timestamp"] = event_ts

                await manager.send_json(channel, websocket, payload)

                if websocket not in manager._channels.get(channel, set()):
                    break

            except (WebSocketDisconnect, ConnectionResetError):
                break
            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.warning("ws_analytics_fraud push error: %s", exc)

            await asyncio.sleep(FRAUD_PUSH_INTERVAL)

    except (WebSocketDisconnect, ConnectionResetError, asyncio.CancelledError):
        pass
    finally:
        manager.disconnect(channel, websocket)
        logger.info("ws_analytics_fraud: connection closed")


# ---------------------------------------------------------------------------
# Channel 4 — /ws/analytics/terminal
# ---------------------------------------------------------------------------


@router.websocket("/ws/analytics/terminal")
async def ws_analytics_terminal(websocket: WebSocket) -> None:
    """
    Push the latest AI pipeline terminal log entry every 5 seconds.

    Duplicate suppression is enforced by comparing the ISO timestamp of the
    incoming log against the last pushed timestamp. The push is skipped when
    no new log entry has been written since the previous tick.

    TODO (Kafka): consume from the ``ml-inference-logs`` topic and push
                  each message as it arrives rather than polling on a timer.

    Payload::

        {
            "timestamp": "2025-08-01T10:32:10.000000",
            "message": "ML inference — model: v2.1.3 | latency: 18.4 ms | CTR: 3.42%",
            "type": "ML",
            "status": "SUCCESS"
        }
    """
    channel = "analytics-terminal"
    await manager.connect(channel, websocket)

    try:
        while True:
            try:
                async with AsyncSessionLocal() as session:
                    service = AnalyticsService(db=session)
                    log = await service.get_latest_terminal_log()

                log_ts = (
                    log.timestamp.isoformat()
                    if isinstance(log.timestamp, datetime)
                    else str(log.timestamp)
                )
                payload = log.model_dump()
                payload["timestamp"] = log_ts

                await manager.send_json(channel, websocket, payload)

                if websocket not in manager._channels.get(channel, set()):
                    break

            except (WebSocketDisconnect, ConnectionResetError):
                break
            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.warning("ws_analytics_terminal push error: %s", exc)

            await asyncio.sleep(TERMINAL_PUSH_INTERVAL)

    except (WebSocketDisconnect, ConnectionResetError, asyncio.CancelledError):
        pass
    finally:
        manager.disconnect(channel, websocket)
        logger.info("ws_analytics_terminal: connection closed")