"""
inference_pipeline.py
=====================
PURPOSE : Production-ready inference pipeline for the CTR Click Prediction Engine.
          Takes a raw ad event dict → returns click probability + SHAP explanation.

THIS FILE IS IMPORTED BY:
  - FastAPI service  (ml_router.py)
  - Kafka consumer   (ctr_consumer.py)
  - React dashboard  (via FastAPI /predict endpoint)

GUARANTEES:
  - Applies identical preprocessing as training (same medians, freq maps)
  - Returns probability in [0.0, 1.0]
  - Returns top-3 SHAP feature explanations in plain English
  - Logs inference latency in milliseconds
  - PRD target: inference < 30ms  (Section 6 — Non-Functional Requirements)

USAGE:
  from ml.inference_pipeline import CTRPredictor
  predictor = CTRPredictor()                  # load once at startup
  result    = predictor.predict(event_dict)   # call per event
"""

import numpy as np
import joblib
import time
import os
import json
import warnings
warnings.filterwarnings("ignore")

import lightgbm as lgb
import xgboost as xgb
import shap

# ── CONFIG ────────────────────────────────────────────────────────────────────
ARTIFACTS_DIR = "ml/save_model"

NUM_COLS = [f"I{i}" for i in range(1, 14)]
CAT_COLS = [f"C{i}" for i in range(1, 27)]
# ─────────────────────────────────────────────────────────────────────────────


