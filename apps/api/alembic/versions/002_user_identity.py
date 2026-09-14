"""user identity fields for municipal registration

Revision ID: 002_user_identity
Revises: 001_initial
Create Date: 2026-09-10
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002_user_identity"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("tipo_documento", sa.String(length=20), nullable=False, server_default="DNI"))
    op.add_column("users", sa.Column("tipo_dni", sa.String(length=20), nullable=False, server_default="azul"))
    op.add_column("users", sa.Column("ubigeo", sa.String(length=10), nullable=True))
    op.add_column("users", sa.Column("fecha_caducidad", sa.Date(), nullable=True))
    op.add_column("users", sa.Column("no_caduca", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("users", sa.Column("fecha_nacimiento", sa.Date(), nullable=True))
    op.add_column("users", sa.Column("distrito_bloqueado_hasta", sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "distrito_bloqueado_hasta")
    op.drop_column("users", "fecha_nacimiento")
    op.drop_column("users", "no_caduca")
    op.drop_column("users", "fecha_caducidad")
    op.drop_column("users", "ubigeo")
    op.drop_column("users", "tipo_dni")
    op.drop_column("users", "tipo_documento")
