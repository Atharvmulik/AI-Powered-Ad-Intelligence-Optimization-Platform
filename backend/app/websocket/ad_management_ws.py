"""
WebSocket module for the Ad Management live-update feed.

Endpoint : WS /ws/ad-management/analysis-log

Pushes an AnalysisLogMessage payload every 4 seconds to all connected
clients, for the Real-Time AI Analysis Log terminal on the Ad Management
page.

Architecture notes
------------------
* Does NOT define a new ConnectionManager. The module-level `manager`
  singleton from app.websocket.dashboard_ws is imported and reused as-is
  — same connection registry, same send_json()/disconnect() plumbing
  that the Dashboard live feed already relies on.
* Connection bookkeeping (`_connections`, `_tasks`) and the Dashboard's
  own push loop are untouched. This module only adds its own push-loop
  coroutine and registers it against the shared manager.
* Each WebSocket connection runs its own async push loop via
  asyncio.create_task, exactly mirroring dashboard_ws.py's pattern but
  with this module's own interval and payload shape.
* Redis-ready: swap the DB call in _fetch_ad_management_log() for a
  Redis subscriber once a "ad-management:live" channel exists.
* Kafka-ready: replace the DB call with an AIOKafka consumer reading
  from an "ad-management-events" topic.
* All exceptions inside the push loop are caught so one bad client
  cannot crash the manager.
"""

from __future__ import annotations

import asyncio
import logging

from fastapi import WebSocket, WebSocketDisconnect

from app.db.session import AsyncSessionLocal
from app.schemas.ad_management import AnalysisLogMessage
from app.services.ad_management_service import AdManagementService
from app.websocket.dashboard_ws import manager  # reuse the existing singleton

logger = logging.getLogger(__name__)

# Push interval in seconds — independent of the Dashboard feed's _PUSH_INTERVAL
_AD_MGMT_PUSH_INTERVAL: float = 4.0

# Per-client push-loop tasks owned by this module. Kept separate from
# `manager._tasks` (which is reserved for the Dashboard feed's tasks) so
# a client connected to both feeds never has one task silently overwrite
# the other inside the shared manager's bookkeeping.
_ad_mgmt_tasks: dict[str, asyncio.Task] = {}


# ---------------------------------------------------------------------------
# Snapshot helper
# ---------------------------------------------------------------------------

async def _fetch_ad_management_log() -> AnalysisLogMessage:
    """
    Open a fresh DB session, generate one analysis log line, close session.

    Redis-ready: replace the DB call with:
        value = await redis_client.get("ad-management:live")
        return AnalysisLogMessage.model_validate_json(value)

    Kafka-ready: replace with an AIOKafka consumer reading from:
        topic = "ad-management-events"
    """
    async with AsyncSessionLocal() as session:
        service = AdManagementService(db=session)
        return await service.generate_analysis_log()


# ---------------------------------------------------------------------------
# Push loop
# ---------------------------------------------------------------------------

def _start_push_loop(client_id: str) -> None:
    """
    Spawn an async push task for a single Ad Management client.

    The task pushes a fresh AnalysisLogMessage every _AD_MGMT_PUSH_INTERVAL
    seconds until the client disconnects or the task is cancelled.
    """
    task = asyncio.create_task(
        _push_loop(client_id),
        name=f"ad-management-push-{client_id}",
    )
    _ad_mgmt_tasks[client_id] = task


async def _push_loop(client_id: str) -> None:
    """
    Internal coroutine: repeatedly fetch a log line and push it.

    Uses its own short-lived DB session per tick, same as the Dashboard
    feed's _push_loop(), so the WebSocket handler does not hold a DB
    connection open for the lifetime of the connection.
    """
    while client_id in manager._connections:  # noqa: SLF001 — shared registry, read-only check
        try:
            log_message = await _fetch_ad_management_log()
            payload = log_message.model_dump()
            success = await manager.send_json(client_id, payload)
            if not success:
                break  # client gone; cleanup happens in the finally block below
        except asyncio.CancelledError:
            logger.debug("Ad Management push loop cancelled for client %s", client_id)
            break
        except Exception as exc:
            logger.exception("Ad Management push loop error for client %s: %s", client_id, exc)
            # Don't crash — wait and retry on next tick
        await asyncio.sleep(_AD_MGMT_PUSH_INTERVAL)


def _stop_push_loop(client_id: str) -> None:
    """Cancel and remove this module's push task for a disconnected client."""
    task = _ad_mgmt_tasks.pop(client_id, None)
    if task and not task.done():
        task.cancel()


# ---------------------------------------------------------------------------
# WebSocket endpoint handler
# ---------------------------------------------------------------------------

async def ad_management_live_ws(websocket: WebSocket) -> None:
    """
    WebSocket endpoint handler for WS /ws/ad-management/analysis-log.

    Connect → start push loop → wait for disconnect / error → cleanup.

    Usage in main.py
    ----------------
    from app.websocket.ad_management_ws import ad_management_live_ws
    app.add_api_websocket_route("/ws/ad-management/analysis-log", ad_management_live_ws)

    Or with APIRouter (FastAPI ≥ 0.100):
    router.add_api_websocket_route("/analysis-log", ad_management_live_ws)
    """
    client_id = await manager.connect(websocket)

    # Send an immediate log line so the terminal UI isn't blank on connect.
    try:
        initial = await _fetch_ad_management_log()
        await manager.send_json(client_id, initial.model_dump())
    except Exception as exc:
        logger.exception("Failed to send initial Ad Management WS payload to %s: %s", client_id, exc)

    # Start this module's own background push loop.
    _start_push_loop(client_id)

    try:
        # Read-only feed; just wait for disconnect.
        while True:
            data = await websocket.receive_text()
            logger.debug("Ad Management WS message from %s: %s", client_id, data)
    except WebSocketDisconnect as exc:
        logger.info(
            "Ad Management WS client %s disconnected cleanly (code=%s reason=%s)",
            client_id,
            exc.code,
            exc.reason,
        )
    except Exception as exc:
        logger.warning("Ad Management WS client %s dropped unexpectedly: %s", client_id, exc)
    finally:
        _stop_push_loop(client_id)
        manager.disconnect(client_id)