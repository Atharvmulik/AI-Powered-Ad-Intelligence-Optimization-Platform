"""
seed_campaigns_data.py
----------------------
AI-Powered Ad Intelligence Optimization Platform
Seeds: reports, scheduled_reports, placement_agent_logs, shap_insights
"""

import asyncio
import logging
import random
from datetime import datetime, timedelta, timezone
from typing import AsyncGenerator, List

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert

from app.db.models import (
    AdCampaign,
    PlacementAgentLog,
    Report,
    ScheduledReport,
    ShapInsight,
)
from app.db.session import AsyncSessionLocal

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
NOW: datetime = datetime.now(tz=timezone.utc)

REPORT_TYPES: List[str] = [
    "Performance Report",
    "Fraud Analysis",
    "CTR Analytics",
    "Audience Insights",
    "Campaign Summary",
]

REPORT_TITLE_PREFIXES: List[str] = [
    "Weekly",
    "Monthly",
    "Daily",
    "Executive",
    "Q1",
    "Q2",
    "Q3",
    "Q4",
    "Mid-Flight",
    "Post-Campaign",
    "Real-Time",
    "Predictive",
]

REPORT_TITLE_SUFFIXES: List[str] = [
    "Campaign Summary",
    "CTR Optimization Report",
    "Fraud Monitoring Report",
    "Executive Dashboard Export",
    "Audience Insights Digest",
    "Performance Deep Dive",
    "Budget Utilization Report",
    "Impression Pacing Report",
    "Click Attribution Report",
    "Viewability Analysis",
    "Geographic Breakdown",
    "Device Performance Report",
]

FREQUENCIES: List[str] = ["Daily", "Weekly", "Monthly"]

SCHEDULED_REPORT_NAMES: List[str] = [
    "Daily CTR Digest",
    "Weekly Fraud Summary",
    "Monthly Executive Dashboard",
    "Real-Time Pacing Alert",
    "Weekly Audience Insights",
    "Daily Budget Burn Report",
    "Monthly Campaign Summary",
    "Weekly Viewability Scorecard",
    "Daily Impression Delivery",
    "Monthly ROI Attribution",
    "Weekly Creative Performance",
    "Daily Conversion Funnel",
    "Monthly Geo Breakdown",
    "Weekly Device Mix Report",
    "Daily Bid Landscape",
    "Monthly Segment Analysis",
    "Weekly Fraud Spike Alert",
    "Daily Top Publishers Report",
    "Monthly Brand Safety Audit",
    "Weekly Click Heatmap",
    "Daily Fill Rate Report",
    "Monthly Incrementality Test",
    "Weekly Cross-Channel Overview",
    "Daily Revenue Attribution",
    "Monthly Whitelist Performance",
]

ACTIONS: List[str] = [
    "Increase Bid",
    "Decrease Bid",
    "Shift Budget",
    "Pause Placement",
    "Expand Audience",
    "Retarget Segment",
]

FEATURE_NAMES: List[str] = [
    "Age",
    "Location",
    "Device Type",
    "Interest Category",
    "Time Of Day",
    "Previous Click Rate",
    "Campaign Budget",
    "Audience Segment",
]

SHAP_FEATURES_PER_CAMPAIGN: int = 5


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------
def rand_ts(days_back: int = 30) -> datetime:
    """Return a random UTC timestamp within the last `days_back` days."""
    offset_seconds = random.randint(0, days_back * 24 * 3600)
    return NOW - timedelta(seconds=offset_seconds)


def future_ts(days_ahead_min: int = 1, days_ahead_max: int = 30) -> datetime:
    """Return a random UTC timestamp in the future."""
    offset_seconds = random.randint(
        days_ahead_min * 3600, days_ahead_max * 24 * 3600
    )
    return NOW + timedelta(seconds=offset_seconds)


def chunk(lst: list, size: int):
    """Yield successive `size`-length chunks from `lst`."""
    for i in range(0, len(lst), size):
        yield lst[i : i + size]


async def table_is_empty(session, model) -> bool:
    """Return True if the given ORM model's table has zero rows."""
    result = await session.execute(select(func.count()).select_from(model))
    return result.scalar_one() == 0


