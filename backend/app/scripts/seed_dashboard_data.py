"""
seed_dashboard_data.py
----------------------
Async SQLAlchemy seed script for the Ad Intelligence Platform.
Schema-exact: only inserts columns that exist in the database.

Usage:
    python seed_dashboard_data.py
"""

import asyncio
import logging
import random
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.db.session import AsyncSessionLocal
from app.db.models import (
    User,
    AdCampaign,
    ClickEvent,
    FraudEvent,
    RecommendationLog,
    InfrastructureMetric,
    MLPredictionLog,
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

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
LOCATIONS     = ["Mumbai", "Pune", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata"]
DEVICE_TYPES  = ["Mobile", "Desktop", "Tablet"]
INTERESTS     = ["Sports", "Gaming", "Fashion", "Technology", "Travel", "Finance", "Fitness"]
GENDERS       = ["Male", "Female"]

CAMPAIGN_TEMPLATES = [
    ("Nike Air Max Campaign",     "adv_001"),
    ("Adidas Sports Campaign",    "adv_002"),
    ("Samsung Galaxy Campaign",   "adv_003"),
    ("Apple iPhone Campaign",     "adv_004"),
    ("Boat Audio Campaign",       "adv_005"),
    ("OnePlus Launch Campaign",   "adv_006"),
    ("Zomato Gold Campaign",      "adv_007"),
    ("Swiggy Delivery Campaign",  "adv_008"),
    ("Asus Gaming Campaign",      "adv_009"),
    ("HP Laptop Campaign",        "adv_010"),
]

FRAUD_CATEGORIES  = ["Bot Farm", "Click Spam", "VPN Abuse", "Device Spoofing", "Fake Traffic"]
FRAUD_SEVERITIES  = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
SEVERITY_WEIGHTS  = [0.30, 0.35, 0.25, 0.10]
FRAUD_STATUSES    = ["Pending", "Blocked", "Investigating"]

RECOMMENDATION_EXPLANATIONS = [
    "User interested in Sports",
    "User interested in Technology",
    "User interested in Fashion",
    "User interested in Gaming",
    "User interested in Finance",
    "Location targeting match",
    "High engagement prediction",
    "Lookalike audience match",
    "Collaborative filtering recommendation",
    "Retargeting signal detected",
    "Sequential ad exposure in nurture funnel",
    "Device affinity match for campaign",
    "Seasonality uplift — festive period",
    "Cross-sell signal from purchase history",
    "Time-of-day model — peak activity window",
]

INFRA_SERVICES = [
    "Kafka", "Redis", "PostgreSQL",
    "FastAPI", "CTR Engine", "Fraud Engine", "Recommendation Engine",
]
MODEL_VERSIONS = [
    "ctr-v1.0",
    "ctr-v1.1",
    "fraud-v2.0",
    "fraud-v2.1",
    "hybrid-rec-v1.0",
]
NOW_UTC = datetime.now(timezone.utc)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def rand_ts(days_back: int) -> datetime:
    return NOW_UTC - timedelta(seconds=random.randint(0, days_back * 86_400))


def chunk(lst: list, size: int):
    for i in range(0, len(lst), size):
        yield lst[i : i + size]


async def table_is_empty(session, model) -> bool:
    result = await session.execute(select(func.count()).select_from(model))
    return result.scalar_one() == 0


# ---------------------------------------------------------------------------
# Seed: Users
# ---------------------------------------------------------------------------

async def seed_users(session) -> list[dict]:
    """Seed 1 000 users. Returns list of user_id + location dicts for FK use."""
    if not await table_is_empty(session, User):
        log.info("⏭  users — already populated, loading existing records.")
        result = await session.execute(select(User.user_id, User.location))
        return [{"user_id": r.user_id, "location": r.location} for r in result.all()]

    log.info("🌱  Seeding 1 000 users …")
    rows: list[dict] = []
    for i in range(1, 1_001):
        rows.append({
            "user_id":     f"user_{i:04d}",
            "age":         random.randint(18, 60),
            "gender":      random.choice(GENDERS),
            "location":    random.choice(LOCATIONS),
            "device_type": random.choice(DEVICE_TYPES),
            "interests":   random.choice(INTERESTS),
            "last_active": rand_ts(15),
        })

    BATCH = 200
    total = -(-len(rows) // BATCH)
    for idx, batch in enumerate(chunk(rows, BATCH), 1):
        await session.execute(pg_insert(User).values(batch).on_conflict_do_nothing())
        log.info(f"   users batch {idx}/{total}")

    await session.commit()
    log.info("✅  users committed  (1 000 rows)")
    return [{"user_id": r["user_id"], "location": r["location"]} for r in rows]


# ---------------------------------------------------------------------------
# Seed: Campaigns
# ---------------------------------------------------------------------------

async def seed_campaigns(session) -> list[dict]:
    """Seed 100 campaigns. Returns list of campaign_id dicts for FK use."""
    if not await table_is_empty(session, AdCampaign):
        log.info("⏭  ad_campaigns — already populated, loading existing records.")
        result = await session.execute(select(AdCampaign.campaign_id))
        return [{"campaign_id": r.campaign_id} for r in result.all()]

    log.info("🌱  Seeding 100 campaigns …")
    rows: list[dict] = []
    for i in range(100):
        template_name, adv_id = CAMPAIGN_TEMPLATES[i % len(CAMPAIGN_TEMPLATES)]
        suffix = f" #{i // len(CAMPAIGN_TEMPLATES) + 1}" if i >= len(CAMPAIGN_TEMPLATES) else ""
        budget = round(random.uniform(5_000, 500_000), 2)
        spend  = round(budget * random.uniform(0.30, 0.95), 2)
        revenue = round(spend * random.uniform(0.8, 2.5), 2)
        start = rand_ts(60).date()
        end   = start + timedelta(days=random.randint(7, 90))
        rows.append({
            "advertiser_id": adv_id,
            "campaign_name": template_name + suffix,
            "budget":        budget,
            "spend":         spend,
            "revenue":       revenue,
            "start_date":    start,
            "end_date":      end,
            "status":        "ACTIVE",
        })

    await session.execute(pg_insert(AdCampaign).values(rows).on_conflict_do_nothing())
    await session.commit()
    log.info("✅  ad_campaigns committed  (100 rows)")

    result = await session.execute(select(AdCampaign.campaign_id))
    return [{"campaign_id": r.campaign_id} for r in result.all()]


# ---------------------------------------------------------------------------
# Seed: Click Events
# ---------------------------------------------------------------------------

async def seed_click_events(
    session,
    users: list[dict],
    campaigns: list[dict],
) -> None:
    if not await table_is_empty(session, ClickEvent):
        log.info("⏭  click_events — already populated, skipping.")
        return

    log.info("🌱  Seeding 10 000 click events …")
    ad_ids = [f"ad_{i:03d}" for i in range(1, 51)]
    rows: list[dict] = []

    for _ in range(10_000):
        user     = random.choice(users)
        campaign = random.choice(campaigns)
        pred_ctr = round(
            random.uniform(0.02, 0.15),
            4
        )
        clicked  = random.random() < pred_ctr
        rows.append({
            "timestamp":      rand_ts(30),
            "user_id":        user["user_id"],
            "ad_id":          random.choice(ad_ids),
            "campaign_id":    campaign["campaign_id"],
            "clicked":        clicked,
            "predicted_ctr":  pred_ctr,
            "actual_outcome": 1 if clicked else 0,
            "location":       user["location"],
        })

    BATCH = 500
    total = -(-len(rows) // BATCH)
    for idx, batch in enumerate(chunk(rows, BATCH), 1):
        await session.execute(pg_insert(ClickEvent).values(batch).on_conflict_do_nothing())
        if idx % 5 == 0 or idx == total:
            log.info(f"   click_events batch {idx}/{total}")

    await session.commit()
    log.info("✅  click_events committed  (10 000 rows)")


# ---------------------------------------------------------------------------
# Seed: Fraud Events
# ---------------------------------------------------------------------------

async def seed_fraud_events(session, users: list[dict]) -> None:
    if not await table_is_empty(session, FraudEvent):
        log.info("⏭  fraud_events — already populated, skipping.")
        return

    log.info("🌱  Seeding 1 000 fraud events …")
    rows: list[dict] = []

    for _ in range(1_000):
        user     = random.choice(users)
        severity = random.choices(FRAUD_SEVERITIES, weights=SEVERITY_WEIGHTS, k=1)[0]
        floor    = {"LOW": 0.40, "MEDIUM": 0.55, "HIGH": 0.70, "CRITICAL": 0.85}[severity]
        rows.append({
            "timestamp":      rand_ts(30),
            "user_id":        user["user_id"],
            "ip_address":     (
                f"{random.randint(1,254)}.{random.randint(0,254)}"
                f".{random.randint(0,254)}.{random.randint(1,254)}"
            ),
            "fraud_score":    round(random.uniform(floor, 0.99), 4),
            "fraud_category": random.choice(FRAUD_CATEGORIES),
            "status":         random.choice(FRAUD_STATUSES),
            "severity":       severity,
        })

    BATCH = 200
    total = -(-len(rows) // BATCH)
    for idx, batch in enumerate(chunk(rows, BATCH), 1):
        await session.execute(pg_insert(FraudEvent).values(batch).on_conflict_do_nothing())
        log.info(f"   fraud_events batch {idx}/{total}")

    await session.commit()
    log.info("✅  fraud_events committed  (1 000 rows)")


# ---------------------------------------------------------------------------
# Seed: Recommendation Logs
# ---------------------------------------------------------------------------

async def seed_recommendation_logs(session, users: list[dict]) -> None:
    if not await table_is_empty(session, RecommendationLog):
        log.info("⏭  recommendation_logs — already populated, skipping.")
        return

    log.info("🌱  Seeding 5 000 recommendation logs …")
    ad_ids = [f"ad_{i:03d}" for i in range(1, 51)]
    rows: list[dict] = []

    for _ in range(5_000):
        user = random.choice(users)
        rows.append({
            "timestamp":            rand_ts(30),
            "user_id":              user["user_id"],
            "ad_id":                random.choice(ad_ids),
            "recommendation_score": round(random.uniform(0.50, 0.99), 4),
            "explanation":          random.choice(RECOMMENDATION_EXPLANATIONS),
        })

    BATCH = 500
    total = -(-len(rows) // BATCH)
    for idx, batch in enumerate(chunk(rows, BATCH), 1):
        await session.execute(pg_insert(RecommendationLog).values(batch).on_conflict_do_nothing())
        if idx % 2 == 0 or idx == total:
            log.info(f"   recommendation_logs batch {idx}/{total}")

    await session.commit()
    log.info("✅  recommendation_logs committed  (5 000 rows)")


# ---------------------------------------------------------------------------
# Seed: Infrastructure Metrics
# ---------------------------------------------------------------------------

async def seed_infrastructure_metrics(session) -> None:
    if not await table_is_empty(session, InfrastructureMetric):
        log.info("⏭  infrastructure_metrics — already populated, skipping.")
        return

    log.info("🌱  Seeding 7 infrastructure metrics …")

    latency_bands: dict[str, tuple[float, float]] = {
        "Kafka":                 (2.0,   15.0),
        "Redis":                 (0.5,    3.0),
        "PostgreSQL":            (5.0,   40.0),
        "FastAPI":               (30.0, 120.0),
        "CTR Engine":            (15.0,  60.0),
        "Fraud Engine":          (18.0,  75.0),
        "Recommendation Engine": (25.0, 100.0),
    }

    rows: list[dict] = []
    for service in INFRA_SERVICES:
        lo, hi = latency_bands[service]
        status = random.choices(["Healthy", "Degraded"], weights=[90, 10], k=1)[0]
        rows.append({
            "service_name":        service,
            "status":              status,
            "uptime":              round(
                random.uniform(99.0, 99.99) if status == "Healthy"
                else random.uniform(97.0, 99.0), 4
            ),
            "latency_ms":          round(random.uniform(lo, hi), 3),
            "heartbeat_timestamp": NOW_UTC,
        })

    await session.execute(pg_insert(InfrastructureMetric).values(rows).on_conflict_do_nothing())
    await session.commit()
    log.info("✅  infrastructure_metrics committed  (7 rows)")


# ---------------------------------------------------------------------------
# Seed: ML Prediction Logs
# ---------------------------------------------------------------------------

async def seed_ml_prediction_logs(
    session,
    users: list[dict],
    campaigns: list[dict],
) -> None:

    if not await table_is_empty(session, MLPredictionLog):
        log.info("⏭  ml_prediction_logs — already populated, skipping.")
        return

    log.info("🌱  Seeding 10 000 ml_prediction_logs …")

    ad_ids = [f"ad_{i:03d}" for i in range(1, 51)]

    rows = []

    for _ in range(10000):

        user = random.choice(users)
        campaign = random.choice(campaigns)

        rows.append({
            "timestamp": rand_ts(30),

            "user_id": user["user_id"],

            "ad_id": random.choice(ad_ids),

            "campaign_id": campaign["campaign_id"],

            "click_probability": round(
                random.uniform(0.02, 0.15),
                4
            ),

            "fraud_probability": round(
                random.uniform(0.01, 0.99),
                4
            ),

            "recommendation_score": round(
                random.uniform(0.50, 0.99),
                4
            ),

            "model_version": random.choice(
                MODEL_VERSIONS
            ),

            "inference_latency_ms": round(
                random.uniform(5, 150),
                2
            ),
        })

    BATCH = 500

    total_batches = -(-len(rows) // BATCH)

    for idx, batch in enumerate(chunk(rows, BATCH), 1):

        await session.execute(
            pg_insert(MLPredictionLog)
            .values(batch)
            .on_conflict_do_nothing()
        )

        if idx % 5 == 0 or idx == total_batches:
            log.info(
                f"   ml_prediction_logs batch {idx}/{total_batches}"
            )

    await session.commit()

    log.info(
        "✅  ml_prediction_logs committed (10 000 rows)"
    )

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

async def main() -> None:
    log.info("=" * 60)
    log.info("  Ad Intelligence Platform — Dashboard Seed Script")
    log.info("=" * 60)

    async with AsyncSessionLocal() as session:
        users     = await seed_users(session)
        campaigns = await seed_campaigns(session)
        await seed_click_events(session, users, campaigns)
        await seed_fraud_events(session, users)
        await seed_recommendation_logs(session, users)
        await seed_infrastructure_metrics(session)
        await seed_ml_prediction_logs(
            session,
            users,
            campaigns
        )
    log.info("=" * 60)
    log.info("  ✅  All tables seeded successfully.")
    log.info("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())