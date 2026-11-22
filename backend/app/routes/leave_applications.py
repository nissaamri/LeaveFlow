from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.employee import Employee
from app.models.leave_type import LeaveType
from app.models.leave_application import LeaveApplication
from app.schemas.leave_application import (
    LeaveApplicationCreate,
    LeaveApplicationResponse
)


router = APIRouter(
    prefix="/leave-applications",
    tags=["Leave Applications"]
)


def calculate_leave_days(start_date: date, end_date: date) -> int:
    """Count weekdays, excluding Saturdays and Sundays."""
    total_days = 0
    current_date = start_date

    while current_date <= end_date:
        if current_date.weekday() < 5:
            total_days += 1

        current_date = date.fromordinal(current_date.toordinal() + 1)

    return total_days


# 1. Create a leave application
@router.post("/", response_model=LeaveApplicationResponse)
def create_leave_application(
    employee_id: int,
    application: LeaveApplicationCreate,
    db: Session = Depends(get_db)
):
    employee = db.query(Employee).filter(
        Employee.employee_id == employee_id
    ).first()

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    leave_type = db.query(LeaveType).filter(
        LeaveType.leave_type_id == application.leave_type_id
    ).first()

    if not leave_type or not leave_type.is_active:
        raise HTTPException(
            status_code=404,
            detail="Active leave type not found"
        )

    if application.end_date < application.start_date:
        raise HTTPException(
            status_code=400,
            detail="End date cannot be before start date"
        )

    total_days = calculate_leave_days(
        application.start_date,
        application.end_date
    )

    if total_days == 0:
        raise HTTPException(
            status_code=400,
            detail="Leave application must include at least one weekday"
        )

    new_application = LeaveApplication(
        employee_id=employee_id,
        leave_type_id=application.leave_type_id,
        start_date=application.start_date,
        end_date=application.end_date,
        total_days=total_days,
        reason=application.reason,
        status="pending"
    )

    db.add(new_application)
    db.commit()
    db.refresh(new_application)

    return new_application


# 2. Get all leave applications
@router.get("/", response_model=list[LeaveApplicationResponse])
def get_leave_applications(db: Session = Depends(get_db)):
    return db.query(LeaveApplication).order_by(
        LeaveApplication.application_id
    ).all()


# 3. Get one leave application by ID
@router.get("/{application_id}", response_model=LeaveApplicationResponse)
def get_leave_application(
    application_id: int,
    db: Session = Depends(get_db)
):
    application = db.query(LeaveApplication).filter(
        LeaveApplication.application_id == application_id
    ).first()

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Leave application not found"
        )

    return application


# 4. Update a leave application
@router.put("/{application_id}", response_model=LeaveApplicationResponse)
def update_leave_application(
    application_id: int,
    application_data: LeaveApplicationCreate,
    db: Session = Depends(get_db)
):
    application = db.query(LeaveApplication).filter(
        LeaveApplication.application_id == application_id
    ).first()

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Leave application not found"
        )

    if application.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Only pending applications can be updated"
        )

    leave_type = db.query(LeaveType).filter(
        LeaveType.leave_type_id == application_data.leave_type_id
    ).first()

    if not leave_type or not leave_type.is_active:
        raise HTTPException(
            status_code=404,
            detail="Active leave type not found"
        )

    if application_data.end_date < application_data.start_date:
        raise HTTPException(
            status_code=400,
            detail="End date cannot be before start date"
        )

    total_days = calculate_leave_days(
        application_data.start_date,
        application_data.end_date
    )

    if total_days == 0:
        raise HTTPException(
            status_code=400,
            detail="Leave application must include at least one weekday"
        )

    application.leave_type_id = application_data.leave_type_id
    application.start_date = application_data.start_date
    application.end_date = application_data.end_date
    application.total_days = total_days
    application.reason = application_data.reason

    db.commit()
    db.refresh(application)

    return application


# 5. Delete a leave application
@router.delete("/{application_id}")
def delete_leave_application(
    application_id: int,
    db: Session = Depends(get_db)
):
    application = db.query(LeaveApplication).filter(
        LeaveApplication.application_id == application_id
    ).first()

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Leave application not found"
        )

    if application.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Only pending applications can be deleted"
        )

    db.delete(application)
    db.commit()

    return {
        "message": "Leave application deleted successfully"
    }