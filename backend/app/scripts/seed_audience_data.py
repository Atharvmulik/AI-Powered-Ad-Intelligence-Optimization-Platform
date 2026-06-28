"""
seed_audience_data.py
----------------------
Async SQLAlchemy seed script for the Audience module.
Schema-exact: only inserts columns that exist in the database.
Idempotent: safe to re-run — existing rows are loaded, not duplicated.

Also patches the `users.gender` column with a deterministic Male/Female/Other
split (55% / 35% / 10%) so the Gender Distribution donut on the Audience page
has real "Other" data — seed_dashboard_data.py's GENDERS list only ever wrote
Male/Female.

Usage:
    python seed_audience_data.py
"""

import asyncio
import logging
import random
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select, update, case
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.db.session import AsyncSessionLocal
from app.db.models import (
    User,
    AudienceSegment,
    AudienceSegmentInsight,
)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger(__name__)

# Deterministic randomness — re-running the script produces the same values.
random.seed(42)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

TAG_POOL = [
    "High Scroll Depth", "Evening Peak", "Weekend Spike", "Price Sensitive",
    "Repeat Visitor", "New User", "Regional Language", "Premium Subscriber",
    "High CTR", "Low Bounce", "Night Owl", "Lunch Break Browsing",
    "Tier-2 City", "Metro Heavy", "Voice Search User", "App-First",
    "Cross-Device", "High Engagement", "Seasonal Shopper", "Loyal Customer",
    "Price Comparator", "Festive Surge", "Cricket Season Spike",
]

FEATURE_POOL = [
    "user_interest=gaming", "user_interest=sports", "user_interest=tech",
    "user_interest=fashion", "user_interest=travel", "user_interest=finance",
    "device=desktop", "device=mobile", "device=tablet",
    "time=evening", "time=weekend", "time=business_hours", "time=night",
    "session_length=long", "session_length=short",
    "location=metro", "location=tier2_city",
    "income_bracket=high", "app_usage=frequent", "payment_method=upi",
]

FRAUD_RISK_WEIGHTS = [("Low", 0.55), ("Medium", 0.35), ("High", 0.10)]

# ---------------------------------------------------------------------------
# Segment definitions
#
# The first three are exact, screenshot-confirmed production values and must
# remain the three highest avg_ctr rows so /segments/insights surfaces them
# by default. All generated segments are capped below avg_ctr=2.85 to
# preserve that ordering.
# ---------------------------------------------------------------------------

CONFIRMED_SEGMENTS = [
    {
        "name": "Pro Gamers",
        "subtitle": "Twitch & Discord heavy users",
        "icon_name": "sports_esports",
        "reach": 1_190_000,
        "growth_pct": 12.4,
        "device_mobile_pct": 30.0,
        "device_desktop_pct": 70.0,
        "device_tablet_pct": 0.0,
        "fraud_risk_level": "Medium",
        "avg_ctr": 3.82,
        "tags": ["High Scroll Depth", "Evening Peak", "Desktop Heavy"],
        "insights": [
            ("user_interest=gaming", 0.31),
            ("device=desktop", 0.18),
            ("time=evening", 0.12),
        ],
    },
    {
        "name": "Sports Enthusiasts",
        "subtitle": "Live streaming & betting",
        "icon_name": "fitness_center",
        "reach": 847_000,
        "growth_pct": 5.1,
        "device_mobile_pct": 65.0,
        "device_desktop_pct": 35.0,
        "device_tablet_pct": 0.0,
        "fraud_risk_level": "Low",
        "avg_ctr": 2.91,
        "tags": ["Live Stream Viewers", "Weekend Spike", "Mobile First"],
        "insights": [
            ("user_interest=sports", 0.28),
            ("device=mobile", 0.21),
            ("time=weekend", 0.14),
        ],
    },
    {
        "name": "Tech Early Adopters",
        "subtitle": "B2B SaaS & AI Tools",
        "icon_name": "memory",
        "reach": 2_090_000,
        "growth_pct": -1.2,
        "device_mobile_pct": 45.0,
        "device_desktop_pct": 55.0,
        "device_tablet_pct": 0.0,
        "fraud_risk_level": "Low",
        "avg_ctr": 4.15,
        "tags": ["Long Sessions", "B2B Hours", "High Intent"],
        "insights": [
            ("user_interest=tech", 0.35),
            ("session_length=long", 0.22),
            ("time=business_hours", 0.16),
        ],
    },
]

