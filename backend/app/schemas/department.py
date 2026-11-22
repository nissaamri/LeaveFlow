from pydantic import BaseModel, ConfigDict


class DepartmentCreate(BaseModel):
    department_name: str


class DepartmentResponse(BaseModel):
    department_id: int
    department_name: str

    model_config = ConfigDict(from_attributes=True)