"""Configuration and stable vocabulary for synthetic traffic generation."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

NORMAL_USER_PERCENTAGE = 0.80
HIGH_INTENT_USER_PERCENTAGE = 0.15
FRAUD_USER_PERCENTAGE = 0.05
FRAUD_EVENT_THRESHOLD = 0.50

EVENT_TYPES = (
    "session_start",
    "view",
    "impression",
    "click",
    "conversion",
    "session_end",
)

PROFILE_NAMES = (
    "normal",
    "highly_engaged",
    "low_engagement",
    "tech_focused",
    "gaming_focused",
    "sports_focused",
    "shopping_focused",
    "suspicious_high_frequency",
)


@dataclass(frozen=True)
class SimulationConfig:
    """Runtime settings; persisted event types are limited by the DB schema."""

    sessions: int = 100
    duration_seconds: int = 60
    events_per_second: float = 20.0
    batch_size: int = 100
    max_events_in_memory: int = 2_000
    random_seed: Optional[int] = 42
    normal_percentage: float = NORMAL_USER_PERCENTAGE
    high_intent_percentage: float = HIGH_INTENT_USER_PERCENTAGE
    fraud_percentage: float = FRAUD_USER_PERCENTAGE
    fraud_event_threshold: float = FRAUD_EVENT_THRESHOLD

    def __post_init__(self) -> None:
        if self.sessions < 1:
            raise ValueError("sessions must be at least 1")
        if self.duration_seconds < 1:
            raise ValueError("duration_seconds must be at least 1")
        if self.events_per_second <= 0:
            raise ValueError("events_per_second must be greater than zero")
        if self.batch_size < 1 or self.max_events_in_memory < 1:
            raise ValueError("batch_size and max_events_in_memory must be positive")
        if any(value < 0 for value in (self.normal_percentage, self.high_intent_percentage, self.fraud_percentage, self.fraud_event_threshold)):
            raise ValueError("traffic percentages cannot be negative")
        total = self.normal_percentage + self.high_intent_percentage + self.fraud_percentage
        if total > 1.0 + 1e-9:
            raise ValueError("normal_percentage + high_intent_percentage + fraud_percentage must not exceed 1.0")
        if not 0.0 <= self.fraud_event_threshold <= 1.0:
            raise ValueError("fraud_event_threshold must be between 0 and 1")
