"""
WebSocket module for the Dashboard live-update feed.

Endpoint : WS /ws/dashboard/live

Pushes a DashboardLiveUpdate payload every 5 seconds to all connected clients.
The ConnectionManager handles fan-out; each client gets its own push loop.

Architecture notes
------------------
* ConnectionManager is a singleton attached to the FastAPI lifespan.
* Each WebSocket connection runs its own async push loop via asyncio.create_task.
* Redis Pub/Sub ready: swap the _broadcast_snapshot() body for a Redis
  subscriber that listens on a "dashboard:live" channel.
* Kafka ready: replace the DB snapshot call in _compute_snapshot() with an
  AIOKafka consumer reading from a "dashboard-events" topic.
* All exceptions inside the push loop are caught so one bad client cannot
  crash the manager.
"""

from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Set

from fastapi import WebSocket, WebSocketDisconnect, status as ws_status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal
from app.schemas.dashboard import DashboardLiveUpdate
from app.services.dashboard_service import DashboardService

logger = logging.getLogger(__name__)

# Push interval in seconds
_PUSH_INTERVAL: float = 5.0


# ---------------------------------------------------------------------------
# ConnectionManager
# ---------------------------------------------------------------------------

class ConnectionManager:
    """
    Manages all active WebSocket connections for the live dashboard feed.

    Each connect() call returns a unique client_id.  The manager maintains
    a registry of {client_id -> WebSocket} and exposes broadcast / unicast
    helpers.  Disconnected sockets are removed automatically.

    This class is safe to use as a module-level singleton because all
    mutation happens on the event-loop thread via awaitable methods.
    """

    def __init__(self) -> None:
        self._connections: Dict[str, WebSocket] = {}
        self._tasks: Dict[str, asyncio.Task] = {}  # type: ignore[type-arg]

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    async def connect(self, websocket: WebSocket) -> str:
        """
        Accept a new WebSocket connection and register it.

        Parameters
        ----------
        websocket : WebSocket

        Returns
        -------
        str
            Unique client identifier derived from the connection object.
        """
        await websocket.accept()
        client_id = str(id(websocket))
        self._connections[client_id] = websocket
        logger.info("WS client connected: %s (total=%d)", client_id, len(self._connections))
        return client_id

    def disconnect(self, client_id: str) -> None:
        """
        Remove a client from the registry and cancel its push task.

        Parameters
        ----------
        client_id : str
        """
        self._connections.pop(client_id, None)

        task = self._tasks.pop(client_id, None)
        if task and not task.done():
            task.cancel()

        logger.info("WS client disconnected: %s (total=%d)", client_id, len(self._connections))

    # ------------------------------------------------------------------
    # Sending helpers
    # ------------------------------------------------------------------

    async def send_json(self, client_id: str, payload: dict) -> bool:
        """
        Send a JSON payload to a single client.

        Returns
        -------
        bool
            False if the send failed (connection dropped).
        """
        websocket = self._connections.get(client_id)
        if websocket is None:
            return False
        try:
            await websocket.send_text(json.dumps(payload, default=str))
            return True
        except Exception as exc:
            logger.warning("WS send failed for client %s: %s", client_id, exc)
            self.disconnect(client_id)
            return False

    async def broadcast(self, payload: dict) -> None:
        """
        Broadcast a JSON payload to all connected clients.

        Disconnected clients are pruned during the broadcast.
        """
        dead: Set[str] = set()
        for client_id, websocket in list(self._connections.items()):
            try:
                await websocket.send_text(json.dumps(payload, default=str))
            except Exception as exc:
                logger.warning("WS broadcast failed for client %s: %s", client_id, exc)
                dead.add(client_id)

        for client_id in dead:
            self.disconnect(client_id)

    # ------------------------------------------------------------------
    # Push loop management
    # ------------------------------------------------------------------

    def start_push_loop(self, client_id: str) -> None:
        """
        Spawn an async push task for a single client.

        The task pushes a fresh DashboardLiveUpdate every _PUSH_INTERVAL
        seconds until the client disconnects or the task is cancelled.
        """
        task = asyncio.create_task(
            self._push_loop(client_id),
            name=f"dashboard-push-{client_id}",
        )
        self._tasks[client_id] = task

    async def _push_loop(self, client_id: str) -> None:
        """
        Internal coroutine: repeatedly fetch a live snapshot and push it.

        Uses its own short-lived DB session so the WebSocket handler does
        not hold a DB connection open for the lifetime of the connection.
        """
        while client_id in self._connections:
            try:
                snapshot = await _fetch_live_snapshot()
                payload = snapshot.model_dump()
                success = await self.send_json(client_id, payload)
                if not success:
                    break  # client gone; task will be cancelled by disconnect()
            except asyncio.CancelledError:
                logger.debug("Push loop cancelled for client %s", client_id)
                break
            except Exception as exc:
                logger.exception("Push loop error for client %s: %s", client_id, exc)
                # Don't crash — wait and retry on next tick
            await asyncio.sleep(_PUSH_INTERVAL)


# Module-level singleton — import this in route handlers and lifespan hooks.
manager = ConnectionManager()


# ---------------------------------------------------------------------------
# Snapshot helper
# ---------------------------------------------------------------------------

async def _fetch_live_snapshot() -> DashboardLiveUpdate:
    """
    Open a fresh DB session, build a live snapshot, and close the session.

    Redis-ready: replace the DB call with:
        value = await redis_client.get("dashboard:live")
        return DashboardLiveUpdate.model_validate_json(value)

    Kafka-ready: replace with an AIOKafka consumer reading from:
        topic = "dashboard-events"
    and fold incoming events into the snapshot.
    """
    async with AsyncSessionLocal() as session:
        service = DashboardService(db=session)
        return await service.get_live_snapshot()


# ---------------------------------------------------------------------------
# WebSocket endpoint handler
# ---------------------------------------------------------------------------

async def dashboard_live_ws(websocket: WebSocket) -> None:
    """
    WebSocket endpoint handler for WS /ws/dashboard/live.

    Connect → start push loop → wait for disconnect / error → cleanup.

    Usage in main.py
    ----------------
    from app.websocket.dashboard_ws import dashboard_live_ws
    app.add_api_websocket_route("/ws/dashboard/live", dashboard_live_ws)

    Or with APIRouter (FastAPI ≥ 0.100):
    router.add_api_websocket_route("/live", dashboard_live_ws)
    """
    client_id = await manager.connect(websocket)

    # Send an immediate snapshot so the UI doesn't show a blank state.
    try:
        initial = await _fetch_live_snapshot()
        await manager.send_json(client_id, initial.model_dump())
    except Exception as exc:
        logger.exception("Failed to send initial WS payload to %s: %s", client_id, exc)

    # Start background push loop
    manager.start_push_loop(client_id)

    try:
        # Keep the connection open; handle client-sent messages if needed.
        # Currently the dashboard is read-only so we just wait for disconnect.
        while True:
            data = await websocket.receive_text()
            # Future: parse client commands (e.g. subscribe to a specific campaign)
            logger.debug("WS message from %s: %s", client_id, data)
    except WebSocketDisconnect as exc:
        logger.info(
            "WS client %s disconnected cleanly (code=%s reason=%s)",
            client_id,
            exc.code,
            exc.reason,
        )
    except Exception as exc:
        logger.warning("WS client %s dropped unexpectedly: %s", client_id, exc)
    finally:
        manager.disconnect(client_id)