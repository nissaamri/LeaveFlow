
from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator
)


EmployeeRole = Literal["employee", "manager", "hr_admin"]


class EmployeeCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str = Field(min_length=8)
    role: EmployeeRole
    department_id: int = Field(gt=0)
    manager_id: int | None = Field(default=None, gt=0)

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str):
        value = value.strip()

        if not value:
            raise ValueError("Full name cannot be empty")

        return value


class EmployeeResponse(BaseModel):
    employee_id: int
    full_name: str
    email: EmailStr
    role: EmployeeRole
    department_id: int
    manager_id: int | None

    model_config = ConfigDict(from_attributes=True)
