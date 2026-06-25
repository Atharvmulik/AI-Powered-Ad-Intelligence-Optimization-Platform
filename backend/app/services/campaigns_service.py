"""
CampaignsService — Service layer for the Campaigns module.

All database access is encapsulated here. The API layer never touches SQLAlchemy
directly; it only calls these methods through dependency injection.

Design principles:
  - Async-first (AsyncSession / asyncpg)
  - Single-responsibility per method
  - Typed return values matching Pydantic schemas
  - Graceful error handling with structured logging
  - Future-ready comments for Redis caching and Kafka event publishing
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import func, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.campaigns import (
    CampaignCardResponse,
    CampaignChartUpdate,
    CampaignIntelligenceResponse,
    CampaignLiveUpdate,
    ChartDataPoint,
    FraudFeedItemResponse,
    FraudFeedResponse,
    FraudFeedUpdate,
    FraudSummaryResponse,
    LiveOverviewResponse,
    PlacementAgentResponse,
    PlacementLogResponse,
    ReportResponse,
    SHAPCampaignResponse,
    SHAPFeatureResponse,
    ScheduledReportResponse,
    TopAdResponse,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

ACTIVE_USER_WINDOW_MINUTES: int = 15
CHART_BUCKET_COUNT: int = 20
TOP_ADS_LIMIT: int = 10
FRAUD_FEED_LIMIT: int = 20
PLACEMENT_LOG_LIMIT: int = 3

# Channel / bid strategy lookup — extend or persist in DB as needed
CHANNEL_MAP: Dict[str, str] = {
    "1": "Meta Ads",
    "2": "Google DV360",
    "3": "The Trade Desk",
    "4": "Amazon DSP",
}
BID_STRATEGY_MAP: Dict[str, str] = {
    "1": "Target ROAS",
    "2": "Target CPA",
    "3": "Maximize Clicks",
    "4": "Maximize Conversions",
}


# ---------------------------------------------------------------------------
# Service class
# ---------------------------------------------------------------------------


class CampaignsService:
    """
    All campaign-related database operations.

    Instantiated per-request via FastAPI dependency injection, receiving an
    AsyncSession that is managed (committed / rolled back) by the caller.

    Future extensions:
      - Inject a Redis client for hot-path caching (live_overview, fraud_feed)
      - Inject a Kafka producer to publish enriched campaign events downstream
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ------------------------------------------------------------------
    # 1. Live Overview
    # ------------------------------------------------------------------

    async def get_live_overview(self) -> LiveOverviewResponse:
        """
        Compute real-time platform KPIs from click_events, fraud_events,
        ml_prediction_logs, and users tables.

        TODO (Redis): cache result for 5 s to reduce DB read pressure at scale.
        """
        try:
            now_utc = datetime.utcnow()
            today_start = now_utc.replace(hour=0, minute=0, second=0, microsecond=0)
            window_start = now_utc - timedelta(minutes=ACTIVE_USER_WINDOW_MINUTES)
            one_minute_ago = now_utc - timedelta(minutes=1)

            # Events per second — count clicks in the last minute / 60
            eps_result = await self.db.execute(
                text(
                    """
                    SELECT COUNT(*) AS cnt
                    FROM click_events
                    WHERE timestamp >= :one_minute_ago
                    """
                ),
                {"one_minute_ago": one_minute_ago},
            )
            eps_row = eps_result.mappings().one_or_none()
            events_last_minute = float(eps_row["cnt"] if eps_row else 0)
            events_per_second = round(events_last_minute / 60.0, 2)

            # Active users — distinct user_id in click_events in last 15 min
            au_result = await self.db.execute(
                text(
                    """
                    SELECT COUNT(DISTINCT user_id) AS cnt
                    FROM click_events
                    WHERE timestamp >= :window_start
                    """
                ),
                {"window_start": window_start},
            )
            au_row = au_result.mappings().one_or_none()
            active_users = int(au_row["cnt"] if au_row else 0)

            # Fraud blocked today
            fb_result = await self.db.execute(
                text(
                    """
                    SELECT COUNT(*) AS cnt
                    FROM fraud_events
                    WHERE status = 'Blocked'
                      AND timestamp >= :today_start
                    """
                ),
                {"today_start": today_start},
            )
            fb_row = fb_result.mappings().one_or_none()
            fraud_blocked_today = int(fb_row["cnt"] if fb_row else 0)

            # Average ML inference latency
            lat_result = await self.db.execute(
                text(
                    """
                    SELECT AVG(inference_latency_ms) AS avg_lat
                    FROM ml_prediction_logs
                    WHERE timestamp >= :today_start
                    """
                ),
                {"today_start": today_start},
            )
            lat_row = lat_result.mappings().one_or_none()
            avg_latency_ms = round(float(lat_row["avg_lat"] or 0.0), 2)

            # Chart data — last 20 one-minute buckets
            chart_result = await self.db.execute(
                text(
                    """
                    WITH buckets AS (
                        SELECT
                            date_trunc('minute', timestamp) AS bucket,
                            COUNT(*) AS events,
                            AVG(predicted_ctr) AS avg_ctr
                        FROM click_events
                        WHERE timestamp >= NOW() - INTERVAL '20 minutes'
                        GROUP BY bucket
                        ORDER BY bucket DESC
                        LIMIT :limit
                    )
                    SELECT
                        b.bucket,
                        b.events,
                        COALESCE(b.avg_ctr, 0) AS avg_ctr,
                        COALESCE(f.fraud_cnt, 0) AS fraud_cnt
                    FROM buckets b
                    LEFT JOIN (
                        SELECT
                            date_trunc('minute', timestamp) AS bucket,
                            COUNT(*) AS fraud_cnt
                        FROM fraud_events
                        WHERE timestamp >= NOW() - INTERVAL '20 minutes'
                        GROUP BY bucket
                    ) f ON f.bucket = b.bucket
                    ORDER BY b.bucket ASC
                    """
                ),
                {"limit": CHART_BUCKET_COUNT},
            )
            chart_rows = chart_result.mappings().all()

            chart_data: List[ChartDataPoint] = []
            for row in chart_rows:
                total = max(int(row["events"]), 1)
                fraud_cnt = int(row["fraud_cnt"])
                fraud_rate = round((fraud_cnt / total) * 100, 2)
                chart_data.append(
                    ChartDataPoint(
                        time=row["bucket"].strftime("%H:%M:%S"),
                        ctr=round(float(row["avg_ctr"]) * 100, 2),
                        fraud_rate=fraud_rate,
                        events=total,
                    )
                )

            return LiveOverviewResponse(
                events_per_second=events_per_second,
                active_users=active_users,
                fraud_blocked_today=fraud_blocked_today,
                avg_latency_ms=avg_latency_ms,
                chart_data=chart_data,
            )

        except Exception as exc:
            logger.exception("CampaignsService.get_live_overview failed: %s", exc)
            raise

    # ------------------------------------------------------------------
    # 2. Campaign Intelligence
    # ------------------------------------------------------------------

    async def get_campaign_intelligence(self) -> CampaignIntelligenceResponse:
        """
        Join ad_campaigns with click_events and fraud_events to compute
        per-campaign KPIs: ROAS, CPA, fraud risk, click quality.
        """
        try:
            result = await self.db.execute(
                text(
                    """
                    WITH click_stats AS (
                        SELECT
                            campaign_id,
                            COUNT(*) AS raw_clicks,
                            SUM(CASE WHEN actual_outcome = 1 THEN 1 ELSE 0 END) AS conversions
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
                        ac.campaign_id,
                        ac.campaign_name             AS name,
                        ac.budget,
                        ac.spend,
                        ac.revenue,
                        ac.status,
                        COALESCE(cs.raw_clicks, 0)   AS raw_clicks,
                        COALESCE(cs.conversions, 0)  AS conversions,
                        COALESCE(fs.fraud_filtered, 0) AS fraud_filtered
                    FROM ad_campaigns ac
                    LEFT JOIN click_stats cs ON cs.campaign_id = ac.campaign_id
                    LEFT JOIN fraud_stats fs ON fs.campaign_id = ac.campaign_id
                    ORDER BY ac.campaign_id
                    """
                )
            )
            rows = result.mappings().all()

            campaigns: List[CampaignCardResponse] = []
            for idx, row in enumerate(rows):
                raw_clicks = int(row["raw_clicks"])
                fraud_filtered = int(row["fraud_filtered"])
                clean_clicks = max(raw_clicks - fraud_filtered, 0)
                spend = float(row["spend"] or 0.0)
                revenue = float(row["revenue"] or 0.0)
                conversions = max(int(row["conversions"]), 1)

                roas = round(revenue / spend, 2) if spend > 0 else 0.0
                cpa = round(spend / conversions, 2)

                fraud_pct = (fraud_filtered / raw_clicks * 100) if raw_clicks > 0 else 0.0
                if fraud_pct < 5:
                    fraud_risk = "LOW"
                elif fraud_pct < 15:
                    fraud_risk = "MEDIUM"
                else:
                    fraud_risk = "HIGH"

                channel_key = str((int(row["campaign_id"]) % 4) + 1)
                bid_key = str((int(row["campaign_id"]) % 4) + 1)

                campaigns.append(
                    CampaignCardResponse(
                        campaign_id=int(row["campaign_id"]),
                        name=row["name"],
                        budget=float(row["budget"] or 0.0),
                        spend=spend,
                        revenue=revenue,
                        roas=roas,
                        cpa=cpa,
                        raw_clicks=raw_clicks,
                        clean_clicks=clean_clicks,
                        fraud_filtered=fraud_filtered,
                        fraud_risk=fraud_risk,
                        channel=CHANNEL_MAP.get(channel_key, "Programmatic"),
                        bid_strategy=BID_STRATEGY_MAP.get(bid_key, "Target ROAS"),
                        status=str(row["status"]).upper(),
                    )
                )

            return CampaignIntelligenceResponse(campaigns=campaigns)

        except Exception as exc:
            logger.exception("CampaignsService.get_campaign_intelligence failed: %s", exc)
            raise

    # ------------------------------------------------------------------
    # 3. Top Performing Ads
    # ------------------------------------------------------------------

    async def get_top_ads(self) -> List[TopAdResponse]:
        """
        Return the top 10 ads ranked by CTR, computed from click_events
        joined with ad_creatives and ad_campaigns.
        """
        try:
            result = await self.db.execute(
                text("""
                    SELECT
                        ce.ad_id,
                        ac.campaign_name,
                        'Banner' AS format,
                        'General' AS category,

                        ROUND(
                            AVG(COALESCE(ce.predicted_ctr, 0)) * 100,
                            2
                        ) AS ctr,

                        COALESCE(ac.revenue, 0) AS revenue

                    FROM click_events ce
                    JOIN ad_campaigns ac
                        ON ac.campaign_id = ce.campaign_id

                    GROUP BY
                        ce.ad_id,
                        ac.campaign_name,
                        ac.revenue

                    ORDER BY ctr DESC
                    LIMIT :limit
                """),
                {"limit": TOP_ADS_LIMIT}
            )
            rows = result.mappings().all()

            return [
                TopAdResponse(
                    ad_id=str(row["ad_id"]),
                    campaign_name=row["campaign_name"],
                    format=row["format"],
                    category=row["category"],
                    ctr=float(row["ctr"]),
                    revenue=round(float(row["revenue"]), 2),
                )
                for row in rows
            ]

        except Exception as exc:
            logger.exception("CampaignsService.get_top_ads failed: %s", exc)
            raise

    # ------------------------------------------------------------------
    # 4. Reports Center
    # ------------------------------------------------------------------

    async def get_reports(self) -> List[ReportResponse]:
        """Return the latest 6 available generated reports, newest first."""
        try:
            result = await self.db.execute(
                text(
                    """
                    SELECT report_id, title, report_type, pages, size_mb, file_path, created_at
                    FROM reports
                    ORDER BY created_at DESC
                    LIMIT 6
                    """
                )
            )
            rows = result.mappings().all()

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
            logger.exception("CampaignsService.get_reports failed: %s", exc)
            raise

    # ------------------------------------------------------------------
    # 5. Scheduled Reports
    # ------------------------------------------------------------------

    async def get_scheduled_reports(self) -> List[ScheduledReportResponse]:
        """Return the next 8 scheduled report definitions, ordered by next_run date."""
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
            logger.exception("CampaignsService.get_scheduled_reports failed: %s", exc)
            raise

    # ------------------------------------------------------------------
    # 6. Fraud Detection Feed
    # ------------------------------------------------------------------

    async def get_fraud_feed(self) -> FraudFeedResponse:
        """
        Return the 20 most recent fraud events, latest first.

        TODO (Redis): maintain a sorted set keyed by timestamp for O(1) lookups.
        TODO (Kafka): consume from fraud-events topic instead of polling DB.
        """
        try:
            result = await self.db.execute(
                text(
                    """
                    SELECT event_id, timestamp, ip_address, fraud_score,
                           fraud_category, status, severity
                    FROM fraud_events
                    ORDER BY timestamp DESC
                    LIMIT :limit
                    """
                ),
                {"limit": FRAUD_FEED_LIMIT},
            )
            rows = result.mappings().all()

            events = [
                FraudFeedItemResponse(
                    event_id=int(row["event_id"]),
                    timestamp=row["timestamp"],
                    ip_address=row["ip_address"],
                    fraud_score=float(row["fraud_score"]),
                    fraud_category=row["fraud_category"],
                    status=row["status"],
                    severity=row["severity"],
                )
                for row in rows
            ]
            period = "all_time"

            return FraudFeedResponse(
                period=period,
                events=events,
            )

        except Exception as exc:
            logger.exception("CampaignsService.get_fraud_feed failed: %s", exc)
            raise

    # ------------------------------------------------------------------
    # 7. Fraud Summary
    # ------------------------------------------------------------------

    async def get_fraud_summary(self) -> FraudSummaryResponse:
        """
        Derive today's fraud analytics from the fraud_events table.

        Model precision / recall are stored or approximated here;
        in production these would be refreshed nightly by your ML pipeline
        and persisted to a model_metrics table.
        """
        try:
            now_utc = datetime.utcnow()
            today_start = now_utc.replace(hour=0, minute=0, second=0, microsecond=0)

            result = await self.db.execute(
                text(
                    """
                    SELECT
                        COUNT(*) FILTER (WHERE status = 'Blocked') AS blocked,
                        COUNT(*) FILTER (WHERE status = 'Pending') AS pending,
                        COUNT(*) FILTER (WHERE status = 'Investigating') AS investigating,
                        COUNT(*) AS total,
                        AVG(fraud_score) FILTER (WHERE status = 'Blocked') AS avg_fraud_score
                    FROM fraud_events
                    """
                )
            )
            row = result.mappings().one_or_none()

            if not row or not row["total"]:
                return FraudSummaryResponse(
                    blocked=0,
                    precision=0.0,
                    recall=0.0,
                    budget_saved=0.0,
                    clean_percent=0.0,
                    suspicious_percent=0.0,
                    blocked_percent=0.0,
                )

            total = int(row["total"])
            blocked = int(row["blocked"] or 0)
            clean = int(row["pending"] or 0)
            suspicious = int(row["investigating"] or 0)

            clean_pct = round((clean / total) * 100, 1)
            suspicious_pct = round((suspicious / total) * 100, 1)
            blocked_pct = round((blocked / total) * 100, 1)

            # Precision / recall: approximated from avg fraud_score of blocked events.
            # Replace with actual confusion-matrix values from a model_metrics table
            # once your offline evaluation pipeline populates it.
            avg_score = float(row["avg_fraud_score"] or 0.85)
            precision = round(min(avg_score * 100, 99.9), 1)
            recall = round(min((avg_score * 0.94) * 100, 99.9), 1)

            # Budget saved = blocked events × estimated average CPC ($0.50 default)
            budget_saved = round(blocked * 0.50, 2)

            return FraudSummaryResponse(
                blocked=blocked,
                precision=precision,
                recall=recall,
                budget_saved=budget_saved,
                clean_percent=clean_pct,
                suspicious_percent=suspicious_pct,
                blocked_percent=blocked_pct,
            )

        except Exception as exc:
            logger.exception("CampaignsService.get_fraud_summary failed: %s", exc)
            raise

    # ------------------------------------------------------------------
    # 8. Smart Placement Agent
    # ------------------------------------------------------------------

    async def get_placement_agent(self) -> List[PlacementLogResponse]:
        """
        Return the 3 most recent placement agent decision logs.
        
        Each log contains the action taken, expected reward, episode number,
        and creation timestamp.
        """
        try:
            result = await self.db.execute(
                text(
                    """
                    SELECT id, action, expected_reward, episode, created_at
                    FROM placement_agent_logs
                    ORDER BY created_at DESC
                    LIMIT :limit
                    """
                ),
                {"limit": PLACEMENT_LOG_LIMIT},
            )
            rows = result.mappings().all()

            logs: List[PlacementLogResponse] = [
                PlacementLogResponse(
                    action=row["action"],
                    expected_reward=float(row["expected_reward"]),
                    episode=int(row["episode"]),
                    created_at=row["created_at"],
                )
                for row in rows
            ]

            return logs

        except Exception as exc:
            logger.exception("CampaignsService.get_placement_agent failed: %s", exc)
            raise

    # ------------------------------------------------------------------
    # 9. SHAP / ML Prediction Insights
    # ------------------------------------------------------------------

    async def get_shap_insights(self) -> List[SHAPCampaignResponse]:
        """
        Group SHAP feature contributions by campaign, joining with ad_campaigns
        to resolve campaign names and aggregate predicted CTR / AUC scores.
        Returns the top 6 campaigns ordered by predicted_ctr (or auc_score if unavailable).
        """
        try:
            result = await self.db.execute(
                text(
                    """
                    SELECT
                        si.campaign_id,
                        ac.campaign_name,
                        AVG(si.predicted_ctr)  AS avg_predicted_ctr,
                        AVG(si.auc_score)      AS avg_auc_score,
                        si.feature_name,
                        AVG(si.shap_value)     AS avg_shap_value
                    FROM shap_insights si
                    JOIN ad_campaigns ac ON ac.campaign_id = si.campaign_id
                    WHERE si.campaign_id IN (
                        SELECT campaign_id
                        FROM shap_insights
                        GROUP BY campaign_id
                        ORDER BY AVG(predicted_ctr) DESC, AVG(auc_score) DESC
                        LIMIT 6
                    )
                    GROUP BY si.campaign_id, ac.campaign_name, si.feature_name
                    ORDER BY avg_predicted_ctr DESC, avg_shap_value DESC
                    """
                )
            )
            rows = result.mappings().all()

            # Aggregate into per-campaign structures
            campaign_map: Dict[int, Dict[str, Any]] = {}
            for row in rows:
                cid = int(row["campaign_id"])
                if cid not in campaign_map:
                    campaign_map[cid] = {
                        "campaign_id": cid,
                        "campaign_name": row["campaign_name"],
                        "predicted_ctr": round(float(row["avg_predicted_ctr"]) * 100, 2),
                        "auc_score": round(float(row["avg_auc_score"]), 3),
                        "features": [],
                    }
                campaign_map[cid]["features"].append(
                    SHAPFeatureResponse(
                        feature=row["feature_name"],
                        shap_value=round(float(row["avg_shap_value"]), 4),
                    )
                )

            return [
                SHAPCampaignResponse(
                    campaign_id=v["campaign_id"],
                    campaign_name=v["campaign_name"],
                    predicted_ctr=v["predicted_ctr"],
                    auc_score=v["auc_score"],
                    features=v["features"],
                )
                for v in campaign_map.values()
            ]

        except Exception as exc:
            logger.exception("CampaignsService.get_shap_insights failed: %s", exc)
            raise

    # ------------------------------------------------------------------
    # WebSocket helpers
    # ------------------------------------------------------------------

    async def get_live_update(self) -> CampaignLiveUpdate:
        """Lightweight snapshot for the /ws/campaigns/live push."""
        overview = await self.get_live_overview()
        now_utc = datetime.utcnow()

        return CampaignLiveUpdate(
            events_per_second=overview.events_per_second,
            active_users=overview.active_users,
            fraud_blocked_today=overview.fraud_blocked_today,
            avg_latency_ms=overview.avg_latency_ms,
            timestamp=now_utc.isoformat(),
        )

    async def get_chart_update(self) -> CampaignChartUpdate:
        """Single latest chart data point for /ws/campaigns/chart."""
        now_utc = datetime.utcnow()
        one_minute_ago = now_utc - timedelta(minutes=1)

        result = await self.db.execute(
            text(
                """
                SELECT
                    COUNT(*)           AS events,
                    AVG(predicted_ctr) AS avg_ctr
                FROM click_events
                WHERE timestamp >= :one_minute_ago
                """
            ),
            {"one_minute_ago": one_minute_ago},
        )
        row = result.mappings().one_or_none()

        events = int(row["events"] if row else 0)
        ctr = round(float(row["avg_ctr"] or 0.0) * 100, 2)

        fraud_result = await self.db.execute(
            text(
                """
                SELECT COUNT(*) AS cnt
                FROM fraud_events
                WHERE timestamp >= :one_minute_ago
                """
            ),
            {"one_minute_ago": one_minute_ago},
        )
        fraud_row = fraud_result.mappings().one_or_none()
        fraud_cnt = int(fraud_row["cnt"] if fraud_row else 0)
        fraud_rate = round((fraud_cnt / max(events, 1)) * 100, 2)

        return CampaignChartUpdate(
            time=now_utc.strftime("%H:%M:%S"),
            ctr=ctr,
            fraud_rate=fraud_rate,
            events=events,
        )

    async def get_latest_fraud_event(self) -> Optional[FraudFeedUpdate]:
        """Most recent single fraud event for the fraud-feed WebSocket."""
        result = await self.db.execute(
            text(
                """
                SELECT event_id, timestamp, ip_address, fraud_score,
                       fraud_category, status, severity
                FROM fraud_events
                ORDER BY timestamp DESC
                LIMIT 1
                """
            )
        )
        row = result.mappings().one_or_none()
        if not row:
            return None

        return FraudFeedUpdate(
            event_id=int(row["event_id"]),
            timestamp=row["timestamp"],
            ip_address=row["ip_address"],
            fraud_score=float(row["fraud_score"]),
            fraud_category=row["fraud_category"],
            status=row["status"],
            severity=row["severity"],
        )
