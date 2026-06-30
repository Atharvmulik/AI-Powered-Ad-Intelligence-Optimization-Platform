"""
AnalyticsService — Service layer for the Analytics module (Part 1).

All database access is encapsulated here. The API layer never touches SQLAlchemy
directly; it only calls these methods through dependency injection.

Design principles:
  - Async-first (AsyncSession / asyncpg)
  - Single-responsibility per method
  - Typed return values matching Pydantic schemas
  - Raw SQL via sqlalchemy.text() — no ORM, no query builder
  - Graceful error handling with structured logging
  - Future-ready comments for Redis caching and Kafka event publishing
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.analytics import (
    AIGrowthPredictionResponse,
    AnalyticsLiveUpdate,
    AnalyticsOverviewResponse,
    AnalyticsTerminalResponse,
    CampaignPerformanceResponse,
    CTRDataPoint,
    CTRTrendResponse,
    CTRUpdate,
    ClickDistributionResponse,
    ConversionFunnelResponse,
    DeviceSplitResponse,
    EngagementResponse,
    FraudMonitorResponse,
    FraudMonitorUpdate,
    GrowthForecastPoint,
    PieChartItem,
    ReportResponse,
    ScheduledReportResponse,
    TerminalLogUpdate,
    TopAdAnalyticsResponse,
    UserInterestResponse,
    PlacementPerformanceResponse,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

ACTIVE_USER_WINDOW_MINUTES: int = 15
CTR_HISTORY_POINTS: int = 20
TOP_ADS_LIMIT: int = 5
FRAUD_LIMIT: int = 20
TERMINAL_LIMIT: int = 50
EVENTS_PER_SECOND_WINDOW_MINUTES: int = 1
PREVIOUS_WINDOW_HOURS: int = 24
TARGET_CTR: float = 5.0  # Platform-wide target CTR threshold (%)
AVERAGE_CPC_USD: float = 0.50  # Estimated cost-per-click used for budget calculations


# ---------------------------------------------------------------------------
# Service class
# ---------------------------------------------------------------------------


class AnalyticsService:
    """
    All analytics-related database operations.

    Instantiated per-request via FastAPI dependency injection, receiving an
    AsyncSession that is managed (committed / rolled back) by the caller.

    Future extensions:
      - Inject a Redis client for hot-path caching (overview, ctr_trend)
      - Inject a Kafka consumer to derive engagement signals from the event stream
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ------------------------------------------------------------------
    # 1. Analytics Overview
    # ------------------------------------------------------------------

    async def get_overview(self) -> AnalyticsOverviewResponse:
        """
        Compute top-level analytics dashboard KPIs from click_events,
        fraud_events, ml_prediction_logs, and users tables.

        Returns current-window values and previous-window equivalents for
        period-over-period comparison cards.

        TODO (Redis): cache result for 10 s to reduce DB read pressure at scale.
        """
        try:
            now_utc = datetime.utcnow()
            window_start = now_utc - timedelta(minutes=ACTIVE_USER_WINDOW_MINUTES)
            prev_window_start = window_start - timedelta(hours=PREVIOUS_WINDOW_HOURS)
            prev_window_end = now_utc - timedelta(hours=PREVIOUS_WINDOW_HOURS)
            one_minute_ago = now_utc - timedelta(minutes=EVENTS_PER_SECOND_WINDOW_MINUTES)
            prev_one_minute_ago = one_minute_ago - timedelta(hours=PREVIOUS_WINDOW_HOURS)
            today_start = now_utc.replace(hour=0, minute=0, second=0, microsecond=0)

            # ------------------------------------------------------------------
            # Active users — distinct user_id in click_events in last 15 min
            # ------------------------------------------------------------------
            au_result = await self.db.execute(
                text(
                    """
                    SELECT
                        COUNT(DISTINCT user_id) FILTER (
                            WHERE timestamp >= :window_start
                        ) AS current_au,
                        COUNT(DISTINCT user_id) FILTER (
                            WHERE timestamp >= :prev_window_start
                              AND timestamp <  :prev_window_end
                        ) AS previous_au
                    FROM click_events
                    WHERE timestamp >= :prev_window_start
                    """
                ),
                {
                    "window_start": window_start,
                    "prev_window_start": prev_window_start,
                    "prev_window_end": prev_window_end,
                },
            )
            au_row = au_result.mappings().one_or_none()
            active_users = int(au_row["current_au"] if au_row else 0)
            previous_active_users = int(au_row["previous_au"] if au_row else 0)

            # ------------------------------------------------------------------
            # Events per second — count clicks in last minute / 60
            # ------------------------------------------------------------------
            eps_result = await self.db.execute(
                text(
                    """
                    SELECT
                        COUNT(*) FILTER (
                            WHERE timestamp >= :one_minute_ago
                        ) AS current_events,
                        COUNT(*) FILTER (
                            WHERE timestamp >= :prev_one_minute_ago
                              AND timestamp <  :prev_window_end
                        ) AS previous_events
                    FROM click_events
                    WHERE timestamp >= :prev_one_minute_ago
                    """
                ),
                {
                    "one_minute_ago": one_minute_ago,
                    "prev_one_minute_ago": prev_one_minute_ago,
                    "prev_window_end": prev_window_end,
                },
            )
            eps_row = eps_result.mappings().one_or_none()
            events_per_second = round(float(eps_row["current_events"] if eps_row else 0) / 60.0, 2)
            previous_events_per_second = round(
                float(eps_row["previous_events"] if eps_row else 0) / 60.0, 2
            )

            # ------------------------------------------------------------------
            # Average bid latency — from ml_prediction_logs
            # ------------------------------------------------------------------
            lat_result = await self.db.execute(
                text(
                    """
                    SELECT
                        AVG(inference_latency_ms) FILTER (
                            WHERE timestamp >= :today_start
                        ) AS current_lat,
                        AVG(inference_latency_ms) FILTER (
                            WHERE timestamp >= :prev_window_start
                              AND timestamp <  :prev_window_end
                        ) AS previous_lat
                    FROM ml_prediction_logs
                    WHERE timestamp >= :prev_window_start
                    """
                ),
                {
                    "today_start": today_start,
                    "prev_window_start": prev_window_start,
                    "prev_window_end": prev_window_end,
                },
            )
            lat_row = lat_result.mappings().one_or_none()
            avg_bid_latency_ms = round(float(lat_row["current_lat"] or 0.0), 2)
            previous_bid_latency_ms = round(float(lat_row["previous_lat"] or 0.0), 2)

            # ------------------------------------------------------------------
            # Fraud rate — blocked events / total events (%)
            # ------------------------------------------------------------------
            fraud_result = await self.db.execute(
                text(
                    """
                    SELECT
                        COUNT(*) FILTER (
                            WHERE timestamp >= :today_start
                        ) AS current_total,
                        COUNT(*) FILTER (
                            WHERE status = 'Blocked'
                              AND timestamp >= :today_start
                        ) AS current_blocked,
                        COUNT(*) FILTER (
                            WHERE timestamp >= :prev_window_start
                              AND timestamp <  :prev_window_end
                        ) AS previous_total,
                        COUNT(*) FILTER (
                            WHERE status = 'Blocked'
                              AND timestamp >= :prev_window_start
                              AND timestamp <  :prev_window_end
                        ) AS previous_blocked
                    FROM fraud_events
                    WHERE timestamp >= :prev_window_start
                    """
                ),
                {
                    "today_start": today_start,
                    "prev_window_start": prev_window_start,
                    "prev_window_end": prev_window_end,
                },
            )
            fraud_row = fraud_result.mappings().one_or_none()
            current_total_f = int(fraud_row["current_total"] or 1) if fraud_row else 1
            current_blocked = int(fraud_row["current_blocked"] or 0) if fraud_row else 0
            previous_total_f = int(fraud_row["previous_total"] or 1) if fraud_row else 1
            previous_blocked = int(fraud_row["previous_blocked"] or 0) if fraud_row else 0
            fraud_rate = round((current_blocked / current_total_f) * 100, 2)
            previous_fraud_rate = round((previous_blocked / previous_total_f) * 100, 2)

            # ------------------------------------------------------------------
            # Current CTR — average predicted_ctr across today's click_events
            # ------------------------------------------------------------------
            ctr_result = await self.db.execute(
                text(
                    """
                    SELECT
                        ROUND(AVG(predicted_ctr) * 100, 2) AS current_ctr
                    FROM click_events
                    WHERE timestamp >= :today_start
                    """
                ),
                {"today_start": today_start},
            )
            ctr_row = ctr_result.mappings().one_or_none()
            current_ctr = float(ctr_row["current_ctr"] or 0.0) if ctr_row else 0.0

            # ------------------------------------------------------------------
            # Summary string derived from computed KPIs
            # ------------------------------------------------------------------
            summary = (
                f"{active_users} active users · "
                f"{events_per_second} events/s · "
                f"CTR {current_ctr}% · "
                f"Fraud rate {fraud_rate}% · "
                f"Avg latency {avg_bid_latency_ms} ms"
            )

            return AnalyticsOverviewResponse(
                active_users=active_users,
                previous_active_users=previous_active_users,
                events_per_second=events_per_second,
                previous_events_per_second=previous_events_per_second,
                avg_bid_latency_ms=avg_bid_latency_ms,
                previous_bid_latency_ms=previous_bid_latency_ms,
                fraud_rate=fraud_rate,
                previous_fraud_rate=previous_fraud_rate,
                current_ctr=current_ctr,
                summary=summary,
            )

        except Exception as exc:
            logger.exception("AnalyticsService.get_overview failed: %s", exc)
            raise

    # ------------------------------------------------------------------
    # 2. CTR Trend
    # ------------------------------------------------------------------

    async def get_ctr_trend(self) -> CTRTrendResponse:
        """
        Return a rolling CTR graph composed of the last 20 one-minute
        time buckets, derived from date_trunc on click_events.timestamp.

        TODO (Redis): maintain a sorted set of per-minute CTR snapshots
        for sub-millisecond reads on high-traffic deployments.
        """
        try:
            result = await self.db.execute(
                text(
                    """
                    WITH buckets AS (
                        SELECT
                            date_trunc('minute', timestamp) AS bucket,
                            ROUND(AVG(predicted_ctr) * 100, 2) AS avg_ctr,
                            COUNT(*) AS events
                        FROM click_events
                        WHERE timestamp >= NOW() - INTERVAL '20 minutes'
                        GROUP BY bucket
                        ORDER BY bucket DESC
                        LIMIT :limit
                    )
                    SELECT bucket, avg_ctr, events
                    FROM buckets
                    ORDER BY bucket ASC
                    """
                ),
                {"limit": CTR_HISTORY_POINTS},
            )
            rows = result.mappings().all()

            points: List[CTRDataPoint] = [
                CTRDataPoint(
                    time=row["bucket"].strftime("%H:%M:%S"),
                    ctr=float(row["avg_ctr"] or 0.0),
                    events=int(row["events"]),
                )
                for row in rows
            ]

            # Current CTR = average of all returned buckets
            current_ctr = (
                round(sum(p.ctr for p in points) / len(points), 2) if points else 0.0
            )

            return CTRTrendResponse(
                current_ctr=current_ctr,
                target_ctr=TARGET_CTR,
                points=points,
            )

        except Exception as exc:
            logger.exception("AnalyticsService.get_ctr_trend failed: %s", exc)
            raise

    # ------------------------------------------------------------------
    # 3. Click Distribution
    # ------------------------------------------------------------------

    async def get_click_distribution(self) -> ClickDistributionResponse:
        """
        Return click distribution across logical advertising channels.

        Since the current schema does not store an explicit channel,
        derive a stable channel from campaign_id so the frontend can
        render a meaningful distribution without requiring schema changes.
        """
        try:
            result = await self.db.execute(
                text(
                    """
                    WITH channel_clicks AS (
                        SELECT
                            CASE
                                WHEN MOD(ce.campaign_id, 4) = 0 THEN 'Search Ads'
                                WHEN MOD(ce.campaign_id, 4) = 1 THEN 'Social Media'
                                WHEN MOD(ce.campaign_id, 4) = 2 THEN 'Display Ads'
                                ELSE 'Video Ads'
                            END AS channel,
                            COUNT(*) AS clicks
                        FROM click_events ce
                        WHERE ce.campaign_id IS NOT NULL
                        GROUP BY
                            CASE
                                WHEN MOD(ce.campaign_id, 4) = 0 THEN 'Search Ads'
                                WHEN MOD(ce.campaign_id, 4) = 1 THEN 'Social Media'
                                WHEN MOD(ce.campaign_id, 4) = 2 THEN 'Display Ads'
                                ELSE 'Video Ads'
                            END
                    ),
                    totals AS (
                        SELECT SUM(clicks) AS grand_total
                        FROM channel_clicks
                    )
                    SELECT
                        cc.channel,
                        cc.clicks,
                        ROUND(
                            (cc.clicks::numeric / NULLIF(t.grand_total, 0)) * 100,
                            2
                        ) AS percentage,
                        t.grand_total
                    FROM channel_clicks cc
                    CROSS JOIN totals t
                    ORDER BY cc.clicks DESC;
                    """
                )
            )

            rows = result.mappings().all()

            total_clicks = int(rows[0]["grand_total"]) if rows else 0

            channels = [
                PieChartItem(
                    label=row["channel"],
                    percentage=float(row["percentage"] or 0),
                    clicks=int(row["clicks"]),
                )
                for row in rows
            ]

            return ClickDistributionResponse(
                total_clicks=total_clicks,
                channels=channels,
            )

        except Exception as exc:
            logger.exception(
                "AnalyticsService.get_click_distribution failed: %s",
                exc,
            )
            raise

    # ------------------------------------------------------------------
    # 4. Engagement Analytics
    # ------------------------------------------------------------------

    async def get_engagement(self) -> EngagementResponse:
        """
        Derive engagement metrics using existing database tables.

        Metrics:
        - Average session duration (estimated from clicks)
        - Returning users
        - Bounce rate
        - Engagement score
        """
        try:
            result = await self.db.execute(
                text(
                    """
                    WITH user_activity AS (
                        SELECT
                            user_id,
                            COUNT(*) AS clicks
                        FROM click_events
                        GROUP BY user_id
                    )

                    SELECT
                        ROUND(AVG(clicks * 30), 2) AS avg_duration_seconds,

                        COUNT(*) FILTER (
                            WHERE clicks > 1
                        ) AS returning_users,

                        COUNT(*) FILTER (
                            WHERE clicks = 1
                        ) AS bounced_users,

                        COUNT(*) AS total_users

                    FROM user_activity;
                    """
                )
            )

            row = result.mappings().one_or_none()

            if not row or row["total_users"] == 0:
                return EngagementResponse(
                    average_session_duration=0,
                    bounce_rate=0,
                    returning_users=0,
                    engagement_score=0,
                )

            avg_duration = float(row["avg_duration_seconds"] or 0)

            returning_users = int(row["returning_users"] or 0)

            bounced_users = int(row["bounced_users"] or 0)

            total_users = int(row["total_users"])

            bounce_rate = round(
                (bounced_users / total_users) * 100,
                2,
            )

            returning_percentage = (
                returning_users / total_users
            ) * 100

            engagement_score = round(
                (returning_percentage * 0.7)
                + ((100 - bounce_rate) * 0.3),
                1,
            )

            return EngagementResponse(
                average_session_duration=avg_duration,
                bounce_rate=bounce_rate,
                returning_users=returning_users,
                engagement_score=engagement_score,
            )

        except Exception as exc:
            logger.exception(
                "AnalyticsService.get_engagement failed: %s",
                exc,
            )
            raise

    # ------------------------------------------------------------------
    # 5. Device Split
    # ------------------------------------------------------------------

    async def get_device_split(self) -> DeviceSplitResponse:
        """
        Return the percentage distribution of users across device types
        using the device_type column on the users table.

        Device type values expected: 'Desktop', 'Mobile', 'Tablet'.
        Any unlisted device type is ignored in the percentage breakdown.
        """
        try:
            result = await self.db.execute(
                text(
                    """
                    WITH device_counts AS (
                        SELECT
                            device_type,
                            COUNT(*) AS cnt
                        FROM users
                        WHERE device_type IN ('Desktop', 'Mobile', 'Tablet')
                        GROUP BY device_type
                    ),
                    totals AS (
                        SELECT SUM(cnt) AS grand_total FROM device_counts
                    )
                    SELECT
                        dc.device_type,
                        ROUND(
                            (dc.cnt::numeric / NULLIF(t.grand_total, 0)) * 100,
                            2
                        ) AS percentage,
                        t.grand_total
                    FROM device_counts dc
                    CROSS JOIN totals t
                    ORDER BY dc.cnt DESC
                    """
                )
            )
            rows = result.mappings().all()

            totals = int(rows[0]["grand_total"]) if rows else 0
            pct_map: Dict[str, float] = {
                row["device_type"]: float(row["percentage"] or 0.0) for row in rows
            }

            return DeviceSplitResponse(
                desktop=pct_map.get("Desktop", 0.0),
                mobile=pct_map.get("Mobile", 0.0),
                tablet=pct_map.get("Tablet", 0.0),
                total_users=totals,
            )

        except Exception as exc:
            logger.exception("AnalyticsService.get_device_split failed: %s", exc)
            raise

    # ------------------------------------------------------------------
    # 6. Top Performing Ads
    # ------------------------------------------------------------------

    async def get_top_ads(self) -> List[TopAdAnalyticsResponse]:
        """
        Return the top-performing campaigns ranked by average predicted CTR.

        Uses:
            - click_events
            - ad_campaigns
            - ad_creatives

        Joins are performed using campaign_id because click_events.ad_id
        (VARCHAR) is not compatible with ad_creatives.ad_id (SERIAL).
        """
        try:
            result = await self.db.execute(
                text(
                    """
                    WITH ad_stats AS (
                        SELECT
                            ce.campaign_id,
                            ROUND(AVG(predicted_ctr) * 100, 2) AS ctr,
                            COUNT(*) AS click_count,
                            ROW_NUMBER() OVER (
                                ORDER BY AVG(predicted_ctr) DESC
                            ) AS rank
                        FROM click_events ce
                        WHERE ce.campaign_id IS NOT NULL
                        GROUP BY ce.campaign_id
                        ORDER BY ctr DESC
                        LIMIT :limit
                    )

                    SELECT
                        ads.rank,

                        ac.campaign_name,

                        COALESCE(ac.advertiser_id, 'Unknown') AS brand,

                        COALESCE(acr.category, 'General') AS category,

                        UPPER(ac.status) AS status,

                        ads.ctr,

                        COALESCE(ac.revenue, 0) AS revenue

                    FROM ad_stats ads

                    INNER JOIN ad_campaigns ac
                        ON ac.campaign_id = ads.campaign_id

                    LEFT JOIN ad_creatives acr
                        ON acr.campaign_id = ads.campaign_id

                    ORDER BY ads.rank;
                    """
                ),
                {"limit": TOP_ADS_LIMIT},
            )

            rows = result.mappings().all()

            return [
                TopAdAnalyticsResponse(
                    rank=int(row["rank"]),
                    campaign=row["campaign_name"],
                    brand=row["brand"],
                    category=row["category"],
                    status=row["status"],
                    ctr=float(row["ctr"] or 0),
                    revenue=float(row["revenue"] or 0),
                )
                for row in rows
            ]

        except Exception as exc:
            logger.exception(
                "AnalyticsService.get_top_ads failed: %s",
                exc,
            )
            raise
    # ------------------------------------------------------------------
    # 7. AI Growth Prediction
    # ------------------------------------------------------------------

    async def get_ai_growth_prediction(self) -> AIGrowthPredictionResponse:
        """
        Generate AI growth insights using ml_prediction_logs and
        recommendation_logs.

        Uses only columns that exist in the current schema.
        """
        try:
            # ML prediction statistics
            ml_result = await self.db.execute(
                text(
                    """
                    SELECT
                        ROUND(AVG(click_probability) * 100, 2)      AS prediction_accuracy,
                        ROUND(AVG(click_probability), 4)            AS avg_click_probability,
                        ROUND(AVG(fraud_probability), 4)            AS avg_fraud_probability,
                        ROUND(AVG(recommendation_score), 4)         AS avg_recommendation_score,
                        ROUND(AVG(inference_latency_ms), 2)         AS avg_latency,
                        MAX(model_version)                          AS latest_model_version
                    FROM ml_prediction_logs;
                    """
                )
            )

            ml = ml_result.mappings().one_or_none()

            prediction_accuracy = float(ml["prediction_accuracy"] or 0)
            click_probability = float(ml["avg_click_probability"] or 0)
            fraud_probability = float(ml["avg_fraud_probability"] or 0)
            recommendation_score = float(ml["avg_recommendation_score"] or 0)
            model_version = ml["latest_model_version"] or "v1.0"

            # Growth forecast derived from recommendation logs
            rec_result = await self.db.execute(
                text(
                    """
                    SELECT
                        ROUND(AVG(recommendation_score) * 100, 2) AS growth_forecast
                    FROM recommendation_logs;
                    """
                )
            )

            rec = rec_result.mappings().one_or_none()

            growth_forecast = float(rec["growth_forecast"] or 0)

            # Confidence calculated from click probability
            confidence = round(prediction_accuracy, 2)

            return AIGrowthPredictionResponse(
                prediction_accuracy=prediction_accuracy,
                recommendation_score=recommendation_score,
                fraud_probability=fraud_probability,
                click_probability=click_probability,
                growth_forecast=growth_forecast,
                confidence=confidence,
                model_version=model_version,
            )

        except Exception as exc:
            logger.exception(
                "AnalyticsService.get_ai_growth_prediction failed: %s",
                exc,
            )
            raise



