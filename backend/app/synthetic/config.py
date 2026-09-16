"""Configuration and stable vocabulary for synthetic traffic generation."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

NORMAL_USER_PERCENTAGE = 0.80
HIGH_INTENT_USER_PERCENTAGE = 0.15
FRAUD_USER_PERCENTAGE = 0.05

EVENT_TYPES = (
    "impression",
    "scroll",
    "hover",
    "click",
    "page_view",
    "session_start",
    "session_end",
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

    def __post_init__(self) -> None:
        if self.sessions < 1:
            raise ValueError("sessions must be at least 1")
        if self.duration_seconds < 1:
            raise ValueError("duration_seconds must be at least 1")
        if self.events_per_second <= 0:
            raise ValueError("events_per_second must be greater than zero")
        if self.batch_size < 1 or self.max_events_in_memory < 1:
            raise ValueError("batch_size and max_events_in_memory must be positive")
        total = self.normal_percentage + self.high_intent_percentage + self.fraud_percentage
        if any(value < 0 for value in (self.normal_percentage, self.high_intent_percentage, self.fraud_percentage)):
            raise ValueError("traffic percentages cannot be negative")
        if abs(total - 1.0) > 0.001:
            raise ValueError("traffic percentages must add up to 1.0")
