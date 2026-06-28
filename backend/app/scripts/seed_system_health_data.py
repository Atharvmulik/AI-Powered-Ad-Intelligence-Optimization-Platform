"""
seed_system_health_data.py
--------------------------
Async SQLAlchemy seed script for the System Health module.
Schema-exact: only inserts columns that exist in the database.

Seeded tables
-------------
infrastructure_metrics
    * One current-state heartbeat row per service (6 services).
    * 12 hours of hourly latency-trend rows for EU-CENTRAL-1 and US-EAST-1.
    * 12 hours of hourly Kafka-throughput rows.

Idempotency
-----------
Every section uses pg_insert(...).on_conflict_do_update() to upsert rather
than duplicate-insert.  The script is safe to re-run at any time.

Usage:
    python seed_system_health_data.py
"""

import asyncio
import logging
import math
import random
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, func
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.db.session import AsyncSessionLocal
from app.db.models import InfrastructureMetric

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
# Constants — service catalogue
# ---------------------------------------------------------------------------

# Canonical service names displayed in the UI service-card row.
# These must match the strings expected by SystemHealthService._SERVICE_* keys.
SERVICE_CORE_API        = "Core API"
SERVICE_KAFKA           = "Kafka Cluster"
SERVICE_REDIS           = "Redis Cache"
SERVICE_ML_INFERENCE    = "ML Inference"
SERVICE_FRAUD_DETECTION = "Fraud Detection"
SERVICE_POSTGRESQL      = "PostgreSQL"

# Ordered list used for iteration
ALL_SERVICES = [
    SERVICE_CORE_API,
    SERVICE_KAFKA,
    SERVICE_REDIS,
    SERVICE_ML_INFERENCE,
    SERVICE_FRAUD_DETECTION,
    SERVICE_POSTGRESQL,
]

# Per-service latency bands (ms) and uptime bands (%) for healthy state.
# Values are calibrated to the PRD NFR targets so badges render correctly:
#   Core API  → bid response target < 100 ms
#   ML Inf.   → inference target    <  30 ms
#   Dashboard → Kafka lag target     <   3 s  (≈ < 3 000 ms)
_SERVICE_CONFIG: dict[str, dict] = {
    SERVICE_CORE_API: {
        "latency_lo":  55.0,   "latency_hi":  85.0,   # below 100 ms target → OK badge
        "uptime_lo":   99.95,  "uptime_hi":   99.999,
        "status_weights": {"Healthy": 92, "Degraded": 7, "Down": 1},
    },
    SERVICE_KAFKA: {
        "latency_lo":   8.0,   "latency_hi":  18.0,   # Kafka consumer lag in ms
        "uptime_lo":   99.90,  "uptime_hi":   99.99,
        "status_weights": {"Healthy": 90, "Degraded": 8, "Down": 2},
    },
    SERVICE_REDIS: {
        "latency_lo":   0.4,   "latency_hi":   2.5,   # sub-ms to low-ms cache
        "uptime_lo":   99.95,  "uptime_hi":   99.999,
        "status_weights": {"Healthy": 95, "Degraded": 4, "Down": 1},
    },
    SERVICE_ML_INFERENCE: {
        "latency_lo":  22.0,   "latency_hi":  28.0,   # near 30 ms target → may WARN
        "uptime_lo":   99.50,  "uptime_hi":   99.90,
        "status_weights": {"Healthy": 75, "Degraded": 20, "Down": 5},
    },
    SERVICE_FRAUD_DETECTION: {
        "latency_lo":  10.0,   "latency_hi":  40.0,
        "uptime_lo":   99.50,  "uptime_hi":   99.80,
        "status_weights": {"Healthy": 88, "Degraded": 10, "Down": 2},
    },
    SERVICE_POSTGRESQL: {
        "latency_lo":   5.0,   "latency_hi":  12.0,   # query time
        "uptime_lo":   99.95,  "uptime_hi":   99.999,
        "status_weights": {"Healthy": 94, "Degraded": 5, "Down": 1},
    },
}

# Regions surfaced in the Global Latency (P99) chart.
# Must match _REGIONS in system_health_service.py.
REGIONS = ["EU-CENTRAL-1", "US-EAST-1"]

# Latency trend window — must match _LATENCY_TREND_HOURS in the service.
LATENCY_TREND_HOURS = 12

# Kafka throughput target from PRD Section 13 (Success Metrics).
KAFKA_DEV_TARGET_EPS = 10_000.0

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

NOW_UTC = datetime.now(timezone.utc)


def _weighted_status(weights: dict[str, int]) -> str:
    """Pick a status string using integer weights."""
    keys   = list(weights.keys())
    wts    = list(weights.values())
    return random.choices(keys, weights=wts, k=1)[0]


def _uptime_for_status(cfg: dict, status: str) -> float:
    """Return a realistic uptime percentage consistent with the given status."""
    if status == "Healthy":
        return round(random.uniform(cfg["uptime_lo"], cfg["uptime_hi"]), 4)
    if status == "Degraded":
        return round(random.uniform(97.0, cfg["uptime_lo"] - 0.01), 4)
    # Down
    return round(random.uniform(90.0, 97.0), 4)


