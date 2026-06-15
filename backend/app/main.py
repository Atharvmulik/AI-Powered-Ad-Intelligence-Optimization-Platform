"""
main.py
=======
FastAPI application entry point for the
AI-Powered Ad Intelligence Optimization Platform.

Registered services:
  /api/v1/predict/click        — CTR Click Prediction Engine
  /api/v1/predict/click/batch  — Batch prediction (Kafka consumer)

Future services to add here:
  /api/v1/fraud                — Fraud Detection Service
  /api/v1/recommend            — Ad Recommendation Engine
  /api/v1/analytics            — Analytics & Reporting
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.click import router as click_router

# ── App instance ──────────────────────────────────────────────────────────────
app = FastAPI(
    title       = "AI-Powered Ad Intelligence Optimization Platform",
    description = (
        "Real-time ML pipeline for click prediction, fraud detection, "
        "and ad recommendation. Built with XGBoost, LightGBM, and FastAPI."
    ),
    version     = "1.0.0",
    docs_url    = "/docs",      # Swagger UI  → http://localhost:8000/docs
    redoc_url   = "/redoc",     # ReDoc UI    → http://localhost:8000/redoc
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Allows your React dashboard (localhost:3000) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["http://localhost:3000",
                         "http://localhost:5173",   # Vite dev server
                         "http://127.0.0.1:3000"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(click_router, prefix="/api/v1")

# Future routers — uncomment as you build each service:
# from app.api.v1.fraud      import router as fraud_router
# from app.api.v1.recommend  import router as recommend_router
# from app.api.v1.analytics  import router as analytics_router
# app.include_router(fraud_router,     prefix="/api/v1")
# app.include_router(recommend_router, prefix="/api/v1")
# app.include_router(analytics_router, prefix="/api/v1")

# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health_check():
    """
    Quick liveness check for the API.
    Hit this first to confirm the server is running.
    """
    return {
        "status"  : "healthy",
        "platform": "AI-Powered Ad Intelligence Optimization Platform",
        "version" : "1.0.0",
        "docs"    : "http://localhost:8000/docs",
    }


@app.get("/", tags=["System"])
async def root():
    return {
        "message" : "Ad Intelligence Platform API is running.",
        "docs"    : "http://localhost:8000/docs",
        "health"  : "http://localhost:8000/health",
    }


# ── Run directly ──────────────────────────────────────────────────────────────
# Use this for development only.
# Production: use uvicorn with gunicorn workers.
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host     = "0.0.0.0",
        port     = 8000,
        reload   = True,    # auto-reload on code changes
        log_level= "info",
    )