# ------------------------------------------------------------------
    # 8. User Interests
    # ------------------------------------------------------------------

    async def get_user_interests(self) -> "UserInterestResponse":
        """
        Aggregate user interest categories from the users.interests column,
        compute each category's share of total interest signal, and return
        them ordered by percentage descending.

        Expects users.interests to be a text column containing a
        comma-separated list of interest labels per user
        (e.g. 'Technology,Sports,Finance').
        """
        try:
            result = await self.db.execute(
                text(
                    """
                    WITH exploded AS (
                        SELECT TRIM(interest) AS category
                        FROM users,
                             UNNEST(STRING_TO_ARRAY(interests, ',')) AS interest
                        WHERE interests IS NOT NULL
                          AND interests <> ''
                    ),
                    counts AS (
                        SELECT
                            category,
                            COUNT(*) AS cnt
                        FROM exploded
                        GROUP BY category
                    ),
                    totals AS (
                        SELECT SUM(cnt) AS grand_total FROM counts
                    )
                    SELECT
                        c.category,
                        ROUND(
                            (c.cnt::numeric / NULLIF(t.grand_total, 0)) * 100,
                            2
                        ) AS percentage
                    FROM counts c
                    CROSS JOIN totals t
                    ORDER BY c.cnt DESC
                    """
                )
            )
            rows = result.mappings().all()

            from app.schemas.analytics import InterestItem, UserInterestResponse

            interests = [
                InterestItem(
                    category=row["category"],
                    percentage=float(row["percentage"] or 0.0),
                )
                for row in rows
            ]

            return UserInterestResponse(interests=interests)

        except Exception as exc:
            logger.exception("AnalyticsService.get_user_interests failed: %s", exc)
            raise

    # ------------------------------------------------------------------
    # 9. Conversion Funnel
    # ------------------------------------------------------------------

    async def get_conversion_funnel(self) -> "ConversionFunnelResponse":
        """
        Build the advertising conversion funnel.

        Funnel:
            Impressions -> Clicks -> Conversions -> Revenue Events

        Definitions:
            - Impressions      : Total tracked click_events.
            - Clicks           : actual_outcome = 1.
            - Conversions      : Clicks with click_probability >= 0.50.
            - Revenue Events   : Converted events belonging to campaigns
                                that generated revenue (> 0).
        """
        try:
            result = await self.db.execute(
                text(
                    """
                    SELECT
                        COUNT(*) AS impressions,

                        COUNT(*) FILTER (
                            WHERE ce.actual_outcome = 1
                        ) AS clicks,

                        COUNT(*) FILTER (
                            WHERE ce.actual_outcome = 1
                            AND predicted_ctr >= 0.50
                        ) AS conversions,

                        COUNT(*) FILTER (
                            WHERE ce.actual_outcome = 1
                            AND ac.revenue > 0
                        ) AS revenue_events

                    FROM click_events ce

                    LEFT JOIN ad_campaigns ac
                        ON ac.campaign_id = ce.campaign_id;
                    """
                )
            )

            row = result.mappings().one_or_none()

            from app.schemas.analytics import ConversionFunnelResponse

            impressions = int(row["impressions"] or 0) if row else 0
            clicks = int(row["clicks"] or 0) if row else 0
            conversions = int(row["conversions"] or 0) if row else 0
            revenue_events = int(row["revenue_events"] or 0) if row else 0

            click_rate = round(
                (clicks / impressions) * 100 if impressions else 0,
                2,
            )

            conversion_rate = round(
                (conversions / clicks) * 100 if clicks else 0,
                2,
            )

            revenue_rate = round(
                (revenue_events / conversions) * 100 if conversions else 0,
                2,
            )

            impression_drop = round(100 - click_rate, 2)
            click_drop = round(100 - conversion_rate, 2)
            conversion_drop = round(100 - revenue_rate, 2)

            return ConversionFunnelResponse(
                impressions=impressions,
                clicks=clicks,
                conversions=conversions,
                revenue_events=revenue_events,
                click_rate=click_rate,
                conversion_rate=conversion_rate,
                revenue_rate=revenue_rate,
                impression_drop=impression_drop,
                click_drop=click_drop,
                conversion_drop=conversion_drop,
            )

        except Exception as exc:
            logger.exception(
                "AnalyticsService.get_conversion_funnel failed: %s",
                exc,
            )
            raise

    # ------------------------------------------------------------------
    # 10. Placement Performance
    # ------------------------------------------------------------------

    async def get_placement_performance(self) -> "PlacementPerformanceResponse":
        """
        Compute placement performance from placement_agent_logs.

        Since placement_agent_logs is not linked to campaigns or click events,
        performance is derived from the reinforcement learning agent's
        expected_reward and execution frequency.
        """
        try:
            result = await self.db.execute(
                text(
                    """
                    WITH placement_stats AS (
                        SELECT
                            action AS placement,
                            COUNT(*) AS impressions,
                            ROUND(AVG(expected_reward) * 100, 2) AS ctr,
                            ROUND(SUM(expected_reward), 2) AS revenue
                        FROM placement_agent_logs
                        GROUP BY action
                    ),
                    ranked AS (
                        SELECT
                            placement,
                            impressions,
                            ctr,
                            revenue,
                            MAX(ctr) OVER () AS best_ctr
                        FROM placement_stats
                    )

                    SELECT
                        placement,
                        impressions,
                        ctr,
                        revenue,

                        ROUND(
                            (ctr / NULLIF(best_ctr, 0)) * 100,
                            2
                        ) AS performance_percentage,

                        CASE
                            WHEN ctr = best_ctr THEN TRUE
                            ELSE FALSE
                        END AS is_best

                    FROM ranked

                    ORDER BY ctr DESC;
                    """
                )
            )

            rows = result.mappings().all()

            from app.schemas.analytics import (
                PlacementPerformanceItem,
                PlacementPerformanceResponse,
            )

            placements = [
                PlacementPerformanceItem(
                    placement=row["placement"],
                    impressions=int(row["impressions"] or 0),
                    ctr=float(row["ctr"] or 0),
                    revenue=float(row["revenue"] or 0),
                    performance_percentage=float(
                        row["performance_percentage"] or 0
                    ),
                    is_best=bool(row["is_best"]),
                )
                for row in rows
            ]

            return PlacementPerformanceResponse(
                placements=placements
            )

        except Exception as exc:
            logger.exception(
                "AnalyticsService.get_placement_performance failed: %s",
                exc,
            )
            raise
    # ------------------------------------------------------------------
    # 11. Fraud Monitor
    # ------------------------------------------------------------------

    async def get_fraud_monitor(self) -> "FraudMonitorResponse":
        """
        Return a real-time fraud monitoring snapshot combining aggregate
        counters (blocked / flagged / clean today) with the latest 20
        fraud event records ordered by timestamp descending.

        TODO (Redis): maintain a sorted set keyed by timestamp for O(1)
        retrieval of the latest N events at high ingestion rates.
        TODO (Kafka): consume from the fraud-events topic instead of
        polling the DB on every request.
        """
        try:
            now_utc = datetime.utcnow()
            today_start = now_utc.replace(hour=0, minute=0, second=0, microsecond=0)

            # Aggregate counters — single scan of today's rows
            agg_result = await self.db.execute(
                text(
                    """
                    SELECT
                        COUNT(*) FILTER (WHERE status = 'Blocked')       AS blocked_today,
                        COUNT(*) FILTER (WHERE status = 'Investigating') AS flagged,
                        COUNT(*) FILTER (WHERE status = 'Pending')       AS clean
                    FROM fraud_events
                    WHERE timestamp >= :today_start
                    """
                ),
                {"today_start": today_start},
            )
            agg_row = agg_result.mappings().one_or_none()
            blocked_today = int(agg_row["blocked_today"] or 0) if agg_row else 0
            flagged       = int(agg_row["flagged"]       or 0) if agg_row else 0
            clean         = int(agg_row["clean"]         or 0) if agg_row else 0

            # Latest fraud events feed
            events_result = await self.db.execute(
                text(
                    """
                    SELECT
                        timestamp,
                        ip_address,
                        fraud_score,
                        fraud_category,
                        status       AS action,
                        severity
                    FROM fraud_events
                    ORDER BY timestamp DESC
                    LIMIT :limit
                    """
                ),
                {"limit": FRAUD_LIMIT},
            )
            event_rows = events_result.mappings().all()

            from app.schemas.analytics import FraudEventItem, FraudMonitorResponse

            events = [
                FraudEventItem(
                    timestamp=row["timestamp"],
                    ip_address=row["ip_address"],
                    fraud_score=float(row["fraud_score"] or 0.0),
                    category=row["fraud_category"],
                    action=row["action"],
                    severity=row["severity"],
                )
                for row in event_rows
            ]

            return FraudMonitorResponse(
                blocked_today=blocked_today,
                flagged=flagged,
                clean=clean,
                events=events,
            )

        except Exception as exc:
            logger.exception("AnalyticsService.get_fraud_monitor failed: %s", exc)
            raise

    # ------------------------------------------------------------------
    # 12. Campaign Performance
    # ------------------------------------------------------------------

    async def get_campaign_performance(self) -> "CampaignPerformanceResponse":
        """
        Return per-campaign performance aggregates by joining ad_campaigns
        with click_events and fraud_events, computing fraud-filtered click
        counts, effective CTR on clean clicks, spend, and ROAS.
        """
        try:
            result = await self.db.execute(
                text(
                    """
                    WITH click_stats AS (
                        SELECT
                            campaign_id,
                            COUNT(*)                                          AS raw_clicks,
                            AVG(predicted_ctr)              AS avg_ctr
                        FROM click_events
                        GROUP BY campaign_id
                    ),
                    fraud_stats AS (
                        SELECT
                            ce.campaign_id,
                            COUNT(fe.event_id) AS fraud_filtered
                        FROM fraud_events fe
                        JOIN click_events ce ON ce.event_id = fe.event_id
                        WHERE fe.status = 'Blocked'
                        GROUP BY ce.campaign_id
                    )
                    SELECT
                        ac.campaign_name,
                        COALESCE(ac.advertiser_id, 'Unknown')             AS advertiser,
                        COALESCE(cs.raw_clicks, 0)                     AS raw_clicks,
                        COALESCE(fs.fraud_filtered, 0)                 AS fraud_filtered,
                        COALESCE(cs.avg_ctr, 0)                        AS avg_ctr,
                        COALESCE(ac.spend, 0)                          AS spend,
                        COALESCE(ac.revenue, 0)                        AS revenue,
                        UPPER(ac.status)                               AS status
                    FROM ad_campaigns ac
                    LEFT JOIN click_stats cs ON cs.campaign_id = ac.campaign_id
                    LEFT JOIN fraud_stats  fs ON fs.campaign_id = ac.campaign_id
                    ORDER BY ac.spend DESC
                    LIMIT 10
                    """
                )
            )
            rows = result.mappings().all()

            from app.schemas.analytics import CampaignPerformanceItem, CampaignPerformanceResponse

            campaigns = []
            for row in rows:
                raw_clicks     = int(row["raw_clicks"]     or 0)
                fraud_filtered = int(row["fraud_filtered"] or 0)
                clean_clicks   = max(raw_clicks - fraud_filtered, 0)
                spend          = float(row["spend"]   or 0.0)
                revenue        = float(row["revenue"] or 0.0)

                # Effective CTR is re-scaled to clean click volume
                effective_ctr = (
                    round(float(row["avg_ctr"]) * (clean_clicks / max(raw_clicks, 1)), 2)
                    if raw_clicks > 0
                    else 0.0
                )
                roas = round(revenue / spend, 2) if spend > 0 else 0.0

                campaigns.append(
                    CampaignPerformanceItem(
                        campaign_name=row["campaign_name"],
                        advertiser=row["advertiser"],
                        raw_clicks=raw_clicks,
                        fraud_filtered=fraud_filtered,
                        effective_ctr=effective_ctr,
                        spend=round(spend, 2),
                        roas=roas,
                        status=row["status"],
                    )
                )

            return CampaignPerformanceResponse(campaigns=campaigns)

        except Exception as exc:
            logger.exception("AnalyticsService.get_campaign_performance failed: %s", exc)
            raise

    # ------------------------------------------------------------------
    # 13. Analytics Terminal
    # ------------------------------------------------------------------

    async def get_terminal_logs(self) -> "AnalyticsTerminalResponse":
        """
        Assemble the latest AI system terminal log entries from:

        • ml_prediction_logs
        • fraud_events
        • infrastructure_metrics

        and return the newest entries first.
        """
        try:
            result = await self.db.execute(
                text(
                    """
                    WITH unified_logs AS (

                        ----------------------------------------------------
                        -- ML Prediction Logs
                        ----------------------------------------------------
                        SELECT
                            timestamp,

                            CONCAT(
                                'ML inference completed | Model: ',
                                model_version,
                                ' | Latency: ',
                                ROUND(inference_latency_ms::numeric, 1),
                                ' ms | Click Probability: ',
                                ROUND(click_probability::numeric * 100, 2),
                                '%'
                            ) AS message,

                            'ML' AS type,

                            CASE
                                WHEN inference_latency_ms > 200 THEN 'WARNING'
                                ELSE 'SUCCESS'
                            END AS status

                        FROM ml_prediction_logs

                        UNION ALL

                        ----------------------------------------------------
                        -- Fraud Events
                        ----------------------------------------------------
                        SELECT
                            timestamp,

                            CONCAT(
                                'Fraud detected | Category: ',
                                fraud_category,
                                ' | Score: ',
                                ROUND(fraud_score::numeric, 3),
                                ' | Status: ',
                                status
                            ) AS message,

                            'Fraud' AS type,

                            CASE
                                WHEN severity IN ('Critical', 'High') THEN 'ERROR'
                                WHEN severity = 'Medium' THEN 'WARNING'
                                ELSE 'INFO'
                            END AS status

                        FROM fraud_events

                        UNION ALL

                        ----------------------------------------------------
                        -- Infrastructure Metrics
                        ----------------------------------------------------
                        SELECT
                            heartbeat_timestamp AS timestamp,

                            CONCAT(
                                service_name,
                                ' | Status: ',
                                status,
                                ' | Latency: ',
                                ROUND(latency_ms::numeric, 2),
                                ' ms | Uptime: ',
                                ROUND(uptime::numeric, 2),
                                '%'
                            ) AS message,

                            'Infra' AS type,

                            CASE
                                WHEN status = 'DOWN' THEN 'ERROR'
                                WHEN latency_ms > 200 THEN 'WARNING'
                                ELSE 'SUCCESS'
                            END AS status

                        FROM infrastructure_metrics

                    )

                    SELECT
                        timestamp,
                        message,
                        type,
                        status
                    FROM unified_logs
                    ORDER BY timestamp DESC
                    LIMIT :limit
                    """
                ),
                {"limit": TERMINAL_LIMIT},
            )

            rows = result.mappings().all()

            from app.schemas.analytics import (
                AnalyticsTerminalResponse,
                TerminalLogItem,
            )

            logs = [
                TerminalLogItem(
                    timestamp=row["timestamp"],
                    message=row["message"],
                    type=row["type"],
                    status=row["status"],
                )
                for row in rows
            ]

            return AnalyticsTerminalResponse(
                logs=logs
            )

        except Exception as exc:
            logger.exception(
                "AnalyticsService.get_terminal_logs failed: %s",
                exc,
            )
            raise

    # ------------------------------------------------------------------
    # 14. Reports
    # ------------------------------------------------------------------

    async def get_reports(self) -> "List[ReportResponse]":
        """Return the latest 6 generated analytics reports, newest first."""
        try:
            result = await self.db.execute(
                text(
                    """
                    SELECT report_id, title, report_type, pages, size_mb,
                           file_path, created_at
                    FROM reports
                    ORDER BY created_at DESC
                    LIMIT 6
                    """
                )
            )
            rows = result.mappings().all()

            from app.schemas.analytics import ReportResponse

            return [
                ReportResponse(
                    report_id=int(row["report_id"]),
                    title=row["title"],
                    report_type=row["report_type"],
                    pages=int(row["pages"]),
                    size_mb=float(row["size_mb"]),
                    file_path=row["file_path"],
                    created_at=row["created_at"],
                )
                for row in rows
            ]

        except Exception as exc:
            logger.exception("AnalyticsService.get_reports failed: %s", exc)
            raise

    # ------------------------------------------------------------------
    # 15. Scheduled Reports
    # ------------------------------------------------------------------

    async def get_scheduled_reports(self) -> "List[ScheduledReportResponse]":
        """
        Return all scheduled report definitions ordered by next_run
        ascending so the most imminent schedules appear first.
        """
        try:
            result = await self.db.execute(
                text(
                    """
                    SELECT schedule_id, name, frequency, next_run, enabled, created_at
                    FROM scheduled_reports
                    ORDER BY next_run ASC
                    LIMIT 8
                    """
                )
            )
            rows = result.mappings().all()

            from app.schemas.analytics import ScheduledReportResponse

            return [
                ScheduledReportResponse(
                    schedule_id=int(row["schedule_id"]),
                    name=row["name"],
                    frequency=row["frequency"],
                    next_run=row["next_run"],
                    enabled=bool(row["enabled"]),
                    created_at=row["created_at"],
                )
                for row in rows
            ]

        except Exception as exc:
            logger.exception("AnalyticsService.get_scheduled_reports failed: %s", exc)
            raise

    # ------------------------------------------------------------------
    # WebSocket helper — Live KPI update
    # ------------------------------------------------------------------

    async def get_live_update(self) -> "AnalyticsLiveUpdate":
        """
        Lightweight KPI snapshot for the /ws/analytics/live push channel.

        Reuses the overview query but returns only the fields required by
        the WebSocket banner to minimise payload size on high-frequency ticks.
        """
        try:
            now_utc = datetime.utcnow()
            today_start = now_utc.replace(hour=0, minute=0, second=0, microsecond=0)
            window_start = now_utc - timedelta(minutes=ACTIVE_USER_WINDOW_MINUTES)
            one_minute_ago = now_utc - timedelta(minutes=EVENTS_PER_SECOND_WINDOW_MINUTES)

            result = await self.db.execute(
                text(
                    """
                    SELECT
                        (
                            SELECT COUNT(DISTINCT user_id)
                            FROM click_events
                            WHERE timestamp >= :window_start
                        ) AS active_users,
                        (
                            SELECT COUNT(*)
                            FROM click_events
                            WHERE timestamp >= :one_minute_ago
                        ) AS events_last_minute,
                        (
                            SELECT ROUND(AVG(inference_latency_ms), 2)
                            FROM ml_prediction_logs
                            WHERE timestamp >= :today_start
                        ) AS avg_latency,
                        (
                            SELECT ROUND(
                                COUNT(*) FILTER (WHERE status = 'Blocked')::numeric
                                / NULLIF(COUNT(*), 0) * 100,
                                2
                            )
                            FROM fraud_events
                            WHERE timestamp >= :today_start
                        ) AS fraud_rate,
                        (
                            SELECT ROUND(AVG(predicted_ctr) * 100, 2) AS ctr
                            FROM click_events
                            WHERE timestamp >= :today_start
                        ) AS current_ctr
                    """
                ),
                {
                    "window_start": window_start,
                    "one_minute_ago": one_minute_ago,
                    "today_start": today_start,
                },
            )
            row = result.mappings().one_or_none()

            from app.schemas.analytics import AnalyticsLiveUpdate

            return AnalyticsLiveUpdate(
                active_users=int(row["active_users"] or 0) if row else 0,
                events_per_second=round(float(row["events_last_minute"] or 0) / 60.0, 2) if row else 0.0,
                avg_bid_latency_ms=float(row["avg_latency"] or 0.0) if row else 0.0,
                fraud_rate=float(row["fraud_rate"] or 0.0) if row else 0.0,
                current_ctr=float(row["current_ctr"] or 0.0) if row else 0.0,
                timestamp=now_utc.isoformat(),
            )

        except Exception as exc:
            logger.exception("AnalyticsService.get_live_update failed: %s", exc)
            raise

    # ------------------------------------------------------------------
    # WebSocket helper — CTR chart tick
    # ------------------------------------------------------------------

    async def get_ctr_update(self) -> "CTRUpdate":
        """
        Single latest CTR data point for the /ws/analytics/ctr push channel.

        Computes the average predicted_ctr over the last 60 seconds and
        the total event count for that window. Appended client-side to the
        live CTR trend chart on each push tick.
        """
        try:
            now_utc = datetime.utcnow()
            one_minute_ago = now_utc - timedelta(minutes=EVENTS_PER_SECOND_WINDOW_MINUTES)

            result = await self.db.execute(
                text(
                    """
                    SELECT
                        ROUND(AVG(predicted_ctr) * 100, 2) AS ctr,
                        COUNT(*)                            AS events
                    FROM click_events
                    WHERE timestamp >= :one_minute_ago
                    """
                ),
                {"one_minute_ago": one_minute_ago},
            )
            row = result.mappings().one_or_none()

            from app.schemas.analytics import CTRUpdate

            return CTRUpdate(
                time=now_utc.strftime("%H:%M:%S"),
                ctr=float(row["ctr"] or 0.0) if row else 0.0,
                events=int(row["events"] or 0) if row else 0,
            )

        except Exception as exc:
            logger.exception("AnalyticsService.get_ctr_update failed: %s", exc)
            raise

    # ------------------------------------------------------------------
    # WebSocket helper — Latest fraud event
    # ------------------------------------------------------------------

    async def get_latest_fraud(self) -> "FraudMonitorUpdate":
        """
        Return the most recent single fraud event for the
        /ws/analytics/fraud-monitor push channel.

        Returns a safe default event when no fraud events exist so the
        WebSocket handler can continue sending heartbeat payloads.
        """
        try:
            result = await self.db.execute(
                text(
                    """
                    SELECT
                        timestamp,
                        ip_address,
                        fraud_score,
                        fraud_category,
                        status AS action
                    FROM fraud_events
                    ORDER BY timestamp DESC
                    LIMIT 1
                    """
                )
            )
            row = result.mappings().one_or_none()

            from app.schemas.analytics import FraudMonitorUpdate

            if not row:
                now_utc = datetime.utcnow()
                return FraudMonitorUpdate(
                    timestamp=now_utc,
                    ip_address="",
                    fraud_score=0.0,
                    category="",
                    action="No events",
                )

            return FraudMonitorUpdate(
                timestamp=row["timestamp"],
                ip_address=row["ip_address"],
                fraud_score=float(row["fraud_score"] or 0.0),
                category=row["fraud_category"],
                action=row["action"],
            )

        except Exception as exc:
            logger.exception("AnalyticsService.get_latest_fraud failed: %s", exc)
            raise

    # ------------------------------------------------------------------
    # WebSocket helper — Latest terminal log entry
    # ------------------------------------------------------------------

    async def get_latest_terminal_log(self) -> "TerminalLogUpdate":
        """
        Return the single most recent AI pipeline log entry for the
        /ws/analytics/terminal push channel.

        Queries ml_prediction_logs exclusively for the lowest-latency
        single-row read; the full UNION ALL is reserved for the REST
        endpoint which can afford the heavier query.

        Returns a safe informational heartbeat when no log entries exist.
        """
        try:
            result = await self.db.execute(
                text(
                    """
                    SELECT
                        timestamp,
                        CONCAT(
                            'ML inference — model: ',
                            model_version,
                            ' | latency: ',
                            ROUND(inference_latency_ms, 1),
                            ' ms | CTR: ',
                            ROUND(click_probability * 100, 2),
                            '%'
                        ) AS message,
                        'ML'                           AS type,
                        CASE
                            WHEN inference_latency_ms > 200 THEN 'WARNING'
                            ELSE 'SUCCESS'
                        END                            AS status
                    FROM ml_prediction_logs
                    ORDER BY timestamp DESC
                    LIMIT 1
                    """
                )
            )
            row = result.mappings().one_or_none()

            from app.schemas.analytics import TerminalLogUpdate

            if not row:
                now_utc = datetime.utcnow()
                return TerminalLogUpdate(
                    timestamp=now_utc,
                    message="Waiting for live analytics events...",
                    type="INFO",
                    status="INFO",
                )

            return TerminalLogUpdate(
                timestamp=row["timestamp"],
                message=row["message"],
                type=row["type"],
                status=row["status"],
            )

        except Exception as exc:
            logger.exception("AnalyticsService.get_latest_terminal_log failed: %s", exc)
            raise