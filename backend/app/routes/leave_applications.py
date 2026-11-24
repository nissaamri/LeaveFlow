from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_employee
from app.models.employee import Employee
from app.models.leave_type import LeaveType
from app.models.leave_application import LeaveApplication
from app.models.leave_balance import LeaveBalance
from app.models.approval import Approval
from app.models.audit_log import AuditLog
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

        current_date = date.fromordinal(
            current_date.toordinal() + 1
        )

    return total_days


def add_audit_log(
    db: Session,
    actor_id: int,
    action: str,
    entity_id: int
):
    """Add an audit record in the same database transaction."""

    db.add(
        AuditLog(
            actor_id=actor_id,
            action=action,
            entity_type="leave_application",
            entity_id=entity_id
        )
    )


def check_application_access(
    db: Session,
    application: LeaveApplication,
    current_employee: Employee
):
    """
    Employees can access their own applications.
    Managers can access their own applications and those of direct reports.
    HR Admins can access all applications.
    """

    if current_employee.role == "hr_admin":
        return

    if application.employee_id == current_employee.employee_id:
        return

    if current_employee.role == "manager":
        applicant = db.query(Employee).filter(
            Employee.employee_id == application.employee_id
        ).first()

        if applicant and applicant.manager_id == current_employee.employee_id:
            return

    raise HTTPException(
        status_code=403,
        detail="You do not have permission to access this leave application"
    )


def check_application_modification(
    application: LeaveApplication,
    current_employee: Employee
):
    """
    Only the application owner or an HR Admin can modify an application.
    Managers can view their reports' applications but cannot modify them.
    """

    if current_employee.role == "hr_admin":
        return

    if application.employee_id == current_employee.employee_id:
        return

    raise HTTPException(
        status_code=403,
        detail="You do not have permission to modify this leave application"
    )


# 1. Create a leave application
@router.post("/", response_model=LeaveApplicationResponse)
def create_leave_application(
    application: LeaveApplicationCreate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    employee_id = current_employee.employee_id

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

    try:
        db.add(new_application)
        db.flush()

        add_audit_log(
            db=db,
            actor_id=current_employee.employee_id,
            action="leave_application_submitted",
            entity_id=new_application.application_id
        )

        db.commit()
        db.refresh(new_application)

    except Exception:
        db.rollback()
        raise

    return new_application


# 2. Get leave applications visible to the logged-in employee
@router.get("/", response_model=list[LeaveApplicationResponse])
def get_leave_applications(
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    query = db.query(LeaveApplication)

    if current_employee.role == "hr_admin":
        pass

    elif current_employee.role == "manager":
        query = query.join(
            Employee,
            Employee.employee_id == LeaveApplication.employee_id
        ).filter(
            or_(
                LeaveApplication.employee_id == current_employee.employee_id,
                Employee.manager_id == current_employee.employee_id
            )
        )

    else:
        query = query.filter(
            LeaveApplication.employee_id == current_employee.employee_id
        )

    return query.order_by(
        LeaveApplication.application_id
    ).all()


# 3. Get one leave application by ID
@router.get("/{application_id}", response_model=LeaveApplicationResponse)
def get_leave_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    application = db.query(LeaveApplication).filter(
        LeaveApplication.application_id == application_id
    ).first()

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Leave application not found"
        )

    check_application_access(
        db,
        application,
        current_employee
    )

    return application


# 4. Update a leave application
@router.put(
    "/{application_id}",
    response_model=LeaveApplicationResponse
)
def update_leave_application(
    application_id: int,
    application_data: LeaveApplicationCreate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    application = db.query(LeaveApplication).filter(
        LeaveApplication.application_id == application_id
    ).first()

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Leave application not found"
        )

    check_application_modification(
        application,
        current_employee
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

    try:
        add_audit_log(
            db=db,
            actor_id=current_employee.employee_id,
            action="leave_application_updated",
            entity_id=application.application_id
        )

        db.commit()
        db.refresh(application)

    except Exception:
        db.rollback()
        raise

    return application


# 5. Cancel a leave application
@router.post(
    "/{application_id}/cancel",
    response_model=LeaveApplicationResponse
)
def cancel_leave_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    application = db.query(LeaveApplication).filter(
        LeaveApplication.application_id == application_id
    ).with_for_update().first()

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Leave application not found"
        )

    check_application_modification(
        application,
        current_employee
    )

    if application.status == "cancelled":
        raise HTTPException(
            status_code=400,
            detail="This application has already been cancelled"
        )

    if application.status == "rejected":
        raise HTTPException(
            status_code=400,
            detail="Rejected applications cannot be cancelled"
        )

    # Restore leave balance only for approved applications
    if application.status == "approved":

        approval = db.query(Approval).filter(
            Approval.application_id == application_id,
            Approval.decision == "approved"
        ).first()

        if not approval:
            raise HTTPException(
                status_code=400,
                detail="Approved application record not found"
            )

        balance = db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == application.employee_id,
            LeaveBalance.leave_type_id == application.leave_type_id,
            LeaveBalance.year == application.start_date.year
        ).with_for_update().first()

        if not balance:
            raise HTTPException(
                status_code=400,
                detail="Leave balance record not found"
            )

        if balance.used_days < application.total_days:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Cannot restore leave balance because the "
                    "used days are lower than the application days."
                )
            )

        balance.used_days -= application.total_days

    application.status = "cancelled"

    try:
        add_audit_log(
            db=db,
            actor_id=current_employee.employee_id,
            action="leave_application_cancelled",
            entity_id=application.application_id
        )

        db.commit()
        db.refresh(application)

    except Exception:
        db.rollback()
        raise

    return application


# 6. Delete a leave application
@router.delete("/{application_id}")
def delete_leave_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    application = db.query(LeaveApplication).filter(
        LeaveApplication.application_id == application_id
    ).first()

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Leave application not found"
        )

    check_application_modification(
        application,
        current_employee
    )

    if application.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Only pending applications can be deleted"
        )

    try:
        add_audit_log(
            db=db,
            actor_id=current_employee.employee_id,
            action="leave_application_deleted",
            entity_id=application.application_id
        )

        db.delete(application)
        db.commit()

    except Exception:
        db.rollback()
        raise

    return {
        "message": "Leave application deleted successfully"
    }
