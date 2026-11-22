from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.employee import Employee
from app.models.leave_type import LeaveType
from app.models.leave_balance import LeaveBalance
from app.schemas.leave_balance import (
    LeaveBalanceCreate,
    LeaveBalanceResponse
)


router = APIRouter(
    prefix="/leave-balances",
    tags=["Leave Balances"]
)


# 1. Create a leave balance
@router.post("/", response_model=LeaveBalanceResponse)
def create_leave_balance(
    balance: LeaveBalanceCreate,
    db: Session = Depends(get_db)
):
    employee = db.query(Employee).filter(
        Employee.employee_id == balance.employee_id
    ).first()

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    leave_type = db.query(LeaveType).filter(
        LeaveType.leave_type_id == balance.leave_type_id
    ).first()

    if not leave_type:
        raise HTTPException(
            status_code=404,
            detail="Leave type not found"
        )

    if balance.entitlement < 0 or balance.used_days < 0:
        raise HTTPException(
            status_code=400,
            detail="Leave days cannot be negative"
        )

    if balance.used_days > balance.entitlement:
        raise HTTPException(
            status_code=400,
            detail="Used days cannot exceed entitlement"
        )

    existing_balance = db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == balance.employee_id,
        LeaveBalance.leave_type_id == balance.leave_type_id,
        LeaveBalance.year == balance.year
    ).first()

    if existing_balance:
        raise HTTPException(
            status_code=400,
            detail="Leave balance already exists for this employee, leave type and year"
        )

    new_balance = LeaveBalance(
        employee_id=balance.employee_id,
        leave_type_id=balance.leave_type_id,
        entitlement=balance.entitlement,
        used_days=balance.used_days,
        year=balance.year
    )

    db.add(new_balance)
    db.commit()
    db.refresh(new_balance)

    return new_balance


# 2. Get all leave balances
@router.get("/", response_model=list[LeaveBalanceResponse])
def get_leave_balances(db: Session = Depends(get_db)):
    return db.query(LeaveBalance).order_by(
        LeaveBalance.balance_id
    ).all()


# 3. Get one leave balance by ID
@router.get("/{balance_id}", response_model=LeaveBalanceResponse)
def get_leave_balance(
    balance_id: int,
    db: Session = Depends(get_db)
):
    balance = db.query(LeaveBalance).filter(
        LeaveBalance.balance_id == balance_id
    ).first()

    if not balance:
        raise HTTPException(
            status_code=404,
            detail="Leave balance not found"
        )

    return balance


# 4. Update a leave balance
@router.put("/{balance_id}", response_model=LeaveBalanceResponse)
def update_leave_balance(
    balance_id: int,
    balance_data: LeaveBalanceCreate,
    db: Session = Depends(get_db)
):
    balance = db.query(LeaveBalance).filter(
        LeaveBalance.balance_id == balance_id
    ).first()

    if not balance:
        raise HTTPException(
            status_code=404,
            detail="Leave balance not found"
        )

    employee = db.query(Employee).filter(
        Employee.employee_id == balance_data.employee_id
    ).first()

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    leave_type = db.query(LeaveType).filter(
        LeaveType.leave_type_id == balance_data.leave_type_id
    ).first()

    if not leave_type:
        raise HTTPException(
            status_code=404,
            detail="Leave type not found"
        )

    if balance_data.entitlement < 0 or balance_data.used_days < 0:
        raise HTTPException(
            status_code=400,
            detail="Leave days cannot be negative"
        )

    if balance_data.used_days > balance_data.entitlement:
        raise HTTPException(
            status_code=400,
            detail="Used days cannot exceed entitlement"
        )

    existing_balance = db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == balance_data.employee_id,
        LeaveBalance.leave_type_id == balance_data.leave_type_id,
        LeaveBalance.year == balance_data.year,
        LeaveBalance.balance_id != balance_id
    ).first()

    if existing_balance:
        raise HTTPException(
            status_code=400,
            detail="Leave balance already exists for this employee, leave type and year"
        )

    balance.employee_id = balance_data.employee_id
    balance.leave_type_id = balance_data.leave_type_id
    balance.entitlement = balance_data.entitlement
    balance.used_days = balance_data.used_days
    balance.year = balance_data.year

    db.commit()
    db.refresh(balance)

    return balance


# 5. Delete a leave balance
@router.delete("/{balance_id}")
def delete_leave_balance(
    balance_id: int,
    db: Session = Depends(get_db)
):
    balance = db.query(LeaveBalance).filter(
        LeaveBalance.balance_id == balance_id
    ).first()

    if not balance:
        raise HTTPException(
            status_code=404,
            detail="Leave balance not found"
        )

    db.delete(balance)
    db.commit()

    return {
        "message": "Leave balance deleted successfully"
    }