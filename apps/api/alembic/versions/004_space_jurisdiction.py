"""admin space jurisdiction and report space assignment

Revision ID: 004_space_jurisdiction
Revises: 003_evidences
Create Date: 2026-09-15
"""

from math import atan2, cos, radians, sin, sqrt
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004_space_jurisdiction"
down_revision: Union[str, None] = "003_evidences"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    radius = 6371
    d_lat = radians(lat2 - lat1)
    d_lng = radians(lng2 - lng1)
    a = sin(d_lat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lng / 2) ** 2
    return radius * 2 * atan2(sqrt(a), sqrt(1 - a))


def upgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.add_column(sa.Column("espacio_id", sa.Uuid(), nullable=True))
        batch.create_index("ix_users_espacio_id", ["espacio_id"])
        batch.create_foreign_key("fk_users_espacio_id_spaces", "spaces", ["espacio_id"], ["id"])

    with op.batch_alter_table("reports") as batch:
        batch.add_column(sa.Column("espacio_id", sa.Uuid(), nullable=True))
        batch.create_index("ix_reports_espacio_id", ["espacio_id"])
        batch.create_foreign_key("fk_reports_espacio_id_spaces", "spaces", ["espacio_id"], ["id"])

    conn = op.get_bind()
    spaces = list(conn.execute(sa.text("SELECT id, code, lat, lng FROM spaces")))
    if not spaces:
        return

    default_id = next((row[0] for row in spaces if row[1] == "esp-001"), spaces[0][0])
    conn.execute(
        sa.text("UPDATE users SET espacio_id = :sid WHERE role = 'admin' AND espacio_id IS NULL"),
        {"sid": default_id},
    )

    reports = list(conn.execute(sa.text("SELECT id, lat, lng FROM reports WHERE espacio_id IS NULL")))
    for report_id, lat, lng in reports:
        space_id = default_id
        if lat is not None and lng is not None:
            ranked = sorted(
                spaces,
                key=lambda row: (_haversine_km(float(lat), float(lng), float(row[2]), float(row[3])), row[1]),
            )
            space_id = ranked[0][0]
        conn.execute(
            sa.text("UPDATE reports SET espacio_id = :sid WHERE id = :rid"),
            {"sid": space_id, "rid": report_id},
        )


def downgrade() -> None:
    with op.batch_alter_table("reports") as batch:
        batch.drop_constraint("fk_reports_espacio_id_spaces", type_="foreignkey")
        batch.drop_index("ix_reports_espacio_id")
        batch.drop_column("espacio_id")

    with op.batch_alter_table("users") as batch:
        batch.drop_constraint("fk_users_espacio_id_spaces", type_="foreignkey")
        batch.drop_index("ix_users_espacio_id")
        batch.drop_column("espacio_id")
