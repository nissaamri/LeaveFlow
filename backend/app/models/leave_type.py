from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.base import Base


class LeaveType(Base):
    __tablename__ = "leave_types"

    leave_type_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    leave_type_name: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False
    )

    requires_approval: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )