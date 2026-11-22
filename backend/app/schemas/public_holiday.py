from datetime import date

from pydantic import BaseModel, ConfigDict


class PublicHolidayCreate(BaseModel):
    holiday_date: date
    holiday_name: str
    location: str


class PublicHolidayResponse(BaseModel):
    holiday_id: int
    holiday_date: date
    holiday_name: str
    location: str

    model_config = ConfigDict(from_attributes=True)