# ---------------------------------------------------------------------------
# Seed: reports
# ---------------------------------------------------------------------------
async def seed_reports(session) -> None:
    logger.info("🌱 Seeding reports...")

    if not await table_is_empty(session, Report):
        logger.info("⏭️  reports already seeded — skipping.")
        return

    rows: List[dict] = []
    for i in range(1, 101):
        prefix = random.choice(REPORT_TITLE_PREFIXES)
        suffix = random.choice(REPORT_TITLE_SUFFIXES)
        rows.append(
            {
                "title": f"{prefix} {suffix}",
                "report_type": random.choice(REPORT_TYPES),
                "pages": random.randint(5, 50),
                "size_mb": round(random.uniform(1.0, 25.0), 2),
                "file_path": f"/reports/report_{i}.pdf",
                "created_at": rand_ts(30),
            }
        )

    BATCH = 50
    for batch in chunk(rows, BATCH):
        stmt = insert(Report).values(batch).on_conflict_do_nothing()
        await session.execute(stmt)

    await session.commit()
    logger.info("✅ reports committed")


# ---------------------------------------------------------------------------
# Seed: scheduled_reports
# ---------------------------------------------------------------------------
async def seed_scheduled_reports(session) -> None:
    logger.info("🌱 Seeding scheduled_reports...")

    if not await table_is_empty(session, ScheduledReport):
        logger.info("⏭️  scheduled_reports already seeded — skipping.")
        return

    names = random.sample(SCHEDULED_REPORT_NAMES, k=25)
    rows: List[dict] = []
    for name in names:
        frequency = random.choice(FREQUENCIES)
        if frequency == "Daily":
            next_run = future_ts(days_ahead_min=1, days_ahead_max=2)
        elif frequency == "Weekly":
            next_run = future_ts(days_ahead_min=1, days_ahead_max=7)
        else:
            next_run = future_ts(days_ahead_min=1, days_ahead_max=30)

        rows.append(
            {
                "name": name,
                "frequency": frequency,
                "next_run": next_run,
                "enabled": random.random() < 0.80,
                "created_at": rand_ts(30),
            }
        )

    stmt = insert(ScheduledReport).values(rows).on_conflict_do_nothing()
    await session.execute(stmt)
    await session.commit()
    logger.info("✅ scheduled_reports committed")


# ---------------------------------------------------------------------------
# Seed: placement_agent_logs
# ---------------------------------------------------------------------------
async def seed_placement_agent_logs(session) -> None:
    logger.info("🌱 Seeding placement_agent_logs...")

    if not await table_is_empty(session, PlacementAgentLog):
        logger.info("⏭️  placement_agent_logs already seeded — skipping.")
        return

    rows: List[dict] = []
    for episode in range(1, 501):
        rows.append(
            {
                "action": random.choice(ACTIONS),
                "expected_reward": round(random.uniform(0.10, 0.99), 4),
                "episode": episode,
                "created_at": rand_ts(30),
            }
        )

    BATCH = 100
    for batch in chunk(rows, BATCH):
        stmt = insert(PlacementAgentLog).values(batch).on_conflict_do_nothing()
        await session.execute(stmt)

    await session.commit()
    logger.info("✅ placement_agent_logs committed")


# ---------------------------------------------------------------------------
# Seed: shap_insights
# ---------------------------------------------------------------------------
async def seed_shap_insights(session) -> None:
    logger.info("🌱 Seeding shap_insights...")

    if not await table_is_empty(session, ShapInsight):
        logger.info("⏭️  shap_insights already seeded — skipping.")
        return

    # Fetch existing campaign IDs
    result = await session.execute(select(AdCampaign.campaign_id))
    campaign_ids: List[int] = [row[0] for row in result.fetchall()]

    if not campaign_ids:
        logger.warning(
            "⚠️  No campaigns found in ad_campaigns — shap_insights will be empty."
        )
        return

    rows: List[dict] = []
    for campaign_id in campaign_ids:
        selected_features = random.sample(
            FEATURE_NAMES, k=SHAP_FEATURES_PER_CAMPAIGN
        )
        for feature_name in selected_features:
            rows.append(
                {
                    "campaign_id": campaign_id,
                    "feature_name": feature_name,
                    "shap_value": round(random.uniform(-1.5, 1.5), 6),
                    "predicted_ctr": round(random.uniform(0.02, 0.15), 6),
                    "auc_score": round(random.uniform(0.70, 0.98), 6),
                    "created_at": rand_ts(30),
                }
            )

    BATCH = 100
    for batch in chunk(rows, BATCH):
        stmt = insert(ShapInsight).values(batch).on_conflict_do_nothing()
        await session.execute(stmt)

    await session.commit()
    logger.info("✅ shap_insights committed")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
async def main() -> None:
    logger.info("=" * 60)
    logger.info("🚀 AI Ad Intelligence Platform — Campaign Data Seeder")
    logger.info("=" * 60)

    async with AsyncSessionLocal() as session:
        await seed_reports(session)
        await seed_scheduled_reports(session)
        await seed_placement_agent_logs(session)
        await seed_shap_insights(session)

    logger.info("=" * 60)
    logger.info("🎉 All campaign seed data committed successfully.")
    logger.info("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())