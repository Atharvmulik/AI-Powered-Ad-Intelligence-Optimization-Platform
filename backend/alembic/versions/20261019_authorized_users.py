"""Create the application login accounts table."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20261019_auth_users"
down_revision: Union[str, Sequence[str], None] = "20261014_pred_shap"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "authorized_users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column(
            "is_active",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_authorized_users_email",
        "authorized_users",
        ["email"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_authorized_users_email", table_name="authorized_users")
    op.drop_table("authorized_users")
