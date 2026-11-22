from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class LeaveApplicationCreate(BaseModel):
    leave_type_id: int
    start_date: date
    end_date: date
    reason: str


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