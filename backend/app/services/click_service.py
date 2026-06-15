"""
click_service.py
----------------
Business logic layer for CTR click prediction.
Imports from ml/ — keeps FastAPI layer clean.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from ml.inference_pipeline import CTRPredictor

# Load ONCE at module import — not on every request
# This is critical: model loading takes 3-5 seconds
_predictor = None

def get_predictor() -> CTRPredictor:
    global _predictor
    if _predictor is None:
        _predictor = CTRPredictor(model_type="xgboost")
    return _predictor


def predict_click(event: dict) -> dict:
    """Single event prediction — called by click.py route."""
    predictor = get_predictor()
    return predictor.predict(event, include_shap=True)


def predict_click_batch(events: list) -> list:
    """Batch prediction — called by Kafka consumer."""
    predictor = get_predictor()
    return predictor.predict_batch(events, include_shap=False)