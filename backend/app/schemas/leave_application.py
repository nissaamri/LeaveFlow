
from datetime import date, datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    field_validator,
    model_validator
)


class LeaveApplicationCreate(BaseModel):
    leave_type_id: int
    start_date: date
    end_date: date
    reason: str

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date < self.start_date:
            raise ValueError("End date cannot be before start date")

        return self

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, value: str):
        value = value.strip()

        if not value:
            raise ValueError("Reason cannot be empty")

        return value


class LeaveApplicationResponse(BaseModel):
    application_id: int
    employee_id: int
    leave_type_id: int
    start_date: date
    end_date: date
    total_days: int
    reason: str
    status: str
    submitted_at: datetime

    model_config = ConfigDict(from_attributes=True)
