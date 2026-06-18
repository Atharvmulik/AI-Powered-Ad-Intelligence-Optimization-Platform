"""
DashboardService — service layer for the Ad Intelligence Dashboard module.

All database I/O is encapsulated here.  The router layer calls this class
exclusively; no SQLAlchemy or raw SQL leaks into the API layer.

Architecture notes
------------------
* Async SQLAlchemy sessions are used throughout (AsyncSession).
* Every public method is an async coroutine.
* Redis-ready: caching stubs are present and clearly marked; swap the
  placeholder body for an actual redis-py / aioredis call when the cache
  layer lands.
* Kafka-ready: event-publishing stubs are present; connect an AIOKafka
  producer when the streaming layer is wired up.
* SHAP integration: get_campaign_explanations() is a placeholder that
  returns a typed response object; the ML service can populate it without
  any schema changes.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from sqlalchemy import func, select, text, desc, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.dashboard import (
    AIRecommendationResponse,
    CampaignAnalyticsResponse,
    CTRTrendResponse,
    DashboardLiveUpdate,
    ExecutiveSummaryResponse,
    FraudAlertResponse,
    GeographicTrafficResponse,
    InsightItem,
    OverviewResponse,
    SHAPExplanationResponse,
    SHAPFeatureItem,
    SystemHealthResponse,
    TopAdResponse,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Lazy model imports — prevents circular imports while keeping the service
# decoupled from db/ model definitions.
# ---------------------------------------------------------------------------

def _models():
    """Return ORM model classes at call time to avoid circular imports."""
    from app.db.models import (  # noqa: PLC0415
        AdCampaign,
        ClickEvent,
        FraudEvent,
        InfrastructureMetric,
        RecommendationLog,
        User,
    )
    return AdCampaign, ClickEvent, FraudEvent, InfrastructureMetric, RecommendationLog, User


# ---------------------------------------------------------------------------
# Cache helper stubs  (Redis-ready)
# ---------------------------------------------------------------------------

async def _cache_get(key: str) -> Optional[str]:
    """
    Redis GET stub.

    Replace with:
        value = await redis_client.get(key)
        return value.decode() if value else None
    """
    return None  # pragma: no cover


async def _cache_set(key: str, value: str, ttl_seconds: int = 30) -> None:
    """
    Redis SET stub.

    Replace with:
        await redis_client.setex(key, ttl_seconds, value)
    """
    return  # pragma: no cover


# ---------------------------------------------------------------------------
# Kafka helper stub  (Kafka-ready)
# ---------------------------------------------------------------------------

async def _publish_event(topic: str, payload: dict) -> None:
    """
    AIOKafka producer stub.

    Replace with:
        await kafka_producer.send_and_wait(topic, value=json.dumps(payload).encode())
    """
    return  # pragma: no cover


# ---------------------------------------------------------------------------
# DashboardService
# ---------------------------------------------------------------------------

class DashboardService:
    """
    Encapsulates all analytics queries for the dashboard module.

    Parameters
    ----------
    db : AsyncSession
        Injected async SQLAlchemy session.
    """

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    # ------------------------------------------------------------------
    # 1. KPI Overview
    # ------------------------------------------------------------------

    async def get_overview(self) -> OverviewResponse:
        """
        Compute top-level KPI metrics.

        Returns
        -------
        OverviewResponse
        """
        AdCampaign, ClickEvent, FraudEvent, InfrastructureMetric, RecommendationLog, User = _models()
        db = self._db
        now = datetime.now(timezone.utc)
        window_15m = now - timedelta(minutes=15)
        window_1m = now - timedelta(minutes=1)

        # total clicks
        total_clicks_result = await db.execute(select(func.count()).select_from(ClickEvent))
        total_clicks: int = total_clicks_result.scalar_one() or 0

        # CTR = clicked / total impressions
        clicked_result = await db.execute(
            select(func.count()).select_from(ClickEvent).where(ClickEvent.clicked == True)  # noqa: E712
        )
        clicked: int = clicked_result.scalar_one() or 0
        ctr: float = round((clicked / total_clicks * 100) if total_clicks > 0 else 0.0, 2)

        # active users — last 15 minutes
        active_result = await db.execute(
            select(func.count(func.distinct(User.user_id)))
            .where(User.last_active >= window_15m)
        )
        active_users: int = active_result.scalar_one() or 0

        # fraud score — average scaled to 0–100
        fraud_avg_result = await db.execute(
            select(func.avg(FraudEvent.fraud_score))
        )
        raw_fraud_avg: float = fraud_avg_result.scalar_one() or 0.0
        fraud_score: float = round(raw_fraud_avg * 100, 2)

        # revenue — sum across all campaigns
        revenue_result = await db.execute(
            select(func.sum(AdCampaign.revenue))
        )
        revenue: float = float(revenue_result.scalar_one() or 0.0)

        # events per second — click events in the last 60 s
        eps_result = await db.execute(
            select(func.count())
            .select_from(ClickEvent)
            .where(ClickEvent.timestamp >= window_1m)
        )
        events_last_minute: int = eps_result.scalar_one() or 0
        events_per_second: float = round(events_last_minute / 60, 2)

        return OverviewResponse(
            total_clicks=total_clicks,
            ctr=ctr,
            active_users=active_users,
            fraud_score=fraud_score,
            revenue=revenue,
            events_per_second=events_per_second,
        )

    # ------------------------------------------------------------------
    # 2. Executive Summary
    # ------------------------------------------------------------------

    async def get_executive_summary(self) -> ExecutiveSummaryResponse:
        """
        Derive analytics-driven textual insights.

        Returns
        -------
        ExecutiveSummaryResponse
        """
        AdCampaign, ClickEvent, FraudEvent, InfrastructureMetric, RecommendationLog, User = _models()
        db = self._db
        now = datetime.now(timezone.utc)
        yesterday = now - timedelta(hours=24)
        two_days_ago = now - timedelta(hours=48)

        # --- CTR today vs yesterday ---
        async def _period_ctr(start: datetime, end: datetime) -> float:
            total_q = await db.execute(
                select(func.count()).select_from(ClickEvent)
                .where(ClickEvent.timestamp.between(start, end))
            )
            clicked_q = await db.execute(
                select(func.count()).select_from(ClickEvent)
                .where(ClickEvent.timestamp.between(start, end))
                .where(ClickEvent.clicked == True)  # noqa: E712
            )
            total = total_q.scalar_one() or 0
            clicked = clicked_q.scalar_one() or 0
            return (clicked / total * 100) if total > 0 else 0.0

        ctr_today = await _period_ctr(yesterday, now)
        ctr_yesterday = await _period_ctr(two_days_ago, yesterday)
        ctr_delta_pct = (
            ((ctr_today - ctr_yesterday) / ctr_yesterday * 100) if ctr_yesterday > 0 else 0.0
        )

        # --- Fraud today vs yesterday ---
        async def _period_fraud(start: datetime, end: datetime) -> float:
            r = await db.execute(
                select(func.avg(FraudEvent.fraud_score))
                .where(FraudEvent.timestamp.between(start, end))
            )
            return float(r.scalar_one() or 0.0)

        fraud_today = await _period_fraud(yesterday, now)
        fraud_yesterday = await _period_fraud(two_days_ago, yesterday)
        fraud_delta_pct = (
            ((fraud_today - fraud_yesterday) / fraud_yesterday * 100)
            if fraud_yesterday > 0
            else 0.0
        )

        # --- Revenue today vs yesterday ---
        async def _period_revenue(start: datetime, end: datetime) -> float:
            r = await db.execute(
                select(func.sum(AdCampaign.revenue))
                .where(AdCampaign.start_date <= end)
                .where(AdCampaign.end_date >= start)
            )
            return float(r.scalar_one() or 0.0)

        revenue_today = await _period_revenue(yesterday, now)
        revenue_yesterday = await _period_revenue(two_days_ago, yesterday)
        revenue_delta_pct = (
            ((revenue_today - revenue_yesterday) / revenue_yesterday * 100)
            if revenue_yesterday > 0
            else 0.0
        )

        # --- Top audience segment by click volume ---
        top_segment_result = await db.execute(
            select(User.interests, func.count(ClickEvent.event_id).label("cnt"))
            .join(ClickEvent, ClickEvent.user_id == User.user_id)
            .group_by(User.interests)
            .order_by(desc("cnt"))
            .limit(1)
        )
        top_row = top_segment_result.first()
        top_segment: str = top_row[0] if top_row else "General"

        # Build insight objects
        def _trend_label(delta: float) -> tuple[str, str]:
            if delta > 0:
                return f"+{delta:.1f}%", "up"
            if delta < 0:
                return f"{delta:.1f}%", "down"
            return "0%", "neutral"

        ctr_trend, ctr_status = _trend_label(ctr_delta_pct)
        fraud_trend, fraud_status = _trend_label(fraud_delta_pct)
        rev_trend, rev_status = _trend_label(revenue_delta_pct)

        insights: List[InsightItem] = [
            InsightItem(
                text=f"CTR moved to {ctr_today:.2f}% compared to {ctr_yesterday:.2f}% yesterday.",
                trend=ctr_trend,
                status=ctr_status,
            ),
            InsightItem(
                text=(
                    f"Average fraud score {'increased' if fraud_delta_pct > 0 else 'decreased'} "
                    f"by {abs(fraud_delta_pct):.1f}% over the last 24 hours."
                ),
                trend=fraud_trend,
                status=fraud_status,
            ),
            InsightItem(
                text=f"Revenue is {rev_trend} relative to the same window yesterday.",
                trend=rev_trend,
                status=rev_status,
            ),
            InsightItem(
                text=f"Top audience segment driving clicks: {top_segment}.",
                trend="",
                status="neutral",
            ),
        ]

        summary = (
            f"Over the last 24 hours, platform CTR reached {ctr_today:.2f}% "
            f"({ctr_trend} vs previous period). "
            f"Fraud activity has {fraud_status}d and revenue is tracking {rev_trend}. "
            f"The '{top_segment}' audience is the top-performing segment."
        )

        return ExecutiveSummaryResponse(insight_text=summary, insights=insights)

    # ------------------------------------------------------------------
    # 3. CTR Trend (hourly, last 24 h)
    # ------------------------------------------------------------------

    async def get_ctr_trend(self) -> CTRTrendResponse:
        """
        Return hourly CTR for the last 24 hours.

        Returns
        -------
        CTRTrendResponse
        """
        AdCampaign, ClickEvent, FraudEvent, InfrastructureMetric, RecommendationLog, User = _models()
        db = self._db
        now = datetime.now(timezone.utc)
        since = now - timedelta(hours=24)

        # Truncate timestamp to the hour using a database-agnostic approach.
        # PostgreSQL: date_trunc('hour', timestamp)
        hour_bucket = func.date_trunc("hour", ClickEvent.timestamp)

        result = await db.execute(
            select(
                hour_bucket.label("hour"),
                func.count().label("total"),
                func.sum(
                    case((ClickEvent.clicked == True, 1), else_=0)  # noqa: E712
                ).label("clicked"),
            )
            .where(ClickEvent.timestamp >= since)
            .group_by(hour_bucket)
            .order_by(hour_bucket)
        )

        rows = result.all()
        timestamps: List[datetime] = []
        ctr_values: List[float] = []

        for row in rows:
            total = row.total or 0
            clicked = int(row.clicked or 0)
            ctr = round((clicked / total * 100) if total > 0 else 0.0, 2)
            timestamps.append(row.hour)
            ctr_values.append(ctr)

        return CTRTrendResponse(timestamps=timestamps, ctr_values=ctr_values)

    # ------------------------------------------------------------------
    # 4. Campaign Analytics
    # ------------------------------------------------------------------

    async def get_campaign_analytics(self) -> CampaignAnalyticsResponse:
        """
        Aggregate campaign metrics with fraud filtering.

        Returns
        -------
        CampaignAnalyticsResponse
        """
        AdCampaign, ClickEvent, FraudEvent, InfrastructureMetric, RecommendationLog, User = _models()
        db = self._db

        # Raw click count
        raw_result = await db.execute(select(func.count()).select_from(ClickEvent))
        raw_clicks: int = raw_result.scalar_one() or 0

        # Clicks originating from fraud users (join fraud_events on user_id)
        fraud_result = await db.execute(
            select(func.count(func.distinct(ClickEvent.event_id)))
            .join(FraudEvent, FraudEvent.user_id == ClickEvent.user_id)
            .where(FraudEvent.fraud_score >= 0.7)
        )
        fraud_filtered_clicks: int = fraud_result.scalar_one() or 0

        # Effective CTR on non-fraud clicks
        clean_clicks = raw_clicks - fraud_filtered_clicks
        effective_ctr: float = round(
            (clean_clicks / raw_clicks * 100) if raw_clicks > 0 else 0.0, 2
        )

        # Conversions = clicks where actual_outcome == 1
        conv_result = await db.execute(
            select(func.count())
            .select_from(ClickEvent)
            .where(ClickEvent.actual_outcome == 1)
        )
        conversions: int = conv_result.scalar_one() or 0

        # Revenue
        rev_result = await db.execute(select(func.sum(AdCampaign.revenue)))
        revenue: float = float(rev_result.scalar_one() or 0.0)

        return CampaignAnalyticsResponse(
            raw_clicks=raw_clicks,
            fraud_filtered_clicks=fraud_filtered_clicks,
            effective_ctr=effective_ctr,
            conversions=conversions,
            revenue=revenue,
        )

    # ------------------------------------------------------------------
    # 5. Top Performing Ads
    # ------------------------------------------------------------------

    async def get_top_ads(self, limit: int = 10) -> List[TopAdResponse]:
        """
        Return top campaigns sorted by CTR descending.

        Parameters
        ----------
        limit : int
            Max number of campaigns to return.

        Returns
        -------
        List[TopAdResponse]
        """
        AdCampaign, ClickEvent, FraudEvent, InfrastructureMetric, RecommendationLog, User = _models()
        db = self._db

        click_sub = (
            select(
                ClickEvent.campaign_id,
                func.count().label("total_clicks"),
                func.sum(
                    case((ClickEvent.clicked == True, 1), else_=0)  # noqa: E712
                ).label("clicked"),
            )
            .group_by(ClickEvent.campaign_id)
            .subquery()
        )

        fraud_sub = (
            select(
                ClickEvent.campaign_id,
                func.count(func.distinct(ClickEvent.event_id)).label("fraud_clicks"),
            )
            .join(FraudEvent, FraudEvent.user_id == ClickEvent.user_id)
            .where(FraudEvent.fraud_score >= 0.7)
            .group_by(ClickEvent.campaign_id)
            .subquery()
        )

        result = await db.execute(
            select(
                AdCampaign.campaign_name,
                AdCampaign.revenue,
                AdCampaign.spend,
                click_sub.c.total_clicks,
                click_sub.c.clicked,
                func.coalesce(fraud_sub.c.fraud_clicks, 0).label("fraud_clicks"),
            )
            .join(click_sub, click_sub.c.campaign_id == AdCampaign.campaign_id)
            .outerjoin(fraud_sub, fraud_sub.c.campaign_id == AdCampaign.campaign_id)
            .order_by(
                desc(
                    case(
                        (click_sub.c.total_clicks > 0,
                         click_sub.c.clicked * 100.0 / click_sub.c.total_clicks),
                        else_=0,
                    )
                )
            )
            .limit(limit)
        )

        rows = result.all()
        ads: List[TopAdResponse] = []
        for row in rows:
            total = row.total_clicks or 0
            clicked = int(row.clicked or 0)
            ctr = round((clicked / total * 100) if total > 0 else 0.0, 2)
            spend = float(row.spend or 0.0)
            revenue = float(row.revenue or 0.0)
            roas = round(revenue / spend, 2) if spend > 0 else 0.0
            ads.append(
                TopAdResponse(
                    campaign_name=row.campaign_name,
                    ctr=ctr,
                    clicks=total,
                    revenue=revenue,
                    spend=spend,
                    roas=roas,
                    fraud_clicks=int(row.fraud_clicks or 0),
                )
            )
        return ads

    # ------------------------------------------------------------------
    # 6. Geographic Traffic
    # ------------------------------------------------------------------

    async def get_geographic_traffic(self) -> List[GeographicTrafficResponse]:
        """
        Aggregate traffic, fraud rate, and conversion rate by city.

        Returns
        -------
        List[GeographicTrafficResponse]
        """
        AdCampaign, ClickEvent, FraudEvent, InfrastructureMetric, RecommendationLog, User = _models()
        db = self._db

        # Click counts per city
        traffic_sub = (
            select(
                ClickEvent.location.label("city"),
                func.count().label("traffic"),
                func.sum(
                    case((ClickEvent.actual_outcome == 1, 1), else_=0)
                ).label("conversions"),
                func.count(func.distinct(ClickEvent.campaign_id)).label("campaign_count"),
            )
            .group_by(ClickEvent.location)
            .subquery()
        )

        # Fraud clicks per city
        fraud_city_sub = (
            select(
                ClickEvent.location.label("city"),
                func.count(func.distinct(ClickEvent.event_id)).label("fraud_count"),
            )
            .join(FraudEvent, FraudEvent.user_id == ClickEvent.user_id)
            .where(FraudEvent.fraud_score >= 0.7)
            .group_by(ClickEvent.location)
            .subquery()
        )

        # Top campaign per city (by click count)
        top_campaign_sub = (
            select(
                ClickEvent.location.label("city"),
                AdCampaign.campaign_name,
                func.count().label("cnt"),
            )
            .join(AdCampaign, AdCampaign.campaign_id == ClickEvent.campaign_id)
            .group_by(ClickEvent.location, AdCampaign.campaign_name)
            .subquery()
        )

        # Best campaign per city — use a lateral or a correlated max approach.
        # For portability, we join top_campaign_sub on the city and filter by
        # max cnt in application code after fetching.
        result = await db.execute(
            select(
                traffic_sub.c.city,
                traffic_sub.c.traffic,
                traffic_sub.c.conversions,
                func.coalesce(fraud_city_sub.c.fraud_count, 0).label("fraud_count"),
            )
            .outerjoin(fraud_city_sub, fraud_city_sub.c.city == traffic_sub.c.city)
            .order_by(desc(traffic_sub.c.traffic))
            .limit(50)
        )

        rows = result.all()

        # Fetch top campaign per city separately to avoid complex lateral join
        top_camp_result = await db.execute(
            select(
                top_campaign_sub.c.city,
                top_campaign_sub.c.campaign_name,
                func.max(top_campaign_sub.c.cnt).label("max_cnt"),
            )
            .group_by(top_campaign_sub.c.city, top_campaign_sub.c.campaign_name)
        )
        # Build a dict: city -> campaign_name (highest cnt)
        city_campaign: dict[str, str] = {}
        for tc_row in top_camp_result.all():
            city = tc_row.city
            if city not in city_campaign:
                city_campaign[city] = tc_row.campaign_name

        geo_list: List[GeographicTrafficResponse] = []
        for row in rows:
            traffic = row.traffic or 0
            conversions = int(row.conversions or 0)
            fraud_count = int(row.fraud_count or 0)
            fraud_rate = round((fraud_count / traffic * 100) if traffic > 0 else 0.0, 2)
            conversion_rate = round(
                (conversions / traffic * 100) if traffic > 0 else 0.0, 2
            )
            geo_list.append(
                GeographicTrafficResponse(
                    city=row.city or "Unknown",
                    traffic=traffic,
                    fraud_rate=fraud_rate,
                    conversion_rate=conversion_rate,
                    top_campaign=city_campaign.get(row.city),
                )
            )
        return geo_list

    # ------------------------------------------------------------------
    # 7. Fraud Alerts
    # ------------------------------------------------------------------

    async def get_fraud_alerts(self, limit: int = 20) -> List[FraudAlertResponse]:
        """
        Return the most recent fraud events ordered by timestamp desc.

        Parameters
        ----------
        limit : int

        Returns
        -------
        List[FraudAlertResponse]
        """
        AdCampaign, ClickEvent, FraudEvent, InfrastructureMetric, RecommendationLog, User = _models()
        db = self._db

        result = await db.execute(
            select(FraudEvent)
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

    # ------------------------------------------------------------------
    # 8. SHAP Explanations  (ML integration placeholder)
    # ------------------------------------------------------------------

    async def get_campaign_explanations(
        self, campaign_id: int
    ) -> SHAPExplanationResponse:
        """
        Return SHAP feature attributions for a campaign.

        This method is intentionally a placeholder.  The ML service will
        populate shap_data (e.g. from a pre-computed JSON column or a Redis
        key) and this method transforms it into the typed schema.

        To integrate:
        1. Fetch pre-computed SHAP values from Redis or a DB column.
        2. Deserialise into a list of {feature, shap_value} dicts.
        3. Normalise shap_value to a 0–100 impact scale.
        4. Replace the stub features below with the real data.
        """
        AdCampaign, ClickEvent, FraudEvent, InfrastructureMetric, RecommendationLog, User = _models()
        db = self._db

        campaign_result = await db.execute(
            select(AdCampaign).where(AdCampaign.campaign_id == campaign_id)
        )
        campaign = campaign_result.scalar_one_or_none()
        if campaign is None:
            from fastapi import HTTPException  # noqa: PLC0415
            raise HTTPException(status_code=404, detail=f"Campaign {campaign_id} not found.")

        # ── STUB: replace with real SHAP data from ML service ──────────
        stub_features: List[SHAPFeatureItem] = [
            SHAPFeatureItem(
                feature="Predicted CTR",
                impact=31.0,
                description="Model-predicted click probability is the strongest positive signal.",
            ),
            SHAPFeatureItem(
                feature="User Interest Match",
                impact=24.0,
                description="High alignment between ad category and user interest cluster.",
            ),
            SHAPFeatureItem(
                feature="Device Type",
                impact=18.0,
                description="Mobile users show 1.4× higher engagement for this campaign.",
            ),
            SHAPFeatureItem(
                feature="Time of Day",
                impact=15.0,
                description="Ads shown between 18:00–21:00 local time perform best.",
            ),
            SHAPFeatureItem(
                feature="Geographic Region",
                impact=12.0,
                description="Tier-1 cities contribute disproportionately to conversions.",
            ),
        ]
        # ───────────────────────────────────────────────────────────────

        return SHAPExplanationResponse(
            campaign_name=campaign.campaign_name,
            features=stub_features,
        )

    # ------------------------------------------------------------------
    # 9. Infrastructure / System Health
    # ------------------------------------------------------------------

    async def get_system_health(self) -> List[SystemHealthResponse]:
        """
        Return current health status for every registered service.

        Returns
        -------
        List[SystemHealthResponse]
        """
        AdCampaign, ClickEvent, FraudEvent, InfrastructureMetric, RecommendationLog, User = _models()
        db = self._db

        # Latest heartbeat per service
        latest_sub = (
            select(
                InfrastructureMetric.service_name,
                func.max(InfrastructureMetric.heartbeat_timestamp).label("latest_ts"),
            )
            .group_by(InfrastructureMetric.service_name)
            .subquery()
        )

        result = await db.execute(
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

    # ------------------------------------------------------------------
    # 10. AI Recommendations
    # ------------------------------------------------------------------

    async def get_ai_recommendations(self) -> List[AIRecommendationResponse]:
        """
        Derive actionable business recommendations from live analytics.

        Logic:
        - High fraud rate → recommend fraud threshold tightening.
        - Low CTR         → recommend audience re-targeting.
        - Low ROAS        → recommend budget reallocation.
        - Healthy metrics → recommend scaling top performers.

        Returns
        -------
        List[AIRecommendationResponse]
        """
        AdCampaign, ClickEvent, FraudEvent, InfrastructureMetric, RecommendationLog, User = _models()
        db = self._db

        recommendations: List[AIRecommendationResponse] = []

        # --- Fraud rate check ---
        total_events_r = await db.execute(select(func.count()).select_from(FraudEvent))
        critical_r = await db.execute(
            select(func.count()).select_from(FraudEvent).where(FraudEvent.severity == "CRITICAL")
        )
        total_events = total_events_r.scalar_one() or 0
        critical_events = critical_r.scalar_one() or 0
        if total_events > 0 and (critical_events / total_events) > 0.05:
            recommendations.append(
                AIRecommendationResponse(
                    title="Tighten Fraud Detection Threshold",
                    description=(
                        f"{critical_events} CRITICAL fraud events detected "
                        f"({critical_events / total_events * 100:.1f}% of all events). "
                        "Recommend lowering fraud_score threshold from 0.70 to 0.60 and "
                        "enabling IP-block rules for Bot Farm category."
                    ),
                    priority="HIGH",
                    action="Update Fraud Threshold",
                )
            )

        # --- CTR check ---
        overview = await self.get_overview()
        if overview.ctr < 2.0:
            recommendations.append(
                AIRecommendationResponse(
                    title="Re-Target Underperforming Audiences",
                    description=(
                        f"Platform-wide CTR is {overview.ctr:.2f}%, below the 2% benchmark. "
                        "Consider refreshing creative assets and narrowing audience segments "
                        "using the Recommendation Engine's collaborative filter outputs."
                    ),
                    priority="HIGH",
                    action="Refresh Audience Segments",
                )
            )

        # --- ROAS check on bottom campaigns ---
        low_roas_r = await db.execute(
            select(AdCampaign.campaign_name, AdCampaign.revenue, AdCampaign.spend)
            .where(AdCampaign.spend > 0)
            .where(AdCampaign.revenue / AdCampaign.spend < 1.5)
            .where(AdCampaign.status == "active")
            .limit(5)
        )
        low_roas_campaigns = low_roas_r.all()
        if low_roas_campaigns:
            names = ", ".join(r.campaign_name for r in low_roas_campaigns[:3])
            recommendations.append(
                AIRecommendationResponse(
                    title="Reallocate Budget from Low-ROAS Campaigns",
                    description=(
                        f"Campaigns {names} have ROAS below 1.5×. "
                        "Reallocating spend to top-performing campaigns could improve "
                        "overall portfolio return by an estimated 18–25%."
                    ),
                    priority="MEDIUM",
                    action="Reallocate Budget",
                )
            )

        # --- Scale top performers ---
        top_ads = await self.get_top_ads(limit=1)
        if top_ads and top_ads[0].roas >= 3.0:
            recommendations.append(
                AIRecommendationResponse(
                    title=f"Scale '{top_ads[0].campaign_name}'",
                    description=(
                        f"Top campaign '{top_ads[0].campaign_name}' achieves "
                        f"{top_ads[0].roas:.1f}× ROAS at {top_ads[0].ctr:.2f}% CTR. "
                        "Increasing its daily budget cap by 30% is projected to yield "
                        "proportional revenue uplift without quality degradation."
                    ),
                    priority="MEDIUM",
                    action="Increase Budget",
                )
            )

        # Generic fallback
        if not recommendations:
            recommendations.append(
                AIRecommendationResponse(
                    title="Maintain Current Strategy",
                    description=(
                        "All key metrics are within healthy ranges. "
                        "Continue monitoring CTR, fraud rates, and ROAS on a 15-minute cadence."
                    ),
                    priority="LOW",
                    action="Monitor",
                )
            )

        return recommendations

    # ------------------------------------------------------------------
    # Live update snapshot  (used by WebSocket)
    # ------------------------------------------------------------------

    async def get_live_snapshot(self) -> DashboardLiveUpdate:
        """
        Lightweight snapshot for the WebSocket push loop.

        Returns
        -------
        DashboardLiveUpdate
        """
        AdCampaign, ClickEvent, FraudEvent, InfrastructureMetric, RecommendationLog, User = _models()
        db = self._db
        now = datetime.now(timezone.utc)
        window_15m = now - timedelta(minutes=15)
        window_1m = now - timedelta(minutes=1)

        active_r = await db.execute(
            select(func.count(func.distinct(User.user_id))).where(User.last_active >= window_15m)
        )
        active_users: int = active_r.scalar_one() or 0

        total_r = await db.execute(select(func.count()).select_from(ClickEvent))
        clicked_r = await db.execute(
            select(func.count()).select_from(ClickEvent).where(ClickEvent.clicked == True)  # noqa: E712
        )
        total = total_r.scalar_one() or 0
        clicked = clicked_r.scalar_one() or 0
        ctr = round((clicked / total * 100) if total > 0 else 0.0, 2)

        eps_r = await db.execute(
            select(func.count()).select_from(ClickEvent).where(ClickEvent.timestamp >= window_1m)
        )
        eps = round((eps_r.scalar_one() or 0) / 60, 2)

        fraud_count_r = await db.execute(
            select(func.count()).select_from(FraudEvent)
            .where(FraudEvent.timestamp >= window_15m)
        )
        fraud_alert_count: int = fraud_count_r.scalar_one() or 0

        rev_r = await db.execute(select(func.sum(AdCampaign.revenue)))
        revenue: float = float(rev_r.scalar_one() or 0.0)

        return DashboardLiveUpdate(
            events_per_second=eps,
            active_users=active_users,
            ctr=ctr,
            fraud_alert_count=fraud_alert_count,
            revenue=revenue,
            timestamp=now,
        )