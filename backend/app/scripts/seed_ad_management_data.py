"""
seed_ad_management_data.py
---------------------------
Async SQLAlchemy seed script for the Ad Management module.
Schema-exact: only inserts columns that exist in the database.

Seeds:
    10 AdCampaign rows  (status: ACTIVE / PAUSED / HALTED,
                          fraud_risk: Low / Medium / Critical)
    15 AdCreative rows  (distributed across the 10 campaigns,
                          format: Banner / Video / Native)

This script is additive and independent of seed_dashboard_data.py — it
does not re-seed AdCampaign rows created by that script and will not
duplicate data on repeated runs (idempotent via table_is_empty guard +
ON CONFLICT DO NOTHING, identical to the existing seed script's pattern).

Usage:
    python -m app.scripts.seed_ad_management_data
"""

import asyncio
import logging
import random
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.db.session import AsyncSessionLocal
from app.db.models import AdCampaign, AdCreative

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
NOW_UTC = datetime.now(timezone.utc)

CAMPAIGN_TEMPLATES = [
    ("Nike Air Max Pro",        "adv_001", "Sports & Fitness"),
    ("Boat Airdopes X",         "adv_005", "Technology"),
    ("Titan Smart v2",          "adv_009", "Technology"),
    ("Apple iPad Promo",        "adv_004", "Technology"),
    ("Starbucks Rewards",       "adv_011", "Food & Beverage"),
    ("Adidas Ultraboost Drop",  "adv_002", "Sports & Fitness"),
    ("Samsung Galaxy Launch",   "adv_003", "Technology"),
    ("Zomato Gold Renewal",     "adv_007", "Food & Beverage"),
    ("OnePlus Buds Campaign",   "adv_006", "Technology"),
    ("Swiggy Festive Push",     "adv_008", "Food & Beverage"),
]

# Per-PRD: status drives the Active Ad Portfolio table; fraud_risk drives
# the Fraud Risk column.  Distribution is weighted to feel realistic —
# most campaigns healthy, a minority paused/halted/risky.
STATUSES = ["ACTIVE", "PAUSED", "HALTED"]
STATUS_WEIGHTS = [0.60, 0.25, 0.15]

FRAUD_RISKS = ["Low", "Medium", "Critical"]
FRAUD_RISK_WEIGHTS = [0.65, 0.25, 0.10]

BID_STRATEGIES = ["CPC", "CPM", "CPA"]

TARGET_DEMOGRAPHIC_POOLS = [
    ["Gen-Z", "Urban Commuters"],
    ["Tech Early Adopters", "Mobile Users"],
    ["Sports Enthusiasts", "Gen-Z"],
    ["Parents", "Budget-Conscious"],
    ["Professionals", "Desktop Users"],
    ["Students", "Night Owls"],
    ["Gamers", "Tech Early Adopters"],
    ["Weekend Shoppers", "High-Income"],
]

AD_FORMATS = ["Banner", "Video", "Native"]
AD_FORMAT_WEIGHTS = [0.50, 0.30, 0.20]

CREATIVE_CATEGORIES = [
    "Technology", "Sports & Fitness", "Fashion & Lifestyle",
    "Food & Beverage", "Finance", "Gaming", "Travel",
    "Health & Wellness", "Automotive", "Education",
]

KEYWORD_POOLS = [
    ["performance", "running", "lifestyle"],
    ["wireless", "audio", "premium"],
    ["smartwatch", "fitness-tracking", "new-arrival"],
    ["tablet", "back-to-school", "productivity"],
    ["rewards", "loyalty", "limited-time"],
    ["sneakers", "trending", "sale"],
    ["smartphone", "flagship", "5g"],
    ["delivery", "subscription", "renewal"],
    ["earbuds", "noise-cancelling", "launch"],
    ["festive", "discount", "app-exclusive"],
]

CREATIVE_STATUSES = ["DRAFT", "DEPLOYED"]
CREATIVE_STATUS_WEIGHTS = [0.20, 0.80]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def rand_ts(days_back: int) -> datetime:
    return NOW_UTC - timedelta(seconds=random.randint(0, days_back * 86_400))


def realistic_ctr_pct() -> float:
    """
    Generate a realistic CTR percentage.

    Most ad-tech CTRs cluster between 0.5% and 4.5% (PRD benchmark is
    2.0%), with a long thin tail up to ~6% for high-performing campaigns
    and a thin tail down to ~0.1% for poorly targeted ones. A normal
    distribution centered near the benchmark, clamped to a sane range,
    approximates this without needing real click/impression counts.
    """
    ctr = random.gauss(mu=2.2, sigma=1.3)
    return round(max(0.05, min(ctr, 6.5)), 2)


async def table_is_empty(session, model) -> bool:
    result = await session.execute(select(func.count()).select_from(model))
    return result.scalar_one() == 0


# ---------------------------------------------------------------------------
# Seed: AdCampaign  (10 rows)
# ---------------------------------------------------------------------------

