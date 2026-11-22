
"""add leave balance check constraints

Revision ID: 6a56b32044db
Revises: 112932d2bf0e
Create Date: 2026-11-23 00:28:14.528968

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6a56b32044db'
down_revision: Union[str, Sequence[str], None] = '112932d2bf0e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.create_check_constraint(
        'check_entitlement_non_negative',
        'leave_balances',
        'entitlement >= 0'
    )

    op.create_check_constraint(
        'check_used_days_non_negative',
        'leave_balances',
        'used_days >= 0'
    )

    op.create_check_constraint(
        'check_used_days_within_entitlement',
        'leave_balances',
        'used_days <= entitlement'
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_constraint(
        'check_used_days_within_entitlement',
        'leave_balances',
        type_='check'
    )

    op.drop_constraint(
        'check_used_days_non_negative',
        'leave_balances',
        type_='check'
    )

    op.drop_constraint(
        'check_entitlement_non_negative',
        'leave_balances',
        type_='check'
    )
