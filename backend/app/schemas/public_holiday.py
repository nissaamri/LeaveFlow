
from datetime import date

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator
)


class PublicHolidayCreate(BaseModel):
    holiday_date: date
    holiday_name: str = Field(min_length=1, max_length=100)
    location: str = Field(min_length=1, max_length=100)

    @field_validator("holiday_name", "location")
    @classmethod
    def validate_text_fields(cls, value: str):
        value = value.strip()

        if not value:
            raise ValueError("This field cannot be empty")

        return value


class PublicHolidayResponse(BaseModel):
    holiday_id: int = Field(gt=0)
    holiday_date: date
    holiday_name: str
    location: str

    model_config = ConfigDict(from_attributes=True)
