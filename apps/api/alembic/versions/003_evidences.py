"""temporary report evidence with 12h ttl

Revision ID: 003_evidences
Revises: 002_user_identity
Create Date: 2026-09-14
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003_evidences"
down_revision: Union[str, None] = "002_user_identity"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "evidences",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("content_type", sa.String(length=40), nullable=False),
        sa.Column("data_url", sa.Text(), nullable=False),
        sa.Column("report_id", sa.Uuid(), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["report_id"], ["reports.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_evidences_user_id", "evidences", ["user_id"])
    op.create_index("ix_evidences_report_id", "evidences", ["report_id"])
    op.create_index("ix_evidences_expires_at", "evidences", ["expires_at"])


def downgrade() -> None:
    op.drop_index("ix_evidences_expires_at", table_name="evidences")
    op.drop_index("ix_evidences_report_id", table_name="evidences")
    op.drop_index("ix_evidences_user_id", table_name="evidences")
    op.drop_table("evidences")