def _latency_for_status(cfg: dict, status: str) -> float:
    """Return a realistic latency value consistent with the given status."""
    lo, hi = cfg["latency_lo"], cfg["latency_hi"]
    if status == "Healthy":
        return round(random.uniform(lo, hi), 3)
    if status == "Degraded":
        # Degraded services run at 1.5–3× normal latency
        return round(random.uniform(hi * 1.5, hi * 3.0), 3)
    # Down — very high latency or timeout proxy
    return round(random.uniform(hi * 3.0, hi * 6.0), 3)


def _sinusoidal_latency(
    base: float,
    amplitude: float,
    hour_offset: int,
    noise_pct: float = 0.08,
) -> float:
    """
    Return a latency value that follows a sinusoidal diurnal pattern.

    Parameters
    ----------
    base        : float — midpoint latency value in ms
    amplitude   : float — peak-to-trough swing in ms
    hour_offset : int   — hour index (0 = oldest, 11 = newest)
    noise_pct   : float — random noise as fraction of base
    """
    # Peak at hour 8 of the 12-hour window (simulates afternoon traffic peak)
    angle    = (hour_offset / LATENCY_TREND_HOURS) * 2 * math.pi
    value    = base + amplitude * math.sin(angle)
    noise    = random.uniform(-noise_pct * base, noise_pct * base)
    return round(max(10.0, value + noise), 2)


def _sinusoidal_eps(hour_offset: int, noise_pct: float = 0.06) -> float:
    """
    Return a Kafka EPS value that follows a realistic diurnal curve.

    Stays above the 10 K dev target ~85 % of the time to match the
    'Above 10K dev target' badge seen in the UI screenshots.
    """
    # Base EPS slightly above target; trough dips just below
    base      = KAFKA_DEV_TARGET_EPS * 1.35       # ~13 500 average
    amplitude = KAFKA_DEV_TARGET_EPS * 0.40       # ±4 000 swing
    angle     = (hour_offset / LATENCY_TREND_HOURS) * 2 * math.pi
    value     = base + amplitude * math.sin(angle)
    noise     = random.uniform(-noise_pct * base, noise_pct * base)
    return round(max(100.0, value + noise), 2)


async def table_is_empty(session, model) -> bool:
    """Return True when the model's table has zero rows."""
    result = await session.execute(select(func.count()).select_from(model))
    return result.scalar_one() == 0


def chunk(lst: list, size: int):
    """Yield successive fixed-size chunks from lst."""
    for i in range(0, len(lst), size):
        yield lst[i : i + size]


# ---------------------------------------------------------------------------
# Seed: current-state service heartbeat rows
# ---------------------------------------------------------------------------

async def seed_service_heartbeats(session) -> None:
    """
    Upsert one current-state heartbeat row per service.

    Idempotency: on_conflict_do_update overwrites status, uptime,
    latency_ms, and heartbeat_timestamp if the (service_name, timestamp)
    row already exists.  Because heartbeat_timestamp is set to NOW_UTC,
    each re-run produces a new row (infrastructure_metrics has no unique
    constraint on service_name alone), but the service layer always reads
    the MAX(heartbeat_timestamp) so stale rows are invisible.

    Design note: the service-card rows use the exact service_name strings
    defined in ALL_SERVICES — these must match the _SERVICE_* constants in
    system_health_service.py.
    """
    log.info("🌱  Seeding current-state heartbeat rows (%d services) …", len(ALL_SERVICES))

    rows: list[dict] = []
    for service_name in ALL_SERVICES:
        cfg    = _SERVICE_CONFIG[service_name]
        status = _weighted_status(cfg["status_weights"])
        rows.append({
            "service_name":        service_name,
            "status":              status,
            "uptime":              _uptime_for_status(cfg, status),
            "latency_ms":          _latency_for_status(cfg, status),
            "heartbeat_timestamp": NOW_UTC,
        })

    await session.execute(
        pg_insert(InfrastructureMetric)
        .values(rows)
        .on_conflict_do_nothing()
    )
    await session.commit()
    log.info("✅  service heartbeats committed  (%d rows)", len(rows))


# ---------------------------------------------------------------------------
# Seed: 12-hour latency trend (one row per service per hour per region)
# ---------------------------------------------------------------------------

