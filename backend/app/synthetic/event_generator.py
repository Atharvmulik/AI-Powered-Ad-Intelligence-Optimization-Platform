"""Reference-data loading and deterministic, serializable event generation."""

from __future__ import annotations

import random
import re
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AdCampaign, AdCreative, User
from app.synthetic.behavior_profiles import (
    FRAUD_BOT,
    BehaviorProfile,
    GAMING_FOCUSED_USER,
    HIGHLY_ENGAGED_USER,
    LOW_ENGAGEMENT_USER,
    NORMAL_USER,
    SHOPPING_FOCUSED_USER,
    SPORTS_FOCUSED_USER,
    TECH_FOCUSED_USER,
)


@dataclass(frozen=True)
class ReferenceData:
    users: tuple[Any, ...]
    campaigns: tuple[Any, ...]
    creatives: tuple[Any, ...]


@dataclass
class SyntheticEvent:
    event_id: str
    event_type: str
    timestamp: datetime
    user_id: str
    session_id: str
    ad_id: str
    campaign_id: int
    age: int
    interests: str
    device: str
    os: str
    app: str
    ip: str
    channel: str
    location: str
    profile_name: str
    clicked: bool = False
    ctr_result: dict[str, Any] | None = None
    fraud_result: dict[str, Any] | None = None
    recommendation_result: dict[str, Any] | None = None
    recommendation_explanation: str | None = None
    click_probability: float | None = None
    fraud_probability: float | None = None
    recommendation_score: float | None = None
    inference_latency_ms: float | None = None
    additional_context: dict[str, Any] = field(default_factory=dict)

    def as_dict(self) -> dict[str, Any]:
        data = self.__dict__.copy()
        return data


async def load_reference_data(session: AsyncSession) -> ReferenceData:
    """Load valid users, campaigns, and creatives once for a run."""
    users = tuple((await session.execute(select(User))).scalars().all())
    campaigns = tuple((await session.execute(select(AdCampaign))).scalars().all())
    campaign_ids = {campaign.campaign_id for campaign in campaigns}
    creatives = tuple(
        creative
        for creative in (await session.execute(select(AdCreative))).scalars().all()
        if creative.campaign_id in campaign_ids
    )
    return ReferenceData(users=users, campaigns=campaigns, creatives=creatives)


