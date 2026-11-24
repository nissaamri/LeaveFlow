
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.base import Base


class Approval(Base):
    __tablename__ = "approvals"

    __table_args__ = (
        CheckConstraint(
            "decision IN ('approved', 'rejected')",
            name="check_approval_decision",
        ),
        UniqueConstraint(
            "application_id",
            name="uq_approval_application",
        ),
    )

    approval_id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )

    application_id: Mapped[int] = mapped_column(
        ForeignKey("leave_applications.application_id"),
        nullable=False,
    )

    approver_id: Mapped[int] = mapped_column(
        ForeignKey("employees.employee_id"),
        nullable=False,
    )

    decision: Mapped[str] = mapped_column(
        String(20), nullable=False
    )

    comments: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )

    decided_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )
