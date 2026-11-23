
from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator
)


class DepartmentCreate(BaseModel):
    department_name: str = Field(min_length=1, max_length=100)

    @field_validator("department_name")
    @classmethod
    def validate_department_name(cls, value: str):
        value = value.strip()

        if not value:
            raise ValueError("Department name cannot be empty")

        return value


class DepartmentResponse(BaseModel):
    department_id: int = Field(gt=0)
    department_name: str

    model_config = ConfigDict(from_attributes=True)
