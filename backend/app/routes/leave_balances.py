
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_employee, require_roles
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


# Check whether an employee can view a particular leave balance
def check_balance_access(
    balance: LeaveBalance,
    current_employee: Employee,
    db: Session
):
    # HR Admin can access every balance
    if current_employee.role == "hr_admin":
        return

    # Employees can access their own balances
    if balance.employee_id == current_employee.employee_id:
        return

    # Managers can access balances belonging to direct reports
    if current_employee.role == "manager":
        balance_employee = db.query(Employee).filter(
            Employee.employee_id == balance.employee_id
        ).first()

        if (
            balance_employee
            and balance_employee.manager_id == current_employee.employee_id
        ):
            return

    raise HTTPException(
        status_code=403,
        detail="You do not have permission to access this leave balance"
    )


# 1. Create a leave balance - HR Admin only
@router.post(
    "/",
    response_model=LeaveBalanceResponse,
    dependencies=[Depends(require_roles("hr_admin"))]
)
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
def get_leave_balances(
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    query = db.query(LeaveBalance)

    if current_employee.role == "hr_admin":
        pass

    elif current_employee.role == "manager":
        query = query.join(
            Employee,
            LeaveBalance.employee_id == Employee.employee_id
        ).filter(
            (Employee.employee_id == current_employee.employee_id)
            | (Employee.manager_id == current_employee.employee_id)
        )

    else:
        query = query.filter(
            LeaveBalance.employee_id == current_employee.employee_id
        )

    return query.order_by(LeaveBalance.balance_id).all()


# 3. Get one leave balance by ID
@router.get("/{balance_id}", response_model=LeaveBalanceResponse)
def get_leave_balance(
    balance_id: int,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    balance = db.query(LeaveBalance).filter(
        LeaveBalance.balance_id == balance_id
    ).first()

    if not balance:
        raise HTTPException(
            status_code=404,
            detail="Leave balance not found"
        )

    check_balance_access(balance, current_employee, db)

    return balance


# 4. Update a leave balance - HR Admin only
@router.put(
    "/{balance_id}",
    response_model=LeaveBalanceResponse,
    dependencies=[Depends(require_roles("hr_admin"))]
)
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


# 5. Delete a leave balance - HR Admin only
@router.delete(
    "/{balance_id}",
    dependencies=[Depends(require_roles("hr_admin"))]
)
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