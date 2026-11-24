
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_employee
from app.models.approval import Approval
from app.models.audit_log import AuditLog
from app.models.employee import Employee
from app.models.leave_application import LeaveApplication
from app.models.leave_balance import LeaveBalance
from app.schemas.approval import ApprovalResponse


router = APIRouter(
    prefix="/approvals",
    tags=["Approvals"]
)


# 1. Create an approval decision
@router.post("/", response_model=ApprovalResponse)
def create_approval(
    application_id: int,
    decision: str,
    comments: str | None = None,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    # Only managers and HR administrators can review applications.
    if current_employee.role not in ["manager", "hr_admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only managers or HR administrators can approve leave"
        )

    # Find and lock the leave application.
    application = db.query(LeaveApplication).filter(
        LeaveApplication.application_id == application_id
    ).with_for_update().first()

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Leave application not found"
        )

    # Managers can only review applications from their own employees.
    if current_employee.role == "manager":
        applicant = db.query(Employee).filter(
            Employee.employee_id == application.employee_id
        ).first()

        if not applicant or applicant.manager_id != current_employee.employee_id:
            raise HTTPException(
                status_code=403,
                detail="You can only review leave applications from your own team"
            )

    if decision not in ["approved", "rejected"]:
        raise HTTPException(
            status_code=400,
            detail="Decision must be approved or rejected"
        )

    if application.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Only pending applications can be reviewed"
        )

    existing_approval = db.query(Approval).filter(
        Approval.application_id == application_id
    ).first()

    if existing_approval:
        raise HTTPException(
            status_code=400,
            detail="This application has already been reviewed"
        )

    # Deduct leave balance only when approved.
    if decision == "approved":

        if application.start_date.year != application.end_date.year:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Applications spanning multiple calendar years "
                    "cannot be approved yet."
                )
            )

        leave_year = application.start_date.year

        balance = db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == application.employee_id,
            LeaveBalance.leave_type_id == application.leave_type_id,
            LeaveBalance.year == leave_year
        ).with_for_update().first()

        if not balance:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"No leave balance found for {leave_year}. "
                    "Please create the employee's leave balance "
                    "before approving this application."
                )
            )

        remaining_days = balance.entitlement - balance.used_days

        if remaining_days < application.total_days:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Insufficient leave balance. "
                    f"Available: {remaining_days} days. "
                    f"Requested: {application.total_days} days."
                )
            )

        balance.used_days += application.total_days

    new_approval = Approval(
        application_id=application_id,
        approver_id=current_employee.employee_id,
        decision=decision,
        comments=comments,
        decided_at=datetime.now(timezone.utc)
    )

    application.status = decision
    db.add(new_approval)

    try:
        db.flush()

        db.add(
            AuditLog(
                actor_id=current_employee.employee_id,
                action=f"leave_application_{decision}",
                entity_type="leave_application",
                entity_id=application_id
            )
        )

        db.commit()
        db.refresh(new_approval)

    except Exception:
        db.rollback()
        raise

    return new_approval


# 2. Get approval records
@router.get("/", response_model=list[ApprovalResponse])
def get_approvals(
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    if current_employee.role == "hr_admin":
        return db.query(Approval).order_by(
            Approval.approval_id
        ).all()

    if current_employee.role == "manager":
        return (
            db.query(Approval)
            .join(
                LeaveApplication,
                Approval.application_id == LeaveApplication.application_id
            )
            .join(
                Employee,
                LeaveApplication.employee_id == Employee.employee_id
            )
            .filter(Employee.manager_id == current_employee.employee_id)
            .order_by(Approval.approval_id)
            .all()
        )

    raise HTTPException(
        status_code=403,
        detail="You do not have permission to view approval records"
    )


# 3. Get one approval by ID
@router.get("/{approval_id}", response_model=ApprovalResponse)
def get_approval(
    approval_id: int,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    approval = db.query(Approval).filter(
        Approval.approval_id == approval_id
    ).first()

    if not approval:
        raise HTTPException(
            status_code=404,
            detail="Approval record not found"
        )

    if current_employee.role == "hr_admin":
        return approval

    if current_employee.role == "manager":
        application = db.query(LeaveApplication).filter(
            LeaveApplication.application_id == approval.application_id
        ).first()

        applicant = db.query(Employee).filter(
            Employee.employee_id == application.employee_id
        ).first() if application else None

        if applicant and applicant.manager_id == current_employee.employee_id:
            return approval

    raise HTTPException(
        status_code=403,
        detail="You do not have permission to view this approval record"
    )