class CTRPredictor:
    """
    Production CTR inference class.
    Instantiate ONCE at application startup (expensive — loads models + SHAP).
    Call predict() per event (cheap — just numpy ops + model inference).
    """

    def __init__(self, model_type: str = "xgboost"):
        """
        Args:
            model_type: "xgboost" | "lightgbm" | "ensemble"
                        Default: "xgboost" (best single model at AUC 0.786)
        """
        print("=" * 60)
        print("  CTRPredictor — Loading artifacts...")
        print("=" * 60)

        self.model_type  = model_type
        self.feature_cols = None
        self.medians      = None
        self.freq_maps    = None
        self.xgb_model    = None
        self.lgb_model    = None
        self.xgb_explainer = None
        self.lgb_explainer = None
        self.base_value   = None

        self._load_artifacts()
        print(f"\n  ✅  CTRPredictor ready  (model={model_type})")
        print(f"  Features : {len(self.feature_cols)}")
        print("=" * 60)

    def _load_artifacts(self):
        """Load all preprocessing artifacts and models."""

        # ── Preprocessing artifacts ───────────────────────────────────────────
        self.feature_cols = joblib.load(f"{ARTIFACTS_DIR}/feature_cols.pkl")
        self.medians      = joblib.load(f"{ARTIFACTS_DIR}/num_medians.pkl")
        self.freq_maps    = joblib.load(f"{ARTIFACTS_DIR}/freq_maps.pkl")
        print("  ✅  Preprocessing artifacts loaded")

        # ── Models ────────────────────────────────────────────────────────────
        if self.model_type in ("xgboost", "ensemble"):
            self.xgb_model = joblib.load(f"{ARTIFACTS_DIR}/xgb_model.pkl")
            print("  ✅  XGBoost model loaded  (AUC=0.786)")

        if self.model_type in ("lightgbm", "ensemble"):
            self.lgb_model = lgb.Booster(
                model_file=f"{ARTIFACTS_DIR}/lgb_model.txt")
            print("  ✅  LightGBM model loaded  (AUC=0.785)")

        # ── SHAP explainers ───────────────────────────────────────────────────
        # TreeExplainer is fast for tree-based models (~1-2ms per prediction)
        if self.xgb_model is not None:
            self.xgb_explainer = shap.TreeExplainer(self.xgb_model)
            print("  ✅  XGBoost SHAP explainer ready")

        if self.lgb_model is not None:
            self.lgb_explainer = shap.TreeExplainer(self.lgb_model)
            bv = self.lgb_explainer.expected_value
            if hasattr(bv, '__len__'):
                self.base_value = float(bv[0])   # LGB native API returns size-1 array
            else:
                self.base_value = float(bv)
            print("  ✅  LightGBM SHAP explainer ready")

        # Load ensemble weights if available
        ens_path = f"{ARTIFACTS_DIR}/ensemble_weights.pkl"
        if os.path.exists(ens_path):
            self.ensemble_weights = joblib.load(ens_path)
        else:
            self.ensemble_weights = {"xgb_weight": 0.5, "lgb_weight": 0.5}

    # ── PREPROCESSING (mirrors Prepare_CTR_data.py exactly) ──────────────────
    def _preprocess(self, event: dict) -> np.ndarray:
        """
        Convert a raw ad event dict to a model-ready feature vector.
        Applies the EXACT same transformations as training:
          1. Extract I1-I13 and C1-C26
          2. Fill missing values (medians / 'MISSING')
          3. Log-transform numerical features
          4. Frequency-encode categorical features
          5. Engineer 8 interaction features
          6. Return ordered numpy array matching feature_cols
        """
        # ── Step 1: Extract raw values ────────────────────────────────────────
        num_values = {}
        for col in NUM_COLS:
            val = event.get(col, None)
            try:
                num_values[col] = float(val) if val is not None else np.nan
            except (ValueError, TypeError):
                num_values[col] = np.nan

        cat_values = {}
        for col in CAT_COLS:
            val = event.get(col, None)
            cat_values[col] = str(val) if val is not None else "MISSING"

        # ── Step 2: Fill missing values ───────────────────────────────────────
        for col in NUM_COLS:
            if np.isnan(num_values[col]):
                num_values[col] = self.medians.get(col, 0.0)

        for col in CAT_COLS:
            if cat_values[col] in ("None", "nan", ""):
                cat_values[col] = "MISSING"

        # ── Step 3: Log-transform numerical features ──────────────────────────
        for col in NUM_COLS:
            v = max(0.0, num_values[col])   # clip negative to 0
            num_values[col] = float(np.log1p(v))

        # ── Step 4: Frequency-encode categorical features ─────────────────────
        freq_encoded = {}
        for col in CAT_COLS:
            freq_map = self.freq_maps.get(col, {})
            freq_encoded[col] = float(freq_map.get(cat_values[col], 0))

        # ── Step 5: Feature engineering (same 8 features as training) ─────────
        num_arr = np.array([num_values[c] for c in NUM_COLS], dtype=np.float32)

        engineered = {
            "num_sum"    : float(num_arr.sum()),
            "num_mean"   : float(num_arr.mean()),
            "num_nonzero": float((num_arr > 0).sum()),
            "num_std"    : float(num_arr.std()),
            "num_max"    : float(num_arr.max()),
            "cat_sum"    : float(sum(freq_encoded.values())),
            "I1_x_I2"   : float(num_values["I1"] * num_values["I2"]),
            "I3_x_I4"   : float(num_values["I3"] * num_values["I4"]),
        }

        # ── Step 6: Assemble feature vector in training order ─────────────────
        all_values = {**num_values, **freq_encoded, **engineered}
        feature_vector = np.array(
            [all_values[col] for col in self.feature_cols],
            dtype=np.float32
        ).reshape(1, -1)

        return feature_vector

    # ── SHAP EXPLANATION ──────────────────────────────────────────────────────
    def _explain(self, feature_vector: np.ndarray,
                 click_prob: float) -> list[dict]:
        """
        Compute top-3 SHAP feature contributions for one prediction.
        Returns plain-English explanation list for the dashboard.

        PRD Section 6: 'Every ad recommendation must include a
        SHAP-based explanation. SHAP explanation latency < 50ms.'
        """
        try:
            # Use XGBoost explainer if available (slightly faster)
            if self.xgb_explainer is not None:
                shap_vals = self.xgb_explainer.shap_values(
                feature_vector,
                check_additivity=False
                )[0]
            else:
                sv = self.lgb_explainer.shap_values(feature_vector)
                shap_vals = sv[0] if not isinstance(sv, list) else sv[1][0]

            # Rank features by absolute SHAP value
            feature_impacts = [
                {
                    "feature"   : self.feature_cols[i],
                    "shap_value": float(shap_vals[i]),
                    "impact"    : abs(float(shap_vals[i])),
                    "direction" : "increases" if shap_vals[i] > 0 else "decreases",
                    "plain_english": (
                        f"'{self.feature_cols[i]}' "
                        f"{'increases' if shap_vals[i] > 0 else 'decreases'} "
                        f"click probability by "
                        f"{abs(float(shap_vals[i])):.3f}"
                    )
                }
                for i in range(len(self.feature_cols))
            ]

            # Return top 3 by absolute impact
            top3 = sorted(feature_impacts,
                          key=lambda x: x["impact"],
                          reverse=True)[:3]
            return top3

        except Exception as e:
            # SHAP failure should never crash inference — degrade gracefully
            return [{"feature": "unavailable", "shap_value": 0.0,
                     "impact": 0.0, "direction": "unknown",
                     "plain_english": f"SHAP unavailable: {str(e)}"}]

    # ── MAIN PREDICT METHOD ───────────────────────────────────────────────────
    def predict(self, event: dict,
                include_shap: bool = True) -> dict:
        """
        Main inference method. Call this per ad event.

        Args:
            event        : dict with keys I1-I13, C1-C26
                           Missing keys are filled with training medians.
            include_shap : if False, skips SHAP (faster, no explanation)

        Returns:
            {
              "click_probability" : float,   # 0.0 to 1.0
              "click_label"       : str,     # "HIGH" / "MEDIUM" / "LOW"
              "model"             : str,
              "inference_latency_ms": float,
              "shap_explanation"  : list,    # top 3 features
              "ad_decision"       : str,     # serve / review / skip
            }
        """
        t_start = time.perf_counter()

        # Preprocess
        feature_vector = self._preprocess(event)

        # ── Predict probability ───────────────────────────────────────────────
        if self.model_type == "xgboost":
            click_prob = float(
                self.xgb_model.predict_proba(feature_vector)[0][1])

        elif self.model_type == "lightgbm":
            click_prob = float(self.lgb_model.predict(feature_vector)[0])

        elif self.model_type == "ensemble":
            xgb_prob   = float(
                self.xgb_model.predict_proba(feature_vector)[0][1])
            lgb_prob   = float(self.lgb_model.predict(feature_vector)[0])
            w          = self.ensemble_weights
            click_prob = (xgb_prob * w["xgb_weight"] +
                          lgb_prob * w["lgb_weight"])
        else:
            raise ValueError(f"Unknown model_type: {self.model_type}")

        # ── SHAP explanation ──────────────────────────────────────────────────
        shap_explanation = []
        if include_shap:
            shap_explanation = self._explain(feature_vector, click_prob)

        # ── Decision logic ────────────────────────────────────────────────────
        # Business rule: thresholds tuned for 25% CTR dataset
        if click_prob >= 0.60:
            click_label = "HIGH"
            ad_decision = "SERVE"       # show this ad immediately
        elif click_prob >= 0.35:
            click_label = "MEDIUM"
            ad_decision = "SERVE"       # serve but track carefully
        elif click_prob >= 0.20:
            click_label = "LOW"
            ad_decision = "REVIEW"      # maybe serve, flag for review
        else:
            click_label = "VERY_LOW"
            ad_decision = "SKIP"        # don't serve — poor ROI

        t_end        = time.perf_counter()
        latency_ms   = (t_end - t_start) * 1000

        return {
            "click_probability"   : round(click_prob, 4),
            "click_label"         : click_label,
            "ad_decision"         : ad_decision,
            "model"               : self.model_type,
            "inference_latency_ms": round(latency_ms, 2),
            "shap_explanation"    : shap_explanation,
            "prd_latency_ok"      : latency_ms < 30.0,
        }

    def predict_batch(self, events: list[dict],
                      include_shap: bool = False) -> list[dict]:
        """
        Batch prediction for multiple events (Kafka batch consumer).
        SHAP disabled by default in batch mode for speed.
        """
        return [self.predict(e, include_shap=include_shap) for e in events]


