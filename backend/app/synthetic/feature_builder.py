"""Deterministic mapping from synthetic activity into raw CTR and fraud features."""

from __future__ import annotations

import hashlib
from collections.abc import Mapping
from datetime import datetime
from typing import Any

CTR_NUM_COLS = [f"I{i}" for i in range(1, 14)]
CTR_CAT_COLS = [f"C{i}" for i in range(1, 27)]


def _stable_token(value: Any, salt: str) -> str:
    raw = str(value or "missing").strip().lower()
    return hashlib.md5(f"{salt}:{raw}".encode("utf-8")).hexdigest()[:12]


def _as_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return float(default)


def build_ctr_feature_dict(event: Mapping[str, Any]) -> dict[str, Any]:
    """Build a CTR feature dict from event context without using the current outcome."""
    timestamp = event.get("timestamp")
    if isinstance(timestamp, str):
        timestamp = datetime.fromisoformat(timestamp)
    if timestamp is None:
        timestamp = datetime.utcnow()

    user_id = str(event.get("user_id") or "user_unknown")
    ad_id = str(event.get("ad_id") or "ad_001")
    category = str(event.get("category") or "general")
    brand = str(event.get("brand") or "brand_unknown")
    device = str(event.get("device") or "desktop")
    os_name = str(event.get("os") or "windows")
    app = str(event.get("app") or "browser")
    channel = str(event.get("channel") or "search")
    profile = str(event.get("profile_name") or "normal")
    event_type = str(event.get("event_type") or "impression")
    location = str(event.get("location") or "unknown")
    session_id = str(event.get("session_id") or "session_unknown")
    ad_format = str(event.get("ad_format") or "banner")
    age = int(event.get("age") or 30)
    interaction_count = int(event.get("interaction_count") or 0)
    bid_amount = _as_float(event.get("bid_amount"), 1.5)
    historical_ctr = _as_float(event.get("historical_ctr"), 0.05)
    engagement_score = _as_float(event.get("engagement_score"), 0.3)
    interest_match = _as_float(event.get("interest_match"), 0.0)
    if event.get("interest_match_flag") in (True, 1, "1", "true", "True"):
        interest_match = 1.0
    hour = int(timestamp.hour)
    minute = int(timestamp.minute)
    weekday = int(timestamp.weekday())
    matched_interest = 1 if str(event.get("interest_match_flag") or "0") not in {"0", "False", "false"} else 0

    num_values = {
        "I1": float(age),
        "I2": float(max(0, interaction_count)),
        "I3": float(bid_amount),
        "I4": float(max(0.0, min(1.0, historical_ctr))),
        "I5": float(hour),
        "I6": float(minute),
        "I7": float(max(0.0, min(1.0, engagement_score))),
        "I8": float(max(0.0, min(1.0, interest_match))),
        "I9": float(weekday),
        "I10": float(len(str(user_id))),
        "I11": float(len(str(ad_id))),
        "I12": float(event.get("campaign_id") or 1),
        "I13": float(1 if event_type == "conversion" else 0),
    }

    cat_values = {
        "C1": _stable_token(user_id, "user"),
        "C2": _stable_token(profile, "profile"),
        "C3": _stable_token(ad_id, "ad"),
        "C4": _stable_token(category, "category"),
        "C5": _stable_token(brand, "brand"),
        "C6": _stable_token(device, "device"),
        "C7": _stable_token(os_name, "os"),
        "C8": _stable_token(app, "app"),
        "C9": _stable_token(channel, "channel"),
        "C10": _stable_token(location, "location"),
        "C11": _stable_token(event_type, "event"),
        "C12": _stable_token(str(hour), "hour"),
        "C13": _stable_token(str(weekday), "weekday"),
        "C14": _stable_token(session_id, "session"),
        "C15": _stable_token(ad_format, "format"),
        "C16": _stable_token(str(matched_interest), "interest_match"),
        "C17": _stable_token(str(event.get("is_premium") or 0), "premium"),
        "C18": _stable_token(str(event.get("device_affinity") or "general"), "device_affinity"),
        "C19": _stable_token(str(event.get("primary_interest") or "general"), "interest"),
        "C20": _stable_token(str(event.get("secondary_interest") or "general"), "secondary_interest"),
        "C21": _stable_token(str(event.get("campaign_name") or "campaign"), "campaign"),
        "C22": _stable_token(str(event.get("page_category") or "home"), "page_category"),
        "C23": _stable_token(str(event.get("user_ip_prefix") or "0.0.0"), "ip_prefix"),
        "C24": _stable_token(str(event.get("ad_keyword_hash") or "keyword"), "keyword"),
        "C25": _stable_token(str(event.get("historical_session_bucket") or "recent"), "session_bucket"),
        "C26": _stable_token(str(event.get("ad_status") or "active"), "status"),
    }

    return {**num_values, **cat_values}


def build_fraud_feature_dict(event: Mapping[str, Any], history: Mapping[str, Any]) -> dict[str, float | int]:
    """Build the fraud feature vector expected by the trained fraud pipeline."""
    timestamp = event.get("timestamp")
    if isinstance(timestamp, str):
        timestamp = datetime.fromisoformat(timestamp)
    if timestamp is None:
        timestamp = datetime.utcnow()

    ip_address = str(event.get("ip") or "0.0.0.0")
    app_name = str(event.get("app") or "browser")
    channel_name = str(event.get("channel") or "search")
    device_name = str(event.get("device") or "desktop")
    os_name = str(event.get("os") or "windows")

    hour = int(timestamp.hour)
    minute = int(timestamp.minute)
    day = int(timestamp.day)
    day_of_week = int(timestamp.weekday())
    is_night = int(hour <= 5)
    is_peak_hour = int(9 <= hour <= 21)

    def hist_value(key: str, lookup_key: str, default: int = 0) -> int:
        value = history.get(key, {})
        if isinstance(value, Mapping):
            return int(value.get(lookup_key, default) or default)
        return int(value or default)

    features = {
        "hour": hour,
        "day": day,
        "day_of_week": day_of_week,
        "minute": minute,
        "is_night": is_night,
        "is_peak_hour": is_peak_hour,
        "ip_click_count": hist_value("ip_click_count", ip_address, 0),
        "ip_app_count": hist_value("ip_app_count", f"{ip_address}:{app_name}", 0),
        "ip_os_count": hist_value("ip_os_count", f"{ip_address}:{os_name}", 0),
        "ip_device_count": hist_value("ip_device_count", f"{ip_address}:{device_name}", 0),
        "ip_hour_count": hist_value("ip_hour_count", f"{ip_address}:{hour}", 0),
        "channel_count": hist_value("channel_count", channel_name, 0),
        "app_count": hist_value("app_count", app_name, 0),
    }
    return features
