"""CLI entry point for additive synthetic traffic generation."""

from __future__ import annotations

import argparse
import asyncio
import logging
import time
from collections import Counter

from sqlalchemy import text

from app.db.session import AsyncSessionLocal
from app.synthetic.config import SimulationConfig
from app.synthetic.db_writer import SyntheticEventWriter
from app.synthetic.event_generator import EventGenerator, choose_users, load_reference_data

log = logging.getLogger(__name__)


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Generate additive synthetic ad traffic")
    parser.add_argument("--duration", type=int, default=60, help="simulation duration in seconds")
    parser.add_argument("--users", type=int, default=100, help="maximum existing users to simulate")
    parser.add_argument("--events-per-second", type=float, default=20.0)
    parser.add_argument("--batch-size", type=int, default=100)
    parser.add_argument("--fraud-rate", type=float, default=0.05)
    parser.add_argument("--seed", type=int, default=42)
    return parser


async def run(config: SimulationConfig) -> Counter[str]:
    async with AsyncSessionLocal() as session:
        try:
            await session.execute(text("SELECT 1"))
        except Exception as exc:
            log.error("Unable to connect to PostgreSQL/Neon database: %s", exc)
            return Counter()

        references = await load_reference_data(session)
        if not references.users:
            raise RuntimeError("No users found in database. Run the existing seed scripts first.")
        if not references.campaigns:
            raise RuntimeError("No campaigns found in database. Run the existing seed scripts first.")
        if not references.creatives:
            raise RuntimeError("No ad creatives found in database. Run the existing seed scripts first.")

        generator = EventGenerator(references, config.random_seed)
        users = choose_users(references, config.sessions, generator.random)
        writer = SyntheticEventWriter(session, config.batch_size)
        totals: Counter[str] = Counter()
        started = time.monotonic()
        pending = []
        generated_events = 0
        session_count = 0
        log.info("Synthetic traffic started: users=%d duration=%ds target=%.1f events/s", len(users), config.duration_seconds, config.events_per_second)
        try:
            while time.monotonic() - started < config.duration_seconds:
                user = users[session_count % len(users)]
                profile = generator.choose_profile(
                    config.normal_percentage,
                    config.high_intent_percentage,
                    config.fraud_percentage,
                )
                generated = generator.generate_session(user, profile)
                generated_events += len(generated)
                pending.extend(generated)
                session_count += 1
                if len(pending) >= config.batch_size or len(pending) >= config.max_events_in_memory:
                    totals.update(await writer.write(pending))
                    pending.clear()
                elapsed = time.monotonic() - started
                target_elapsed = generated_events / config.events_per_second
                await asyncio.sleep(max(0.0, target_elapsed - elapsed))
        except KeyboardInterrupt:
            log.info("Simulation interrupted")
        finally:
            if pending:
                totals.update(await writer.write(pending))
        log.info("Synthetic traffic finished: sessions=%d inserted=%s", session_count, dict(totals))
        return totals


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    args = _parser().parse_args()
    fraud_rate = max(0.0, min(1.0, args.fraud_rate))
    non_fraud = 1.0 - fraud_rate
    config = SimulationConfig(
        sessions=max(1, args.users),
        duration_seconds=max(1, args.duration),
        events_per_second=args.events_per_second,
        batch_size=max(1, args.batch_size),
        random_seed=args.seed,
        normal_percentage=non_fraud * (0.80 / 0.95),
        high_intent_percentage=non_fraud * (0.15 / 0.95),
        fraud_percentage=fraud_rate,
    )
    try:
        asyncio.run(run(config))
    except (RuntimeError, ValueError) as exc:
        log.error("Synthetic traffic stopped: %s", exc)


if __name__ == "__main__":
    main()
