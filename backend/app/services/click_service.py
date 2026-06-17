"""
click_service.py  (v2 — with SHAP cache)
-----------------------------------------
SHAP cache strategy:
  - SHAP is expensive (~120ms) but deterministic
  - Same feature vector → same SHAP output every time
  - Cache key = hash of the feature vector
  - Cache size = 1000 entries (LRU — evicts oldest)
  - Cache hit → 0ms SHAP latency
  - Cache miss → compute and store (~120ms, once)

In production this cache would be Redis.
For portfolio/local: Python dict with LRU is sufficient.
"""

import sys
import os
import hashlib
import json
from functools import lru_cache
sys.path.append(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from ml.inference_pipeline import CTRPredictor

# ── Singleton predictor — loaded once at startup ──────────────────────────────
_predictor = None

def get_predictor() -> CTRPredictor:
    global _predictor
    if _predictor is None:
        _predictor = CTRPredictor(model_type="xgboost")
    return _predictor


# ── SHAP cache — keyed by feature vector hash ─────────────────────────────────
_shap_cache: dict = {}
MAX_CACHE_SIZE = 1000

def _cache_key(event: dict) -> str:
    """Deterministic hash of the event dict for cache lookup."""
    serialized = json.dumps(event, sort_keys=True, default=str)
    return hashlib.md5(serialized.encode()).hexdigest()

def _evict_if_full():
    """Simple eviction — remove oldest 10% when full."""
    if len(_shap_cache) >= MAX_CACHE_SIZE:
        evict_count = MAX_CACHE_SIZE // 10
        for key in list(_shap_cache.keys())[:evict_count]:
            del _shap_cache[key]


# ── Public API ────────────────────────────────────────────────────────────────
def predict_click(event: dict) -> dict:
    """
    Single event prediction with cached SHAP.
    Flow:
      1. Run fast inference (no SHAP) — ~3ms
      2. Check SHAP cache
         HIT  → attach cached explanation, return  (~3ms total)
         MISS → compute SHAP, cache it, return     (~125ms first time)
    """
    predictor = get_predictor()

    # Fast inference first — always under 30ms
    result = predictor.predict(event, include_shap=False)

    # SHAP with cache
    key = _cache_key(event)
    if key in _shap_cache:
        result["shap_explanation"]  = _shap_cache[key]
        result["shap_cache_hit"]    = True
    else:
        shap_result = predictor.predict(event, include_shap=True)
        explanation = shap_result["shap_explanation"]
        _evict_if_full()
        _shap_cache[key]           = explanation
        result["shap_explanation"] = explanation
        result["shap_cache_hit"]   = False

    result["shap_cache_size"] = len(_shap_cache)
    return result


def predict_click_batch(events: list) -> list:
    """
    Batch prediction — no SHAP (Kafka consumer path).
    Each event: ~3ms. 50 events: ~150ms total.
    """
    predictor = get_predictor()
    return predictor.predict_batch(events, include_shap=False)


def get_cache_stats() -> dict:
    """Expose cache stats to the /health endpoint."""
    return {
        "shap_cache_size"   : len(_shap_cache),
        "shap_cache_max"    : MAX_CACHE_SIZE,
        "shap_cache_fill_pct": round(len(_shap_cache) / MAX_CACHE_SIZE * 100, 1),
    }