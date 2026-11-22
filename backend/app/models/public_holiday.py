from datetime import date

from sqlalchemy import Date, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.base import Base


class PublicHoliday(Base):
    __tablename__ = "public_holidays"

    __table_args__ = (
        UniqueConstraint(
            "holiday_date",
            "location",
            name="uq_public_holiday_date_location"
        ),
    )

    holiday_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    holiday_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    holiday_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    location: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )