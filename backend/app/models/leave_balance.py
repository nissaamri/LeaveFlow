from sqlalchemy import (
    ForeignKey,
    Integer,
    UniqueConstraint,
    CheckConstraint
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.base import Base


class LeaveBalance(Base):
    __tablename__ = "leave_balances"

    __table_args__ = (
        UniqueConstraint(
            "employee_id",
            "leave_type_id",
            "year",
            name="uq_employee_leave_type_year"
        ),
        CheckConstraint(
            "entitlement >= 0",
            name="check_entitlement_non_negative"
        ),
        CheckConstraint(
            "used_days >= 0",
            name="check_used_days_non_negative"
        ),
        CheckConstraint(
            "used_days <= entitlement",
            name="check_used_days_within_entitlement"
        ),
    )

    balance_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    employee_id: Mapped[int] = mapped_column(
        ForeignKey("employees.employee_id"),
        nullable=False
    )

    leave_type_id: Mapped[int] = mapped_column(
        ForeignKey("leave_types.leave_type_id"),
        nullable=False
    )

    entitlement: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    used_days: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )

    year: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )