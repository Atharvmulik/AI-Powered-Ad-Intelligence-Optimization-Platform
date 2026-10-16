from __future__ import annotations

import os
import importlib.util
import sys
from datetime import datetime, timezone
from types import ModuleType, SimpleNamespace
from unittest import IsolatedAsyncioTestCase
from unittest.mock import AsyncMock, patch

import numpy as np
from fastapi import HTTPException
from sqlalchemy.dialects import postgresql

for optional_ml_module in ("shap", "xgboost"):
    if importlib.util.find_spec(optional_ml_module) is None:
        sys.modules[optional_ml_module] = ModuleType(optional_ml_module)

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://test:test@127.0.0.1/test",
)

from app.api.v1.aiinsight import get_prediction_shap  # noqa: E402
from app.db.models import MLPredictionLog, ShapInsight  # noqa: E402
from app.schemas.aiinsight import PredictionItem  # noqa: E402
from app.services.aiinsight_service import AIInsightService  # noqa: E402
from app.synthetic.db_writer import (  # noqa: E402
    SyntheticEventWriter,
    _genuine_shap_attributions,
)
from app.synthetic.event_generator import SyntheticEvent  # noqa: E402
from ml.inference_pipeline import CTRPredictor  # noqa: E402


class StubResult:
    def __init__(self, *, scalar=None, rows=None, scalar_values=None):
        self._scalar = scalar
        self._rows = rows or []
        self._scalar_values = scalar_values or []

    def scalar_one_or_none(self):
        return self._scalar

    def all(self):
        return self._rows

    def scalars(self):
        return SimpleNamespace(all=lambda: self._scalar_values)


class StubSession:
    def __init__(self, *results):
        self.results = list(results)
        self.statements = []

    async def execute(self, statement, *args, **kwargs):
        self.statements.append(statement)
        return self.results.pop(0)


class WriterSession:
    def __init__(self, fail_on_shap=False):
        self.predictions = {}
        self.attributions = {}
        self.pending_predictions = {}
        self.pending_attributions = {}
        self.statements = []
        self.commits = 0
        self.rollbacks = 0
        self.fail_on_shap = fail_on_shap

    @staticmethod
    def _rows(statement):
        values = statement._multi_values[0]
        rows = [values] if isinstance(values, dict) else list(values)
        return [
            {getattr(column, "name", column): value for column, value in row.items()}
            for row in rows
        ]

    async def execute(self, statement, *args, **kwargs):
        self.statements.append(statement)
        table = getattr(statement, "table", None)
        if table is None:
            rows = [
                SimpleNamespace(event_id=event_id, prediction_id=prediction_id)
                for event_id, prediction_id in (
                    self.predictions | self.pending_predictions
                ).items()
            ]
            return StubResult(rows=rows)

        if table.name == MLPredictionLog.__tablename__:
            new_ids = []
            for row in self._rows(statement):
                event_id = row["event_id"]
                if event_id not in self.predictions and event_id not in self.pending_predictions:
                    prediction_id = len(self.predictions) + len(self.pending_predictions) + 1
                    self.pending_predictions[event_id] = prediction_id
                    new_ids.append(event_id)
            return StubResult(scalar_values=new_ids)

        if table.name == ShapInsight.__tablename__:
            if self.fail_on_shap:
                raise RuntimeError("simulated attribution write failure")
            for row in self._rows(statement):
                key = (row["prediction_id"], row["feature_name"])
                if key not in self.attributions:
                    self.pending_attributions.setdefault(key, row)
        return StubResult()

    async def commit(self):
        self.commits += 1
        self.predictions.update(self.pending_predictions)
        self.attributions.update(self.pending_attributions)
        self.pending_predictions.clear()
        self.pending_attributions.clear()

    async def rollback(self):
        self.rollbacks += 1
        self.pending_predictions.clear()
        self.pending_attributions.clear()


def _event(event_id="event-1", *, include_shap=True):
    timestamp = datetime(2026, 10, 14, 9, 30, tzinfo=timezone.utc)
    explanation = (
        [
            {
                "feature": "I1_x_I2",
                "feature_value": 0.75,
                "shap_value": -0.32,
                "impact": 0.32,
            },
            {
                "feature": "cat_sum",
                "feature_value": 0.12,
                "shap_value": 0.18,
                "impact": 0.18,
            },
        ]
        if include_shap
        else []
    )
    return SyntheticEvent(
        event_id=event_id,
        event_type="click",
        timestamp=timestamp,
        user_id="user-1",
        session_id="session-1",
        ad_id="ad-1",
        campaign_id=7,
        age=30,
        interests="technology",
        device="desktop",
        os="windows",
        app="browser",
        ip="192.0.2.1",
        channel="search",
        location="US",
        profile_name="normal",
        clicked=True,
        ctr_result={
            "click_probability": 0.63,
            "inference_latency_ms": 5.0,
            "model": "xgboost",
            "shap_explanation": explanation,
        },
        fraud_result={"fraud_score": 0.03, "inference_latency_ms": 2.0},
        recommendation_result={"recommendation_score": 0.8, "inference_latency_ms": 1.0},
    )


