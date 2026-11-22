from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.approval import Approval
from app.models.employee import Employee
from app.models.leave_application import LeaveApplication
from app.schemas.approval import ApprovalResponse


router = APIRouter(
    prefix="/approvals",
    tags=["Approvals"]
)


# 1. Create an approval decision
@router.post("/", response_model=ApprovalResponse)
def create_approval(
    application_id: int,
    approver_id: int,
    decision: str,
    comments: str | None = None,
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

    approver = db.query(Employee).filter(
        Employee.employee_id == approver_id
    ).first()

    if not approver:
        raise HTTPException(
            status_code=404,
            detail="Approver not found"
        )

    if approver.role not in ["manager", "hr_admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only managers or HR administrators can approve leave"
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

    new_approval = Approval(
        application_id=application_id,
        approver_id=approver_id,
        decision=decision,
        comments=comments,
        decided_at=datetime.utcnow()
    )

    application.status = decision

    db.add(new_approval)
    db.commit()
    db.refresh(new_approval)

    return new_approval


# 2. Get all approval records
@router.get("/", response_model=list[ApprovalResponse])
def get_approvals(db: Session = Depends(get_db)):
    return db.query(Approval).order_by(
        Approval.approval_id
    ).all()


# 3. Get one approval by ID
@router.get("/{approval_id}", response_model=ApprovalResponse)
def get_approval(
    approval_id: int,
    db: Session = Depends(get_db)
):
    approval = db.query(Approval).filter(
        Approval.approval_id == approval_id
    ).first()

    if not approval:
        raise HTTPException(
            status_code=404,
            detail="Approval record not found"
        )

    return approval
