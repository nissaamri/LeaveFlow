
from datetime import date, datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    text
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.base import Base


class LeaveApplication(Base):
    __tablename__ = "leave_applications"
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'approved', 'rejected', 'cancelled')",
            name="check_leave_application_status"
        ),
        CheckConstraint(
            "start_date <= end_date",
            name="check_leave_application_dates"
        ),
        CheckConstraint(
            "total_days > 0",
            name="check_leave_application_total_days"
        ),
    )

    application_id: Mapped[int] = mapped_column(
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

    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    end_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    total_days: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    reason: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="pending",
        server_default=text("'pending'"),
        nullable=False
    )

    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False
    )