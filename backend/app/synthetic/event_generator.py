"""Reference-data loading and deterministic, serializable event generation."""

from __future__ import annotations

import random
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Iterable

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AdCampaign, AdCreative, User
from app.synthetic.behavior_profiles import (
    FRAUD_BOT,
    HIGH_INTENT_USER,
    NORMAL_USER,
    BehaviorProfile,
)


@dataclass(frozen=True)
class ReferenceData:
    users: tuple[Any, ...]
    campaigns: tuple[Any, ...]
    creatives: tuple[Any, ...]


@dataclass(frozen=True)
class SyntheticEvent:
    event_type: str
    timestamp: datetime
    user_id: str
    session_id: str
    ad_id: str
    campaign_id: int
    device_type: str
    location: str
    interest: str
    behavior_profile: str
    click_probability: float
    clicked: bool
    fraud_probability: float
    fraud_score: float
    ip_address: str
    recommendation_score: float
    recommendation_explanation: str
    inference_latency_ms: float

    def as_dict(self) -> dict[str, Any]:
        return self.__dict__.copy()


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
    """Generate persisted opportunities and predictions from loaded references."""

    def __init__(self, references: ReferenceData, seed: int | None = 42) -> None:
        self.references = references
        self.random = random.Random(seed)

    def choose_profile(
        self,
        normal_percentage: float,
        high_intent_percentage: float,
        fraud_percentage: float,
    ) -> BehaviorProfile:
        choice = self.random.random()
        if choice < normal_percentage:
            return NORMAL_USER
        if choice < normal_percentage + high_intent_percentage:
            return HIGH_INTENT_USER
        if choice < normal_percentage + high_intent_percentage + fraud_percentage:
            return FRAUD_BOT
        return NORMAL_USER

    def generate_session(
        self,
        user: Any,
        profile: BehaviorProfile,
        now: datetime | None = None,
    ) -> list[SyntheticEvent]:
        if not self.references.creatives:
            return []
        timestamp = now or datetime.now(timezone.utc)
        session_id = f"syn_{uuid.uuid4().hex}"
        opportunity_count = self.random.randint(profile.min_opportunities, profile.max_opportunities)
        events: list[SyntheticEvent] = []
        for _ in range(opportunity_count):
            creative = self._choose_creative(user, profile)
            category = (creative.category or "General").strip()
            interest = (user.interests or "General").strip()
            click_probability = self._click_probability(user, creative, profile, timestamp)
            clicked = profile.repeated_clicks or self.random.random() < click_probability
            fraud_score = self._fraud_score(profile, clicked)
            fraud_probability = round(min(0.99, max(profile.fraud_probability, fraud_score)), 4)
            recommendation_score = self._recommendation_score(user, creative, profile)
            events.append(
                SyntheticEvent(
                    event_type="impression",
                    timestamp=timestamp,
                    user_id=str(user.user_id),
                    session_id=session_id,
                    ad_id=f"ad_{int(creative.ad_id):03d}",
                    campaign_id=int(creative.campaign_id),
                    device_type=str(user.device_type or "Unknown"),
                    location=str(user.location or "Unknown"),
                    interest=interest,
                    behavior_profile=profile.name,
                    click_probability=click_probability,
                    clicked=clicked,
                    fraud_probability=fraud_probability,
                    fraud_score=fraud_score,
                    ip_address=self._ip_address(user, profile),
                    recommendation_score=recommendation_score,
                    recommendation_explanation=self._explanation(interest, category, user.device_type),
                    inference_latency_ms=round(self.random.uniform(8.0, 42.0), 2),
                )
            )
            timestamp += timedelta(seconds=self.random.uniform(*profile.click_delay_seconds))
        return events

    def _choose_creative(self, user: Any, profile: BehaviorProfile) -> Any:
        if profile is FRAUD_BOT or not user.interests:
            return self.random.choice(self.references.creatives)
        matching = [creative for creative in self.references.creatives if self._matches(user, creative)]
        return self.random.choice(matching or list(self.references.creatives))

    @staticmethod
    def _matches(user: Any, creative: Any) -> bool:
        interest = str(user.interests or "").lower()
        category = str(creative.category or "").lower()
        keywords = str(creative.keywords or "").lower()
        return bool(interest) and (interest in category or interest in keywords or category in interest)

    def _click_probability(self, user: Any, creative: Any, profile: BehaviorProfile, timestamp: datetime) -> float:
        score = profile.base_click_probability
        relevant = self._matches(user, creative)
        score += profile.intent_boost if relevant else (-0.025 if profile is HIGH_INTENT_USER else 0.0)
        if str(user.device_type or "").lower() in str(creative.keywords or "").lower():
            score += 0.035
        if timestamp.hour in range(18, 23) and str(user.interests or "").lower() in {"gaming", "sports", "fashion"}:
            score += 0.025
        if profile is FRAUD_BOT:
            score += 0.02
        noise = self.random.uniform(-0.015, 0.015)
        return round(min(0.95, max(0.01, score + noise)), 4)

    def _recommendation_score(self, user: Any, creative: Any, profile: BehaviorProfile) -> float:
        score = 0.72 if self._matches(user, creative) else 0.28
        if profile is HIGH_INTENT_USER:
            score += 0.16
        if profile is FRAUD_BOT:
            score -= 0.12
        return round(min(0.99, max(0.01, score + self.random.uniform(-0.03, 0.03))), 4)

    def _fraud_score(self, profile: BehaviorProfile, clicked: bool) -> float:
        if profile is FRAUD_BOT:
            return round(min(0.99, self.random.uniform(0.84, 0.99)), 4)
        base = self.random.uniform(0.01, 0.18) if profile is NORMAL_USER else self.random.uniform(0.01, 0.10)
        if clicked and profile is NORMAL_USER:
            base += 0.03
        return round(min(0.70, base), 4)

    def _ip_address(self, user: Any, profile: BehaviorProfile) -> str:
        if profile is FRAUD_BOT:
            return f"198.51.100.{self.random.randint(1, 12)}"
        return f"203.0.113.{(int(getattr(user, 'id', 1)) % 240) + 1}"

    @staticmethod
    def _explanation(interest: str, category: str, device_type: str | None) -> str:
        if interest.lower() in category.lower() or category.lower() in interest.lower():
            return f"User interested in {interest}"
        if device_type:
            return "Device affinity match"
        return "Lookalike audience match"


def choose_users(references: ReferenceData, count: int, rng: random.Random) -> tuple[Any, ...]:
    """Return a bounded sample without inventing users."""
    if count >= len(references.users):
        return references.users
    return tuple(rng.sample(list(references.users), count))
