
"""Improve leave application defaults and timestamp

Revision ID: 6bf410aa3b6e
Revises: c0bbcf74cc8b
Create Date: 2026-11-23 11:56:42.145103

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6bf410aa3b6e'
down_revision: Union[str, Sequence[str], None] = 'c0bbcf74cc8b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.alter_column(
        'leave_applications',
        'status',
        existing_type=sa.VARCHAR(length=20),
        existing_nullable=False,
        server_default=sa.text("'pending'")
    )

    op.alter_column(
        'leave_applications',
        'submitted_at',
        existing_type=sa.DateTime(timezone=False),
        type_=sa.DateTime(timezone=True),
        existing_nullable=False,
        postgresql_using="submitted_at AT TIME ZONE 'UTC'",
        server_default=sa.text('CURRENT_TIMESTAMP')
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.alter_column(
        'leave_applications',
        'submitted_at',
        existing_type=sa.DateTime(timezone=True),
        type_=sa.DateTime(timezone=False),
        existing_nullable=False,
        postgresql_using="submitted_at AT TIME ZONE 'UTC'",
        server_default=None
    )

    op.alter_column(
        'leave_applications',
        'status',
        existing_type=sa.VARCHAR(length=20),
        existing_nullable=False,
        server_default=None
    )