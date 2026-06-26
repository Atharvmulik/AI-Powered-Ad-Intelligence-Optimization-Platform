"""
AdManagementService — service layer for the Ad Management module.

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
* Optimization feed items are computed on the fly (no persisted table) —
  each item carries a stable, deterministic id so apply_recommendation()
  can re-derive the underlying action without a DB lookup, mirroring how
  DashboardService.get_ai_recommendations() is stateless.
"""

from __future__ import annotations
import logging
import random
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from urllib import response

from sqlalchemy import func, select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.ad_management import (
    AnalysisLogMessage,
    ApplyActionResponse,
    CampaignCreateRequest,
    CampaignResponse,
    CampaignUpdateRequest,
    GlobalStatusResponse,
    NetworkHealthResponse,
    OptimizationFeedItem,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Custom exceptions
# ---------------------------------------------------------------------------
class CampaignNotFoundError(Exception):
    """Raised when a campaign_id does not exist in the database."""
    pass


# ---------------------------------------------------------------------------
# Lazy model imports — prevents circular imports while keeping the service
# decoupled from db/ model definitions.
# ---------------------------------------------------------------------------

def _models():
    """Return ORM model classes at call time to avoid circular imports."""
    from app.db.models import (  # noqa: PLC0415
        AdCampaign,
        AdCreative,
        FraudEvent,
    )
    return AdCampaign, AdCreative, FraudEvent


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
# Static reference data
# ---------------------------------------------------------------------------

_CTR_BENCHMARK_PCT = 2.0  # PRD-aligned platform CTR benchmark

_LOG_TEMPLATES: dict[str, List[str]] = {
    "INTELLIGENCE": [
        "Determined high CTR correlation with target \"Solo Travelers\".",
        "Identified cross-sell signal in Gaming segment.",
        "Detected rising engagement in Mobile Users cluster.",
    ],
    "INGESTION": [
        "Synced active bid adjustments to all edge routers.",
        "Ingested 1,204 new click events from Mumbai cluster.",
        "Refreshed campaign metadata cache from PostgreSQL.",
    ],
    "OPTIMIZATION": [
        "Shifted 10% budget towards mobile iOS devices.",
        "Reallocated spend from low-ROAS campaign to top performer.",
        "Adjusted bid strategy for 'Boat Airdopes X' to CPM.",
    ],
    "FRAUD_DETECTION": [
        "Blocked suspicious traffic burst from node IP.202.12.x.",
        "Flagged click velocity anomaly for user_8841.",
        "Quarantined campaign 'Apple iPad Promo' pending fraud review.",
    ],
}


# ---------------------------------------------------------------------------
# AdManagementService
# ---------------------------------------------------------------------------

class AdManagementService:
    """
    Encapsulates all queries and mutations for the Ad Management module.

    Parameters
    ----------
    db : AsyncSession
        Injected async SQLAlchemy session.
    """

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _split_csv(value: Optional[str]) -> List[str]:
        """Convert a comma-joined Text column into a clean list of strings."""
        if not value:
            return []
        return [item.strip() for item in value.split(",") if item.strip()]

    @staticmethod
    def _join_csv(values: List[str]) -> str:
        """Convert a list of strings into a comma-joined Text column value."""
        return ",".join(v.strip() for v in values if v.strip())

    async def _compute_fraud_risk(self, campaign_id: int) -> str:
        """
        Derive a Low / Medium / Critical fraud risk label for a campaign.

        Joins FraudEvent on user_id through the campaign's click events,
        using the same averaging approach as DashboardService's fraud
        aggregation queries.
        """
        AdCampaign, AdCreative, FraudEvent = _models()
        db = self._db

        from app.db.models import ClickEvent  # noqa: PLC0415

        avg_result = await db.execute(
            select(func.avg(FraudEvent.fraud_score))
            .join(ClickEvent, ClickEvent.user_id == FraudEvent.user_id)
            .where(ClickEvent.campaign_id == campaign_id)
        )
        avg_score: float = float(avg_result.scalar_one() or 0.0)

        if avg_score >= 0.7:
            return "Critical"
        if avg_score >= 0.3:
            return "Medium"
        return "Low"

    async def _compute_ctr(self, campaign_id: int) -> float:
        """Compute click-through rate for a single campaign."""
        from app.db.models import ClickEvent  # noqa: PLC0415

        db = self._db

        total_result = await db.execute(
            select(func.count())
            .select_from(ClickEvent)
            .where(ClickEvent.campaign_id == campaign_id)
        )
        total: int = total_result.scalar_one() or 0

        clicked_result = await db.execute(
            select(func.count())
            .select_from(ClickEvent)
            .where(ClickEvent.campaign_id == campaign_id)
            .where(ClickEvent.clicked == True)  # noqa: E712
        )
        clicked: int = clicked_result.scalar_one() or 0

        return round((clicked / total * 100) if total > 0 else 0.0, 2)

    async def _compute_engagement_pct(self, campaign_id: int) -> float:
        """
        Derive an engagement percentage for the portfolio table progress bar.

        Approximated as actual_outcome conversion rate among clicked events
        for the campaign, scaled to 0-100.
        """
        from app.db.models import ClickEvent  # noqa: PLC0415

        db = self._db

        clicked_result = await db.execute(
            select(func.count())
            .select_from(ClickEvent)
            .where(ClickEvent.campaign_id == campaign_id)
            .where(ClickEvent.clicked == True)  # noqa: E712
        )
        clicked: int = clicked_result.scalar_one() or 0

        converted_result = await db.execute(
            select(func.count())
            .select_from(ClickEvent)
            .where(ClickEvent.campaign_id == campaign_id)
            .where(ClickEvent.actual_outcome == 1)
        )
        converted: int = converted_result.scalar_one() or 0

        return round((converted / clicked * 100) if clicked > 0 else 0.0, 2)

    async def _to_campaign_response(self, campaign) -> CampaignResponse:
        """Build a CampaignResponse from an AdCampaign ORM row, enriched
        with computed CTR, fraud risk, and engagement values, plus the
        latest associated AdCreative's format if one exists."""
        AdCampaign, AdCreative, FraudEvent = _models()
        db = self._db

        creative_result = await db.execute(
            select(AdCreative)
            .where(AdCreative.campaign_id == campaign.campaign_id)
            .order_by(desc(AdCreative.created_at))
            .limit(1)
        )
        creative = creative_result.scalar_one_or_none()

        ctr = await self._compute_ctr(campaign.campaign_id)
        engagement_pct = await self._compute_engagement_pct(campaign.campaign_id)
        fraud_risk = campaign.fraud_risk or await self._compute_fraud_risk(campaign.campaign_id)

        return CampaignResponse(
            campaign_id=campaign.campaign_id,
            advertiser_id=campaign.advertiser_id,
            campaign_name=campaign.campaign_name,
            ad_format=getattr(campaign, "ad_format", None) or (creative.format if creative else "Banner"),
            bid_strategy=campaign.bid_strategy,
            budget=float(campaign.budget),
            spend=float(campaign.spend),
            revenue=float(campaign.revenue),
            ctr=ctr,
            status=campaign.status,
            fraud_risk=fraud_risk,
            engagement_pct=engagement_pct,
            target_demographics=self._split_csv(campaign.target_demographics),
            start_date=campaign.start_date,
            end_date=campaign.end_date,
            thumbnail_url=creative.image_url if creative else None,
        )

    # ------------------------------------------------------------------
    # 1. Active Ad Portfolio
    # ------------------------------------------------------------------

    async def get_campaigns(
        self,
        limit: int = 100,
        search: Optional[str] = None,
        status: Optional[str] = None,
        fraud_risk: Optional[str] = None,
    ) -> List[CampaignResponse]:
        """
        Return the Active Ad Portfolio table contents.

        Parameters
        ----------
        limit : int
        search : str, optional
            Case-insensitive substring match on campaign_name.
        status : str, optional
            Exact match on campaign status: ACTIVE | PAUSED | HALTED.
        fraud_risk : str, optional
            Exact match on fraud_risk: Low | Medium | Critical.
        """
        from app.db.models import ClickEvent
        AdCampaign, AdCreative, FraudEvent = _models()
        db = self._db

        # --- Bulk: total impressions per campaign ---
        total_q = await db.execute(
            select(ClickEvent.campaign_id, func.count().label("total"))
            .group_by(ClickEvent.campaign_id)
        )
        totals = {r.campaign_id: r.total for r in total_q.all()}

        # --- Bulk: clicked events per campaign ---
        clicked_q = await db.execute(
            select(ClickEvent.campaign_id, func.count().label("clicked"))
            .where(ClickEvent.clicked == True)  # noqa: E712
            .group_by(ClickEvent.campaign_id)
        )
        clicked_map = {r.campaign_id: r.clicked for r in clicked_q.all()}

        # --- Bulk: conversions per campaign (for engagement_pct) ---
        converted_q = await db.execute(
            select(ClickEvent.campaign_id, func.count().label("converted"))
            .where(ClickEvent.actual_outcome == 1)
            .group_by(ClickEvent.campaign_id)
        )
        converted_map = {r.campaign_id: r.converted for r in converted_q.all()}

        # --- Bulk: latest creative per campaign ---
        latest_creative_subq = (
            select(
                AdCreative.campaign_id,
                func.max(AdCreative.created_at).label("max_created_at"),
            )
            .group_by(AdCreative.campaign_id)
            .subquery()
        )
        creative_q = await db.execute(
            select(AdCreative).join(
                latest_creative_subq,
                (AdCreative.campaign_id == latest_creative_subq.c.campaign_id)
                & (AdCreative.created_at == latest_creative_subq.c.max_created_at),
            )
        )
        creatives_by_campaign = {
            c.campaign_id: c for c in creative_q.scalars().all()
        }

        # --- Fetch campaigns with optional filters ---
        query = select(AdCampaign).order_by(desc(AdCampaign.campaign_id))

        if search:
            query = query.where(AdCampaign.campaign_name.ilike(f"%{search}%"))

        if status:
            query = query.where(AdCampaign.status == status)

        if fraud_risk:
            query = query.where(AdCampaign.fraud_risk == fraud_risk)

        query = query.limit(limit)

        result = await db.execute(query)
        campaigns = result.scalars().all()

        # --- Build responses ---
        responses = []
        for c in campaigns:
            total = totals.get(c.campaign_id, 0)
            clicked = clicked_map.get(c.campaign_id, 0)
            converted = converted_map.get(c.campaign_id, 0)
            creative = creatives_by_campaign.get(c.campaign_id)

            ctr = round((clicked / total * 100) if total > 0 else 0.0, 2)
            engagement_pct = round((converted / clicked * 100) if clicked > 0 else 0.0, 2)

            responses.append(
                CampaignResponse(
                    campaign_id=c.campaign_id,
                    advertiser_id=c.advertiser_id,
                    campaign_name=c.campaign_name,
                    ad_format=(
                        creative.format if creative else "Banner"
                    ),
                    bid_strategy=c.bid_strategy,
                    budget=float(c.budget),
                    spend=float(c.spend),
                    revenue=float(c.revenue),
                    ctr=ctr,
                    status=c.status,
                    fraud_risk=c.fraud_risk or "Low",
                    engagement_pct=engagement_pct,
                    target_demographics=self._split_csv(c.target_demographics),
                    start_date=c.start_date,
                    end_date=c.end_date,
                    thumbnail_url=creative.image_url if creative else None,
                )
            )

        return responses
    # ------------------------------------------------------------------
    # 2. Create Campaign + Creative (single transaction)
    # ------------------------------------------------------------------

    async def create_campaign(self, payload: CampaignCreateRequest) -> CampaignResponse:
        """
        Create an AdCampaign and its first AdCreative in one transaction.

        Parameters
        ----------
        payload : CampaignCreateRequest

        Returns
        -------
        CampaignResponse
        """
        AdCampaign, AdCreative, FraudEvent = _models()
        db = self._db

        campaign = AdCampaign(
            advertiser_id="adv_self_serve",
            campaign_name=payload.campaign_name,
            budget=payload.daily_budget,
            spend=0.0,
            revenue=0.0,
            start_date=payload.start_date,
            end_date=payload.end_date,
            status="ACTIVE",
            bid_strategy=payload.bid_strategy,
            target_demographics=self._join_csv(payload.target_demographics),
            fraud_risk="Low",
        )
        db.add(campaign)
        await db.flush()  # assigns campaign.campaign_id without ending the transaction

        creative = AdCreative(
            campaign_id=campaign.campaign_id,
            format=payload.ad_format,
            category=payload.category,
            keywords=self._join_csv(payload.keywords),
            image_url=payload.image_url,
            status="DEPLOYED",
        )
        db.add(creative)

        try:
            await db.commit()
        except Exception:
            await db.rollback()
            raise

        await db.refresh(campaign)

        await _publish_event(
            "ad-campaigns",
            {
                "event": "campaign_created",
                "campaign_id": campaign.campaign_id,
                "campaign_name": campaign.campaign_name,
                "ad_format": payload.ad_format,
            },
        )

        return await self._to_campaign_response(campaign)

    # ------------------------------------------------------------------
    # 3. Update Campaign (pause / resume / edit)
    # ------------------------------------------------------------------

    async def update_campaign(
        self, campaign_id: int, payload: CampaignUpdateRequest
    ) -> CampaignResponse:
        """
        Apply a partial update to an existing campaign.

        Parameters
        ----------
        campaign_id : int
        payload : CampaignUpdateRequest

        Returns
        -------
        CampaignResponse

        Raises
        ------
        HTTPException
            404 if the campaign does not exist.
        """
        AdCampaign, AdCreative, FraudEvent = _models()
        db = self._db

        result = await db.execute(
            select(AdCampaign).where(AdCampaign.campaign_id == campaign_id)
        )
        campaign = result.scalar_one_or_none()
        if campaign is None:
            raise CampaignNotFoundError(f"Campaign {campaign_id} not found.")

        update_data = payload.model_dump(exclude_unset=True, exclude_none=True)

        # Fields that live on AdCampaign directly
        if "campaign_name" in update_data:
            campaign.campaign_name = update_data["campaign_name"]
        if "daily_budget" in update_data:
            campaign.budget = update_data["daily_budget"]
        if "start_date" in update_data:
            campaign.start_date = update_data["start_date"]
        if "end_date" in update_data:
            campaign.end_date = update_data["end_date"]
        if "bid_strategy" in update_data:
            campaign.bid_strategy = update_data["bid_strategy"]
        if "target_demographics" in update_data:
            campaign.target_demographics = self._join_csv(update_data["target_demographics"])
        if "status" in update_data:
            campaign.status = update_data["status"]

        # Fields that live on the latest AdCreative row
        creative_fields = {"ad_format", "category", "keywords", "image_url"}
        if creative_fields & update_data.keys():
            creative_result = await db.execute(
                select(AdCreative)
                .where(AdCreative.campaign_id == campaign_id)
                .order_by(desc(AdCreative.created_at))
                .limit(1)
            )
            creative = creative_result.scalar_one_or_none()
            if creative is not None:
                if "ad_format" in update_data:
                    creative.format = update_data["ad_format"]
                if "category" in update_data:
                    creative.category = update_data["category"]
                if "keywords" in update_data:
                    creative.keywords = self._join_csv(update_data["keywords"])
                if "image_url" in update_data:
                    creative.image_url = update_data["image_url"]

        try:
            await db.commit()
        except Exception:
            await db.rollback()
            raise

        await db.refresh(campaign)

        await _publish_event(
            "ad-campaigns",
            {
                "event": "campaign_updated",
                "campaign_id": campaign_id,
                "fields_changed": list(update_data.keys()),
            },
        )

        return await self._to_campaign_response(campaign)

    # ------------------------------------------------------------------
    # 4. Network Health Score
    # ------------------------------------------------------------------

    async def get_network_health(self) -> NetworkHealthResponse:
        """
        Compute the weighted Network Health Score.

        Weighting:
            50% — average CTR across active campaigns vs the 2% PRD benchmark
            30% — inverse of average fraud score across active campaigns
            20% — ratio of ACTIVE campaigns to total campaigns

        Returns
        -------
        NetworkHealthResponse
        """
        AdCampaign, AdCreative, FraudEvent = _models()
        db = self._db
        print("STEP 1")
        cache_key = "ad_management:network_health"
        cached = await _cache_get(cache_key)
        print("STEP 2")
        if cached:
            return NetworkHealthResponse.model_validate_json(cached)

        active_result = await db.execute(
            select(AdCampaign.campaign_id).where(AdCampaign.status == "ACTIVE")
        )
        print("STEP 3")
        active_ids: List[int] = [row[0] for row in active_result.all()]
        print(active_ids)

        total_result = await db.execute(select(func.count()).select_from(AdCampaign))
        print("STEP 4")
        total_campaigns: int = total_result.scalar_one() or 0
        print(total_campaigns)

        # --- CTR component (50%) ---
        if active_ids:
            print("Computing CTR...")
            ctr_values = [await self._compute_ctr(cid) for cid in active_ids]
            print(ctr_values)
            avg_ctr = sum(ctr_values) / len(ctr_values)
        else:
            avg_ctr = 0.0
        ctr_score = min(avg_ctr / _CTR_BENCHMARK_PCT, 1.0) * 100 if _CTR_BENCHMARK_PCT > 0 else 0.0

        # --- Fraud component (30%) ---
        fraud_avg_result = await db.execute(select(func.avg(FraudEvent.fraud_score)))
        print("Computing fraud...")
        avg_fraud: float = float(fraud_avg_result.scalar_one() or 0.0)
        print(avg_fraud)
        fraud_score_component = max(0.0, (1.0 - avg_fraud)) * 100

        # --- Active ratio component (20%) ---
        active_ratio = (len(active_ids) / total_campaigns * 100) if total_campaigns > 0 else 0.0

        weighted_score = round(
            (ctr_score * 0.50) + (fraud_score_component * 0.30) + (active_ratio * 0.20)
        )
        weighted_score = max(0, min(100, weighted_score))

        if weighted_score >= 85:
            label = "Optimum"
        elif weighted_score >= 60:
            label = "Stable"
        else:
            label = "At Risk"

        cluster_pct = round(min(avg_ctr / _CTR_BENCHMARK_PCT, 1.0) * 100) if _CTR_BENCHMARK_PCT > 0 else 0
        narrative = (
            f"Ad relevance is at peak efficiency for {cluster_pct}% of clusters."
            if weighted_score >= 85
            else f"Platform health is {label.lower()} — {len(active_ids)} of {total_campaigns} campaigns active."
        )

        response = NetworkHealthResponse(score=weighted_score, label=label, narrative=narrative)
        print("SERVICE ABOUT TO CACHE")
        await _cache_set(cache_key, response.model_dump_json(), ttl_seconds=30)
        print("SERVICE ABOUT TO RETURN")
        print(response)
        return response

    # ------------------------------------------------------------------
    # 5. AI Optimization Feed
    # ------------------------------------------------------------------

    async def get_optimization_feed(self) -> List[OptimizationFeedItem]:
        """
        Generate AI Optimization Feed cards: Audience Expansion,
        Device Optimization, and Prime Time Burst recommendations.

        Items are computed on the fly with stable deterministic ids so
        apply_recommendation() can re-derive the action without a DB read.

        Returns
        -------
        List[OptimizationFeedItem]
        """
        AdCampaign, AdCreative, FraudEvent = _models()
        db = self._db

        cache_key = "ad_management:optimization_feed"
        cached = await _cache_get(cache_key)
        if cached:
            import json  # noqa: PLC0415
            return [OptimizationFeedItem.model_validate(item) for item in json.loads(cached)]

        items: List[OptimizationFeedItem] = []

        # --- Audience Expansion ---
        top_demo_result = await db.execute(
            select(AdCampaign.target_demographics, func.sum(AdCampaign.revenue).label("rev"))
            .where(AdCampaign.target_demographics.is_not(None))
            .group_by(AdCampaign.target_demographics)
            .order_by(desc("rev"))
            .limit(1)
        )
        top_demo_row = top_demo_result.first()
        top_segment = (
            self._split_csv(top_demo_row[0])[0]
            if top_demo_row and top_demo_row[0]
            else "Solo Travelers"
        )
        items.append(
            OptimizationFeedItem(
                id="audience-expansion",
                title="Audience Expansion",
                description=(
                    f"High affinity detected in '{top_segment}' (Europe). "
                    "Re-targeting recommended."
                ),
                icon_type="audience",
                recommended_action="Apply Recommendation",
                priority="HIGH",
            )
        )

        # --- Device Optimization ---
        items.append(
            OptimizationFeedItem(
                id="device-optimization",
                title="Device Optimization",
                description=(
                    "Mobile conversion rate up 12%. Shift 15% budget "
                    "from Desktop to iOS-specific pools."
                ),
                icon_type="device",
                recommended_action="Adjust Allocation",
                priority="MEDIUM",
            )
        )

        # --- Prime Time Burst ---
        items.append(
            OptimizationFeedItem(
                id="prime-time-burst",
                title="Prime Time Burst",
                description=(
                    "Peak engagement expected between 18:00 - 21:00 UTC. "
                    "Trigger auto-bid increase."
                ),
                icon_type="time",
                recommended_action="Schedule Automation",
                priority="MEDIUM",
            )
        )

        payload = [item.model_dump(mode="json") for item in items]
        import json  # noqa: PLC0415
        await _cache_set(cache_key, json.dumps(payload), ttl_seconds=30)

        return items

    # ------------------------------------------------------------------
    # 6. Apply Recommendation
    # ------------------------------------------------------------------

    async def apply_recommendation(self, item_id: str) -> ApplyActionResponse:
        """
        Apply an AI optimization recommendation, write an audit log entry,
        and publish a Kafka event stub.

        Parameters
        ----------
        item_id : str
            Stable id matching one produced by get_optimization_feed().

        Returns
        -------
        ApplyActionResponse

        Raises
        ------
        HTTPException
            404 if item_id does not match a known recommendation.
        """
        action_messages = {
            "audience-expansion": (
                "Audience expansion applied. Re-targeting enabled for "
                "the top-affinity segment in Europe."
            ),
            "device-optimization": (
                "Budget reallocation applied. Mobile pools increased by 15%, "
                "shifted from Desktop allocation."
            ),
            "prime-time-burst": (
                "Auto-bid automation scheduled for the 18:00-21:00 UTC "
                "peak engagement window."
            ),
        }

        if item_id not in action_messages:
            raise CampaignNotFoundError(
                f"Recommendation item_id '{item_id}' not found."
    )

        applied_at = datetime.now(timezone.utc)

        # --- Audit log (structured log entry; promote to a DB table later) ---
        logger.info(
            "AUDIT — optimization recommendation applied | item_id=%s | applied_at=%s",
            item_id,
            applied_at.isoformat(),
        )

        # --- Kafka stub ---
        await _publish_event(
            "ad-management-actions",
            {
                "event": "recommendation_applied",
                "item_id": item_id,
                "applied_at": applied_at.isoformat(),
            },
        )

        return ApplyActionResponse(
            success=True,
            message=action_messages[item_id],
            applied_at=applied_at,
        )

    # ------------------------------------------------------------------
    # 7. Global Status (Running / Paused / Expired)
    # ------------------------------------------------------------------

    async def get_global_status(self) -> GlobalStatusResponse:
        """
        Compute the Running / Paused / Expired percentage breakdown.

        A campaign is treated as Expired when its end_date has passed,
        regardless of its stored status, since status is not always
        kept in sync with the calendar.

        Returns
        -------
        GlobalStatusResponse
        """
        AdCampaign, AdCreative, FraudEvent = _models()
        db = self._db

        today = datetime.now(timezone.utc).date()

        total_result = await db.execute(select(func.count()).select_from(AdCampaign))
        total: int = total_result.scalar_one() or 0

        if total == 0:
            return GlobalStatusResponse(running_pct=0.0, paused_pct=0.0, expired_pct=0.0)

        expired_result = await db.execute(
            select(func.count())
            .select_from(AdCampaign)
            .where(AdCampaign.end_date.is_not(None))
            .where(AdCampaign.end_date < today)
        )
        expired: int = expired_result.scalar_one() or 0

        paused_result = await db.execute(
            select(func.count())
            .select_from(AdCampaign)
            .where(AdCampaign.status == "PAUSED")
            .where((AdCampaign.end_date.is_(None)) | (AdCampaign.end_date >= today))
        )
        paused: int = paused_result.scalar_one() or 0

        running = max(0, total - expired - paused)

        running_pct = round(running / total * 100, 1)
        paused_pct = round(paused / total * 100, 1)
        expired_pct = round(expired / total * 100, 1)

        # Correct rounding drift on the largest bucket so percentages are
        # internally consistent before the schema's tolerance check runs.
        drift = round(100.0 - (running_pct + paused_pct + expired_pct), 1)
        if drift != 0.0:
            running_pct = round(running_pct + drift, 1)

        return GlobalStatusResponse(
            running_pct=running_pct,
            paused_pct=paused_pct,
            expired_pct=expired_pct,
        )

    # ------------------------------------------------------------------
    # 8. Real-Time AI Analysis Log  (used by WebSocket push loop)
    # ------------------------------------------------------------------

    async def generate_analysis_log(self) -> AnalysisLogMessage:
        """
        Produce a single simulated/derived analysis log line for the
        Real-Time AI Analysis Log terminal.

        One of INTELLIGENCE, INGESTION, OPTIMIZATION, or FRAUD_DETECTION
        is sampled per call; the WebSocket push loop calls this on a
        fixed interval and broadcasts the result.

        Returns
        -------
        AnalysisLogMessage
        """
        log_type = random.choice(
            ["INTELLIGENCE", "INGESTION", "OPTIMIZATION", "FRAUD_DETECTION"]
        )
        message = random.choice(_LOG_TEMPLATES[log_type])

        return AnalysisLogMessage(
            log_type=log_type,
            message=message,
            timestamp=datetime.now(timezone.utc),
        )
    

# ------------------------------------------------------------------
    # 9. Delete Campaign
    # ------------------------------------------------------------------

    async def delete_campaign(self, campaign_id: int) -> None:
        """
        Permanently delete a campaign and its associated creatives.

        Parameters
        ----------
        campaign_id : int

        Raises
        ------
        CampaignNotFoundError
            If campaign_id does not exist.
        """
        AdCampaign, AdCreative, FraudEvent = _models()

        result = await self._db.execute(
            select(AdCampaign).where(AdCampaign.campaign_id == campaign_id)
        )
        campaign = result.scalar_one_or_none()
        if campaign is None:
            raise CampaignNotFoundError(f"Campaign {campaign_id} not found.")

        # Remove associated creatives first since there's no ON DELETE
        # CASCADE declared on the FK in db/models.py.
        creative_result = await self._db.execute(
            select(AdCreative).where(AdCreative.campaign_id == campaign_id)
        )
        creatives = creative_result.scalars().all()
        for creative in creatives:
            await self._db.delete(creative)

        await self._db.delete(campaign)

        try:
            await self._db.commit()
        except Exception:
            await self._db.rollback()
            raise