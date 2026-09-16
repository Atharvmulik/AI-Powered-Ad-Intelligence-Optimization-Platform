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

    def __init__(self, session: AsyncSession, batch_size: int = 100) -> None:
        self.session = session
        self.batch_size = batch_size

    async def write(self, events: Iterable[SyntheticEvent]) -> Counter[str]:
        event_list = list(events)
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
        click_rows = [
            {
                "timestamp": event.timestamp,
                "user_id": event.user_id,
                "ad_id": event.ad_id,
                "campaign_id": event.campaign_id,
                "clicked": event.clicked,
                "predicted_ctr": event.click_probability,
                "actual_outcome": int(event.clicked),
                "location": event.location,
            }
            for event in events
        ]
        recommendation_rows = [
            {
                "timestamp": event.timestamp,
                "user_id": event.user_id,
                "ad_id": event.ad_id,
                "recommendation_score": event.recommendation_score,
                "explanation": event.recommendation_explanation,
            }
            for event in events
        ]
        prediction_rows = [
            {
                "timestamp": event.timestamp,
                "user_id": event.user_id,
                "ad_id": event.ad_id,
                "campaign_id": event.campaign_id,
                "click_probability": event.click_probability,
                "fraud_probability": event.fraud_probability,
                "recommendation_score": event.recommendation_score,
                "model_version": "synthetic-v1.0",
                "inference_latency_ms": event.inference_latency_ms,
            }
            for event in events
        ]
        fraud_rows = [
            {
                "timestamp": event.timestamp,
                "user_id": event.user_id,
                "ip_address": event.ip_address,
                "fraud_score": event.fraud_score,
                "fraud_category": "Bot Farm" if event.behavior_profile == "fraud_bot" else "Fake Traffic",
                "status": "Blocked" if event.fraud_score >= 0.80 else "Pending",
                "severity": "CRITICAL" if event.fraud_score >= 0.90 else "HIGH" if event.fraud_score >= 0.70 else "LOW",
            }
            for event in events
            if event.fraud_score >= 0.40
        ]
        await self.session.execute(insert(ClickEvent), click_rows)
        await self.session.execute(insert(RecommendationLog), recommendation_rows)
        await self.session.execute(insert(MLPredictionLog), prediction_rows)
        if fraud_rows:
            await self.session.execute(insert(FraudEvent), fraud_rows)
        return Counter(
            click_events=len(click_rows),
            recommendation_logs=len(recommendation_rows),
            ml_prediction_logs=len(prediction_rows),
            fraud_events=len(fraud_rows),
        )
