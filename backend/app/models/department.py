from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.base import Base


class Department(Base):
    __tablename__ = "departments"

    department_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    department_name: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False
    )