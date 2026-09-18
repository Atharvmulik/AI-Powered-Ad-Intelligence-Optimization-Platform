"""Behavior profiles used by the synthetic traffic generator."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class BehaviorProfile:
    name: str
    min_opportunities: int
    max_opportunities: int
    base_click_probability: float
    intent_boost: float
    fraud_probability: float
    click_delay_seconds: tuple[float, float]
    scroll_probability: float
    hover_probability: float
    repeated_clicks: bool = False
    interest_bias: str | None = None


NORMAL_USER = BehaviorProfile(
    name="normal",
    min_opportunities=1,
    max_opportunities=3,
    base_click_probability=0.055,
    intent_boost=0.025,
    fraud_probability=0.08,
    click_delay_seconds=(1.5, 8.0),
    scroll_probability=0.72,
    hover_probability=0.35,
    interest_bias=None,
)

HIGHLY_ENGAGED_USER = BehaviorProfile(
    name="highly_engaged",
    min_opportunities=2,
    max_opportunities=5,
    base_click_probability=0.14,
    intent_boost=0.20,
    fraud_probability=0.035,
    click_delay_seconds=(0.8, 4.0),
    scroll_probability=0.9,
    hover_probability=0.7,
    interest_bias=None,
)

LOW_ENGAGEMENT_USER = BehaviorProfile(
    name="low_engagement",
    min_opportunities=1,
    max_opportunities=2,
    base_click_probability=0.02,
    intent_boost=0.015,
    fraud_probability=0.02,
    click_delay_seconds=(5.0, 20.0),
    scroll_probability=0.2,
    hover_probability=0.1,
    interest_bias=None,
)

TECH_FOCUSED_USER = BehaviorProfile(
    name="tech_focused",
    min_opportunities=2,
    max_opportunities=4,
    base_click_probability=0.11,
    intent_boost=0.15,
    fraud_probability=0.03,
    click_delay_seconds=(1.0, 7.0),
    scroll_probability=0.8,
    hover_probability=0.65,
    interest_bias="tech",
)

GAMING_FOCUSED_USER = BehaviorProfile(
    name="gaming_focused",
    min_opportunities=3,
    max_opportunities=6,
    base_click_probability=0.18,
    intent_boost=0.22,
    fraud_probability=0.04,
    click_delay_seconds=(0.7, 4.5),
    scroll_probability=0.85,
    hover_probability=0.7,
    interest_bias="gaming",
)

SPORTS_FOCUSED_USER = BehaviorProfile(
    name="sports_focused",
    min_opportunities=2,
    max_opportunities=5,
    base_click_probability=0.12,
    intent_boost=0.18,
    fraud_probability=0.03,
    click_delay_seconds=(1.2, 6.0),
    scroll_probability=0.76,
    hover_probability=0.6,
    interest_bias="sports",
)

SHOPPING_FOCUSED_USER = BehaviorProfile(
    name="shopping_focused",
    min_opportunities=2,
    max_opportunities=4,
    base_click_probability=0.09,
    intent_boost=0.12,
    fraud_probability=0.025,
    click_delay_seconds=(1.5, 8.0),
    scroll_probability=0.7,
    hover_probability=0.55,
    interest_bias="shopping",
)

FRAUD_BOT = BehaviorProfile(
    name="suspicious_high_frequency",
    min_opportunities=5,
    max_opportunities=10,
    base_click_probability=0.94,
    intent_boost=0.0,
    fraud_probability=0.94,
    click_delay_seconds=(0.02, 0.18),
    scroll_probability=0.04,
    hover_probability=0.03,
    repeated_clicks=True,
    interest_bias="gaming",
)

PROFILES = (
    NORMAL_USER,
    HIGHLY_ENGAGED_USER,
    LOW_ENGAGEMENT_USER,
    TECH_FOCUSED_USER,
    GAMING_FOCUSED_USER,
    SPORTS_FOCUSED_USER,
    SHOPPING_FOCUSED_USER,
    FRAUD_BOT,
)
