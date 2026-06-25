"""
Ad Intelligence Platform — FastAPI application entry point.

Registers:
  - Dashboard REST router  (/api/v1/dashboard/*)
  - Dashboard WebSocket    (/ws/dashboard/live)
  - CORS middleware
  - Global exception handler
  - DB lifespan (engine connect / dispose)

Run with:
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.db.session import engine
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1 import ad_management
from app.websocket.dashboard_ws import dashboard_live_ws
from app.websocket.ad_management_ws import ad_management_live_ws
from app.api.v1.campaigns import router as campaigns_router
from app.websocket.campaigns_ws import router as campaigns_ws_router
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


# ---------------------------------------------------------------------------
# Lifespan — startup / shutdown hooks
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan context.

    Startup  : verify DB connectivity, warm Redis if configured.
    Shutdown : dispose DB engine, close Kafka producer.
    """
    logger.info("Starting Ad Intelligence Platform …")

    # Verify DB connection on startup
    try:
        async with engine.begin() as conn:
            await conn.run_sync(lambda _: None)
        logger.info("PostgreSQL connection verified.")
    except Exception as exc:
        logger.critical("Cannot connect to PostgreSQL: %s", exc)
        raise

    # ── Redis warm-up stub ──────────────────────────────────────────────
    # from app.db.session import redis_client
    # await redis_client.ping()
    # logger.info("Redis connection verified.")
    # ────────────────────────────────────────────────────────────────────

    # ── Kafka producer startup stub ─────────────────────────────────────
    # from app.db.session import kafka_producer
    # await kafka_producer.start()
    # logger.info("Kafka producer started.")
    # ────────────────────────────────────────────────────────────────────

    yield  # application is running

    # Shutdown
    logger.info("Shutting down …")
    await engine.dispose()

    # ── Kafka producer shutdown stub ────────────────────────────────────
    # await kafka_producer.stop()
    # ────────────────────────────────────────────────────────────────────


# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------

def create_app() -> FastAPI:
    application = FastAPI(
        title="Ad Intelligence Platform API",
        description=(
            "Production API for the AI-Powered Ad Intelligence and CTR "
            "Optimization Platform.  Exposes analytics, fraud signals, "
            "campaign metrics, and a real-time WebSocket feed."
        ),
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # ── CORS ────────────────────────────────────────────────────────────
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],          # Tighten for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── REST routers ────────────────────────────────────────────────────
    application.include_router(dashboard_router, prefix="/api/v1")
    application.include_router(ad_management.router, prefix="/api/v1")

    # ── WebSocket routes ────────────────────────────────────────────────
    application.add_api_websocket_route("/ws/dashboard/live", dashboard_live_ws)
    application.add_api_websocket_route("/ws/ad-management/analysis-log", ad_management_live_ws)  
    application.include_router(campaigns_router, prefix="/api/v1")
    application.include_router(campaigns_ws_router)

    # ── Global exception handler ─────────────────────────────────────────
    @application.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled exception on %s %s", request.method, request.url)
        return JSONResponse(
            status_code=500,
            content={"detail": "An internal server error occurred."},
        )

    return application


app: FastAPI = create_app()