"""CLI entry point for additive synthetic traffic generation."""

from __future__ import annotations

import argparse
import asyncio
import logging
import time
from collections import Counter, defaultdict

from sqlalchemy import text

from app.db.session import AsyncSessionLocal
from app.synthetic.config import SimulationConfig
from app.synthetic.db_writer import SyntheticEventWriter
from app.synthetic.event_generator import EventGenerator, choose_users, load_reference_data
from app.synthetic.ml_inference import FraudPredictor, RecommendationEngine, CTRInferenceAdapter

log = logging.getLogger(__name__)


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Generate additive synthetic ad traffic")
    parser.add_argument("--duration", type=int, default=60, help="simulation duration in seconds")
    parser.add_argument("--users", type=int, default=100, help="maximum existing users to simulate")
    parser.add_argument("--events-per-second", type=float, default=20.0)
    parser.add_argument("--batch-size", type=int, default=100)
    parser.add_argument("--fraud-rate", type=float, default=0.05)
    parser.add_argument("--fraud-threshold", type=float, default=0.50)
    parser.add_argument("--seed", type=int, default=42)
    return parser


def _user_ctr_history(user_id: str, ad_id: str, user_ad_clicks: dict[str, dict[str, int]], user_ad_impressions: dict[str, dict[str, int]]) -> tuple[float, float]:
    click_total = user_ad_clicks.get(user_id, {}).get(ad_id, 0)
    impression_total = user_ad_impressions.get(user_id, {}).get(ad_id, 0)
    return (click_total / max(1, impression_total), click_total)


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
        writer = SyntheticEventWriter(session, config.batch_size, config.fraud_event_threshold)
        ctr_adapter = CTRInferenceAdapter()
        fraud_predictor = FraudPredictor()
        recommendation_engine = RecommendationEngine()
        totals: Counter[str] = Counter()
        started = time.monotonic()
        pending = []
        generated_events = 0
        session_count = 0
        fraud_history = {
            "ip_click_count": defaultdict(int),
            "ip_app_count": defaultdict(int),
            "ip_os_count": defaultdict(int),
            "ip_device_count": defaultdict(int),
            "ip_hour_count": defaultdict(int),
            "channel_count": defaultdict(int),
            "app_count": defaultdict(int),
        }
        user_seen_ads = defaultdict(set)
        user_stats = defaultdict(lambda: {"impressions": 0, "clicks": 0, "conversions": 0, "interactions": 0})
        user_ad_clicks: dict[str, dict[str, int]] = defaultdict(dict)
        user_ad_impressions: dict[str, dict[str, int]] = defaultdict(dict)

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
                for event in generated:
                    previous_history = {key: dict(counter) for key, counter in fraud_history.items()}
                    previous_seen = set(user_seen_ads.get(event.user_id, set()))
                    user_behavior = user_stats.get(event.user_id, {"impressions": 0, "clicks": 0, "conversions": 0, "interactions": 0})
                    historical_ctr, _ = _user_ctr_history(event.user_id, event.ad_id, user_ad_clicks, user_ad_impressions)
                    engagement_score = min(1.0, (user_behavior["clicks"] + 1.5 * user_behavior["conversions"] + 0.5 * user_behavior["interactions"]) / max(1, user_behavior["interactions"] + 1))
                    event_dict = event.as_dict()
                    event_dict.update(
                        {
                            "interest_match_flag": bool(event.additional_context.get("interest_match_flag")),
                            "bid_amount": event.additional_context.get("bid_amount"),
                            "category": event.additional_context.get("category"),
                            "brand": event.additional_context.get("brand"),
                            "primary_interest": event.additional_context.get("primary_interest"),
                            "secondary_interest": event.additional_context.get("secondary_interest"),
                            "device_affinity": event.additional_context.get("device_affinity"),
                            "user_ip_prefix": event.additional_context.get("user_ip_prefix"),
                            "ad_keyword_hash": event.additional_context.get("ad_keyword_hash"),
                            "historical_session_bucket": event.additional_context.get("historical_session_bucket"),
                            "ad_status": event.additional_context.get("ad_status"),
                            "page_category": event.additional_context.get("page_category"),
                            "campaign_name": event.additional_context.get("campaign_name"),
                            "interaction_count": user_behavior["interactions"],
                            "engagement_score": engagement_score,
                            "historical_ctr": historical_ctr,
                            "os": event.os,
                            "device": event.device,
                            "app": event.app,
                            "channel": event.channel,
                            "ip": event.ip,
                            "profile_name": event.profile_name,
                            "location": event.location,
                            "age": event.age,
                            "interests": event.interests,
                            "campaign_id": event.campaign_id,
                            "event_type": event.event_type,
                            "user_id": event.user_id,
                            "ad_id": event.ad_id,
                        }
                    )

                    event.ctr_result = ctr_adapter.predict(event_dict)
                    if event.ctr_result is None:
                        log.warning("Dropping synthetic event for user=%s ad=%s because real CTR output is unavailable.", event.user_id, event.ad_id)
                        continue
                    event.click_probability = event.ctr_result.get("click_probability")
                    event.fraud_result = fraud_predictor.predict(event_dict, previous_history)
                    if event.fraud_result is None:
                        log.warning("Dropping synthetic event for user=%s ad=%s because real fraud output is unavailable.", event.user_id, event.ad_id)
                        continue
                    event.fraud_probability = event.fraud_result.get("fraud_score")
                    event.recommendation_result = recommendation_engine.recommend(
                        user_id=str(event.user_id),
                        age=event.age,
                        interests=event.interests,
                        seen_ad_ids=list(previous_seen),
                    )
                    if event.recommendation_result is None:
                        log.warning("Dropping synthetic event for user=%s ad=%s because real recommendation output is unavailable.", event.user_id, event.ad_id)
                        continue
                    event.recommendation_explanation = event.recommendation_result.get("explanation") if event.recommendation_result else None
                    event.recommendation_score = event.recommendation_result.get("recommendation_score") if event.recommendation_result else None
                    event.inference_latency_ms = float((event.ctr_result or {}).get("inference_latency_ms", 0.0) + (event.fraud_result or {}).get("inference_latency_ms", 0.0) + (event.recommendation_result or {}).get("inference_latency_ms", 0.0))

                    if event.event_type in {"impression", "view", "click", "conversion"}:
                        user_seen_ads[event.user_id].add(event.ad_id)
                        user_ad_impressions[event.user_id][event.ad_id] = user_ad_impressions[event.user_id].get(event.ad_id, 0) + 1
                        user_behavior["impressions"] += 1
                        user_behavior["interactions"] += 1
                    if event.event_type in {"click", "conversion"}:
                        user_behavior["clicks"] += 1
                        user_behavior["interactions"] += 1
                        user_ad_clicks[event.user_id][event.ad_id] = user_ad_clicks[event.user_id].get(event.ad_id, 0) + 1
                    if event.event_type == "conversion":
                        user_behavior["conversions"] += 1
                    user_stats[event.user_id] = user_behavior

                    for key, counter in fraud_history.items():
                        if key == "ip_click_count":
                            counter[event.ip] += 1 if event.event_type in {"click", "conversion"} else 0
                        elif key == "ip_app_count":
                            counter[f"{event.ip}:{event.app}"] += 1
                        elif key == "ip_os_count":
                            counter[f"{event.ip}:{event.os}"] += 1
                        elif key == "ip_device_count":
                            counter[f"{event.ip}:{event.device}"] += 1
                        elif key == "ip_hour_count":
                            counter[f"{event.ip}:{event.timestamp.hour}"] += 1
                        elif key == "channel_count":
                            counter[event.channel] += 1
                        elif key == "app_count":
                            counter[event.app] += 1

                    log.info(
                        "[SYNTHETIC] user=%s profile=%s event=%s ad=%s previous_ip_click_count=%s ip_click_count_after=%s",
                        event.user_id,
                        event.profile_name,
                        event.event_type,
                        event.ad_id,
                        previous_history.get("ip_click_count", {}).get(event.ip, 0),
                        fraud_history["ip_click_count"].get(event.ip, 0),
                    )
                    log.info("[CTR] probability=%s label=%s decision=%s latency=%.2fms", event.click_probability, event.ctr_result.get("click_label"), event.ctr_result.get("ad_decision"), event.ctr_result.get("inference_latency_ms", 0.0))
                    log.info("[FRAUD] score=%.4f label=%s latency=%.2fms", event.fraud_probability, event.fraud_result.get("fraud_label"), event.fraud_result.get("inference_latency_ms", 0.0))
                    log.info("[RECOMMENDER] top_ad=%s score=%.4f", event.recommendation_result.get("ad_id"), event.recommendation_result.get("recommendation_score"))
                    pending.append(event)
                    generated_events += 1
                session_count += 1
                if len(pending) >= config.batch_size or len(pending) >= config.max_events_in_memory:
                    totals.update(await writer.write(pending))
                    pending.clear()
                elapsed = time.monotonic() - started
                target_elapsed = generated_events / max(config.events_per_second, 1e-9)
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
    config = SimulationConfig(
        sessions=max(1, args.users),
        duration_seconds=max(1, args.duration),
        events_per_second=args.events_per_second,
        batch_size=max(1, args.batch_size),
        random_seed=args.seed,
        normal_percentage=0.80,
        high_intent_percentage=0.15,
        fraud_percentage=fraud_rate,
        fraud_event_threshold=max(0.0, min(1.0, args.fraud_threshold)),
    )
    if config.normal_percentage + config.high_intent_percentage + config.fraud_percentage > 1.0:
        raise ValueError("Fraud rate plus the default profile mix exceeds 1.0; reduce --fraud-rate")
    try:
        asyncio.run(run(config))
    except (RuntimeError, ValueError) as exc:
        log.error("Synthetic traffic stopped: %s", exc)


if __name__ == "__main__":
    main()
