from pydantic import BaseModel, EmailStr, ConfigDict


class EmployeeCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str
    department_id: int
    manager_id: int | None = None


class EmployeeResponse(BaseModel):
    employee_id: int
    full_name: str
    email: EmailStr
    role: str
    department_id: int
    manager_id: int | None

    model_config = ConfigDict(from_attributes=True)