# ── STANDALONE TEST ───────────────────────────────────────────────────────────
def run_tests():
    """
    Run when executed directly: python ml/inference_pipeline.py
    Verifies the full pipeline end-to-end before FastAPI integration.
    """

    predictor = CTRPredictor(model_type="xgboost")

    print("\n" + "=" * 60)
    print("  TEST 1 — High intent user (should predict HIGH click)")
    print("=" * 60)
    high_intent_event = {
        "I1": 5, "I2": 3, "I3": 12, "I4": 7, "I5": 100,
        "I6": 8, "I7": 4, "I8": 2,  "I9": 3, "I10": 5,
        "I11": 9, "I12": 1, "I13": 6,
        "C1": "a73ee510", "C2": "b3c1b41a", "C3": "b3c1b41a",
        "C4": "be589b51", "C5": "25c83c98", "C6": "7e0ccccf",
        "C7": "c9d4222a", "C8": "27c07bd6", "C9": "0b153874",
        "C10": "a73ee510", "C11": "b3c1b41a", "C12": "be589b51",
        "C13": "25c83c98", "C14": "7e0ccccf", "C15": "c9d4222a",
        "C16": "27c07bd6", "C17": "0b153874", "C18": "a73ee510",
        "C19": "b3c1b41a", "C20": "be589b51", "C21": "25c83c98",
        "C22": "7e0ccccf", "C23": "c9d4222a", "C24": "27c07bd6",
        "C25": "0b153874", "C26": "a73ee510",
    }

    result = predictor.predict(high_intent_event, include_shap=True)
    _print_result(result)

    print("\n" + "=" * 60)
    print("  TEST 2 — Cold user with all missing values")
    print("=" * 60)
    cold_user_event = {}   # All missing — filled with training medians
    result2 = predictor.predict(cold_user_event, include_shap=True)
    _print_result(result2)

    print("\n" + "=" * 60)
    print("  TEST 3 — Latency benchmark (100 predictions, no SHAP)")
    print("=" * 60)
    times = []
    for _ in range(100):
        t = time.perf_counter()
        predictor.predict(high_intent_event, include_shap=False)
        times.append((time.perf_counter() - t) * 1000)

    avg_ms = np.mean(times)
    p95_ms = np.percentile(times, 95)
    p99_ms = np.percentile(times, 99)

    print(f"\n  100 predictions completed")
    print(f"  Avg latency   : {avg_ms:.2f} ms")
    print(f"  P95 latency   : {p95_ms:.2f} ms")
    print(f"  P99 latency   : {p99_ms:.2f} ms")
    print(f"  PRD target    : < 30ms")
    print(f"  Status        : "
          f"{'✅ PASS' if p99_ms < 30 else '⚠️  Review caching strategy'}")

    print("\n" + "=" * 60)
    print("  TEST 4 — SHAP latency benchmark (20 predictions with SHAP)")
    print("=" * 60)
    shap_times = []
    for _ in range(20):
        t = time.perf_counter()
        predictor.predict(high_intent_event, include_shap=True)
        shap_times.append((time.perf_counter() - t) * 1000)

    avg_shap = np.mean(shap_times)
    print(f"\n  20 predictions with SHAP completed")
    print(f"  Avg latency   : {avg_shap:.2f} ms")
    print(f"  PRD SHAP target: < 50ms")
    print(f"  Status        : "
          f"{'✅ PASS' if avg_shap < 50 else '⚠️  Use cached SHAP for real-time'}")

    print("\n" + "=" * 60)
    print("  TEST 5 — Ensemble model")
    print("=" * 60)
    ens_predictor = CTRPredictor(model_type="ensemble")
    result5 = ens_predictor.predict(high_intent_event, include_shap=False)
    _print_result(result5)

    print("\n" + "=" * 60)
    print("  TEST 6 — Batch prediction (Kafka consumer simulation)")
    print("=" * 60)
    batch       = [high_intent_event] * 50
    t_batch     = time.perf_counter()
    batch_results = predictor.predict_batch(batch, include_shap=False)
    batch_ms    = (time.perf_counter() - t_batch) * 1000
    serve_count = sum(1 for r in batch_results
                      if r["ad_decision"] == "SERVE")
    print(f"\n  Batch size  : 50 events")
    print(f"  Total time  : {batch_ms:.1f} ms")
    print(f"  Per event   : {batch_ms/50:.2f} ms")
    print(f"  SERVE count : {serve_count}/50")

    print("\n" + "=" * 60)
    print("  ✅  ALL TESTS COMPLETE — Pipeline ready for FastAPI")
    print("=" * 60)
    print("\n  FastAPI integration snippet:")
    print("  ─────────────────────────────────────────────")
    print("  from ml.inference_pipeline import CTRPredictor")
    print("  predictor = CTRPredictor()   # at app startup")
    print("")
    print("  @app.post('/predict')")
    print("  async def predict(event: dict):")
    print("      return predictor.predict(event)")
    print("  ─────────────────────────────────────────────")


def _print_result(result: dict):
    print(f"\n  click_probability   : {result['click_probability']}")
    print(f"  click_label         : {result['click_label']}")
    print(f"  ad_decision         : {result['ad_decision']}")
    print(f"  model               : {result['model']}")
    print(f"  inference_latency   : {result['inference_latency_ms']} ms"
          f"  {'✅' if result['prd_latency_ok'] else '⚠️'}")
    if result["shap_explanation"]:
        print(f"  top SHAP features   :")
        for feat in result["shap_explanation"]:
            print(f"    → {feat['plain_english']}")


if __name__ == "__main__":
    run_tests()