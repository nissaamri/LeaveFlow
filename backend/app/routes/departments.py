
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_employee, require_roles
from app.models.department import Department
from app.models.employee import Employee
from app.schemas.department import DepartmentCreate, DepartmentResponse


router = APIRouter(
    prefix="/departments",
    tags=["Departments"]
)


# 1. Create a department - HR Admin only
@router.post(
    "/",
    response_model=DepartmentResponse,
    dependencies=[Depends(require_roles("hr_admin"))]
)
def create_department(
    department: DepartmentCreate,
    db: Session = Depends(get_db)
):
    existing_department = db.query(Department).filter(
        Department.department_name == department.department_name
    ).first()

    if existing_department:
        raise HTTPException(
            status_code=400,
            detail="Department already exists"
        )

    new_department = Department(
        department_name=department.department_name
    )

    db.add(new_department)
    db.commit()
    db.refresh(new_department)

    return new_department


# 2. Get all departments - all authenticated users
@router.get(
    "/",
    response_model=list[DepartmentResponse]
)
def get_departments(
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    departments = db.query(Department).order_by(
        Department.department_id
    ).all()

    return departments


# 3. Get one department by ID - all authenticated users
@router.get(
    "/{department_id}",
    response_model=DepartmentResponse
)
def get_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    department = db.query(Department).filter(
        Department.department_id == department_id
    ).first()

    if not department:
        raise HTTPException(
            status_code=404,
            detail="Department not found"
        )

    return department


# 4. Update a department - HR Admin only
@router.put(
    "/{department_id}",
    response_model=DepartmentResponse,
    dependencies=[Depends(require_roles("hr_admin"))]
)
def update_department(
    department_id: int,
    department_data: DepartmentCreate,
    db: Session = Depends(get_db)
):
    department = db.query(Department).filter(
        Department.department_id == department_id
    ).first()

    if not department:
        raise HTTPException(
            status_code=404,
            detail="Department not found"
        )

    existing_department = db.query(Department).filter(
        Department.department_name == department_data.department_name,
        Department.department_id != department_id
    ).first()

    if existing_department:
        raise HTTPException(
            status_code=400,
            detail="Department name already exists"
        )

    department.department_name = department_data.department_name

    db.commit()
    db.refresh(department)

    return department


# 5. Delete a department - HR Admin only
@router.delete(
    "/{department_id}",
    dependencies=[Depends(require_roles("hr_admin"))]
)
def delete_department(
    department_id: int,
    db: Session = Depends(get_db)
):
    department = db.query(Department).filter(
        Department.department_id == department_id
    ).first()

    if not department:
        raise HTTPException(
            status_code=404,
            detail="Department not found"
        )

    db.delete(department)
    db.commit()

    return {
        "message": "Department deleted successfully"
    }