GENERATED_SEGMENT_TEMPLATES = [
    ("Festive Shoppers", "Diwali & festive season spenders", "celebration"),
    ("OTT Bingers", "Heavy streaming on Hotstar & Netflix", "live_tv"),
    ("UPI Power Users", "High-frequency digital payment users", "account_balance_wallet"),
    ("Cricket Fanatics", "IPL & live match second-screen viewers", "sports_cricket"),
    ("Regional Language Readers", "Vernacular news & content consumers", "newspaper"),
    ("College Students", "18-22 campus & hostel audience", "school"),
    ("Young Parents", "New parents shopping for baby products", "child_care"),
    ("Travel Planners", "Active flight & hotel search behavior", "flight"),
    ("Food Delivery Regulars", "Frequent Swiggy & Zomato orders", "restaurant"),
    ("Stock & Crypto Traders", "Active demat & trading app users", "trending_up"),
    ("Fashion & Beauty Shoppers", "Apparel and cosmetics browsing pattern", "checkroom"),
    ("Automobile Enthusiasts", "Two-wheeler & car research traffic", "directions_car"),
    ("Real Estate Seekers", "Property listing high-intent browsers", "home_work"),
    ("Fitness Trackers", "Health app & wearable engaged users", "monitor_heart"),
    ("Job Seekers", "Active resume & job portal browsing", "work"),
    ("Mobile-First Gamers", "Casual mobile gaming sessions", "stadia_controller"),
    ("Premium OTT Subscribers", "Paid streaming subscription holders", "subscriptions"),
    ("Tier-2 City Shoppers", "Value-conscious non-metro buyers", "storefront"),
    ("Metro Commuters", "High mobile usage during commute hours", "train"),
    ("Night Owl Browsers", "Peak activity between 11 PM and 2 AM", "bedtime"),
    ("Lunch Break Browsers", "Midday browsing spike during office hours", "lunch_dining"),
    ("Festive Travel Bookers", "Holiday season flight & train bookings", "luggage"),
    ("Budget Smartphone Buyers", "Sub-15K smartphone research traffic", "smartphone"),
    ("B2B Decision Makers", "Enterprise software research behavior", "business_center"),
    ("Wedding Season Shoppers", "Jewelry, apparel & venue browsing", "favorite"),
    ("Health & Wellness Seekers", "Diet, yoga & wellness content engaged", "spa"),
    ("EdTech Learners", "Online course & exam-prep engagement", "menu_book"),
    ("Home Improvement DIYers", "Furniture & decor research traffic", "chair"),
    ("Insurance Researchers", "Policy comparison high-intent visits", "health_and_safety"),
    ("First-Time Internet Users", "New-to-internet rural audience", "wifi"),
    ("Loyal Repeat Customers", "High lifetime engagement, low churn", "loyalty"),
]


def _weighted_fraud_risk() -> str:
    return random.choices(
        [level for level, _ in FRAUD_RISK_WEIGHTS],
        weights=[w for _, w in FRAUD_RISK_WEIGHTS],
        k=1,
    )[0]


def _random_device_split() -> tuple[float, float, float]:
    """Mobile/desktop dominate; tablet stays realistically low (2-18%),
    in line with the platform's actual ~14% tablet share."""
    mobile = round(random.uniform(35.0, 70.0), 1)
    tablet = round(random.uniform(2.0, 18.0), 1)
    desktop = round(100.0 - mobile - tablet, 1)
    return mobile, desktop, tablet


def _build_generated_segments() -> list[dict]:
    """Flesh out GENERATED_SEGMENT_TEMPLATES with randomized, realistic fields."""
    segments: list[dict] = []
    for name, subtitle, icon_name in GENERATED_SEGMENT_TEMPLATES:
        mobile, desktop, tablet = _random_device_split()
        feature_choices = random.sample(FEATURE_POOL, 3)
        contributions = sorted(
            (round(random.uniform(0.08, 0.34), 2) for _ in range(3)),
            reverse=True,
        )
        segments.append(
            {
                "name": name,
                "subtitle": subtitle,
                "icon_name": icon_name,
                "reach": random.randint(60_000, 1_500_000),
                "growth_pct": round(random.uniform(-8.0, 22.0), 1),
                "device_mobile_pct": mobile,
                "device_desktop_pct": desktop,
                "device_tablet_pct": tablet,
                "fraud_risk_level": _weighted_fraud_risk(),
                "avg_ctr": round(random.uniform(0.6, 2.8), 2),
                "tags": random.sample(TAG_POOL, 3),
                "insights": list(zip(feature_choices, contributions)),
            }
        )
    return segments


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def table_is_empty(session, model) -> bool:
    result = await session.execute(select(func.count()).select_from(model))
    return result.scalar_one() == 0


