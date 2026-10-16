"""Link genuine SHAP rows to their persisted prediction."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20261014_pred_shap"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "ml_prediction_logs",
        sa.Column("event_id", sa.String(length=64), nullable=True),
    )
    op.create_index(
        "uq_ml_prediction_logs_event_id",
        "ml_prediction_logs",
        ["event_id"],
        unique=True,
    )

    op.add_column(
        "shap_insights",
        sa.Column("prediction_id", sa.Integer(), nullable=True),
    )
    op.add_column(
        "shap_insights",
        sa.Column("feature_value", sa.Float(), nullable=True),
    )
    op.add_column(
        "shap_insights",
        sa.Column("explanation_model", sa.String(length=100), nullable=True),
    )
    op.create_foreign_key(
        "fk_shap_insights_prediction_id_ml_prediction_logs",
        "shap_insights",
        "ml_prediction_logs",
        ["prediction_id"],
        ["prediction_id"],
        ondelete="CASCADE",
    )
    op.create_index(
        "ix_shap_insights_prediction_id",
        "shap_insights",
        ["prediction_id"],
    )
    op.create_index(
        "uq_shap_insights_prediction_feature",
        "shap_insights",
        ["prediction_id", "feature_name"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("uq_shap_insights_prediction_feature", table_name="shap_insights")
    op.drop_index("ix_shap_insights_prediction_id", table_name="shap_insights")
    op.drop_constraint(
        "fk_shap_insights_prediction_id_ml_prediction_logs",
        "shap_insights",
        type_="foreignkey",
    )
    op.drop_column("shap_insights", "explanation_model")
    op.drop_column("shap_insights", "feature_value")
    op.drop_column("shap_insights", "prediction_id")
    op.drop_index("uq_ml_prediction_logs_event_id", table_name="ml_prediction_logs")
    op.drop_column("ml_prediction_logs", "event_id")
