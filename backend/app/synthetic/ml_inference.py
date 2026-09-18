"""Concrete runtime inference adapters for the real CTR, fraud, and recommender models."""

from __future__ import annotations

import logging
import time
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

from app.synthetic.feature_builder import build_ctr_feature_dict, build_fraud_feature_dict

log = logging.getLogger(__name__)


class SyntheticInferenceError(RuntimeError):
    """Raised when a model cannot be loaded or called."""


def _backend_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _ml_root() -> Path:
    return _backend_root() / "ml"


def _candidate_model_dirs() -> list[Path]:
    root = _ml_root()
    return [root / "save_model", root / "save_models", root / "saved_models"]


class CTRInferenceAdapter:
    def __init__(self) -> None:
        self.predictor = None
        self._load()

    def _load(self) -> None:
        try:
            import ml.inference_pipeline as inference_pipeline

            artifacts_dir = next((p for p in _candidate_model_dirs() if p.exists()), None)
            if artifacts_dir is None:
                raise FileNotFoundError(f"CTR artifacts directory not found in {_candidate_model_dirs()}")
            inference_pipeline.ARTIFACTS_DIR = str(artifacts_dir)
            self.predictor = inference_pipeline.CTRPredictor(model_type="xgboost")
            log.info("CTR model loaded from %s", artifacts_dir)
        except Exception as exc:  # pragma: no cover - model may be missing in local run
            log.error("[CTR ERROR] Failed to load real CTR predictor: %s", exc)
            self.predictor = None

    def predict(self, event: dict[str, Any]) -> dict[str, Any] | None:
        if self.predictor is None:
            log.error("[CTR ERROR] Real CTR predictor unavailable for event %s", event.get('user_id'))
            return None
        try:
            start = time.perf_counter()
            ctr_input = build_ctr_feature_dict(event)
            ctr_fields = {key: ctr_input.get(key) for key in [f"I{i}" for i in range(1, 14)] + [f"C{i}" for i in range(1, 27)]}
            log.info("[CTR RAW] user=%s ad=%s field_values=%s", event.get('user_id'), event.get('ad_id'), ctr_fields)
            result = self.predictor.predict(ctr_input, include_shap=False)
            latency_ms = (time.perf_counter() - start) * 1000
            result["inference_latency_ms"] = round(latency_ms, 2)
            result["prd_latency_ok"] = latency_ms < 30.0
            log.info(
                "[CTR] probability=%s label=%s decision=%s latency=%.2fms",
                result.get("click_probability"),
                result.get("click_label"),
                result.get("ad_decision"),
                result.get("inference_latency_ms"),
            )
            return result
        except Exception as exc:
            log.error("[CTR ERROR] Real CTR inference failed for user=%s ad=%s: %s", event.get('user_id'), event.get('ad_id'), exc)
            return None


class FraudPredictor:
    def __init__(self) -> None:
        self.model = None
        self.isolation_forest = None
        self.scaler = None
        self.feature_columns = None
        self._load()

    def _load(self) -> None:
        try:
            saved_dir = next((p for p in _candidate_model_dirs() if p.exists() and (p / "fraud_xgboost.pkl").exists()), None)
            if saved_dir is None:
                saved_dir = next((p for p in _candidate_model_dirs() if p.exists()), None)
            if saved_dir is None:
                raise FileNotFoundError(f"Fraud artifacts directory not found in {_candidate_model_dirs()}")
            self.model = joblib.load(saved_dir / "fraud_xgboost.pkl")
            self.isolation_forest = joblib.load(saved_dir / "isolation_forest.pkl")
            self.scaler = joblib.load(saved_dir / "fraud_scaler.pkl")
            self.feature_columns = joblib.load(saved_dir / "fraud_feature_columns.pkl")
            log.info("Fraud model artifacts loaded from %s", saved_dir)
        except Exception as exc:
            log.error("[FRAUD ERROR] Failed to load real fraud pipeline: %s", exc)
            self.model = None
            self.isolation_forest = None
            self.scaler = None
            self.feature_columns = None

    def predict(self, event: dict[str, Any], history: dict[str, Any]) -> dict[str, Any] | None:
        if self.model is None or self.scaler is None or self.feature_columns is None:
            log.error("[FRAUD ERROR] Real fraud model unavailable for user=%s", event.get('user_id'))
            return None
        try:
            start = time.perf_counter()
            features = build_fraud_feature_dict(event, history)
            frame = pd.DataFrame([features], columns=self.feature_columns)
            scaled = self.scaler.transform(frame)
            xgb_prob = float(self.model.predict_proba(scaled)[0][1])
            if_scores = self.isolation_forest.decision_function(scaled)[0]
            if_score_values = self.isolation_forest.decision_function(scaled)
            if_min = float(np.min(if_score_values))
            if_max = float(np.max(if_score_values))
            if_span = max(if_max - if_min, 1e-9)
            isolation_prob = 1.0 - ((if_scores - if_min) / if_span)
            fraud_score = float(max(0.0, min(1.0, 0.3 * isolation_prob + 0.7 * xgb_prob)))
            label = "FRAUD" if fraud_score >= 0.50 else "CLEAN"
            latency_ms = (time.perf_counter() - start) * 1000
            result = {
                "fraud_score": round(fraud_score, 4),
                "fraud_label": label,
                "model": "xgboost+isolation_forest",
                "inference_latency_ms": round(latency_ms, 2),
                "raw_features": features,
            }
            log.info("[FRAUD RAW] user=%s ip=%s features=%s", event.get('user_id'), event.get('ip'), features)
            log.info("[FRAUD] score=%.4f label=%s latency=%.2fms", fraud_score, label, latency_ms)
            return result
        except Exception as exc:
            log.error("[FRAUD ERROR] Real fraud inference failed for user=%s ip=%s: %s", event.get('user_id'), event.get('ip'), exc)
            return None


