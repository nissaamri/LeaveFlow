from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.leave_type import LeaveType
from app.schemas.leave_type import LeaveTypeCreate, LeaveTypeResponse


router = APIRouter(
    prefix="/leave-types",
    tags=["Leave Types"]
)


# 1. Create a leave type
@router.post("/", response_model=LeaveTypeResponse)
def create_leave_type(
    leave_type: LeaveTypeCreate,
    db: Session = Depends(get_db)
):
    existing_leave_type = db.query(LeaveType).filter(
        LeaveType.leave_type_name == leave_type.leave_type_name
    ).first()

    if existing_leave_type:
        raise HTTPException(
            status_code=400,
            detail="Leave type already exists"
        )

    new_leave_type = LeaveType(
        leave_type_name=leave_type.leave_type_name,
        requires_approval=leave_type.requires_approval,
        is_active=leave_type.is_active
    )

    db.add(new_leave_type)
    db.commit()
    db.refresh(new_leave_type)

    return new_leave_type


# 2. Get all leave types
@router.get("/", response_model=list[LeaveTypeResponse])
def get_leave_types(db: Session = Depends(get_db)):
    return db.query(LeaveType).order_by(
        LeaveType.leave_type_id
    ).all()


# 3. Get one leave type by ID
@router.get("/{leave_type_id}", response_model=LeaveTypeResponse)
def get_leave_type(
    leave_type_id: int,
    db: Session = Depends(get_db)
):
    leave_type = db.query(LeaveType).filter(
        LeaveType.leave_type_id == leave_type_id
    ).first()

    if not leave_type:
        raise HTTPException(
            status_code=404,
            detail="Leave type not found"
        )

    return leave_type


# 4. Update a leave type
@router.put("/{leave_type_id}", response_model=LeaveTypeResponse)
def update_leave_type(
    leave_type_id: int,
    leave_type_data: LeaveTypeCreate,
    db: Session = Depends(get_db)
):
    leave_type = db.query(LeaveType).filter(
        LeaveType.leave_type_id == leave_type_id
    ).first()

    if not leave_type:
        raise HTTPException(
            status_code=404,
            detail="Leave type not found"
        )

    existing_leave_type = db.query(LeaveType).filter(
        LeaveType.leave_type_name == leave_type_data.leave_type_name,
        LeaveType.leave_type_id != leave_type_id
    ).first()

    if existing_leave_type:
        raise HTTPException(
            status_code=400,
            detail="Leave type name already exists"
        )

    leave_type.leave_type_name = leave_type_data.leave_type_name
    leave_type.requires_approval = leave_type_data.requires_approval
    leave_type.is_active = leave_type_data.is_active

    db.commit()
    db.refresh(leave_type)

    return leave_type


# 5. Delete a leave type
@router.delete("/{leave_type_id}")
def delete_leave_type(
    leave_type_id: int,
    db: Session = Depends(get_db)
):
    leave_type = db.query(LeaveType).filter(
        LeaveType.leave_type_id == leave_type_id
    ).first()

    if not leave_type:
        raise HTTPException(
            status_code=404,
            detail="Leave type not found"
        )

    db.delete(leave_type)
    db.commit()

    return {
        "message": "Leave type deleted successfully"
    }