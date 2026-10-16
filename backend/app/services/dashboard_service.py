"""DashboardService — analytics layer for the synthetic-event dashboard.

This service intentionally consumes the real PostgreSQL data already written by the
synthetic generator and ML inference pipeline. It does not invent schema fields,
random values, or fake metrics.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from sqlalchemy import and_, case, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.dashboard import (
    AIAdDecisionResponse,
    AIRecommendationResponse,
    CampaignAnalyticsResponse,
    CampaignOpportunityItem,
    CampaignOpportunityRadarResponse,
    CTRModelHealthResponse,
    CTRTrendResponse,
    DashboardLiveUpdate,
    ExecutiveSummaryResponse,
    FraudAlertResponse,
    FraudModelHealthResponse,
    GeographicTrafficResponse,
    InsightItem,
    ModelIntelligenceResponse,
    OverviewResponse,
    RecommendationEngineHealthResponse,
    SHAPExplanationResponse,
    SHAPFeatureItem,
    SystemHealthResponse,
    TopAdResponse,
)

logger = logging.getLogger(__name__)


def _models():
    """Return ORM model classes at call time to avoid circular imports."""
    from app.db.models import (  # noqa: PLC0415
        AdCampaign,
        ClickEvent,
        FraudEvent,
        InfrastructureMetric,
        MLPredictionLog,
        RecommendationLog,
        ShapInsight,
        User,
    )

    return (
        AdCampaign,
        ClickEvent,
        FraudEvent,
        InfrastructureMetric,
        MLPredictionLog,
        RecommendationLog,
        ShapInsight,
        User,
    )


async def _cache_get(key: str) -> Optional[str]:
    """Redis GET stub kept intentionally empty for the current architecture."""
    return None  # pragma: no cover


async def _cache_set(key: str, value: str, ttl_seconds: int = 30) -> None:
    """Redis SET stub kept intentionally empty for the current architecture."""
    return  # pragma: no cover


async def _publish_event(topic: str, payload: dict) -> None:
    """Kafka producer stub kept intentionally empty for the current architecture."""
    return  # pragma: no cover


class DashboardService:
    """Encapsulates dashboard analytics backed by the PostgreSQL synthetic stream."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    @staticmethod
    def _safe_ratio(numerator: float | int, denominator: float | int) -> float:
        if denominator in (None, 0):
            return 0.0
        return round((float(numerator) / float(denominator)) * 100.0, 2)

    async def _event_metrics(
        self,
        start: datetime | None = None,
        end: datetime | None = None,
    ) -> tuple[int, int, int, int]:
        """Return total events, impressions, clicks, and conversions from ClickEvent.

        The current schema uses ClickEvent.clicked as the real event-state flag and
        actual_outcome as the conversion signal. There is no event_type field in the
        persisted ORM model, so this is the safe schema-backed interpretation.
        """
        _, ClickEvent, _, _, _, _, _, _ = _models()
        stmt = select(
            func.count().label("total_events"),
            func.sum(case((ClickEvent.clicked.is_(False), 1), else_=0)).label("impressions"),
            func.sum(case((ClickEvent.clicked.is_(True), 1), else_=0)).label("clicks"),
            func.sum(case((ClickEvent.actual_outcome == 1, 1), else_=0)).label("conversions"),
        ).select_from(ClickEvent)
        if start is not None:
            stmt = stmt.where(ClickEvent.timestamp >= start)
        if end is not None:
            stmt = stmt.where(ClickEvent.timestamp <= end)

        row = (await self._db.execute(stmt)).one()
        total_events = int(row.total_events or 0)
        impressions = int(row.impressions or 0)
        clicks = int(row.clicks or 0)
        conversions = int(row.conversions or 0)
        return total_events, impressions, clicks, conversions

    async def _active_users(self, window_minutes: int = 15) -> int:
        """Count distinct users with real activity in the recent ClickEvent stream."""
        _, ClickEvent, _, _, _, _, _, _ = _models()
        window_start = datetime.now(timezone.utc) - timedelta(minutes=window_minutes)
        result = await self._db.execute(
            select(func.count(func.distinct(ClickEvent.user_id)))
            .where(ClickEvent.timestamp >= window_start)
        )
        return int(result.scalar_one() or 0)

    async def _compute_ctr(
        self,
        start: datetime | None = None,
        end: datetime | None = None,
    ) -> float:
        """CTR = clicks / impressions x 100 using actual ClickEvent rows."""
        _, ClickEvent, _, _, _, _, _, _ = _models()
        stmt = select(
            func.sum(case((ClickEvent.clicked.is_(True), 1), else_=0)).label("clicks"),
            func.sum(case((ClickEvent.clicked.is_(False), 1), else_=0)).label("impressions"),
        ).select_from(ClickEvent)
        if start is not None:
            stmt = stmt.where(ClickEvent.timestamp >= start)
        if end is not None:
            stmt = stmt.where(ClickEvent.timestamp <= end)

        row = (await self._db.execute(stmt)).one()
        clicks = int(row.clicks or 0)
        impressions = int(row.impressions or 0)
        return self._safe_ratio(clicks, impressions)

    async def _compute_events_per_second(self, window_minutes: int = 1) -> float:
        """Return synthetic events per second in the recent window."""
        _, ClickEvent, _, _, _, _, _, _ = _models()
        if window_minutes <= 0:
            return 0.0
        window_start = datetime.now(timezone.utc) - timedelta(minutes=window_minutes)
        result = await self._db.execute(
            select(func.count())
            .select_from(ClickEvent)
            .where(ClickEvent.timestamp >= window_start)
        )
        total_events = int(result.scalar_one() or 0)
        return round(total_events / (window_minutes * 60), 2)

    async def _fraud_user_ids(
        self,
        start: datetime | None = None,
        end: datetime | None = None,
    ) -> set[str]:
        """Return user IDs flagged by FraudEvent.

        There is no direct FK between ClickEvent and FraudEvent in the current schema, so
        we use the schema-supported relationship available to both tables: the shared
        user_id and timestamp window. This is the safest event-to-fraud approximation that
        can be derived without inventing new columns or foreign keys.
        """
        _, _, FraudEvent, _, _, _, _, _ = _models()
        stmt = select(FraudEvent.user_id).where(FraudEvent.fraud_score >= 0.5)
        if start is not None:
            stmt = stmt.where(FraudEvent.timestamp >= start)
        if end is not None:
            stmt = stmt.where(FraudEvent.timestamp <= end)
        stmt = stmt.group_by(FraudEvent.user_id)
        result = await self._db.execute(stmt)
        return {str(row[0]) for row in result.all() if row[0] is not None}

    async def _fraud_filtered_clicks(
        self,
        start: datetime | None = None,
        end: datetime | None = None,
        campaign_id: int | None = None,
    ) -> int:
        """Best-effort fraudulent click counts using user-based attribution.

        Because the current schema does not persist an event-level fraud foreign key,
        a click is treated as fraud-flagged when it comes from a user_id that also has
        a persisted FraudEvent with a meaningful fraud score.
        """
        _, ClickEvent, _, _, _, _, _, _ = _models()
        user_ids = await self._fraud_user_ids(start=start, end=end)
        if not user_ids:
            return 0

        stmt = (
            select(func.count())
            .select_from(ClickEvent)
            .where(ClickEvent.clicked.is_(True))
            .where(ClickEvent.user_id.in_(list(user_ids)))
        )
        if start is not None:
            stmt = stmt.where(ClickEvent.timestamp >= start)
        if end is not None:
            stmt = stmt.where(ClickEvent.timestamp <= end)
        if campaign_id is not None:
            stmt = stmt.where(ClickEvent.campaign_id == campaign_id)

        count = await self._db.execute(stmt)
        return int(count.scalar_one() or 0)

    async def _fraud_clicks_by_campaign(
        self,
        start: datetime | None = None,
        end: datetime | None = None,
    ) -> dict[int, int]:
        """Map campaign_id to fraud-flagged click count using the same user-based fallback."""
        _, ClickEvent, _, _, _, _, _, _ = _models()
        user_ids = await self._fraud_user_ids(start=start, end=end)
        if not user_ids:
            return {}

        stmt = (
            select(
                ClickEvent.campaign_id.label("campaign_id"),
                func.count().label("fraud_clicks"),
            )
            .where(ClickEvent.clicked.is_(True))
            .where(ClickEvent.campaign_id.is_not(None))
            .where(ClickEvent.user_id.in_(list(user_ids)))
            .group_by(ClickEvent.campaign_id)
        )
        if start is not None:
            stmt = stmt.where(ClickEvent.timestamp >= start)
        if end is not None:
            stmt = stmt.where(ClickEvent.timestamp <= end)

        rows = (await self._db.execute(stmt)).all()
        return {int(row.campaign_id): int(row.fraud_clicks or 0) for row in rows if row.campaign_id is not None}

    async def _overview_snapshot(self) -> dict:
        """Shared recent KPI snapshot; ClickEvent only stores binary outcomes.

        The event-rate denominator stays at 10 seconds, including during startup.
        """
        AdCampaign, ClickEvent, _, _, MLPredictionLog, _, _, _ = _models()
        now = datetime.now(timezone.utc)
        fifteen_minutes_ago = now - timedelta(minutes=15)
        five_minutes_ago = now - timedelta(minutes=5)
        ten_seconds_ago = now - timedelta(seconds=10)
        one_minute_ago = now - timedelta(minutes=1)

        recent_metrics_row = await self._db.execute(
            select(
                func.count().label("total_events"),
                func.sum(case((ClickEvent.clicked.is_(False), 1), else_=0)).label("impressions"),
                func.sum(case((ClickEvent.clicked.is_(True), 1), else_=0)).label("clicks"),
                func.sum(case((ClickEvent.actual_outcome == 1, 1), else_=0)).label("conversions"),
            )
            .select_from(ClickEvent)
            .where(ClickEvent.timestamp >= fifteen_minutes_ago)
            .where(ClickEvent.timestamp <= now)
        )
        recent_metrics = recent_metrics_row.one()
        total_events = int(recent_metrics.total_events or 0)
        total_impressions = int(recent_metrics.impressions or 0)
        total_clicks = int(recent_metrics.clicks or 0)
        total_conversions = int(recent_metrics.conversions or 0)
        ctr = self._safe_ratio(total_clicks, total_impressions)

        active_users_row = await self._db.execute(
            select(func.count(func.distinct(ClickEvent.user_id)))
            .select_from(ClickEvent)
            .where(ClickEvent.timestamp >= five_minutes_ago)
            .where(ClickEvent.timestamp <= now)
            .where(ClickEvent.clicked.is_(True))
        )
        active_users = int(active_users_row.scalar_one() or 0)

        fraud_score_row = await self._db.execute(
            select(func.avg(MLPredictionLog.fraud_probability))
            .select_from(MLPredictionLog)
            .where(MLPredictionLog.timestamp >= fifteen_minutes_ago)
            .where(MLPredictionLog.timestamp <= now)
        )
        fraud_score = round(float(fraud_score_row.scalar_one() or 0.0) * 100.0, 2)

        revenue_row = await self._db.execute(select(func.sum(AdCampaign.revenue)))
        revenue = float(revenue_row.scalar_one() or 0.0)

        events_row = await self._db.execute(
            select(func.count())
            .select_from(ClickEvent)
            .where(ClickEvent.timestamp >= ten_seconds_ago)
            .where(ClickEvent.timestamp <= now)
        )
        recent_events = int(events_row.scalar_one() or 0)
        events_per_second = round(recent_events / 10.0, 2)

        recent_clicks_row = await self._db.execute(
            select(func.count())
            .select_from(ClickEvent)
            .where(ClickEvent.timestamp >= one_minute_ago)
            .where(ClickEvent.timestamp <= now)
            .where(ClickEvent.clicked.is_(True))
        )
        recent_clicks = int(recent_clicks_row.scalar_one() or 0)
        clicks_per_second = round(recent_clicks / 60.0, 2)

        return {
            "total_events": total_events,
            "total_impressions": total_impressions,
            "total_clicks": total_clicks,
            "total_conversions": total_conversions,
            "ctr": ctr,
            "active_users": active_users,
            "fraud_score": fraud_score,
            "revenue": revenue,
            "events_per_second": events_per_second,
            "clicks_per_second": clicks_per_second,
        }

    async def get_overview(self) -> OverviewResponse:
        """Compute top-level KPI metrics from actual generated synthetic traffic."""
        metrics = await self._overview_snapshot()
        return OverviewResponse(
            total_clicks=metrics["total_clicks"],
            ctr=metrics["ctr"],
            active_users=metrics["active_users"],
            fraud_score=metrics["fraud_score"],
            revenue=metrics["revenue"],
            events_per_second=metrics["events_per_second"],
            clicks_per_second=metrics["clicks_per_second"],
        )

    async def get_executive_summary(self) -> ExecutiveSummaryResponse:
        """Derive insights from recent synthetic event and fraud activity."""
        AdCampaign, ClickEvent, FraudEvent, _, _, _, _, User = _models()
        db = self._db
        now = datetime.now(timezone.utc)
        current_start = now - timedelta(hours=24)
        previous_start = now - timedelta(hours=48)
        previous_end = now - timedelta(hours=24)

        def _pct_change(current_value: float | None, previous_value: float | None) -> float | None:
            if current_value is None or previous_value in (None, 0):
                return None
            return ((float(current_value) - float(previous_value)) / float(previous_value)) * 100.0

        def _format_currency(value: float) -> str:
            return f"₹{float(value):,.2f}"

        async def _period_ctr(start: datetime, end: datetime) -> tuple[int, float]:
            row = await db.execute(
                select(
                    func.count().label("row_count"),
                    func.sum(case((ClickEvent.clicked.is_(True), 1), else_=0)).label("clicks"),
                    func.sum(case((ClickEvent.clicked.is_(False), 1), else_=0)).label("impressions"),
                )
                .where(ClickEvent.timestamp >= start)
                .where(ClickEvent.timestamp < end)
                .select_from(ClickEvent)
            )
            result = row.one()
            row_count = int(result.row_count or 0)
            clicks = int(result.clicks or 0)
            impressions = int(result.impressions or 0)
            return row_count, self._safe_ratio(clicks, impressions)

        async def _period_fraud(start: datetime, end: datetime) -> tuple[int, float]:
            row = await db.execute(
                select(
                    func.count().label("row_count"),
                    func.avg(FraudEvent.fraud_score).label("avg_fraud_score"),
                )
                .where(FraudEvent.timestamp >= start)
                .where(FraudEvent.timestamp < end)
                .select_from(FraudEvent)
            )
            result = row.one()
            row_count = int(result.row_count or 0)
            avg_fraud_score = float(result.avg_fraud_score or 0.0) * 100.0
            return row_count, avg_fraud_score

        async def _period_revenue(start: datetime, end: datetime) -> tuple[int, float]:
            row = await db.execute(
                select(
                    func.count().label("row_count"),
                    func.sum(AdCampaign.revenue).label("revenue"),
                )
                .where(AdCampaign.start_date.is_(None) | (AdCampaign.start_date <= end.date()))
                .where(AdCampaign.end_date.is_(None) | (AdCampaign.end_date >= start.date()))
            )
            result = row.one()
            row_count = int(result.row_count or 0)
            revenue = float(result.revenue or 0.0)
            return row_count, revenue

        current_ctr_rows, current_ctr = await _period_ctr(current_start, now)
        previous_ctr_rows, previous_ctr = await _period_ctr(previous_start, previous_end)
        ctr_delta = _pct_change(current_ctr, previous_ctr)

        current_fraud_rows, current_fraud = await _period_fraud(current_start, now)
        previous_fraud_rows, previous_fraud = await _period_fraud(previous_start, previous_end)
        fraud_delta = _pct_change(current_fraud, previous_fraud)

        current_revenue_rows, current_revenue = await _period_revenue(current_start, now)
        previous_revenue_rows, previous_revenue = await _period_revenue(previous_start, previous_end)
        revenue_delta = _pct_change(current_revenue, previous_revenue)

        top_segment_row = await db.execute(
            select(
                User.interests.label("segment"),
                func.count(ClickEvent.event_id).label("cnt"),
            )
            .join(ClickEvent, ClickEvent.user_id == User.user_id)
            .where(ClickEvent.timestamp >= current_start)
            .where(ClickEvent.timestamp < now)
            .where(ClickEvent.clicked.is_(True))
            .where(User.interests.is_not(None))
            .where(User.interests != "")
            .group_by(User.interests)
            .order_by(desc("cnt"), User.interests)
            .limit(1)
        )
        top_row = top_segment_row.first()
        top_segment = str(top_row.segment).strip() if top_row and top_row.segment else None

        def _build_trend(delta_value: float | None, precision: int = 2) -> tuple[str, str]:
            if delta_value is None:
                return "N/A", "neutral"
            if abs(delta_value) < 10 ** (-precision):
                return f"{0:.{precision}f}%" if precision > 1 else "0.0%", "neutral"
            if delta_value > 0:
                return f"+{delta_value:.{precision}f}%", "up"
            if delta_value < 0:
                return f"-{abs(delta_value):.{precision}f}%", "down"
            return f"{0:.{precision}f}%", "neutral"

        if ctr_delta is not None:
            ctr_trend, ctr_status = _build_trend(ctr_delta, 2)
            ctr_text = (
                f"CTR increased to {current_ctr:.2f}%, up {abs(ctr_delta):.2f}% from the previous period."
                if ctr_delta > 0
                else f"CTR decreased to {current_ctr:.2f}%, down {abs(ctr_delta):.2f}% from the previous period."
                if ctr_delta < 0
                else f"CTR is currently {current_ctr:.2f}% and remained unchanged from the previous period."
            )
        elif previous_ctr_rows > 0 and previous_ctr == 0 and current_ctr > 0:
            ctr_trend, ctr_status = "N/A", "neutral"
            ctr_text = f"CTR is currently {current_ctr:.2f}%. A percentage comparison is unavailable because the previous period had no measurable CTR."
        else:
            ctr_trend, ctr_status = "N/A", "neutral"
            ctr_text = f"CTR is currently {current_ctr:.2f}%. No previous-period comparison is available yet."

        if fraud_delta is not None:
            fraud_trend, fraud_status = _build_trend(fraud_delta, 1)
            if fraud_delta > 0:
                fraud_text = f"Average fraud score increased by {abs(fraud_delta):.1f}% from the previous period."
            elif fraud_delta < 0:
                fraud_text = f"Average fraud score decreased by {abs(fraud_delta):.1f}% from the previous period."
            else:
                fraud_text = "Average fraud score remained stable compared with the previous period."
        elif previous_fraud_rows > 0 and previous_fraud == 0:
            fraud_trend, fraud_status = "N/A", "neutral"
            fraud_text = f"Fraud activity is currently {current_fraud:.1f}%. A percentage comparison is unavailable because the previous period had no measurable fraud score."
        else:
            fraud_trend, fraud_status = "N/A", "neutral"
            fraud_text = "Fraud activity is currently stable. No previous-period comparison is available yet."

        if revenue_delta is not None:
            rev_trend, rev_status = _build_trend(revenue_delta, 1)
            if revenue_delta > 0:
                revenue_text = f"Revenue increased by {abs(revenue_delta):.1f}% compared with the previous period."
            elif revenue_delta < 0:
                revenue_text = f"Revenue decreased by {abs(revenue_delta):.1f}% compared with the previous period."
            else:
                revenue_text = "Revenue remained unchanged compared with the previous period."
        elif previous_revenue_rows > 0 and previous_revenue == 0:
            rev_trend, rev_status = "N/A", "neutral"
            revenue_text = f"Revenue is currently {_format_currency(current_revenue)}. A percentage comparison is unavailable because the previous period had no measurable revenue."
        else:
            rev_trend, rev_status = "N/A", "neutral"
            revenue_text = f"Revenue is currently {_format_currency(current_revenue)}. No previous-period comparison is available yet."

        if top_segment:
            audience_text = f"Top audience segment driving clicks: {top_segment}."
            audience_trend = "N/A"
            audience_status = "neutral"
        else:
            audience_text = "Top audience segment data is not available yet."
            audience_trend = "N/A"
            audience_status = "neutral"

        insights: List[InsightItem] = [
            InsightItem(text=ctr_text, trend=ctr_trend, status=ctr_status),
            InsightItem(text=fraud_text, trend=fraud_trend, status=fraud_status),
            InsightItem(text=revenue_text, trend=rev_trend, status=rev_status),
            InsightItem(text=audience_text, trend=audience_trend, status=audience_status),
        ]

        summary_parts: list[str] = []
        if ctr_delta is not None:
            summary_parts.append(
                f"Platform CTR is currently {current_ctr:.2f}%, with a {abs(ctr_delta):.2f}% change compared with the previous period."
            )
        else:
            summary_parts.append(f"Platform CTR is currently {current_ctr:.2f}%. No previous-period comparison is available yet.")

        if fraud_delta is not None:
            summary_parts.append(
                f"Fraud activity is currently {current_fraud:.1f}% on average, with a {abs(fraud_delta):.1f}% change from the previous period."
            )
        else:
            summary_parts.append("Fraud activity is currently stable. No previous-period comparison is available yet.")

        if revenue_delta is not None:
            summary_parts.append(
                f"Revenue changed by {abs(revenue_delta):.1f}% compared with the previous period."
            )
        else:
            summary_parts.append(f"Revenue is currently {_format_currency(current_revenue)}. No previous-period comparison is available yet.")

        if top_segment:
            summary_parts.append(f"The {top_segment} audience generated the highest click volume.")
        else:
            summary_parts.append("Top audience segment data is not available yet.")

        summary = " ".join(summary_parts)
        return ExecutiveSummaryResponse(insight_text=summary, insights=insights)

    async def get_ctr_trend(self) -> CTRTrendResponse:
        """Return hourly CTR values for the last 24 hours using actual ClickEvent counts."""
        _, ClickEvent, _, _, _, _, _, _ = _models()
        now = datetime.now(timezone.utc)
        since = now - timedelta(hours=24)
        hour_bucket = func.date_trunc("hour", ClickEvent.timestamp)

        result = await self._db.execute(
            select(
                hour_bucket.label("hour"),
                func.sum(case((ClickEvent.clicked.is_(True), 1), else_=0)).label("clicked"),
                func.sum(case((ClickEvent.clicked.is_(False), 1), else_=0)).label("impressions"),
            )
            .where(ClickEvent.timestamp >= since)
            .group_by(hour_bucket)
            .order_by(hour_bucket)
        )
        rows = result.all()

        by_hour: dict[datetime, dict[str, int]] = {}
        for row in rows:
            if row.hour is None:
                continue
            bucket = row.hour.replace(minute=0, second=0, microsecond=0)
            by_hour[bucket] = {
                "clicked": int(row.clicked or 0),
                "impressions": int(row.impressions or 0),
            }

        timestamps: List[datetime] = []
        ctr_values: List[float] = []
        for offset in range(24):
            bucket_start = (now.replace(minute=0, second=0, microsecond=0) - timedelta(hours=23 - offset))
            data = by_hour.get(bucket_start, {"clicked": 0, "impressions": 0})
            clicked = int(data.get("clicked") or 0)
            impressions = int(data.get("impressions") or 0)
            ctr = self._safe_ratio(clicked, impressions)
            timestamps.append(bucket_start)
            ctr_values.append(ctr)
        return CTRTrendResponse(timestamps=timestamps, ctr_values=ctr_values)

    async def get_campaign_analytics(self) -> CampaignAnalyticsResponse:
        """Aggregate the recent event stream without inventing conversions."""
        AdCampaign, ClickEvent, FraudEvent, _, MLPredictionLog, _, _, _ = _models()
        window_start = datetime.now(timezone.utc) - timedelta(minutes=15)

        fraudulent_prediction = (
            select(1)
            .select_from(MLPredictionLog)
            .where(
                and_(
                    MLPredictionLog.timestamp == ClickEvent.timestamp,
                    MLPredictionLog.user_id == ClickEvent.user_id,
                    MLPredictionLog.ad_id == ClickEvent.ad_id,
                    MLPredictionLog.campaign_id == ClickEvent.campaign_id,
                    MLPredictionLog.fraud_probability >= 0.5,
                )
            )
            .exists()
        )
        event_metrics = await self._db.execute(
            select(
                func.count().label("total_events"),
                func.sum(case((ClickEvent.clicked.is_(False), 1), else_=0)).label("impressions"),
                func.sum(case((ClickEvent.clicked.is_(True), 1), else_=0)).label("raw_clicks"),
                func.sum(
                    case(
                        (and_(ClickEvent.clicked.is_(True), ~fraudulent_prediction), 1),
                        else_=0,
                    )
                ).label("legit_clicks"),
            )
            .select_from(ClickEvent)
            .where(ClickEvent.timestamp >= window_start)
        )
        event_row = event_metrics.one()
        total_events = int(event_row.total_events or 0)
        impressions = int(event_row.impressions or 0)
        raw_clicks = int(event_row.raw_clicks or 0)
        legit_clicks = int(event_row.legit_clicks or 0)

        fraud_event_count = await self._db.execute(
            select(func.count())
            .select_from(FraudEvent)
            .where(FraudEvent.timestamp >= window_start)
        )
        fraudulent_events = int(fraud_event_count.scalar_one() or 0)

        revenue_row = await self._db.execute(select(func.sum(AdCampaign.revenue)))
        revenue = float(revenue_row.scalar_one() or 0.0)

        return CampaignAnalyticsResponse(
            impressions=impressions,
            raw_clicks=raw_clicks,
            legit_clicks=legit_clicks,
            effective_ctr=self._safe_ratio(legit_clicks, impressions),
            conversions=None,
            conversion_rate=None,
            revenue=revenue,
            fraud_rate=min(self._safe_ratio(fraudulent_events, total_events), 100.0),
        )

    async def get_top_ads(self, limit: int = 10) -> List[TopAdResponse]:
        """Return active campaigns ranked by CTR from the latest synthetic traffic."""
        AdCampaign, ClickEvent, _, _, MLPredictionLog, _, _, _ = _models()
        window_start = datetime.now(timezone.utc) - timedelta(minutes=15)
        result_limit = min(max(limit, 0), 10)

        impressions_expr = func.sum(case((ClickEvent.clicked.is_(False), 1), else_=0))
        clicks_expr = func.sum(case((ClickEvent.clicked.is_(True), 1), else_=0))
        fraud_prediction = (
            select(1)
            .select_from(MLPredictionLog)
            .where(
                and_(
                    MLPredictionLog.timestamp == ClickEvent.timestamp,
                    MLPredictionLog.user_id == ClickEvent.user_id,
                    MLPredictionLog.ad_id == ClickEvent.ad_id,
                    MLPredictionLog.campaign_id == ClickEvent.campaign_id,
                    MLPredictionLog.fraud_probability >= 0.5,
                )
            )
            .exists()
        )
        fraud_clicks_expr = func.sum(
            case((and_(ClickEvent.clicked.is_(True), fraud_prediction), 1), else_=0)
        )
        ctr_expr = case(
            (impressions_expr > 0, clicks_expr * 100.0 / impressions_expr),
            else_=0.0,
        )

        stats = await self._db.execute(
            select(
                AdCampaign.campaign_id.label("campaign_id"),
                AdCampaign.campaign_name.label("campaign_name"),
                impressions_expr.label("impressions"),
                clicks_expr.label("clicks"),
                ctr_expr.label("ctr"),
                AdCampaign.revenue.label("revenue"),
                AdCampaign.spend.label("spend"),
                fraud_clicks_expr.label("fraud_clicks"),
            )
            .select_from(AdCampaign)
            .join(ClickEvent, ClickEvent.campaign_id == AdCampaign.campaign_id)
            .where(AdCampaign.status == "ACTIVE")
            .where(ClickEvent.timestamp >= window_start)
            .group_by(
                AdCampaign.campaign_id,
                AdCampaign.campaign_name,
                AdCampaign.revenue,
                AdCampaign.spend,
            )
            .order_by(desc(ctr_expr), AdCampaign.campaign_id)
            .limit(result_limit)
        )

        ads: List[TopAdResponse] = []
        for row in stats.all():
            revenue = float(row.revenue or 0.0)
            spend = float(row.spend or 0.0)
            ads.append(
                TopAdResponse(
                    campaign_id=int(row.campaign_id),
                    campaign_name=row.campaign_name,
                    impressions=int(row.impressions or 0),
                    clicks=int(row.clicks or 0),
                    ctr=round(float(row.ctr or 0.0), 2),
                    revenue=revenue,
                    spend=spend,
                    roas=round(revenue / spend, 2) if spend > 0 else 0.0,
                    fraud_clicks=int(row.fraud_clicks or 0),
                )
            )
        return ads

    async def get_geographic_traffic(self) -> List[GeographicTrafficResponse]:
        """Aggregate current geographic traffic and normalized fraud/conversion ratios."""
        AdCampaign, ClickEvent, FraudEvent, _, _, _, _, User = _models()
        now = datetime.now(timezone.utc)
        window_start = now - timedelta(minutes=15)
        has_event_type = hasattr(ClickEvent, "event_type")

        traffic_stmt = (
            select(
                ClickEvent.location.label("city"),
                func.count().label("traffic"),
                func.sum(case((ClickEvent.event_type == "conversion", 1), else_=0)).label("conversions")
                if has_event_type
                else func.sum(case((ClickEvent.actual_outcome == 1, 1), else_=0)).label("conversions"),
            )
            .where(ClickEvent.location.is_not(None))
            .where(ClickEvent.timestamp >= window_start)
            .where(ClickEvent.timestamp <= now)
        )
        if has_event_type:
            traffic_stmt = traffic_stmt.where(ClickEvent.event_type.in_(["view", "impression", "click", "conversion"]))
        else:
            traffic_stmt = traffic_stmt.where(ClickEvent.campaign_id.is_not(None))

        traffic_rows = (await self._db.execute(
            traffic_stmt
            .group_by(ClickEvent.location)
            .order_by(desc(func.count()))
            .limit(50)
        )).all()

        fraud_by_city = (await self._db.execute(
            select(User.location.label("city"), func.count(FraudEvent.event_id).label("fraud_count"))
            .join(FraudEvent, FraudEvent.user_id == User.user_id)
            .where(User.location.is_not(None))
            .where(FraudEvent.timestamp >= window_start)
            .where(FraudEvent.timestamp <= now)
            .group_by(User.location)
        )).all()
        fraud_counts = {row.city: int(row.fraud_count or 0) for row in fraud_by_city if row.city is not None}

        top_campaign_stmt = (
            select(
                ClickEvent.location.label("city"),
                AdCampaign.campaign_name.label("campaign_name"),
                func.count().label("cnt"),
            )
            .join(AdCampaign, AdCampaign.campaign_id == ClickEvent.campaign_id)
            .where(ClickEvent.location.is_not(None))
            .where(ClickEvent.timestamp >= window_start)
            .where(ClickEvent.timestamp <= now)
        )
        if has_event_type:
            top_campaign_stmt = top_campaign_stmt.where(ClickEvent.event_type.in_(["view", "impression", "click", "conversion"]))
        else:
            top_campaign_stmt = top_campaign_stmt.where(ClickEvent.campaign_id.is_not(None))

        top_campaign_rows = (await self._db.execute(
            top_campaign_stmt
            .group_by(ClickEvent.location, AdCampaign.campaign_name)
            .order_by(desc(func.count()), ClickEvent.location, AdCampaign.campaign_name)
        )).all()

        city_campaign: dict[str, str | None] = {}
        for row in top_campaign_rows:
            city = str(row.city or "").strip()
            if not city or city in city_campaign:
                continue
            city_campaign[city] = str(row.campaign_name) if row.campaign_name is not None else None

        geo_list: List[GeographicTrafficResponse] = []
        for row in traffic_rows:
            city = str(row.city or "Unknown")
            traffic = int(row.traffic or 0)
            conversions = int(row.conversions or 0)
            fraud_count = int(fraud_counts.get(city, 0) or 0)
            conversion_rate = round(float(conversions) / float(traffic), 4) if traffic else 0.0
            fraud_rate = round(float(fraud_count) / float(traffic), 4) if traffic else 0.0
            geo_list.append(
                GeographicTrafficResponse(
                    city=city,
                    traffic=traffic,
                    fraud_rate=fraud_rate,
                    conversion_rate=conversion_rate,
                    top_campaign=city_campaign.get(city),
                )
            )
        return geo_list

    async def get_fraud_alerts(self, limit: int = 20) -> List[FraudAlertResponse]:
        """Return persisted fraud rows from the current 15-minute window."""
        _, _, FraudEvent, _, _, _, _, _ = _models()
        now = datetime.now(timezone.utc)
        window_start = now - timedelta(minutes=15)
        result = await self._db.execute(
            select(FraudEvent)
            .where(
                FraudEvent.timestamp >= window_start,
                FraudEvent.timestamp <= now,
            )
            .order_by(desc(FraudEvent.timestamp))
            .limit(limit)
        )
        events = result.scalars().all()
        return [
            FraudAlertResponse(
                ip_address=evt.ip_address,
                fraud_score=float(evt.fraud_score),
                fraud_category=evt.fraud_category,
                status=evt.status,
                severity=evt.severity,
                timestamp=evt.timestamp,
            )
            for evt in events
        ]

    async def get_campaign_explanations(
        self,
        campaign_id: int,
    ) -> SHAPExplanationResponse:
        """Return real SHAP feature attributions when persisted for a campaign."""
        AdCampaign, _, _, _, _, _, ShapInsight, _ = _models()

        campaign = (await self._db.execute(select(AdCampaign).where(AdCampaign.campaign_id == campaign_id))).scalar_one_or_none()
        if campaign is None:
            from fastapi import HTTPException  # noqa: PLC0415
            raise HTTPException(status_code=404, detail=f"Campaign {campaign_id} not found.")

        shap_rows = (await self._db.execute(
            select(ShapInsight.feature_name, ShapInsight.shap_value)
            .where(ShapInsight.campaign_id == campaign_id)
            .where(ShapInsight.prediction_id.is_(None))
            .order_by(desc(func.abs(ShapInsight.shap_value)))
            .limit(10)
        )).all()

        features: List[SHAPFeatureItem] = []
        for row in shap_rows:
            value = float(row.shap_value or 0.0)
            impact = min(abs(value) * 100.0, 100.0)
            features.append(
                SHAPFeatureItem(
                    feature=row.feature_name,
                    impact=round(impact, 2),
                    description=(
                        f"Feature contribution for {row.feature_name}: {value:.4f} "
                        "contribution to the predicted CTR signal."
                    ),
                )
            )

        if not features:
            # SHAP is intentionally absent unless the synthetic pipeline actually stores it.
            features.append(
                SHAPFeatureItem(
                    feature="No SHAP data available",
                    impact=0.0,
                    description="No persisted SHAP rows are available for this campaign yet.",
                )
            )

        return SHAPExplanationResponse(campaign_name=campaign.campaign_name, features=features)

    async def get_system_health(self) -> List[SystemHealthResponse]:
        """Return current health status from InfrastructureMetric records only."""
        _, _, _, InfrastructureMetric, _, _, _, _ = _models()

        latest_sub = (
            select(
                InfrastructureMetric.service_name,
                func.max(InfrastructureMetric.heartbeat_timestamp).label("latest_ts"),
            )
            .group_by(InfrastructureMetric.service_name)
            .subquery()
        )

        result = await self._db.execute(
            select(InfrastructureMetric)
            .join(
                latest_sub,
                (InfrastructureMetric.service_name == latest_sub.c.service_name)
                & (InfrastructureMetric.heartbeat_timestamp == latest_sub.c.latest_ts),
            )
            .order_by(InfrastructureMetric.service_name)
        )
        metrics = result.scalars().all()
        return [
            SystemHealthResponse(
                service_name=m.service_name,
                status=m.status,
                uptime=float(m.uptime),
                latency_ms=float(m.latency_ms),
                last_heartbeat=m.heartbeat_timestamp,
            )
            for m in metrics
        ]

    async def get_ai_recommendations(self) -> List[AIRecommendationResponse]:
        """Derive business recommendations from persisted synthetic analytics only."""
        AdCampaign, _, FraudEvent, _, _, _, _, _ = _models()

        overview = await self.get_overview()
        recommendations: List[AIRecommendationResponse] = []

        total_events = await self._db.execute(select(func.count()).select_from(FraudEvent))
        critical_events = await self._db.execute(
            select(func.count()).select_from(FraudEvent).where(FraudEvent.severity == "CRITICAL")
        )
        total_fraud_events = int(total_events.scalar_one() or 0)
        critical_count = int(critical_events.scalar_one() or 0)
        if total_fraud_events > 0 and (critical_count / total_fraud_events) > 0.05:
            recommendations.append(
                AIRecommendationResponse(
                    title="Tighten Fraud Detection Threshold",
                    description=(
                        f"{critical_count} CRITICAL fraud events detected ({critical_count / total_fraud_events * 100:.1f}% of all fraud alerts). "
                        "Consider tightening the fraud score threshold and reviewing high-risk IP ranges."
                    ),
                    priority="HIGH",
                    action="Update Fraud Threshold",
                )
            )

        if overview.ctr < 2.0:
            recommendations.append(
                AIRecommendationResponse(
                    title="Re-Target Underperforming Audiences",
                    description=(
                        f"Platform-wide CTR is {overview.ctr:.2f}%, below the 2% benchmark. "
                        "Refresh creative assets and refine targeting around the highest-converting segments."
                    ),
                    priority="HIGH",
                    action="Refresh Audience Segments",
                )
            )

        low_roas_rows = (await self._db.execute(
            select(AdCampaign.campaign_name, AdCampaign.revenue, AdCampaign.spend)
            .where(AdCampaign.spend > 0)
            .where((AdCampaign.revenue / AdCampaign.spend) < 1.5)
            .where(AdCampaign.status == "ACTIVE")
            .limit(5)
        )).all()
        if low_roas_rows:
            names = ", ".join(row.campaign_name for row in low_roas_rows[:3])
            recommendations.append(
                AIRecommendationResponse(
                    title="Reallocate Budget from Low-ROAS Campaigns",
                    description=(
                        f"Campaigns {names} have ROAS below 1.5×. Reallocate spend toward campaigns with stronger synthetic event performance."
                    ),
                    priority="MEDIUM",
                    action="Reallocate Budget",
                )
            )

        top_ads = await self.get_top_ads(limit=1)
        if top_ads and top_ads[0].roas >= 3.0:
            recommendations.append(
                AIRecommendationResponse(
                    title=f"Scale '{top_ads[0].campaign_name}'",
                    description=(
                        f"Top campaign '{top_ads[0].campaign_name}' achieves {top_ads[0].roas:.1f}× ROAS at {top_ads[0].ctr:.2f}% CTR. "
                        "Consider increasing spend gradually while monitoring conversion quality and fraud risk."
                    ),
                    priority="MEDIUM",
                    action="Increase Budget",
                )
            )

        if not recommendations:
            recommendations.append(
                AIRecommendationResponse(
                    title="Maintain Current Strategy",
                    description="All observed synthetic metrics are within healthy ranges. Continue monitoring CTR, fraud rates, and ROAS on a 15-minute cadence.",
                    priority="LOW",
                    action="Monitor",
                )
            )
        return recommendations

    async def get_ai_ad_decision(self) -> AIAdDecisionResponse:
        """Return a deterministic recommendation for the strongest live campaign signal."""
        AdCampaign, ClickEvent, _, _, _, _, _, _ = _models()
        now = datetime.now(timezone.utc)
        window_start = now - timedelta(minutes=15)

        stats = await self._db.execute(
            select(
                ClickEvent.campaign_id.label("campaign_id"),
                AdCampaign.campaign_name.label("campaign_name"),
                func.sum(case((ClickEvent.clicked.is_(False), 1), else_=0)).label("impressions"),
                func.sum(case((ClickEvent.clicked.is_(True), 1), else_=0)).label("clicks"),
                func.sum(case((ClickEvent.actual_outcome == 1, 1), else_=0)).label("conversions"),
            )
            .select_from(ClickEvent)
            .join(AdCampaign, AdCampaign.campaign_id == ClickEvent.campaign_id)
            .where(ClickEvent.timestamp >= window_start)
            .where(ClickEvent.timestamp <= now)
            .where(ClickEvent.campaign_id.is_not(None))
            .group_by(ClickEvent.campaign_id, AdCampaign.campaign_name)
        )
        campaigns = stats.all()
        if not campaigns:
            return AIAdDecisionResponse(
                decision="NO_DATA",
                decision_score=0.0,
                recommended_action="Monitor",
                reasons=["No recent campaign traffic was available in the last 15 minutes."],
                timestamp=now,
            )

        fraud_users = await self._fraud_user_ids(start=window_start, end=now)
        fraud_clicks_by_campaign: dict[int, int] = {}
        if fraud_users:
            fraud_click_rows = await self._db.execute(
                select(
                    ClickEvent.campaign_id.label("campaign_id"),
                    func.count().label("fraud_clicks"),
                )
                .where(ClickEvent.timestamp >= window_start)
                .where(ClickEvent.timestamp <= now)
                .where(ClickEvent.clicked.is_(True))
                .where(ClickEvent.campaign_id.is_not(None))
                .where(ClickEvent.user_id.in_(list(fraud_users)))
                .group_by(ClickEvent.campaign_id)
            )
            fraud_clicks_by_campaign = {
                int(row.campaign_id): int(row.fraud_clicks or 0)
                for row in fraud_click_rows.all()
                if row.campaign_id is not None
            }

        candidate_rows: list[dict] = []
        for row in campaigns:
            campaign_id = int(row.campaign_id)
            impressions = int(row.impressions or 0)
            clicks = int(row.clicks or 0)
            conversions = int(row.conversions or 0)
            ctr = self._safe_ratio(clicks, impressions)
            conversion_rate = self._safe_ratio(conversions, clicks)
            spend = float((await self._db.execute(select(AdCampaign.spend).where(AdCampaign.campaign_id == campaign_id))).scalar_one() or 0.0)
            revenue = float((await self._db.execute(select(AdCampaign.revenue).where(AdCampaign.campaign_id == campaign_id))).scalar_one() or 0.0)
            roas = round(revenue / spend, 2) if spend > 0 else 0.0
            fraud_clicks = fraud_clicks_by_campaign.get(campaign_id, 0)
            fraud_rate = self._safe_ratio(fraud_clicks, max(1, clicks))
            candidate_rows.append(
                {
                    "campaign_id": campaign_id,
                    "campaign_name": row.campaign_name,
                    "ctr": ctr,
                    "clicks": clicks,
                    "impressions": impressions,
                    "conversions": conversions,
                    "conversion_rate": conversion_rate,
                    "fraud_clicks": fraud_clicks,
                    "fraud_rate": fraud_rate,
                    "spend": spend,
                    "revenue": revenue,
                    "roas": roas,
                }
            )

        if not candidate_rows:
            return AIAdDecisionResponse(
                decision="NO_DATA",
                decision_score=0.0,
                recommended_action="Monitor",
                reasons=["No recent campaign performance data was available in the current live window."],
                timestamp=now,
            )

        best = max(candidate_rows, key=lambda item: (
            item["ctr"],
            item["conversion_rate"],
            item["roas"],
            -item["fraud_rate"],
            item["clicks"],
        ))
        recent_ctr = best["ctr"]
        current_fraud = float(best["fraud_rate"])
        current_conversion = float(best["conversion_rate"])
        roas = float(best["roas"])
        spend = float(best["spend"])
        revenue = float(best["revenue"])

        previous_start = now - timedelta(minutes=30)
        prev_stats = await self._db.execute(
            select(
                ClickEvent.campaign_id,
                func.sum(case((ClickEvent.clicked.is_(False), 1), else_=0)).label("impressions"),
                func.sum(case((ClickEvent.clicked.is_(True), 1), else_=0)).label("clicks"),
            )
            .where(ClickEvent.timestamp >= previous_start)
            .where(ClickEvent.timestamp < window_start)
            .where(ClickEvent.campaign_id == best["campaign_id"])
            .group_by(ClickEvent.campaign_id)
        )
        prev_row = prev_stats.one_or_none()
        prev_impressions = int(prev_row.impressions or 0) if prev_row else 0
        prev_clicks = int(prev_row.clicks or 0) if prev_row else 0
        prev_ctr = self._safe_ratio(prev_clicks, prev_impressions)
        ctr_change = round(((recent_ctr - prev_ctr) / prev_ctr) * 100.0, 2) if prev_ctr not in (0, None) else None

        if recent_ctr >= 6.0 and current_fraud <= 8.0 and current_conversion >= 3.0 and roas >= 2.5:
            decision = "SCALE"
            action = "Increase Budget"
            score = min(99.0, 55.0 + recent_ctr * 3.5 + current_conversion * 5.0 + max(0.0, roas * 8.0) - current_fraud * 1.5)
        elif recent_ctr >= 3.0 and current_fraud <= 12.0 and roas >= 1.0:
            decision = "KEEP_RUNNING"
            action = "Maintain Spend"
            score = min(95.0, 60.0 + recent_ctr * 4.0 + current_conversion * 3.0 - current_fraud * 1.1)
        elif recent_ctr >= 2.0 and current_fraud <= 18.0:
            decision = "MONITOR"
            action = "Watch Conversion Quality"
            score = min(90.0, 50.0 + recent_ctr * 3.0 + current_conversion * 2.0 - current_fraud * 1.2)
        elif current_fraud >= 25.0 or recent_ctr < 1.5 or current_conversion < 1.0:
            decision = "REDUCE"
            action = "Reduce Spend"
            score = max(0.0, 80.0 - current_fraud * 1.5 - max(0.0, 2.5 - recent_ctr) * 10.0)
        else:
            decision = "OPTIMIZE"
            action = "Rebalance Creative"
            score = max(0.0, 60.0 + recent_ctr * 2.0 - current_fraud * 1.1)

        if spend <= 0:
            spend = 0.0
        if current_fraud >= 35.0 and (recent_ctr < 2.0 or current_conversion < 1.0):
            decision = "PAUSE"
            action = "Pause Campaign"
            score = max(0.0, 55.0 - current_fraud * 1.2)

        reasons: list[str] = []
        if recent_ctr > 0:
            reasons.append(f"CTR is {recent_ctr:.2f}% in the current live window.")
        if current_fraud >= 0:
            reasons.append(f"Fraud exposure is {current_fraud:.2f}% of recent clicks.")
        if roas > 0:
            reasons.append(f"ROAS is {roas:.2f}x with {revenue:,.2f} revenue on {spend:,.2f} spend.")
        elif current_conversion > 0:
            reasons.append(f"Conversion rate is {current_conversion:.2f}% across recent clicks.")
        if ctr_change is not None:
            reasons.append(f"CTR trend moved {ctr_change:+.2f}% versus the prior live window.")
        if len(reasons) > 3:
            reasons = reasons[:3]
        if not reasons:
            reasons = ["Campaign metrics are present but did not provide a strong actionable signal."]

        return AIAdDecisionResponse(
            ad_id=None,
            campaign_id=best["campaign_id"],
            campaign_name=best["campaign_name"],
            ctr=round(recent_ctr, 2),
            ctr_change=round(ctr_change, 2) if ctr_change is not None else None,
            fraud_risk=min(100.0, current_fraud * 1.5),
            fraud_rate=round(current_fraud, 2),
            conversion_rate=round(current_conversion, 2),
            roas=round(roas, 2) if roas > 0 else 0.0,
            decision=decision,
            decision_score=round(score, 2),
            recommended_action=action,
            reasons=reasons,
            timestamp=now,
        )

    async def get_model_intelligence(self) -> ModelIntelligenceResponse:
        """Summarize healthy behavior for the CTR, fraud, and recommendation models."""
        _, _, _, _, MLPredictionLog, RecommendationLog, _, _ = _models()
        now = datetime.now(timezone.utc)
        window_start = now - timedelta(minutes=15)

        ctr_row = await self._db.execute(
            select(
                func.count().label("prediction_count"),
                func.avg(MLPredictionLog.click_probability).label("average_prediction"),
                func.min(MLPredictionLog.click_probability).label("min_prediction"),
                func.max(MLPredictionLog.click_probability).label("max_prediction"),
            )
            .where(MLPredictionLog.timestamp >= window_start)
            .where(MLPredictionLog.timestamp <= now)
        )
        ctr_result = ctr_row.one()
        ctr_count = int(ctr_result.prediction_count or 0)
        ctr_avg = float(ctr_result.average_prediction) if ctr_result.average_prediction is not None else None
        ctr_min = float(ctr_result.min_prediction) if ctr_result.min_prediction is not None else None
        ctr_max = float(ctr_result.max_prediction) if ctr_result.max_prediction is not None else None
        ctr_status = "healthy" if ctr_count > 0 and all(value is not None for value in (ctr_avg, ctr_min, ctr_max)) else ("no_data" if ctr_count == 0 else "degraded")

        fraud_row = await self._db.execute(
            select(
                func.count().label("prediction_count"),
                func.avg(MLPredictionLog.fraud_probability).label("average_risk"),
                func.min(MLPredictionLog.fraud_probability).label("min_risk"),
                func.max(MLPredictionLog.fraud_probability).label("max_risk"),
                func.sum(case((MLPredictionLog.fraud_probability >= 0.5, 1), else_=0)).label("high_risk_count"),
                func.sum(case((MLPredictionLog.fraud_probability >= 0.9, 1), else_=0)).label("critical_count"),
            )
            .where(MLPredictionLog.timestamp >= window_start)
            .where(MLPredictionLog.timestamp <= now)
        )
        fraud_result = fraud_row.one()
        fraud_count = int(fraud_result.prediction_count or 0)
        fraud_avg = float(fraud_result.average_risk) if fraud_result.average_risk is not None else None
        fraud_min = float(fraud_result.min_risk) if fraud_result.min_risk is not None else None
        fraud_max = float(fraud_result.max_risk) if fraud_result.max_risk is not None else None
        high_risk_count = int(fraud_result.high_risk_count or 0)
        critical_count = int(fraud_result.critical_count or 0)
        fraud_status = "healthy" if fraud_count > 0 and all(value is not None for value in (fraud_avg, fraud_min, fraud_max)) else ("no_data" if fraud_count == 0 else "degraded")

        recommendation_row = await self._db.execute(
            select(
                func.count().label("recommendation_count"),
                func.count(func.distinct(RecommendationLog.ad_id)).label("unique_ads"),
                func.avg(RecommendationLog.recommendation_score).label("average_score"),
            )
            .where(RecommendationLog.timestamp >= window_start)
            .where(RecommendationLog.timestamp <= now)
        )
        recommendation_result = recommendation_row.one()
        recommendation_count = int(recommendation_result.recommendation_count or 0)
        unique_ads = int(recommendation_result.unique_ads or 0)
        avg_score = float(recommendation_result.average_score) if recommendation_result.average_score is not None else None
        recommendation_status = "healthy" if recommendation_count > 0 and avg_score is not None else ("no_data" if recommendation_count == 0 else "degraded")

        return ModelIntelligenceResponse(
            timestamp=now,
            ctr_model=CTRModelHealthResponse(
                status=ctr_status,
                prediction_count=ctr_count,
                average_prediction=round(ctr_avg, 4) if ctr_avg is not None else None,
                min_prediction=round(ctr_min, 4) if ctr_min is not None else None,
                max_prediction=round(ctr_max, 4) if ctr_max is not None else None,
            ),
            fraud_model=FraudModelHealthResponse(
                status=fraud_status,
                prediction_count=fraud_count,
                average_risk=round(fraud_avg, 4) if fraud_avg is not None else None,
                min_risk=round(fraud_min, 4) if fraud_min is not None else None,
                max_risk=round(fraud_max, 4) if fraud_max is not None else None,
                high_risk_count=high_risk_count,
                critical_count=critical_count,
            ),
            recommendation_engine=RecommendationEngineHealthResponse(
                status=recommendation_status,
                recommendation_count=recommendation_count,
                unique_ads=unique_ads,
                average_score=round(avg_score, 4) if avg_score is not None else None,
            ),
        )

    async def get_campaign_opportunities(self) -> CampaignOpportunityRadarResponse:
        """Rank live campaigns by efficiency, trend, and fraud posture."""
        AdCampaign, ClickEvent, _, _, _, _, _, _ = _models()
        now = datetime.now(timezone.utc)
        window_start = now - timedelta(minutes=15)

        campaign_rows = await self._db.execute(
            select(
                ClickEvent.campaign_id.label("campaign_id"),
                AdCampaign.campaign_name.label("campaign_name"),
                func.sum(case((ClickEvent.clicked.is_(False), 1), else_=0)).label("impressions"),
                func.sum(case((ClickEvent.clicked.is_(True), 1), else_=0)).label("clicks"),
                func.sum(case((ClickEvent.actual_outcome == 1, 1), else_=0)).label("conversions"),
                AdCampaign.revenue.label("revenue"),
                AdCampaign.spend.label("spend"),
            )
            .select_from(ClickEvent)
            .join(AdCampaign, AdCampaign.campaign_id == ClickEvent.campaign_id)
            .where(ClickEvent.timestamp >= window_start)
            .where(ClickEvent.timestamp <= now)
            .where(ClickEvent.campaign_id.is_not(None))
            .group_by(ClickEvent.campaign_id, AdCampaign.campaign_name, AdCampaign.revenue, AdCampaign.spend)
        )
        campaigns = campaign_rows.all()
        if not campaigns:
            return CampaignOpportunityRadarResponse(timestamp=now, opportunities=[])

        fraud_users = await self._fraud_user_ids(start=window_start, end=now)
        fraud_clicks_by_campaign: dict[int, int] = {}
        if fraud_users:
            rows = await self._db.execute(
                select(
                    ClickEvent.campaign_id.label("campaign_id"),
                    func.count().label("fraud_clicks"),
                )
                .where(ClickEvent.timestamp >= window_start)
                .where(ClickEvent.timestamp <= now)
                .where(ClickEvent.clicked.is_(True))
                .where(ClickEvent.campaign_id.is_not(None))
                .where(ClickEvent.user_id.in_(list(fraud_users)))
                .group_by(ClickEvent.campaign_id)
            )
            fraud_clicks_by_campaign = {
                int(row.campaign_id): int(row.fraud_clicks or 0)
                for row in rows.all()
                if row.campaign_id is not None
            }

        opportunities: list[CampaignOpportunityItem] = []
        for row in campaigns:
            campaign_id = int(row.campaign_id)
            impressions = int(row.impressions or 0)
            clicks = int(row.clicks or 0)
            conversions = int(row.conversions or 0)
            ctr = self._safe_ratio(clicks, impressions)
            conversion_rate = self._safe_ratio(conversions, clicks)
            revenue = float(row.revenue or 0.0)
            spend = float(row.spend or 0.0)
            roas = round(revenue / spend, 2) if spend > 0 else 0.0
            fraud_clicks = fraud_clicks_by_campaign.get(campaign_id, 0)
            fraud_rate = self._safe_ratio(fraud_clicks, max(1, clicks))

            prev_query = await self._db.execute(
                select(
                    func.sum(case((ClickEvent.clicked.is_(False), 1), else_=0)).label("impressions"),
                    func.sum(case((ClickEvent.clicked.is_(True), 1), else_=0)).label("clicks"),
                )
                .where(ClickEvent.timestamp >= now - timedelta(minutes=30))
                .where(ClickEvent.timestamp < window_start)
                .where(ClickEvent.campaign_id == campaign_id)
            )
            prev_vals = prev_query.one()
            prior_impressions = int(prev_vals.impressions or 0)
            prior_clicks = int(prev_vals.clicks or 0)
            prior_ctr = self._safe_ratio(prior_clicks, prior_impressions)
            ctr_change = None
            if prior_ctr not in (0, None):
                ctr_change = round(((ctr - prior_ctr) / prior_ctr) * 100.0, 2)

            if impressions <= 0 or clicks <= 0:
                continue
            if ctr >= 6.0 and fraud_rate <= 8.0 and conversion_rate >= 3.0 and roas >= 2.0:
                status = "SCALE"
                priority = "HIGH"
                reason = "Strong engagement with low fraud exposure."
                action = "Increase Budget"
            elif ctr >= 2.5 and conversion_rate < 2.0 and fraud_rate <= 12.0:
                status = "OPTIMIZE"
                priority = "MEDIUM"
                reason = "Strong click activity but weak conversion efficiency."
                action = "Refine Creative"
            elif fraud_rate >= 12.0 or (ctr < 2.0 and fraud_rate >= 8.0):
                status = "MONITOR"
                priority = "HIGH" if fraud_rate >= 20.0 else "MEDIUM"
                reason = "Fraud exposure is increasing in the current live window."
                action = "Review Fraud Controls"
            elif fraud_rate >= 25.0 or ctr < 1.5 or conversion_rate < 1.0:
                status = "REDUCE"
                priority = "HIGH"
                reason = "High fraud exposure combined with weak campaign efficiency."
                action = "Reduce Spend"
            elif ctr < 2.0 and conversion_rate < 1.2:
                status = "PAUSE"
                priority = "HIGH"
                reason = "Campaign efficiency is below acceptable thresholds in the live window."
                action = "Pause Campaign"
            else:
                status = "MONITOR"
                priority = "LOW"
                reason = "Performance is acceptable but still needs monitoring in the live window."
                action = "Monitor"

            if status in {"SCALE", "REDUCE", "PAUSE"}:
                priority = "HIGH"
            elif status == "OPTIMIZE":
                priority = "MEDIUM"
            elif status == "MONITOR":
                priority = "LOW" if ctr >= 2.0 and fraud_rate <= 5.0 else "MEDIUM"

            opportunities.append(
                CampaignOpportunityItem(
                    campaign_id=campaign_id,
                    campaign_name=row.campaign_name,
                    status=status,
                    priority=priority,
                    ctr=round(ctr, 2),
                    ctr_change=round(ctr_change, 2) if ctr_change is not None else None,
                    conversion_rate=round(conversion_rate, 2),
                    fraud_rate=round(fraud_rate, 2),
                    revenue=revenue,
                    spend=spend,
                    roas=round(roas, 2) if roas > 0 else 0.0,
                    reason=reason,
                    recommended_action=action,
                )
            )

        opportunities.sort(
            key=lambda item: (
                {"SCALE": 5, "OPTIMIZE": 4, "MONITOR": 3, "REDUCE": 2, "PAUSE": 1}.get(item.status, 0),
                -(item.fraud_rate or 0.0),
                -(item.ctr or 0.0),
            ),
            reverse=True,
        )
        return CampaignOpportunityRadarResponse(timestamp=now, opportunities=opportunities[:10])

    async def get_live_snapshot(self) -> DashboardLiveUpdate:
        """Lightweight snapshot for the WebSocket push loop using the same metrics as the overview API."""
        _, _, FraudEvent, _, _, _, _, _ = _models()
        now = datetime.now(timezone.utc)
        metrics = await self._overview_snapshot()
        live_ctr = await self._compute_ctr(
            start=now - timedelta(seconds=10),
            end=now,
        )

        fraud_alert_count = int((await self._db.execute(
            select(func.count())
            .select_from(FraudEvent)
            .where(FraudEvent.timestamp >= now - timedelta(minutes=15))
        )).scalar_one() or 0)

        return DashboardLiveUpdate(
            events_per_second=metrics["events_per_second"],
            active_users=metrics["active_users"],
            ctr=live_ctr,
            fraud_alert_count=fraud_alert_count,
            revenue=metrics["revenue"],
            timestamp=now,
            ai_decision=await self.get_ai_ad_decision(),
            model_intelligence=await self.get_model_intelligence(),
            campaign_opportunities=(await self.get_campaign_opportunities()).opportunities,
        )