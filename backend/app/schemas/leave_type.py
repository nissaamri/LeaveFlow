
from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator
)


class LeaveTypeCreate(BaseModel):
    leave_type_name: str = Field(min_length=1, max_length=100)
    requires_approval: bool = True
    is_active: bool = True

    @field_validator("leave_type_name")
    @classmethod
    def validate_leave_type_name(cls, value: str):
        value = value.strip()

        if not value:
            raise ValueError("Leave type name cannot be empty")

        return value


class LeaveTypeResponse(BaseModel):
    leave_type_id: int = Field(gt=0)
    leave_type_name: str
    requires_approval: bool
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
