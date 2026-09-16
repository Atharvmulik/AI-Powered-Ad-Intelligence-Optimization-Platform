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
)

HIGH_INTENT_USER = BehaviorProfile(
    name="high_intent",
    min_opportunities=2,
    max_opportunities=5,
    base_click_probability=0.14,
    intent_boost=0.20,
    fraud_probability=0.035,
    click_delay_seconds=(0.8, 4.0),
    scroll_probability=0.9,
    hover_probability=0.7,
)

FRAUD_BOT = BehaviorProfile(
    name="fraud_bot",
    min_opportunities=5,
    max_opportunities=10,
    base_click_probability=0.94,
    intent_boost=0.0,
    fraud_probability=0.94,
    click_delay_seconds=(0.02, 0.18),
    scroll_probability=0.04,
    hover_probability=0.03,
    repeated_clicks=True,
)

PROFILES = (NORMAL_USER, HIGH_INTENT_USER, FRAUD_BOT)
