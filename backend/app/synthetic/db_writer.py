"""Batched persistence for synthetic events using the existing session."""

from __future__ import annotations

import logging
from collections import Counter
from math import isfinite
from typing import Iterable

from sqlalchemy import insert, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ClickEvent, FraudEvent, MLPredictionLog, RecommendationLog, ShapInsight
from app.event_bus import aiinsight_event_bus
from app.synthetic.event_generator import SyntheticEvent

log = logging.getLogger(__name__)


def _genuine_shap_attributions(ctr_result: dict) -> list[dict[str, object]]:
    """Keep only complete feature rows emitted by the model's SHAP explainer."""
    explanation = ctr_result.get("shap_explanation")
    if not isinstance(explanation, list):
        return []

    attributions = []
    for item in explanation:
        if not isinstance(item, dict):
            continue
        feature_name = item.get("feature")
        feature_value = item.get("feature_value")
        shap_value = item.get("shap_value")
        try:
            numeric_feature_value = float(feature_value)
            numeric_shap_value = float(shap_value)
        except (TypeError, ValueError):
            log.warning("Skipping incomplete SHAP attribution: %s", item)
            continue
        if (
            not isinstance(feature_name, str)
            or not feature_name
            or feature_name == "unavailable"
            or not isfinite(numeric_feature_value)
            or not isfinite(numeric_shap_value)
        ):
            log.warning("Skipping invalid SHAP attribution: %s", item)
            continue
        attributions.append(
            {
                "feature_name": feature_name,
                "feature_value": numeric_feature_value,
                "shap_value": numeric_shap_value,
            }
        )
    return attributions


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
                counts, published_prediction_events = await self._write_batch(batch)
                await self.session.commit()
                totals.update(counts)
                for payload in published_prediction_events:
                    try:
                        await aiinsight_event_bus.publish(payload)
                    except Exception:
                        log.exception("AI insight prediction event publish failed for payload=%s", payload)
                log.info("Synthetic batch committed: %s", dict(counts))
            except Exception:
                await self.session.rollback()
                log.exception("Synthetic batch rolled back; continuing with later batches")
        return totals

    async def _write_batch(self, events: list[SyntheticEvent]) -> tuple[Counter[str], list[dict]]:
        click_rows = []
        recommendation_rows = []
        prediction_rows = []
        prediction_rows_by_event_id = {}
        shap_candidates_by_event_id = {}
        prediction_notifications = []
        fraud_rows = []
        seen_event_ids = set()
        prediction_insert_count = 0

        for event in events:
            if event.event_id in seen_event_ids:
                log.warning("Skipping duplicate synthetic event in batch: %s", event.event_id)
                continue
            seen_event_ids.add(event.event_id)

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

            prediction_row = {
                "event_id": event.event_id,
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
            prediction_rows.append(prediction_row)
            prediction_rows_by_event_id[event.event_id] = prediction_row
            shap_candidates_by_event_id[event.event_id] = (
                event,
                ctr_result,
                _genuine_shap_attributions(ctr_result),
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
            inserted_result = await self.session.execute(
                pg_insert(MLPredictionLog)
                .values(prediction_rows)
                .on_conflict_do_nothing(index_elements=[MLPredictionLog.event_id])
                .returning(MLPredictionLog.event_id)
            )
            new_event_ids = set(inserted_result.scalars().all())
            prediction_insert_count = len(new_event_ids)

            prediction_result = await self.session.execute(
                select(MLPredictionLog.event_id, MLPredictionLog.prediction_id).where(
                    MLPredictionLog.event_id.in_(prediction_rows_by_event_id)
                )
            )
            prediction_ids = {
                row.event_id: row.prediction_id for row in prediction_result.all()
            }

            attribution_rows = []
            for event_id, (event, ctr_result, attributions) in shap_candidates_by_event_id.items():
                if event_id not in new_event_ids:
                    continue
                prediction_id = prediction_ids.get(event_id)
                if prediction_id is None:
                    raise RuntimeError(f"Persisted prediction ID unavailable for event {event_id}")
                for attribution in attributions:
                    attribution_rows.append(
                        {
                            "campaign_id": event.campaign_id,
                            "prediction_id": prediction_id,
                            "feature_name": attribution["feature_name"],
                            "feature_value": attribution["feature_value"],
                            "shap_value": attribution["shap_value"],
                            "predicted_ctr": float(ctr_result["click_probability"]),
                            "explanation_model": ctr_result.get("model"),
                            "created_at": event.timestamp,
                        }
                    )

            if attribution_rows:
                await self.session.execute(
                    pg_insert(ShapInsight)
                    .values(attribution_rows)
                    .on_conflict_do_nothing(
                        index_elements=[
                            ShapInsight.prediction_id,
                            ShapInsight.feature_name,
                        ]
                    )
                )

            for row in prediction_rows:
                event_id = row["event_id"]
                if event_id not in new_event_ids:
                    continue
                prediction_notifications.append(
                    {
                        "type": "prediction_created",
                        "data": {
                            "prediction_id": prediction_ids[event_id],
                            "timestamp": row["timestamp"],
                            "campaign_name": None,
                            "ad_id": row["ad_id"],
                            "click_probability": float(row["click_probability"]),
                            "fraud_probability": float(row["fraud_probability"]),
                            "recommendation_score": float(row["recommendation_score"]),
                            "model_version": row["model_version"],
                            "inference_latency_ms": float(row["inference_latency_ms"]),
                        },
                    }
                )
        if fraud_rows:
            await self.session.execute(insert(FraudEvent), fraud_rows)
        return (
            Counter(
                click_events=len(click_rows),
                recommendation_logs=len(recommendation_rows),
                ml_prediction_logs=prediction_insert_count,
                fraud_events=len(fraud_rows),
            ),
            prediction_notifications,
        )
