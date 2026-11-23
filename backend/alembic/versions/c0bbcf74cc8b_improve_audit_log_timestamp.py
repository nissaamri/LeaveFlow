
"""improve audit log timestamp

Revision ID: c0bbcf74cc8b
Revises: b69c282e41d0
Create Date: 2026-11-23 11:46:25.162323

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c0bbcf74cc8b'
down_revision: Union[str, Sequence[str], None] = 'b69c282e41d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.alter_column(
        'audit_logs',
        'created_at',
        existing_type=sa.DateTime(timezone=False),
        type_=sa.DateTime(timezone=True),
        existing_nullable=False,
        postgresql_using="created_at AT TIME ZONE 'UTC'",
        server_default=sa.text('CURRENT_TIMESTAMP')
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.alter_column(
        'audit_logs',
        'created_at',
        existing_type=sa.DateTime(timezone=True),
        type_=sa.DateTime(timezone=False),
        existing_nullable=False,
        postgresql_using="created_at AT TIME ZONE 'UTC'",
        server_default=None
    )