class EventGenerator:
    """Generate realistic user sessions and events from the live ad catalogue."""

    def __init__(self, references: ReferenceData, seed: int | None = 42) -> None:
        self.references = references
        self.random = random.Random(seed)

    def choose_profile(
        self,
        normal_percentage: float,
        high_intent_percentage: float,
        fraud_percentage: float,
    ) -> BehaviorProfile:
        profile_candidates = (
            NORMAL_USER,
            HIGHLY_ENGAGED_USER,
            LOW_ENGAGEMENT_USER,
            TECH_FOCUSED_USER,
            GAMING_FOCUSED_USER,
            SPORTS_FOCUSED_USER,
            SHOPPING_FOCUSED_USER,
            FRAUD_BOT,
        )
        total_primary = normal_percentage + high_intent_percentage + fraud_percentage
        remaining = max(0.0, 1.0 - total_primary)
        weights = [
            normal_percentage,
            high_intent_percentage,
            0.15 * remaining,
            0.20 * remaining,
            0.20 * remaining,
            0.20 * remaining,
            0.25 * remaining,
            fraud_percentage,
        ]
        total = sum(weights)
        if total <= 0:
            return NORMAL_USER
        threshold = self.random.random() * total
        cumulative = 0.0
        for profile, weight in zip(profile_candidates, weights):
            cumulative += weight
            if threshold <= cumulative:
                return profile
        return profile_candidates[-1]

    def generate_session(
        self,
        user: Any,
        profile: BehaviorProfile,
        now: datetime | None = None,
    ) -> list[SyntheticEvent]:
        if not self.references.creatives:
            return []
        base_time = now or datetime.now(timezone.utc)
        session_id = f"syn_{uuid.uuid4().hex}"
        session_length = self.random.randint(profile.min_opportunities, profile.max_opportunities)
        events: list[SyntheticEvent] = []
        seen_ad_ids: list[str] = []
        last_clicked = False

        events.append(self._make_event(user, profile, session_id, "session_start", base_time, seen_ad_ids))
        for index in range(session_length):
            creative = self._choose_creative(user, profile)
            event_type = self._next_event_type(profile, index, last_clicked)
            delay_seconds = self.random.uniform(*profile.click_delay_seconds) if event_type in {"click", "conversion"} else self.random.uniform(0.5, 4.0)
            event_time = base_time + timedelta(seconds=sum(self.random.uniform(0.3, 1.4) for _ in range(2)) + index * delay_seconds)
            event = self._make_event(user, profile, session_id, event_type, event_time, seen_ad_ids, creative)
            if event.ad_id not in seen_ad_ids:
                seen_ad_ids.append(event.ad_id)
            events.append(event)
            last_clicked = event.clicked

        events.append(self._make_event(user, profile, session_id, "session_end", base_time + timedelta(seconds=max(5, session_length * 2)), seen_ad_ids))
        return events

    @staticmethod
    def _ad_id_from_creative(creative: Any) -> str:
        return normalize_ad_id(getattr(creative, "ad_id", "ad_001"))

    def _make_event(
        self,
        user: Any,
        profile: BehaviorProfile,
        session_id: str,
        event_type: str,
        timestamp: datetime,
        seen_ad_ids: list[str],
        creative: Any | None = None,
    ) -> SyntheticEvent:
        creative = creative or self.random.choice(self.references.creatives)
        ad_id = self._ad_id_from_creative(creative)
        interest = str(getattr(user, "interests", "") or "tech").strip() or "tech"
        device = str(getattr(user, "device_type", "") or "desktop").strip() or "desktop"
        os_name = str(getattr(user, "os_name", "") or "windows").strip() or "windows"
        if profile is FRAUD_BOT:
            device = "mobile" if self.random.random() < 0.5 else "desktop"
            os_name = "android" if self.random.random() < 0.5 else "windows"
        app = (creative.category or "home").lower() if self.random.random() < 0.7 else "browser"
        channel = "search" if self.random.random() < 0.5 else "display"
        ip = self._ip_address(user, profile)
        if event_type == "session_start":
            ad_id = seen_ad_ids[0] if seen_ad_ids else self._ad_id_from_creative(creative)
        if event_type in {"click", "conversion"}:
            clicked = True
        else:
            clicked = False

        return SyntheticEvent(
            event_id=f"syn_{uuid.uuid4().hex}",
            event_type=event_type,
            timestamp=timestamp,
            user_id=str(user.user_id),
            session_id=session_id,
            ad_id=ad_id,
            campaign_id=int(creative.campaign_id),
            age=int(getattr(user, "age", 30) or 30),
            interests=interest,
            device=device,
            os=os_name,
            app=app,
            ip=ip,
            channel=channel,
            location=str(getattr(user, "location", "unknown") or "unknown"),
            profile_name=profile.name,
            clicked=clicked,
            recommendation_explanation=self._explanation(interest, creative.category or "general", device),
            additional_context={
                "interest_match_flag": self._matches(user, creative),
                "bid_amount": float(getattr(creative, "bid_amount", 1.0) or 1.0),
                "brand": str(getattr(creative, "brand_name", "brand") or "brand"),
                "category": str(getattr(creative, "category", "general") or "general"),
                "primary_interest": interest,
                "secondary_interest": str(getattr(user, "secondary_interest", "lifestyle") or "lifestyle"),
                "profile_name": profile.name,
                "location": str(getattr(user, "location", "unknown") or "unknown"),
                "user_ip_prefix": ip.rsplit('.', 1)[0],
                "ad_keyword_hash": str(hash(str(getattr(creative, "keywords", "keyword") or "keyword"))),
                "historical_session_bucket": "recent" if timestamp.hour >= 9 else "early",
                "ad_status": "active",
                "campaign_name": str(getattr(creative, "category", "general") or "general"),
                "page_category": (creative.category or "home").lower(),
                "device_affinity": device,
                "interaction_count": 1,
                "engagement_score": 0.45 if event_type in {"click", "conversion"} else 0.2,
                "historical_ctr": 0.05,
                "os": os_name,
                "channel": channel,
            },
        )

    def _choose_creative(self, user: Any, profile: BehaviorProfile) -> Any:
        interest = str(getattr(user, "interests", "") or "").lower()
        weighted_candidates: list[tuple[float, Any]] = []
        for creative in self.references.creatives:
            score = 1.0
            if self._matches(user, creative):
                score += 3.0
            if profile.interest_bias and profile.interest_bias.lower() in str(getattr(creative, "category", "") or "").lower():
                score += 2.0
            if profile is FRAUD_BOT:
                score += 0.5
            if interest and interest not in str(getattr(creative, "category", "") or "").lower() and interest not in str(getattr(creative, "keywords", "") or "").lower():
                score *= 0.6
            weighted_candidates.append((score, creative))
        total = sum(score for score, _ in weighted_candidates)
        threshold = self.random.random() * total
        current = 0.0
        for score, creative in weighted_candidates:
            current += score
            if threshold <= current:
                return creative
        return self.random.choice(self.references.creatives)

    @staticmethod
    def _matches(user: Any, creative: Any) -> bool:
        interest = str(getattr(user, "interests", "") or "").lower()
        category = str(getattr(creative, "category", "") or "").lower()
        keywords = str(getattr(creative, "keywords", "") or "").lower()
        return bool(interest) and (interest in category or interest in keywords or category in interest)

    @staticmethod
    def _explanation(interest: str, category: str, device_type: str | None) -> str:
        if interest.lower() in category.lower() or category.lower() in interest.lower():
            return f"User interested in {interest}"
        if device_type:
            return "Device affinity match"
        return "Lookalike audience match"

    def _ip_address(self, user: Any, profile: BehaviorProfile) -> str:
        if profile is FRAUD_BOT:
            return f"198.51.100.{self.random.randint(1, 12)}"
        return f"203.0.113.{(int(getattr(user, 'id', 1)) % 240) + 1}"

    def _next_event_type(self, profile: BehaviorProfile, index: int, previous_clicked: bool) -> str:
        if profile is FRAUD_BOT:
            if previous_clicked and self.random.random() < 0.6:
                return "conversion"
            if self.random.random() < 0.72:
                return "click"
            return "impression"
        if index == 0:
            return "impression"
        if previous_clicked and self.random.random() < 0.35:
            return "conversion"
        click_likelihood = min(0.85, profile.base_click_probability + profile.intent_boost)
        if self.random.random() < click_likelihood:
            return "click"
        if self.random.random() < 0.25:
            return "view"
        return "impression"


def normalize_ad_id(value: Any) -> str:
    """Normalize arbitrary ad IDs into the canonical ad_XXX format."""
    if value is None:
        return "ad_001"
    raw = str(value).strip()
    if not raw:
        return "ad_001"
    match = re.search(r"(\d+)", raw)
    if match:
        number = int(match.group(1))
        return f"ad_{number:03d}"
    try:
        number = int(float(raw))
        return f"ad_{number:03d}"
    except (TypeError, ValueError):
        return "ad_001"


def choose_users(references: ReferenceData, count: int, rng: random.Random) -> tuple[Any, ...]:
    """Return a bounded sample without inventing users."""
    if count >= len(references.users):
        return references.users
    return tuple(rng.sample(list(references.users), count))
