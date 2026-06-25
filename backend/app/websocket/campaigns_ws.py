"""
Campaigns WebSocket Module — /ws/campaigns/*

Three persistent WebSocket channels:

  1. /ws/campaigns/live        — Platform KPIs pushed every 5 seconds
  2. /ws/campaigns/chart       — Single chart data point pushed every 3 seconds
  3. /ws/campaigns/fraud-feed  — Latest fraud event pushed every 4 seconds

Design principles:
  - Singleton ConnectionManager handles client lifecycle (connect / disconnect)
  - Each channel runs its own async push loop
  - Graceful disconnect on WebSocketDisconnect or any send failure
  - Structured logging on every lifecycle event
  - Future-ready: swap DB poll for Kafka consumer or Redis pub/sub per channel

NOTE: Register these routes on the FastAPI app instance (not APIRouter)
because WebSocket routes must be mounted at the app level:

    from app.websocket.campaigns_ws import router as campaigns_ws_router
    app.include_router(campaigns_ws_router)
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Dict, List, Set

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal
from app.services.campaigns_service import CampaignsService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Campaigns WebSocket"])

# ---------------------------------------------------------------------------
# Push intervals (seconds)
# ---------------------------------------------------------------------------

LIVE_PUSH_INTERVAL: float = 5.0
CHART_PUSH_INTERVAL: float = 3.0
FRAUD_FEED_PUSH_INTERVAL: float = 4.0


# ---------------------------------------------------------------------------
# Connection Manager
# ---------------------------------------------------------------------------


class ConnectionManager:
    """
    Manages active WebSocket clients per channel.

    Thread-safe for asyncio single-threaded event loop use.
    For multi-worker deployments, replace the in-process Set with a
    Redis pub/sub fan-out so all Uvicorn workers share state.

    TODO (Redis): on connect, subscribe worker to Redis channel;
                  on disconnect, unsubscribe. Publish from a single
                  background producer instead of per-worker polling.
    """

    def __init__(self) -> None:
        # channel_name -> set of active WebSocket connections
        self._channels: Dict[str, Set[WebSocket]] = {}

    def _ensure_channel(self, channel: str) -> None:
        if channel not in self._channels:
            self._channels[channel] = set()

    async def connect(self, channel: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self._ensure_channel(channel)
        self._channels[channel].add(websocket)
        logger.info(
            "WS client connected  | channel=%s | total=%d",
            channel,
            len(self._channels[channel]),
        )

    def disconnect(self, channel: str, websocket: WebSocket) -> None:
        self._ensure_channel(channel)
        self._channels[channel].discard(websocket)
        logger.info(
            "WS client disconnected | channel=%s | remaining=%d",
            channel,
            len(self._channels[channel]),
        )

    async def send_json(self, channel: str, websocket: WebSocket, payload: dict) -> None:
        """Send JSON payload to a single client; silently remove on failure."""
        try:
            await websocket.send_json(payload)
        except Exception as exc:
            logger.warning("WS send failed | channel=%s | error=%s", channel, exc)
            self.disconnect(channel, websocket)

    async def broadcast(self, channel: str, payload: dict) -> None:
        """Broadcast JSON payload to all clients on a channel."""
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
        return len(self._channels.get(channel, set()))


# Singleton — one manager instance per process
manager = ConnectionManager()


# ---------------------------------------------------------------------------
# DB session helper
# ---------------------------------------------------------------------------


async def _get_service() -> CampaignsService:
    """
    Open a scoped AsyncSession for use inside a WebSocket push loop.

    Each push tick gets its own session so transactions don't span ticks.
    Uses `AsyncSessionLocal` from `app.db.session` as the session factory.
    """
    async with AsyncSessionLocal() as session:
        return CampaignsService(db=session)


# ---------------------------------------------------------------------------
# Channel 1 — /ws/campaigns/live
# ---------------------------------------------------------------------------


@router.websocket("/ws/campaigns/live")
async def ws_campaigns_live(websocket: WebSocket) -> None:
    """
    Push aggregated live KPI update every 5 seconds.

    Payload::

        {
            "events_per_second": 8420.0,
            "active_users": 14200,
            "fraud_blocked_today": 24891,
            "avg_latency_ms": 24.0,
            "fraud_alert_count": 52
        }
    """
    channel = "live"
    await manager.connect(channel, websocket)
    try:
        while True:
            try:
                async with AsyncSessionLocal() as session:
                    service = CampaignsService(db=session)
                    update = await service.get_live_update()
                payload = update.model_dump()
                await manager.send_json(channel, websocket, payload)

                # If the client disconnected during send, bail out
                if websocket not in manager._channels.get(channel, set()):
                    break

            except WebSocketDisconnect:
                break
            except Exception as exc:
                logger.exception("ws_campaigns_live push error: %s", exc)
                # Don't kill the loop on a DB error — retry next tick
            await asyncio.sleep(LIVE_PUSH_INTERVAL)

    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(channel, websocket)
        logger.info("ws_campaigns_live: connection closed")


# ---------------------------------------------------------------------------
# Channel 2 — /ws/campaigns/chart
# ---------------------------------------------------------------------------


@router.websocket("/ws/campaigns/chart")
async def ws_campaigns_chart(websocket: WebSocket) -> None:
    """
    Push a single chart data point every 3 seconds.

    Payload::

        {
            "time": "10:32:10",
            "ctr": 2.8,
            "fraud_rate": 1.1,
            "events": 5200
        }
    """
    channel = "chart"
    await manager.connect(channel, websocket)
    try:
        while True:
            try:
                async with AsyncSessionLocal() as session:
                    service = CampaignsService(db=session)
                    point = await service.get_chart_update()
                payload = point.model_dump()
                await manager.send_json(channel, websocket, payload)

                if websocket not in manager._channels.get(channel, set()):
                    break

            except WebSocketDisconnect:
                break
            except Exception as exc:
                logger.exception("ws_campaigns_chart push error: %s", exc)
            await asyncio.sleep(CHART_PUSH_INTERVAL)

    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(channel, websocket)
        logger.info("ws_campaigns_chart: connection closed")


# ---------------------------------------------------------------------------
# Channel 3 — /ws/campaigns/fraud-feed
# ---------------------------------------------------------------------------


@router.websocket("/ws/campaigns/fraud-feed")
async def ws_campaigns_fraud_feed(websocket: WebSocket) -> None:
    """
    Push the latest fraud event every 4 seconds.

    In production, replace the DB poll with a Kafka consumer subscribed to
    the ``fraud-events`` topic so new events are pushed within milliseconds
    of detection rather than on a fixed timer.

    TODO (Kafka): ``consumer = AIOKafkaConsumer('fraud-events', ...)``
                  Replace the sleep loop with ``async for msg in consumer``.

    Payload::

        {
            "event_id": 1,
            "timestamp": "2025-08-01T10:32:10Z",
            "ip_address": "192.168.1.1",
            "fraud_score": 0.94,
            "fraud_category": "Bot Traffic",
            "status": "Blocked",
            "severity": "Critical"
        }
    """
    channel = "fraud-feed"
    await manager.connect(channel, websocket)

    last_event_id: int | None = None

    try:
        while True:
            try:
                async with AsyncSessionLocal() as session:
                    service = CampaignsService(db=session)
                    event = await service.get_latest_fraud_event()

                if event and event.event_id != last_event_id:
                    last_event_id = event.event_id
                    payload = event.model_dump()
                    # datetime is not JSON-serializable by default
                    payload["timestamp"] = event.timestamp.isoformat()
                    await manager.send_json(channel, websocket, payload)

                if websocket not in manager._channels.get(channel, set()):
                    break

            except WebSocketDisconnect:
                break
            except Exception as exc:
                logger.exception("ws_campaigns_fraud_feed push error: %s", exc)
            await asyncio.sleep(FRAUD_FEED_PUSH_INTERVAL)

    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(channel, websocket)
        logger.info("ws_campaigns_fraud_feed: connection closed")