class RecommendationEngine:
    def __init__(self) -> None:
        self.tf_idf = None
        self.ad_matrix = None
        self.svd_model = None
        self.user_encoder = None
        self.ad_encoder = None
        self.predicted_matrix = None
        self.interest_keywords = None
        self.weights = None
        self.ads = None
        self.users = None
        self._load()

    def _load(self) -> None:
        try:
            saved_dir = next((p for p in _candidate_model_dirs() if p.exists() and (p / "tfidf_vectorizer.pkl").exists()), None)
            if saved_dir is None:
                saved_dir = next((p for p in _candidate_model_dirs() if p.exists()), None)
            if saved_dir is None:
                raise FileNotFoundError(f"Recommendation artifacts directory not found in {_candidate_model_dirs()}")
            data_dir = _ml_root() / "data" / "synthetic"
            self.tf_idf = joblib.load(saved_dir / "tfidf_vectorizer.pkl")
            self.ad_matrix = joblib.load(saved_dir / "ad_tfidf_matrix.pkl")
            self.svd_model = joblib.load(saved_dir / "svd_model.pkl")
            self.user_encoder = joblib.load(saved_dir / "user_encoder.pkl")
            self.ad_encoder = joblib.load(saved_dir / "ad_encoder.pkl")
            self.predicted_matrix = joblib.load(saved_dir / "predicted_score_matrix.pkl")
            self.interest_keywords = joblib.load(saved_dir / "interest_keywords_map.pkl")
            self.weights = joblib.load(saved_dir / "hybrid_weights.pkl")
            self.ads = pd.read_csv(data_dir / "ad_catalogue.csv")
            self.users = pd.read_csv(data_dir / "user_profiles.csv")
            log.info("Recommendation artifacts loaded from %s", saved_dir)
        except Exception as exc:
            log.error("[RECOMMENDATION ERROR] Failed to load real recommendation engine: %s", exc)
            self.tf_idf = None
            self.ad_matrix = None
            self.svd_model = None
            self.user_encoder = None
            self.ad_encoder = None
            self.predicted_matrix = None
            self.interest_keywords = None
            self.weights = None
            self.ads = None
            self.users = None

    def _get_content_scores(self, user_row: pd.Series) -> np.ndarray:
        primary = str(user_row.get("primary_interest", "tech"))
        secondary = str(user_row.get("secondary_interest", "lifestyle"))
        primary_text = self.interest_keywords.get(primary, primary)
        secondary_text = self.interest_keywords.get(secondary, secondary)
        user_text = f"{primary_text} {primary_text} {secondary_text}"
        user_vector = self.tf_idf.transform([user_text])
        return (user_vector @ self.ad_matrix.T).toarray().flatten()

    def _get_collab_scores(self, user_id: str) -> np.ndarray:
        scores = np.zeros(len(self.ads), dtype=float)
        if self.user_encoder is None or self.ad_encoder is None:
            return scores
        if user_id not in self.user_encoder.classes_:
            return scores
        user_idx = int(self.user_encoder.transform([user_id])[0])
        for i, ad_id in enumerate(self.ads["ad_id"].tolist()):
            if str(ad_id) in self.ad_encoder.classes_:
                ad_idx = int(self.ad_encoder.transform([str(ad_id)])[0])
                scores[i] = float(self.predicted_matrix[user_idx, ad_idx])
        max_score = float(np.max(scores)) if scores.size else 0.0
        min_score = float(np.min(scores)) if scores.size else 0.0
        if max_score > 0.0:
            score_span = max_score - min_score
            if score_span > 0.0:
                scores = (scores - min_score) / score_span
        return scores

    def recommend(self, user_id: str, age: int, interests: str, seen_ad_ids: list[str] | None = None) -> dict[str, Any] | None:
        if self.tf_idf is None or self.ad_matrix is None or self.users is None or self.ads is None:
            log.error("[RECOMMENDATION ERROR] Real recommendation engine unavailable for user=%s", user_id)
            return None
        try:
            seen = {str(ad_id) for ad_id in (seen_ad_ids or [])}
            active_ads = self.ads[self.ads["is_active"] == 1].copy().reset_index(drop=True)
            user_row = self.users[self.users["user_id"] == user_id]
            if user_row.empty:
                user_row = pd.Series({"user_id": user_id, "age": age, "primary_interest": interests or "tech", "secondary_interest": "lifestyle"})
            else:
                user_row = user_row.iloc[0]
            content_scores = self._get_content_scores(user_row)
            collab_scores = self._get_collab_scores(user_id)
            bid_values = active_ads["bid_amount"].astype(float).to_numpy(dtype=float)
            bid_min = float(np.min(bid_values)) if bid_values.size else 0.0
            bid_max = float(np.max(bid_values)) if bid_values.size else 0.0
            bid_norm = (bid_values - bid_min) / (bid_max - bid_min) if bid_values.size and bid_max > bid_min else np.zeros_like(bid_values, dtype=float)
            final_scores = np.zeros(len(active_ads), dtype=float)
            for index, row in active_ads.iterrows():
                ad_id = str(row["ad_id"])
                if ad_id in seen:
                    continue
                age_min = int(row["target_age_min"])
                age_max = int(row["target_age_max"])
                if age < age_min or age > age_max:
                    continue
                ad_position = int(self.ads.index[self.ads["ad_id"].astype(str) == ad_id][0]) if ad_id in self.ads["ad_id"].astype(str).tolist() else index
                content_score = float(content_scores[ad_position]) if ad_position < len(content_scores) else 0.0
                collab_score = float(collab_scores[ad_position]) if ad_position < len(collab_scores) else 0.0
                final_score = float(self.weights["content"] * content_score + self.weights["collab"] * collab_score + self.weights["bid"] * float(bid_norm[index]))
                final_scores[index] = final_score

            candidates = []
            for index, row in active_ads.iterrows():
                ad_id = str(row["ad_id"])
                if ad_id in seen:
                    continue
                age_min = int(row["target_age_min"])
                age_max = int(row["target_age_max"])
                if age < age_min or age > age_max:
                    continue
                ad_position = int(self.ads.index[self.ads["ad_id"].astype(str) == ad_id][0]) if ad_id in self.ads["ad_id"].astype(str).tolist() else index
                final_score = float(final_scores[index])
                if final_score <= 0.0:
                    continue
                candidates.append({
                    "ad_id": ad_id,
                    "ad_name": str(row["ad_name"]),
                    "category": str(row["category"]),
                    "brand": str(row["brand_name"]),
                    "final_score": round(final_score, 4),
                    "content_score": round(float(content_scores[ad_position]) if ad_position < len(content_scores) else 0.0, 4),
                    "collab_score": round(float(collab_scores[ad_position]) if ad_position < len(collab_scores) else 0.0, 4),
                    "bid_score": round(float(bid_norm[index]), 4),
                    "explanation": f"Recommended because it matches your interest in {user_row.get('primary_interest', interests)}",
                })
            candidates.sort(key=lambda item: item["final_score"], reverse=True)
            top = candidates[:5]
            selected = top[0] if top else None
            if not selected:
                return None
            log.info("[RECOMMENDER] user=%s top_ad=%s score=%.4f", user_id, selected["ad_id"], selected["final_score"])
            return {
                "user_id": user_id,
                "recommendation_score": float(selected["final_score"]),
                "ad_id": selected["ad_id"],
                "ad_name": selected["ad_name"],
                "category": selected["category"],
                "brand": selected["brand"],
                "explanation": selected["explanation"],
                "candidates": top,
                "inference_latency_ms": 0.0,
            }
        except Exception as exc:
            log.error("[RECOMMENDATION ERROR] Real recommender failed for user=%s: %s", user_id, exc)
            return None


def build_enriched_event(event: dict[str, Any], history: dict[str, Any], run_ctr: bool = True, run_fraud: bool = True, run_recommendation: bool = True) -> dict[str, Any]:
    """Run the actual ML pipelines for the synthetic event and return their outputs."""
    result = dict(event)
    ctr_adapter = CTRInferenceAdapter() if run_ctr else None
    fraud_predictor = FraudPredictor() if run_fraud else None
    recommendation_engine = RecommendationEngine() if run_recommendation else None

    if ctr_adapter is not None:
        result["ctr_result"] = ctr_adapter.predict(result)
    if fraud_predictor is not None:
        result["fraud_result"] = fraud_predictor.predict(result, history)
    if recommendation_engine is not None:
        seen_ads = history.get("seen_ad_ids", [])
        result["recommendation_result"] = recommendation_engine.recommend(
            user_id=str(result.get("user_id") or "unknown"),
            age=int(result.get("age") or 25),
            interests=str(result.get("interests") or "tech"),
            seen_ad_ids=list(seen_ads),
        )
    return result