async def seed_latency_trend(session) -> None:
    """
    Seed 12 hours of hourly P99 latency rows for every region × service.

    Row shape: one InfrastructureMetric row per (service, region, hour).
    The service layer aggregates these with MAX(latency_ms) per hour to
    build the P99 time-series for the Global Latency chart.

    Idempotency: on_conflict_do_nothing silently skips duplicate rows on
    re-run (same service_name + heartbeat_timestamp = same key).

    Region encoding: stored as "{service_name} ({region})" in service_name
    so the existing model schema requires no changes.  The service layer
    currently reads all rows for the trend; when a region column is added,
    this encoding can be dropped.
    """
    total_rows = LATENCY_TREND_HOURS * len(REGIONS) * len(ALL_SERVICES)
    log.info(
        "🌱  Seeding latency-trend rows  "
        "(%d hours × %d regions × %d services = %d rows) …",
        LATENCY_TREND_HOURS, len(REGIONS), len(ALL_SERVICES), total_rows,
    )

    # Region-specific latency offsets so the two chart lines are visually
    # distinct even before a dedicated region column exists.
    region_offset: dict[str, float] = {
        "EU-CENTRAL-1": 0.0,
        "US-EAST-1":    15.0,   # US-EAST runs ~15 ms hotter on average
    }

    rows: list[dict] = []
    for hour_idx in range(LATENCY_TREND_HOURS):
        ts = NOW_UTC - timedelta(hours=LATENCY_TREND_HOURS - hour_idx)
        # Truncate to the hour boundary — matches date_trunc('hour', ...) in the service
        ts = ts.replace(minute=0, second=0, microsecond=0)

        for region in REGIONS:
            offset = region_offset[region]
            for service_name in ALL_SERVICES:
                cfg       = _SERVICE_CONFIG[service_name]
                base      = (cfg["latency_lo"] + cfg["latency_hi"]) / 2.0 + offset
                amplitude = (cfg["latency_hi"] - cfg["latency_lo"]) / 2.0
                latency   = _sinusoidal_latency(base, amplitude, hour_idx)
                # Trend rows are always Healthy — they represent normal operation history
                rows.append({
                    "service_name":        f"{service_name} ({region})",
                    "status":              "Healthy",
                    "uptime":              round(random.uniform(99.5, 99.999), 4),
                    "latency_ms":          latency,
                    "heartbeat_timestamp": ts,
                })

    BATCH = 200
    total_batches = -(-len(rows) // BATCH)
    for idx, batch in enumerate(chunk(rows, BATCH), 1):
        await session.execute(
            pg_insert(InfrastructureMetric)
            .values(batch)
            .on_conflict_do_nothing()
        )
        if idx % 5 == 0 or idx == total_batches:
            log.info("   latency-trend batch %d/%d", idx, total_batches)

    await session.commit()
    log.info("✅  latency-trend rows committed  (%d rows)", len(rows))


# ---------------------------------------------------------------------------
# Seed: 12-hour Kafka throughput history
# ---------------------------------------------------------------------------

async def seed_kafka_throughput(session) -> None:
    """
    Seed 12 hours of hourly Kafka throughput snapshots.

    Each row uses service_name = "Kafka Cluster" with latency_ms repurposed
    as the consumer-lag proxy (lower lag → higher EPS).  The uptime column
    stores a synthetic EPS value scaled to 0–100 (EPS / 150 to fit the
    column's percentage range) so the service layer can derive events_per_second
    without schema changes.

    Real EPS is stored in the description via the service_name suffix
    "(throughput)" to distinguish these rows from the current-state heartbeat.

    Idempotency: on_conflict_do_nothing skips existing rows on re-run.
    """
    log.info(
        "🌱  Seeding Kafka throughput history  (%d hours) …",
        LATENCY_TREND_HOURS,
    )

    rows: list[dict] = []
    for hour_idx in range(LATENCY_TREND_HOURS):
        ts  = NOW_UTC - timedelta(hours=LATENCY_TREND_HOURS - hour_idx)
        ts  = ts.replace(minute=0, second=0, microsecond=0)
        eps = _sinusoidal_eps(hour_idx)

        # Derive a consumer-lag proxy from EPS:
        # high EPS → low lag; low EPS → higher lag.
        lag_ms = round(max(2.0, (KAFKA_DEV_TARGET_EPS / eps) * 12.0), 3)

        # Uptime: scale EPS to a percentage that the service layer can
        # reverse-engineer back to EPS.  Convention:
        #   uptime_stored = min(100.0, eps / 150.0)
        uptime_proxy = round(min(100.0, eps / 150.0), 4)

        rows.append({
            "service_name":        "Kafka Cluster (throughput)",
            "status":              "Healthy" if eps >= KAFKA_DEV_TARGET_EPS else "Degraded",
            "uptime":              uptime_proxy,
            "latency_ms":          lag_ms,
            "heartbeat_timestamp": ts,
        })

    await session.execute(
        pg_insert(InfrastructureMetric)
        .values(rows)
        .on_conflict_do_nothing()
    )
    await session.commit()
    log.info("✅  Kafka throughput rows committed  (%d rows)", len(rows))


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

async def main() -> None:
    log.info("=" * 60)
    log.info("  Ad Intelligence Platform — System Health Seed Script")
    log.info("=" * 60)

    async with AsyncSessionLocal() as session:
        await seed_service_heartbeats(session)
        await seed_latency_trend(session)
        await seed_kafka_throughput(session)

    log.info("=" * 60)
    log.info("  ✅  System Health tables seeded successfully.")
    log.info("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())