def _tags_to_text(tags: list[str]) -> str:
    """Comma-separated, matching User.interests / AdCreative.keywords convention."""
    return ",".join(tags)


# ---------------------------------------------------------------------------
# Patch: backfill "Other" into users.gender
# ---------------------------------------------------------------------------

async def patch_user_genders(session) -> None:
    """
    Deterministically reassign users.gender to a 55% Male / 35% Female /
    10% Other split, based on `id % 20`. seed_dashboard_data.py's GENDERS
    list never wrote "Other", but the Audience Gender Distribution donut
    requires it. Idempotent — safe to re-run.
    """
    stmt = (
        update(User)
        .where(User.gender.is_not(None))
        .values(
            gender=case(
                (User.id % 20 < 11, "Male"),
                (User.id % 20 < 18, "Female"),
                else_="Other",
            )
        )
    )
    result = await session.execute(stmt)
    await session.commit()
    log.info(f"✅  users.gender patched — {result.rowcount} rows now Male/Female/Other (55/35/10).")


# ---------------------------------------------------------------------------
# Seed: Audience Segments
# ---------------------------------------------------------------------------

async def seed_audience_segments(session, all_segments: list[dict]) -> list[dict]:
    """Seed 34 audience segments from a pre-built list. Returns {id, name} dicts for FK use."""
    if not await table_is_empty(session, AudienceSegment):
        log.info("⏭  audience_segments — already populated, loading existing records.")
        result = await session.execute(select(AudienceSegment.id, AudienceSegment.name))
        return [{"id": r.id, "name": r.name} for r in result.all()]

    rows = [
        {
            "name": s["name"],
            "subtitle": s["subtitle"],
            "icon_name": s["icon_name"],
            "reach": s["reach"],
            "growth_pct": s["growth_pct"],
            "device_mobile_pct": s["device_mobile_pct"],
            "device_desktop_pct": s["device_desktop_pct"],
            "device_tablet_pct": s["device_tablet_pct"],
            "fraud_risk_level": s["fraud_risk_level"],
            "avg_ctr": s["avg_ctr"],
            "tags": _tags_to_text(s["tags"]),
            "is_active": True,
        }
        for s in all_segments
    ]

    await session.execute(pg_insert(AudienceSegment).values(rows).on_conflict_do_nothing())
    await session.commit()
    log.info(f"✅  audience_segments committed  ({len(rows)} rows)")

    result = await session.execute(select(AudienceSegment.id, AudienceSegment.name))
    return [{"id": r.id, "name": r.name} for r in result.all()]


# ---------------------------------------------------------------------------
# Seed: Audience Segment Insights (SHAP)
# ---------------------------------------------------------------------------

async def seed_audience_segment_insights(
    session, segments: list[dict], all_segments: list[dict]
) -> None:
    """Seed 3 SHAP-style feature contribution rows per segment, using the
    SAME all_segments list that was inserted into audience_segments — not a
    freshly regenerated one — so insight values stay consistent with the
    segment row they describe."""
    if not await table_is_empty(session, AudienceSegmentInsight):
        log.info("⏭  audience_segment_insights — already populated, skipping.")
        return

    name_to_id = {s["name"]: s["id"] for s in segments}

    rows = []
    for s in all_segments:
        segment_id = name_to_id.get(s["name"])
        if segment_id is None:
            continue
        for feature_name, contribution_value in s["insights"]:
            rows.append(
                {
                    "segment_id": segment_id,
                    "feature_name": feature_name,
                    "contribution_value": contribution_value,
                }
            )

    await session.execute(pg_insert(AudienceSegmentInsight).values(rows).on_conflict_do_nothing())
    await session.commit()
    log.info(f"✅  audience_segment_insights committed  ({len(rows)} rows)")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

async def main() -> None:
    log.info("=" * 60)
    log.info("  Ad Intelligence Platform — Audience Seed Script")
    log.info("=" * 60)

    # Built ONCE — both seed functions consume this same list so segment
    # rows and their insight rows always describe the same data.
    all_segments = CONFIRMED_SEGMENTS + _build_generated_segments()

    async with AsyncSessionLocal() as session:
        await patch_user_genders(session)
        segments = await seed_audience_segments(session, all_segments)
        await seed_audience_segment_insights(session, segments, all_segments)

    log.info("=" * 60)
    log.info("  ✅  Audience module seeded successfully.")
    log.info("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())