async def seed_ad_management_campaigns(session) -> list[dict]:
    """
    Seed 10 AdCampaign rows with the Ad Management-specific columns
    (bid_strategy, target_demographics, fraud_risk) populated.

    Returns list of {"campaign_id": int, "campaign_name": str} for use
    by seed_ad_creatives().
    """
    existing_count_result = await session.execute(
        select(func.count()).select_from(AdCampaign)
    )
    existing_count = existing_count_result.scalar_one()

    if existing_count >= 10:
        log.info(
            "⏭  ad_campaigns already has %d rows — skipping Ad Management "
            "campaign seed to avoid duplicates.",
            existing_count,
        )
        result = await session.execute(
            select(AdCampaign.campaign_id, AdCampaign.campaign_name).limit(10)
        )
        return [{"campaign_id": r.campaign_id, "campaign_name": r.campaign_name} for r in result.all()]

    log.info("🌱  Seeding 10 Ad Management campaigns …")

    rows: list[dict] = []
    for i, (name, adv_id, _category) in enumerate(CAMPAIGN_TEMPLATES):
        budget = round(random.uniform(10_000, 200_000), 2)
        spend = round(budget * random.uniform(0.35, 0.95), 2)
        revenue = round(spend * random.uniform(0.9, 3.2), 2)

        start = rand_ts(45).date()
        # A couple of campaigns deliberately end in the past so the
        # Global Status "Expired" bucket has real data to show.
        if i % 5 == 0:
            end = start + timedelta(days=random.randint(5, 20))
            if end > date.today():
                end = date.today() - timedelta(days=random.randint(1, 10))
        else:
            end = start + timedelta(days=random.randint(14, 60))

        status = random.choices(STATUSES, weights=STATUS_WEIGHTS, k=1)[0]
        fraud_risk = random.choices(FRAUD_RISKS, weights=FRAUD_RISK_WEIGHTS, k=1)[0]
        bid_strategy = random.choice(BID_STRATEGIES)
        target_demographics = ",".join(random.choice(TARGET_DEMOGRAPHIC_POOLS))

        rows.append({
            "advertiser_id": adv_id,
            "campaign_name": name,
            "budget": budget,
            "spend": spend,
            "revenue": revenue,
            "start_date": start,
            "end_date": end,
            "status": status,
            "bid_strategy": bid_strategy,
            "target_demographics": target_demographics,
            "fraud_risk": fraud_risk,
        })

    await session.execute(pg_insert(AdCampaign).values(rows).on_conflict_do_nothing())
    await session.commit()
    log.info("✅  ad_campaigns committed  (10 rows, Ad Management fields populated)")

    result = await session.execute(
        select(AdCampaign.campaign_id, AdCampaign.campaign_name)
        .where(AdCampaign.campaign_name.in_([r["campaign_name"] for r in rows]))
    )
    return [{"campaign_id": r.campaign_id, "campaign_name": r.campaign_name} for r in result.all()]


# ---------------------------------------------------------------------------
# Seed: AdCreative  (15 rows)
# ---------------------------------------------------------------------------

async def seed_ad_creatives(session, campaigns: list[dict]) -> None:
    """
    Seed 15 AdCreative rows distributed across the 10 seeded campaigns.

    Every campaign gets at least one creative; 5 campaigns get a second
    creative (15 total = 10 + 5), mirroring how a real advertiser tests
    A/B creative variants on their better-performing campaigns.
    """
    if not await table_is_empty(session, AdCreative):
        log.info("⏭  ad_creatives — already populated, skipping seed.")
        return

    if not campaigns:
        log.warning("⚠️  No campaigns available — skipping ad_creatives seed.")
        return

    log.info("🌱  Seeding 15 Ad Creatives …")

    rows: list[dict] = []
    creatives_per_campaign = {c["campaign_id"]: 1 for c in campaigns}

    # Give 5 campaigns a second creative (A/B variant) to reach 15 total.
    extra_campaigns = random.sample(campaigns, k=min(5, len(campaigns)))
    for c in extra_campaigns:
        creatives_per_campaign[c["campaign_id"]] += 1

    creative_index = 0
    for campaign in campaigns:
        count = creatives_per_campaign[campaign["campaign_id"]]
        for variant in range(count):
            pool_idx = creative_index % len(CREATIVE_CATEGORIES)
            ad_format = random.choices(AD_FORMATS, weights=AD_FORMAT_WEIGHTS, k=1)[0]
            keywords = ",".join(random.choice(KEYWORD_POOLS))
            status = random.choices(
                CREATIVE_STATUSES, weights=CREATIVE_STATUS_WEIGHTS, k=1
            )[0]

            rows.append({
                "campaign_id": campaign["campaign_id"],
                "format": ad_format,
                "category": CREATIVE_CATEGORIES[pool_idx],
                "keywords": keywords,
                "image_url": (
                    f"https://cdn.adai.app/creatives/"
                    f"{campaign['campaign_name'].lower().replace(' ', '-')}"
                    f"-v{variant + 1}.png"
                ),
                "status": status,
            })
            creative_index += 1

    await session.execute(pg_insert(AdCreative).values(rows).on_conflict_do_nothing())
    await session.commit()
    log.info("✅  ad_creatives committed  (%d rows)", len(rows))


# ---------------------------------------------------------------------------
# Seed: realistic CTR backfill note
# ---------------------------------------------------------------------------
#
# CTR is NOT a stored column on AdCampaign — it is computed live by
# AdManagementService._compute_ctr() from ClickEvent rows. This script
# does not (and should not) write a ctr column. realistic_ctr_pct() is
# provided above for any future seed step that needs to generate matching
# ClickEvent rows (e.g. a combined campaign+click seed); it is exposed
# here so seed_click_events()-style scripts can import and reuse it
# instead of duplicating the distribution logic.


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

async def main() -> None:
    log.info("=" * 60)
    log.info("  Ad Intelligence Platform — Ad Management Seed Script")
    log.info("=" * 60)

    async with AsyncSessionLocal() as session:
        campaigns = await seed_ad_management_campaigns(session)
        await seed_ad_creatives(session, campaigns)

    log.info("=" * 60)
    log.info("  ✅  Ad Management tables seeded successfully.")
    log.info("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())