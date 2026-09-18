"""Batched persistence for synthetic events using the existing session."""

from __future__ import annotations

import logging
from collections import Counter
from typing import Iterable

from sqlalchemy import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ClickEvent, FraudEvent, MLPredictionLog, RecommendationLog
from app.synthetic.event_generator import SyntheticEvent

log = logging.getLogger(__name__)


class SyntheticEventWriter:
    """Write only supported rows; this class does not own database connectivity."""

    def __init__(self, session: AsyncSession, batch_size: int = 100, fraud_event_threshold: float = 0.50) -> None:
        self.session = session
        self.batch_size = batch_size
        self.fraud_event_threshold = fraud_event_threshold

    async def write(self, events: Iterable[SyntheticEvent]) -> Counter[str]:
        event_list = list(events)
        if not event_list:
            return Counter()
        totals: Counter[str] = Counter()
        for start in range(0, len(event_list), self.batch_size):
            batch = event_list[start : start + self.batch_size]
            try:
                counts = await self._write_batch(batch)
                await self.session.commit()
                totals.update(counts)
                log.info("Synthetic batch committed: %s", dict(counts))
            except Exception:
                await self.session.rollback()
                log.exception("Synthetic batch rolled back; continuing with later batches")
        return totals

    async def _write_batch(self, events: list[SyntheticEvent]) -> Counter[str]:
        click_rows = []
        recommendation_rows = []
        prediction_rows = []
        fraud_rows = []

        for event in events:
            ctr_result = event.ctr_result or {}
            fraud_result = event.fraud_result or {}
            recommendation_result = event.recommendation_result or {}

            click_prediction = ctr_result.get("click_probability")
            recommendation_value = recommendation_result.get("recommendation_score") or recommendation_result.get("final_score")
            fraud_score = fraud_result.get("fraud_score")

            if click_prediction is None or recommendation_value is None or fraud_score is None:
                log.warning(
                    "Skipping synthetic event for user=%s ad=%s because real model outputs were unavailable (ctr=%s recommendation=%s fraud=%s)",
                    event.user_id,
                    event.ad_id,
                    click_prediction is not None,
                    recommendation_value is not None,
                    fraud_score is not None,
                )
                continue

            click_rows.append(
                {
                    "timestamp": event.timestamp,
                    "user_id": event.user_id,
                    "ad_id": event.ad_id,
                    "campaign_id": event.campaign_id,
                    "clicked": bool(event.clicked),
                    "predicted_ctr": float(click_prediction),
                    "actual_outcome": int(bool(event.clicked)),
                    "location": event.location,
                }
            )

            recommendation_rows.append(
                {
                    "timestamp": event.timestamp,
                    "user_id": event.user_id,
                    "ad_id": event.ad_id,
                    "recommendation_score": float(recommendation_value),
                    "explanation": recommendation_result.get("explanation") or event.recommendation_explanation,
                }
            )

            prediction_rows.append(
                {
                    "timestamp": event.timestamp,
                    "user_id": event.user_id,
                    "ad_id": event.ad_id,
                    "campaign_id": event.campaign_id,
                    "click_probability": float(click_prediction),
                    "fraud_probability": float(fraud_score),
                    "recommendation_score": float(recommendation_value),
                    "model_version": "synthetic-v1.0",
                    "inference_latency_ms": float((ctr_result.get("inference_latency_ms") or 0.0) + (fraud_result.get("inference_latency_ms") or 0.0) + (recommendation_result.get("inference_latency_ms") or 0.0)),
                }
            )

            if float(fraud_score) >= self.fraud_event_threshold:
                fraud_rows.append(
                    {
                        "timestamp": event.timestamp,
                        "user_id": event.user_id,
                        "ip_address": event.ip,
                        "fraud_score": float(fraud_score),
                        "fraud_category": "Bot Farm" if event.profile_name == "suspicious_high_frequency" else "Fake Traffic",
                        "status": "Blocked" if float(fraud_score) >= 0.80 else "Pending",
                        "severity": "CRITICAL" if float(fraud_score) >= 0.90 else "HIGH" if float(fraud_score) >= 0.70 else "LOW",
                    }
                )

        if click_rows:
            await self.session.execute(insert(ClickEvent), click_rows)
        if recommendation_rows:
            await self.session.execute(insert(RecommendationLog), recommendation_rows)
        if prediction_rows:
            await self.session.execute(insert(MLPredictionLog), prediction_rows)
        if fraud_rows:
            await self.session.execute(insert(FraudEvent), fraud_rows)
        return Counter(
            click_events=len(click_rows),
            recommendation_logs=len(recommendation_rows),
            ml_prediction_logs=len(prediction_rows),
            fraud_events=len(fraud_rows),
        )
