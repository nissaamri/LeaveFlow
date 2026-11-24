
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password, require_roles
from app.models.employee import Employee
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse
)


router = APIRouter(
    prefix="/employees",
    tags=["Employees"]
)


# Only HR administrators can manage employee records.


# 1. Create an employee
@router.post(
    "/",
    response_model=EmployeeResponse,
    dependencies=[Depends(require_roles("hr_admin"))]
)
def create_employee(
    employee: EmployeeCreate,
    db: Session = Depends(get_db)
):
    existing_employee = db.query(Employee).filter(
        Employee.email == employee.email
    ).first()

    if existing_employee:
        raise HTTPException(
            status_code=400,
            detail="Employee email already exists"
        )

    new_employee = Employee(
        full_name=employee.full_name,
        email=employee.email,
        password_hash=hash_password(employee.password),
        role=employee.role,
        department_id=employee.department_id,
        manager_id=employee.manager_id
    )

    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)

    return new_employee


# 2. Get all employees
@router.get(
    "/",
    response_model=list[EmployeeResponse],
    dependencies=[Depends(require_roles("hr_admin"))]
)
def get_employees(db: Session = Depends(get_db)):
    return db.query(Employee).order_by(
        Employee.employee_id
    ).all()


# 3. Get one employee by ID
@router.get(
    "/{employee_id}",
    response_model=EmployeeResponse,
    dependencies=[Depends(require_roles("hr_admin"))]
)
def get_employee(
    employee_id: int,
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

    return employee


# 4. Update an employee
@router.put(
    "/{employee_id}",
    response_model=EmployeeResponse,
    dependencies=[Depends(require_roles("hr_admin"))]
)
def update_employee(
    employee_id: int,
    employee_data: EmployeeUpdate,
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

    existing_employee = db.query(Employee).filter(
        Employee.email == employee_data.email,
        Employee.employee_id != employee_id
    ).first()

    if existing_employee:
        raise HTTPException(
            status_code=400,
            detail="Employee email already exists"
        )

    employee.full_name = employee_data.full_name
    employee.email = employee_data.email
    employee.role = employee_data.role
    employee.department_id = employee_data.department_id
    employee.manager_id = employee_data.manager_id

    # Only change the password when a new one is provided.
    if employee_data.password:
        employee.password_hash = hash_password(
            employee_data.password
        )

    db.commit()
    db.refresh(employee)

    return employee


# 5. Delete an employee
@router.delete(
    "/{employee_id}",
    dependencies=[Depends(require_roles("hr_admin"))]
)
def delete_employee(
    employee_id: int,
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

    db.delete(employee)
    db.commit()

    return {
        "message": "Employee deleted successfully"
    }
