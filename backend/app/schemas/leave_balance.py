
from pydantic import BaseModel, ConfigDict, Field, model_validator


class LeaveBalanceCreate(BaseModel):
    employee_id: int = Field(gt=0)
    leave_type_id: int = Field(gt=0)
    entitlement: int = Field(ge=0)
    used_days: int = Field(default=0, ge=0)
    year: int = Field(gt=0)

    @model_validator(mode="after")
    def validate_balance(self):
        if self.used_days > self.entitlement:
            raise ValueError(
                "Used days cannot exceed leave entitlement"
            )

        return self


class LeaveBalanceResponse(BaseModel):
    balance_id: int
    employee_id: int
    leave_type_id: int
    entitlement: int
    used_days: int
    year: int

    model_config = ConfigDict(from_attributes=True)
