from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.public_holiday import PublicHoliday
from app.schemas.public_holiday import (
    PublicHolidayCreate,
    PublicHolidayResponse
)


router = APIRouter(
    prefix="/public-holidays",
    tags=["Public Holidays"]
)


# 1. Create a public holiday
@router.post("/", response_model=PublicHolidayResponse)
def create_public_holiday(
    holiday: PublicHolidayCreate,
    db: Session = Depends(get_db)
):
    existing_holiday = db.query(PublicHoliday).filter(
        PublicHoliday.holiday_date == holiday.holiday_date,
        PublicHoliday.location == holiday.location
    ).first()

    if existing_holiday:
        raise HTTPException(
            status_code=400,
            detail="Public holiday already exists for this date and location"
        )

    new_holiday = PublicHoliday(
        holiday_date=holiday.holiday_date,
        holiday_name=holiday.holiday_name,
        location=holiday.location
    )

    db.add(new_holiday)
    db.commit()
    db.refresh(new_holiday)

    return new_holiday


# 2. Get all public holidays
@router.get("/", response_model=list[PublicHolidayResponse])
def get_public_holidays(
    location: str | None = None,
    year: int | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(PublicHoliday)

    if location:
        query = query.filter(
            PublicHoliday.location.ilike(location)
        )

    if year:
        query = query.filter(
            PublicHoliday.holiday_date >= date(year, 1, 1),
            PublicHoliday.holiday_date <= date(year, 12, 31)
        )

    return query.order_by(
        PublicHoliday.holiday_date
    ).all()


# 3. Get one public holiday by ID
@router.get("/{holiday_id}", response_model=PublicHolidayResponse)
def get_public_holiday(
    holiday_id: int,
    db: Session = Depends(get_db)
):
    holiday = db.query(PublicHoliday).filter(
        PublicHoliday.holiday_id == holiday_id
    ).first()

    if not holiday:
        raise HTTPException(
            status_code=404,
            detail="Public holiday not found"
        )

    return holiday


# 4. Update a public holiday
@router.put("/{holiday_id}", response_model=PublicHolidayResponse)
def update_public_holiday(
    holiday_id: int,
    holiday_data: PublicHolidayCreate,
    db: Session = Depends(get_db)
):
    holiday = db.query(PublicHoliday).filter(
        PublicHoliday.holiday_id == holiday_id
    ).first()

    if not holiday:
        raise HTTPException(
            status_code=404,
            detail="Public holiday not found"
        )

    existing_holiday = db.query(PublicHoliday).filter(
        PublicHoliday.holiday_date == holiday_data.holiday_date,
        PublicHoliday.location == holiday_data.location,
        PublicHoliday.holiday_id != holiday_id
    ).first()

    if existing_holiday:
        raise HTTPException(
            status_code=400,
            detail="Public holiday already exists for this date and location"
        )

    holiday.holiday_date = holiday_data.holiday_date
    holiday.holiday_name = holiday_data.holiday_name
    holiday.location = holiday_data.location

    db.commit()
    db.refresh(holiday)

    return holiday


# 5. Delete a public holiday
@router.delete("/{holiday_id}")
def delete_public_holiday(
    holiday_id: int,
    db: Session = Depends(get_db)
):
    holiday = db.query(PublicHoliday).filter(
        PublicHoliday.holiday_id == holiday_id
    ).first()

    if not holiday:
        raise HTTPException(
            status_code=404,
            detail="Public holiday not found"
        )

    db.delete(holiday)
    db.commit()

    return {
        "message": "Public holiday deleted successfully"
    }