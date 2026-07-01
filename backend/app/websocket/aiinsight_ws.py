"""
WebSocket module for the AI Insight live-update feed.

Endpoint : WS /ws/aiinsight/live

Pushes an AIInsightLiveUpdate payload every 5 seconds to all connected clients.
The ConnectionManager handles fan-out; each client gets its own push loop.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Dict, Set

from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal
from app.schemas.aiinsight import AIInsightLiveUpdate
from app.services.aiinsight_service import AIInsightService

logger = logging.getLogger(__name__)

# Push interval in seconds
_PUSH_INTERVAL: float = 5.0


# ---------------------------------------------------------------------------
# ConnectionManager
# ---------------------------------------------------------------------------

class AIInsightConnectionManager:
    """Manages all active WebSocket connections for the AI Insight live feed."""

    def __init__(self) -> None:
        self._connections: Dict[str, WebSocket] = {}
        self._tasks: Dict[str, asyncio.Task] = {}  # type: ignore[type-arg]

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    async def connect(self, websocket: WebSocket) -> str:
        """Accept a new WebSocket connection and register it."""
        await websocket.accept()
        client_id = str(id(websocket))
        self._connections[client_id] = websocket
        logger.info("WS client connected: %s (total=%d)", client_id, len(self._connections))
        return client_id

    def disconnect(self, client_id: str) -> None:
        """Remove a client from the registry and cancel its push task."""
        self._connections.pop(client_id, None)

        task = self._tasks.pop(client_id, None)
        if task and not task.done():
            task.cancel()

        logger.info("WS client disconnected: %s (total=%d)", client_id, len(self._connections))

    # ------------------------------------------------------------------
    # Sending helpers
    # ------------------------------------------------------------------

    async def send_json(self, client_id: str, payload: dict) -> bool:
        """Send a JSON payload to a single client."""
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
        """Broadcast a JSON payload to all connected clients."""
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
        """Spawn an async push task for a single client."""
        task = asyncio.create_task(
            self._push_loop(client_id),
            name=f"aiinsight-push-{client_id}",
        )
        self._tasks[client_id] = task

    async def _push_loop(self, client_id: str) -> None:
        """Internal coroutine: repeatedly fetch a live snapshot and push it."""
        while client_id in self._connections:
            try:
                snapshot = await _fetch_live_snapshot()
                payload = snapshot.model_dump()
                success = await self.send_json(client_id, payload)
                if not success:
                    break
            except asyncio.CancelledError:
                logger.debug("Push loop cancelled for client %s", client_id)
                break
            except Exception as exc:
                logger.exception("Push loop error for client %s: %s", client_id, exc)
            await asyncio.sleep(_PUSH_INTERVAL)


# Module-level singleton — import this in route handlers and lifespan hooks.
manager = AIInsightConnectionManager()


# ---------------------------------------------------------------------------
# Snapshot helper
# ---------------------------------------------------------------------------

async def _fetch_live_snapshot() -> AIInsightLiveUpdate:
    """Open a fresh DB session, build a live snapshot, and close the session."""
    async with AsyncSessionLocal() as session:
        service = AIInsightService(db=session)
        return await service.get_live_snapshot()


# ---------------------------------------------------------------------------
# WebSocket endpoint handler
# ---------------------------------------------------------------------------

async def aiinsight_live_ws(websocket: WebSocket) -> None:
    """WebSocket endpoint handler for WS /ws/aiinsight/live."""
    client_id = await manager.connect(websocket)

    try:
        initial = await _fetch_live_snapshot()
        await manager.send_json(client_id, initial.model_dump())
    except Exception as exc:
        logger.exception("Failed to send initial WS payload to %s: %s", client_id, exc)

    manager.start_push_loop(client_id)

    try:
        while True:
            data = await websocket.receive_text()
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