class PredictionShapTests(IsolatedAsyncioTestCase):
    async def test_prediction_shap_returns_exact_linked_signed_features(self):
        prediction = SimpleNamespace(
            prediction_id=81,
            model_version="synthetic-v1.0",
            timestamp=datetime(2026, 10, 14, tzinfo=timezone.utc),
        )
        rows = [
            SimpleNamespace(
                feature_name="I1_x_I2",
                feature_value=0.75,
                shap_value=-0.32,
                explanation_model="xgboost",
                created_at=prediction.timestamp,
            )
        ]
        session = StubSession(
            StubResult(scalar=prediction),
            StubResult(rows=rows),
        )

        response = await AIInsightService(session).get_prediction_shap(81)

        self.assertEqual(response.prediction_id, 81)
        self.assertEqual(response.features[0].feature_name, "I1_x_I2")
        self.assertEqual(response.features[0].feature_value, 0.75)
        self.assertEqual(response.features[0].shap_value, -0.32)
        self.assertEqual(response.features[0].explanation_model, "xgboost")
        self.assertIn("shap_insights.prediction_id = :prediction_id_1", str(session.statements[1]))

    async def test_existing_prediction_without_shap_returns_empty_features(self):
        prediction = SimpleNamespace(
            prediction_id=82,
            model_version="synthetic-v1.0",
            timestamp=datetime(2026, 10, 14, tzinfo=timezone.utc),
        )
        session = StubSession(StubResult(scalar=prediction), StubResult(rows=[]))

        response = await AIInsightService(session).get_prediction_shap(82)

        self.assertEqual(response.features, [])

    async def test_missing_prediction_is_not_found(self):
        service = SimpleNamespace(get_prediction_shap=AsyncMock(return_value=None))

        with self.assertRaises(HTTPException) as context:
            await get_prediction_shap(404, service=service)

        self.assertEqual(context.exception.status_code, 404)

    def test_ctr_adapter_requests_genuine_shap_during_prediction(self):
        class Predictor:
            def __init__(self):
                self.include_shap = None

            def predict(self, features, include_shap):
                self.include_shap = include_shap
                return {"click_probability": 0.5, "shap_explanation": []}

        from app.synthetic.ml_inference import CTRInferenceAdapter

        adapter = CTRInferenceAdapter.__new__(CTRInferenceAdapter)
        adapter.predictor = Predictor()
        with patch("app.synthetic.ml_inference.build_ctr_feature_dict", return_value={"I1": 1}):
            result = adapter.predict({"user_id": "user-1"})

        self.assertTrue(adapter.predictor.include_shap)
        self.assertEqual(result["shap_explanation"], [])

    def test_attribution_normalizer_keeps_signed_real_values_only(self):
        values = _genuine_shap_attributions(
            {
                "shap_explanation": [
                    {"feature": "f1", "feature_value": 1.5, "shap_value": -0.4},
                    {"feature": "unavailable", "feature_value": 0, "shap_value": 0},
                    {"feature": "incomplete", "shap_value": 0.3},
                ]
            }
        )

        self.assertEqual(
            values,
            [{"feature_name": "f1", "feature_value": 1.5, "shap_value": -0.4}],
        )

    def test_prediction_response_adds_id_without_dropping_existing_fields(self):
        item = PredictionItem(
            prediction_id=19,
            timestamp=datetime(2026, 10, 14, tzinfo=timezone.utc),
            campaign_name="campaign",
            ad_id="ad-1",
            click_probability=0.5,
            fraud_probability=0.1,
            recommendation_score=2.0,
            model_version="synthetic-v1.0",
            inference_latency_ms=4.0,
        )

        self.assertEqual(item.prediction_id, 19)
        self.assertEqual(
            set(item.model_dump()),
            {
                "prediction_id",
                "timestamp",
                "campaign_name",
                "ad_id",
                "click_probability",
                "fraud_probability",
                "recommendation_score",
                "model_version",
                "inference_latency_ms",
            },
        )

    async def test_campaign_shap_response_stays_campaign_shaped(self):
        row = SimpleNamespace(
            campaign_name="campaign",
            feature_name="legacy-feature",
            shap_value=-0.1,
            predicted_ctr=0.25,
            auc_score=0.9,
            created_at=datetime(2026, 10, 14, tzinfo=timezone.utc),
        )
        session = StubSession(StubResult(rows=[row]))

        response = await AIInsightService(session).get_shap(campaign_id=7)

        self.assertEqual(response.features[0].campaign_name, "campaign")
        self.assertEqual(response.features[0].feature_name, "legacy-feature")
        self.assertEqual(response.features[0].shap_value, -0.1)
        self.assertIn("shap_insights.prediction_id IS NULL", str(session.statements[0]))

    async def test_writer_links_rows_and_publishes_compatible_event_once_on_retry(self):
        session = WriterSession()
        publish = AsyncMock()
        event = _event()
        writer = SyntheticEventWriter(session)

        with patch("app.synthetic.db_writer.aiinsight_event_bus.publish", publish):
            await writer.write([event])
            await writer.write([event])

        self.assertEqual(len(session.predictions), 1)
        self.assertEqual(len(session.attributions), 2)
        self.assertIn((1, "I1_x_I2"), session.attributions)
        self.assertEqual(session.attributions[(1, "I1_x_I2")]["shap_value"], -0.32)
        self.assertEqual(session.attributions[(1, "I1_x_I2")]["feature_value"], 0.75)
        self.assertEqual(publish.await_count, 1)
        payload = publish.await_args.args[0]
        self.assertEqual(payload["type"], "prediction_created")
        self.assertEqual(payload["data"]["prediction_id"], 1)
        for existing_field in (
            "timestamp",
            "campaign_name",
            "ad_id",
            "click_probability",
            "fraud_probability",
            "recommendation_score",
            "model_version",
            "inference_latency_ms",
        ):
            self.assertIn(existing_field, payload["data"])

        shap_statement = next(
            statement
            for statement in session.statements
            if getattr(getattr(statement, "table", None), "name", None)
            == ShapInsight.__tablename__
        )
        sql = str(shap_statement.compile(dialect=postgresql.dialect()))
        self.assertIn("ON CONFLICT (prediction_id, feature_name) DO NOTHING", sql)
        prediction_statement = next(
            statement
            for statement in session.statements
            if getattr(getattr(statement, "table", None), "name", None)
            == MLPredictionLog.__tablename__
        )
        prediction_sql = str(prediction_statement.compile(dialect=postgresql.dialect()))
        self.assertIn("ON CONFLICT (event_id) DO NOTHING", prediction_sql)

    async def test_prediction_without_shap_persists_without_explanation(self):
        session = WriterSession()
        writer = SyntheticEventWriter(session)

        with patch("app.synthetic.db_writer.aiinsight_event_bus.publish", AsyncMock()):
            await writer.write([_event(include_shap=False)])

        self.assertEqual(len(session.predictions), 1)
        self.assertEqual(session.attributions, {})
        self.assertEqual(session.commits, 1)

    async def test_attribution_write_failure_rolls_back_without_publishing(self):
        session = WriterSession(fail_on_shap=True)
        publish = AsyncMock()

        with patch("app.synthetic.db_writer.aiinsight_event_bus.publish", publish):
            counts = await SyntheticEventWriter(session).write([_event()])

        self.assertEqual(session.rollbacks, 1)
        self.assertEqual(session.commits, 0)
        self.assertEqual(session.predictions, {})
        self.assertEqual(publish.await_count, 0)
        self.assertEqual(counts, {})

    def test_shap_explainer_returns_input_values_and_signed_attributions(self):
        class Explainer:
            @staticmethod
            def shap_values(feature_vector, check_additivity):
                return np.array([[0.3, -0.2]])

        predictor = CTRPredictor.__new__(CTRPredictor)
        predictor.xgb_explainer = Explainer()
        predictor.lgb_explainer = None
        predictor.feature_cols = ["feature_a", "feature_b"]

        explanation = predictor._explain(np.array([[1.25, 0.5]]), 0.7)

        self.assertEqual(explanation[0]["feature"], "feature_a")
        self.assertEqual(explanation[0]["feature_value"], 1.25)
        self.assertEqual(explanation[0]["shap_value"], 0.3)
        self.assertEqual(explanation[1]["feature"], "feature_b")
        self.assertEqual(explanation[1]["feature_value"], 0.5)
        self.assertEqual(explanation[1]["shap_value"], -0.2)

    def test_shap_failure_returns_no_synthetic_attribution(self):
        class Explainer:
            @staticmethod
            def shap_values(*args, **kwargs):
                raise RuntimeError("unavailable")

        predictor = CTRPredictor.__new__(CTRPredictor)
        predictor.xgb_explainer = Explainer()
        predictor.lgb_explainer = None
        predictor.feature_cols = ["feature_a"]

        self.assertEqual(predictor._explain(np.array([[1.25]]), 0.7), [])
        self.assertEqual(predictor._explain(np.array([[1.25]]), 0.7), [])
    def test_explainer_initialization_failure_keeps_loaded_ctr_model(self):
        predictor = CTRPredictor.__new__(CTRPredictor)
        predictor.model_type = "xgboost"
        predictor.xgb_model = None
        predictor.lgb_model = None
        predictor.xgb_explainer = None
        predictor.lgb_explainer = None
        predictor.base_value = None
        model = object()

        with (
            patch(
                "ml.inference_pipeline.joblib.load",
                side_effect=[["feature"], {}, {}, model],
            ),
            patch("ml.inference_pipeline.os.path.exists", return_value=False),
            patch(
                "ml.inference_pipeline.shap.TreeExplainer",
                side_effect=RuntimeError("explainer unavailable"),
                create=True,
            ),
        ):
            predictor._load_artifacts()

        self.assertIs(predictor.xgb_model, model)
        self.assertIsNone(predictor.xgb_explainer)
