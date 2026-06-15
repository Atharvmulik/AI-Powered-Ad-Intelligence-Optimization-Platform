"""
click.py (router)
-----------------
FastAPI route for CTR click prediction.
POST /api/v1/predict/click
"""
from fastapi import APIRouter, HTTPException
from app.schemas.click import ClickPredictRequest, ClickPredictResponse
from app.services.click_service import predict_click, predict_click_batch

router = APIRouter(prefix="/predict", tags=["Click Prediction"])


@router.post("/click", response_model=ClickPredictResponse)
async def predict_click_endpoint(event: ClickPredictRequest):
    """
    Predict click probability for a single ad event.
    Returns probability, SHAP explanation, and serve decision.
    PRD target: < 30ms inference latency.
    """
    try:
        result = predict_click(event.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/click/batch")
async def predict_click_batch_endpoint(events: list[ClickPredictRequest]):
    """
    Batch prediction for Kafka consumer.
    SHAP disabled for speed in batch mode.
    """
    try:
        return predict_click_batch([e.model_dump() for e in events])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))