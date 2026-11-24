
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.models.employee import Employee
from app.schemas.auth import LoginRequest, LoginResponse


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/login", response_model=LoginResponse)
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    employee = db.query(Employee).filter(
        Employee.email == login_data.email
    ).first()

    # Use the same message for unknown emails and wrong passwords.
    if not employee or not verify_password(
        login_data.password,
        employee.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        employee.employee_id
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "employee": {
            "employee_id": employee.employee_id,
            "full_name": employee.full_name,
            "email": employee.email,
            "role": employee.role
        }
    }
