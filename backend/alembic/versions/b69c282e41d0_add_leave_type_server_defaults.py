
"""add leave type server defaults

Revision ID: b69c282e41d0
Revises: 3ed8df03dcd7
Create Date: 2026-11-23 00:41:27.747058

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b69c282e41d0'
down_revision: Union[str, Sequence[str], None] = '3ed8df03dcd7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.alter_column(
        'leave_types',
        'requires_approval',
        existing_type=sa.Boolean(),
        server_default=sa.text('true'),
        existing_nullable=False
    )

    op.alter_column(
        'leave_types',
        'is_active',
        existing_type=sa.Boolean(),
        server_default=sa.text('true'),
        existing_nullable=False
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.alter_column(
        'leave_types',
        'is_active',
        existing_type=sa.Boolean(),
        server_default=None,
        existing_nullable=False
    )

    op.alter_column(
        'leave_types',
        'requires_approval',
        existing_type=sa.Boolean(),
        server_default=None,
        existing_nullable=False
    )