from pydantic import BaseModel, ConfigDict


class LeaveTypeCreate(BaseModel):
    leave_type_name: str
    requires_approval: bool = True
    is_active: bool = True


class LeaveTypeResponse(BaseModel):
    leave_type_id: int
    leave_type_name: str
    requires_approval: bool
    is_active: bool

    model_config = ConfigDict(from_attributes=True)