from pydantic import BaseModel, ConfigDict


class LeaveBalanceCreate(BaseModel):
    employee_id: int
    leave_type_id: int
    entitlement: int
    used_days: int = 0
    year: int


class LeaveBalanceResponse(BaseModel):
    balance_id: int
    employee_id: int
    leave_type_id: int
    entitlement: int
    used_days: int
    year: int

    model_config = ConfigDict(from_attributes=True)