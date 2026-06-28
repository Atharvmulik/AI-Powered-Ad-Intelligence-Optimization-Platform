"""
AudienceService — service layer for the Audience Intelligence module.

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
* Demographics (gender / age / device) are computed live from the `users`
  table via GROUP BY / CASE aggregates — no separate snapshot table.
* `tags` is stored as a comma-separated Text column on AudienceSegment
  (matching User.interests / AdCreative.keywords) and is converted to/from
  List[str] at the service boundary.
"""

from __future__ import annotations

import logging
import math
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from sqlalchemy import asc, case, delete as sa_delete, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.audience import (
    AgeBreakdown,
    AudienceDemographicsResponse,
    AudienceInsightFeatureItem,
    AudienceInsightResponse,
    AudienceInsightsListResponse,
    AudienceOverviewResponse,
    AudienceSegmentCreate,
    AudienceSegmentResponse,
    AudienceSegmentUpdate,
    DeviceBreakdown,
    GenderBreakdown,
    PaginatedAudienceSegmentsResponse,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Lazy model imports — prevents circular imports while keeping the service
# decoupled from db/ model definitions.
# ---------------------------------------------------------------------------

def _models():
    """Return ORM model classes at call time to avoid circular imports."""
    from app.db.models import (  # noqa: PLC0415
        AudienceSegment,
        AudienceSegmentInsight,
        User,
    )
    return AudienceSegment, AudienceSegmentInsight, User


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
# AudienceService
# ---------------------------------------------------------------------------

class AudienceService:
    """
    Encapsulates all queries for the Audience module — segments,
    demographics, and SHAP-style segment insights.

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
    def _tags_to_list(tags: Optional[str]) -> List[str]:
        """Convert the comma-separated Text column into a list for the API."""
        if not tags:
            return []
        return [t.strip() for t in tags.split(",") if t.strip()]

    @staticmethod
    def _tags_to_text(tags: Optional[List[str]]) -> Optional[str]:
        """Convert an incoming list of tags into the comma-separated Text column."""
        if not tags:
            return None
        return ",".join(t.strip() for t in tags if t.strip())

    def _to_segment_response(self, segment) -> AudienceSegmentResponse:
        """Build an AudienceSegmentResponse from an ORM AudienceSegment row."""
        return AudienceSegmentResponse(
            id=segment.id,
            name=segment.name,
            subtitle=segment.subtitle,
            icon_name=segment.icon_name,
            reach=segment.reach,
            growth_pct=segment.growth_pct,
            device_mobile_pct=segment.device_mobile_pct,
            device_desktop_pct=segment.device_desktop_pct,
            device_tablet_pct=segment.device_tablet_pct,
            fraud_risk_level=segment.fraud_risk_level,
            avg_ctr=segment.avg_ctr,
            tags=self._tags_to_list(segment.tags),
            is_active=segment.is_active,
            created_at=segment.created_at,
            updated_at=segment.updated_at,
        )

    @staticmethod
    def _bucket_risk_score(score: float) -> str:
        """
        Map an averaged numeric risk score (Low=1, Medium=2, High=3) to a
        display label, allowing hybrid labels near bucket boundaries
        (e.g. 'Low-Medium'). Thresholds are a placeholder heuristic pending
        a confirmed business rule.
        """
        if score < 1.35:
            return "Low"
        if score < 1.65:
            return "Low-Medium"
        if score < 2.35:
            return "Medium"
        if score < 2.65:
            return "Medium-High"
        return "High"

    # ------------------------------------------------------------------
    # 1. Overview
    # ------------------------------------------------------------------

    async def get_overview(self) -> AudienceOverviewResponse:
        """
        Compute the four header KPI cards for the Audience page.

        Returns
        -------
        AudienceOverviewResponse
        """
        AudienceSegment, AudienceSegmentInsight, User = _models()
        db = self._db
        now = datetime.now(timezone.utc)
        window_15m = now - timedelta(minutes=15)

        cache_key = "audience:overview"
        cached = await _cache_get(cache_key)
        if cached:
            return AudienceOverviewResponse.model_validate_json(cached)

        # total addressable reach — sum of reach across active segments
        reach_result = await db.execute(
            select(func.sum(AudienceSegment.reach)).where(AudienceSegment.is_active == True)  # noqa: E712
        )
        total_addressable_reach: int = int(reach_result.scalar_one() or 0)

        # avg fraud risk — map Low/Medium/High to 1/2/3, average, bucket back to a label
        risk_score_case = case(
            (AudienceSegment.fraud_risk_level == "Low", 1),
            (AudienceSegment.fraud_risk_level == "Medium", 2),
            (AudienceSegment.fraud_risk_level == "High", 3),
            else_=1,
        )
        risk_result = await db.execute(
            select(func.avg(risk_score_case)).where(AudienceSegment.is_active == True)  # noqa: E712
        )
        avg_risk_score: float = float(risk_result.scalar_one() or 1.0)
        avg_fraud_risk: str = self._bucket_risk_score(avg_risk_score)

        # live active now — distinct users active in the last 15 minutes
        active_result = await db.execute(
            select(func.count(func.distinct(User.user_id))).where(User.last_active >= window_15m)
        )
        live_active_now: int = active_result.scalar_one() or 0

        # top performing segment — highest avg_ctr among active segments
        top_result = await db.execute(
            select(AudienceSegment.name, AudienceSegment.avg_ctr)
            .where(AudienceSegment.is_active == True)  # noqa: E712
            .order_by(desc(AudienceSegment.avg_ctr))
            .limit(1)
        )
        top_row = top_result.first()
        top_performing_segment: str = top_row.name if top_row else ""
        top_performing_segment_ctr: float = float(top_row.avg_ctr) if top_row else 0.0

        response = AudienceOverviewResponse(
            total_addressable_reach=total_addressable_reach,
            avg_fraud_risk=avg_fraud_risk,
            live_active_now=live_active_now,
            top_performing_segment=top_performing_segment,
            top_performing_segment_ctr=top_performing_segment_ctr,
        )

        await _cache_set(cache_key, response.model_dump_json(), ttl_seconds=30)
        return response

    # ------------------------------------------------------------------
    # 2. List Segments
    # ------------------------------------------------------------------

    async def list_segments(
        self,
        q: Optional[str] = None,
        fraud_risk: Optional[str] = None,
        device: Optional[str] = None,
        sort_by: str = "avg_ctr",
        page: int = 1,
        limit: int = 20,
    ) -> PaginatedAudienceSegmentsResponse:
        """
        Paginated, filterable, sortable list of audience segments.

        No performance threshold is applied beyond `is_active` — "High-
        Performing Segments" is currently just the page's display copy.
        Default sort is avg_ctr descending. Both are easy to change once
        the business rule is confirmed.

        Parameters
        ----------
        q : Optional[str]
            Free-text search against segment name.
        fraud_risk : Optional[str]
            Exact match on fraud_risk_level ('Low' | 'Medium' | 'High').
        device : Optional[str]
            Filters to segments where the given device type is dominant
            ('Mobile' | 'Desktop' | 'Tablet').
        sort_by : str
            One of 'avg_ctr', 'growth_pct', 'reach', 'name'.
        page, limit : int
            1-indexed pagination.

        Returns
        -------
        PaginatedAudienceSegmentsResponse
        """
        AudienceSegment, AudienceSegmentInsight, User = _models()
        db = self._db

        stmt = select(AudienceSegment).where(AudienceSegment.is_active == True)  # noqa: E712
        count_stmt = (
            select(func.count())
            .select_from(AudienceSegment)
            .where(AudienceSegment.is_active == True)  # noqa: E712
        )

        if q:
            pattern = f"%{q.strip()}%"
            stmt = stmt.where(AudienceSegment.name.ilike(pattern))
            count_stmt = count_stmt.where(AudienceSegment.name.ilike(pattern))

        if fraud_risk:
            stmt = stmt.where(AudienceSegment.fraud_risk_level == fraud_risk)
            count_stmt = count_stmt.where(AudienceSegment.fraud_risk_level == fraud_risk)

        if device:
            device_norm = device.strip().lower()
            dominant_clause = None
            if device_norm == "mobile":
                dominant_clause = (
                    (AudienceSegment.device_mobile_pct >= AudienceSegment.device_desktop_pct)
                    & (AudienceSegment.device_mobile_pct >= AudienceSegment.device_tablet_pct)
                )
            elif device_norm == "desktop":
                dominant_clause = (
                    (AudienceSegment.device_desktop_pct >= AudienceSegment.device_mobile_pct)
                    & (AudienceSegment.device_desktop_pct >= AudienceSegment.device_tablet_pct)
                )
            elif device_norm == "tablet":
                dominant_clause = (
                    (AudienceSegment.device_tablet_pct >= AudienceSegment.device_mobile_pct)
                    & (AudienceSegment.device_tablet_pct >= AudienceSegment.device_desktop_pct)
                )
            if dominant_clause is not None:
                stmt = stmt.where(dominant_clause)
                count_stmt = count_stmt.where(dominant_clause)

        sort_columns = {
            "avg_ctr": AudienceSegment.avg_ctr,
            "growth_pct": AudienceSegment.growth_pct,
            "reach": AudienceSegment.reach,
            "name": AudienceSegment.name,
        }
        sort_column = sort_columns.get(sort_by, AudienceSegment.avg_ctr)
        stmt = stmt.order_by(asc(sort_column) if sort_by == "name" else desc(sort_column))

        total_result = await db.execute(count_stmt)
        total: int = total_result.scalar_one() or 0

        page = max(page, 1)
        limit = max(limit, 1)
        offset = (page - 1) * limit
        stmt = stmt.offset(offset).limit(limit)

        result = await db.execute(stmt)
        segments = result.scalars().all()

        total_pages = math.ceil(total / limit) if limit else 0

        return PaginatedAudienceSegmentsResponse(
            items=[self._to_segment_response(s) for s in segments],
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

    # ------------------------------------------------------------------
    # 3. Get Segment
    # ------------------------------------------------------------------

    async def get_segment(self, segment_id: int) -> Optional[AudienceSegmentResponse]:
        """
        Fetch a single segment by id.

        Returns
        -------
        Optional[AudienceSegmentResponse]
            None if no segment exists with the given id — the router is
            responsible for raising HTTP 404 in that case.
        """
        AudienceSegment, AudienceSegmentInsight, User = _models()
        db = self._db

        result = await db.execute(select(AudienceSegment).where(AudienceSegment.id == segment_id))
        segment = result.scalar_one_or_none()
        if segment is None:
            return None
        return self._to_segment_response(segment)

    # ------------------------------------------------------------------
    # 4. Create Segment
    # ------------------------------------------------------------------

    async def create_segment(self, payload: AudienceSegmentCreate) -> AudienceSegmentResponse:
        """
        Create a new audience segment.

        Returns
        -------
        AudienceSegmentResponse
        """
        AudienceSegment, AudienceSegmentInsight, User = _models()
        db = self._db

        segment = AudienceSegment(
            name=payload.name,
            subtitle=payload.subtitle,
            icon_name=payload.icon_name,
            reach=payload.reach,
            growth_pct=payload.growth_pct,
            device_mobile_pct=payload.device_mobile_pct,
            device_desktop_pct=payload.device_desktop_pct,
            device_tablet_pct=payload.device_tablet_pct,
            fraud_risk_level=payload.fraud_risk_level,
            avg_ctr=payload.avg_ctr,
            tags=self._tags_to_text(payload.tags),
            is_active=payload.is_active,
        )
        db.add(segment)
        await db.commit()
        await db.refresh(segment)

        await _publish_event(
            "audience-segment-created",
            {"segment_id": segment.id, "name": segment.name},
        )

        return self._to_segment_response(segment)

    # ------------------------------------------------------------------
    # 5. Update Segment
    # ------------------------------------------------------------------

    async def update_segment(
        self, segment_id: int, payload: AudienceSegmentUpdate
    ) -> Optional[AudienceSegmentResponse]:
        """
        Apply a partial update to an existing segment.

        Returns
        -------
        Optional[AudienceSegmentResponse]
            None if no segment exists with the given id.
        """
        AudienceSegment, AudienceSegmentInsight, User = _models()
        db = self._db

        result = await db.execute(select(AudienceSegment).where(AudienceSegment.id == segment_id))
        segment = result.scalar_one_or_none()
        if segment is None:
            return None

        update_data = payload.model_dump(exclude_unset=True)

        if "tags" in update_data:
            update_data["tags"] = self._tags_to_text(update_data["tags"])

        for field, value in update_data.items():
            setattr(segment, field, value)

        await db.commit()
        await db.refresh(segment)

        await _publish_event("audience-segment-updated", {"segment_id": segment.id})

        return self._to_segment_response(segment)

    # ------------------------------------------------------------------
    # 6. Delete Segment
    # ------------------------------------------------------------------

    async def delete_segment(self, segment_id: int) -> bool:
        """
        Delete a segment and its associated SHAP insight rows.

        The audience_segment_insights FK has no ON DELETE CASCADE configured
        at the DB level, so child rows are deleted explicitly first.

        Returns
        -------
        bool
            True if a segment was deleted, False if no segment existed.
        """
        AudienceSegment, AudienceSegmentInsight, User = _models()
        db = self._db

        result = await db.execute(select(AudienceSegment).where(AudienceSegment.id == segment_id))
        segment = result.scalar_one_or_none()
        if segment is None:
            return False

        await db.execute(
            sa_delete(AudienceSegmentInsight).where(AudienceSegmentInsight.segment_id == segment_id)
        )
        await db.delete(segment)
        await db.commit()

        await _publish_event("audience-segment-deleted", {"segment_id": segment_id})

        return True

    # ------------------------------------------------------------------
    # 7. Demographics
    # ------------------------------------------------------------------

    async def get_demographics(self) -> AudienceDemographicsResponse:
        """
        Compute platform-wide Gender / Age / Device breakdowns directly from
        the users table — no separate snapshot table.

        Returns
        -------
        AudienceDemographicsResponse
        """
        AudienceSegment, AudienceSegmentInsight, User = _models()
        db = self._db

        cache_key = "audience:demographics"
        cached = await _cache_get(cache_key)
        if cached:
            return AudienceDemographicsResponse.model_validate_json(cached)

        gender = await self._compute_gender_breakdown(db, User)
        age_groups = await self._compute_age_breakdown(db, User)
        device = await self._compute_device_breakdown(db, User)

        response = AudienceDemographicsResponse(
            gender=gender,
            age_groups=age_groups,
            device=device,
        )

        await _cache_set(cache_key, response.model_dump_json(), ttl_seconds=60)
        return response

    @staticmethod
    async def _compute_gender_breakdown(db: AsyncSession, User) -> GenderBreakdown:
        """Aggregate users.gender into Male / Female / Other percentages."""
        result = await db.execute(
            select(User.gender, func.count())
            .where(User.gender.is_not(None))
            .group_by(User.gender)
        )
        rows = result.all()
        total = sum(count for _, count in rows) or 1

        male = sum(count for gender, count in rows if gender == "Male")
        female = sum(count for gender, count in rows if gender == "Female")
        other = total - male - female

        return GenderBreakdown(
            male_pct=round(male / total * 100, 2),
            female_pct=round(female / total * 100, 2),
            other_pct=round(other / total * 100, 2),
        )

    @staticmethod
    async def _compute_age_breakdown(db: AsyncSession, User) -> List[AgeBreakdown]:
        """Bucket users.age into 18-24 / 25-34 / 35-44 / 45+ via SQL CASE."""
        age_bucket = case(
            (User.age.between(18, 24), "18-24"),
            (User.age.between(25, 34), "25-34"),
            (User.age.between(35, 44), "35-44"),
            (User.age >= 45, "45+"),
            else_=None,
        )

        result = await db.execute(
            select(age_bucket.label("bucket"), func.count())
            .where(User.age.is_not(None))
            .where(User.age >= 18)
            .group_by(age_bucket)
        )
        rows = result.all()
        total = sum(count for _, count in rows) or 1

        order = ["18-24", "25-34", "35-44", "45+"]
        counts = {bucket: count for bucket, count in rows if bucket is not None}

        return [
            AgeBreakdown(label=label, percentage=round(counts.get(label, 0) / total * 100, 2))
            for label in order
        ]

    @staticmethod
    async def _compute_device_breakdown(db: AsyncSession, User) -> DeviceBreakdown:
        """Aggregate users.device_type into Mobile / Desktop / Tablet percentages."""
        result = await db.execute(
            select(User.device_type, func.count())
            .where(User.device_type.is_not(None))
            .group_by(User.device_type)
        )
        rows = result.all()
        total = sum(count for _, count in rows) or 1

        mobile = sum(count for dt, count in rows if dt == "Mobile")
        desktop = sum(count for dt, count in rows if dt == "Desktop")
        tablet = sum(count for dt, count in rows if dt == "Tablet")

        return DeviceBreakdown(
            mobile_pct=round(mobile / total * 100, 2),
            desktop_pct=round(desktop / total * 100, 2),
            tablet_pct=round(tablet / total * 100, 2),
        )

    # ------------------------------------------------------------------
    # 8. Segment Insights (SHAP)
    # ------------------------------------------------------------------

    async def get_segment_insights(self, limit: int = 3) -> AudienceInsightsListResponse:
        """
        Return SHAP-style feature-contribution cards for the top performing
        segments, independent of whatever filter/sort is active on the main
        segments table.

        Returns
        -------
        AudienceInsightsListResponse
        """
        AudienceSegment, AudienceSegmentInsight, User = _models()
        db = self._db

        top_result = await db.execute(
            select(AudienceSegment)
            .where(AudienceSegment.is_active == True)  # noqa: E712
            .order_by(desc(AudienceSegment.avg_ctr))
            .limit(limit)
        )
        top_segments = top_result.scalars().all()

        insights: List[AudienceInsightResponse] = []
        for segment in top_segments:
            features_result = await db.execute(
                select(AudienceSegmentInsight)
                .where(AudienceSegmentInsight.segment_id == segment.id)
                .order_by(desc(AudienceSegmentInsight.contribution_value))
            )
            feature_rows = features_result.scalars().all()

            features = [
                AudienceInsightFeatureItem(
                    feature=row.feature_name,
                    contribution=float(row.contribution_value),
                )
                for row in feature_rows
            ]

            top_feature_name = feature_rows[0].feature_name if feature_rows else "N/A"

            insights.append(
                AudienceInsightResponse(
                    segment_id=segment.id,
                    segment_name=segment.name,
                    features=features,
                    recommended_because=f"Recommended because of {top_feature_name}",
                )
            )

        return AudienceInsightsListResponse(insights=insights)