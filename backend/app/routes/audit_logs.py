from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.audit_log import AuditLog
from app.models.employee import Employee
from app.schemas.audit_log import AuditLogResponse


router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs"]
)


# 1. Create an audit log
@router.post("/", response_model=AuditLogResponse)
def create_audit_log(
    actor_id: int,
    action: str,
    entity_type: str,
    entity_id: int,
    db: Session = Depends(get_db)
):
    actor = db.query(Employee).filter(
        Employee.employee_id == actor_id
    ).first()

    if not actor:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    new_log = AuditLog(
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id
    )

    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    return new_log


# 2. Get all audit logs
@router.get("/", response_model=list[AuditLogResponse])
def get_audit_logs(
    actor_id: int | None = None,
    action: str | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)

    if actor_id is not None:
        query = query.filter(
            AuditLog.actor_id == actor_id
        )

    if action:
        query = query.filter(
            AuditLog.action.ilike(f"%{action}%")
        )

    return query.order_by(
        AuditLog.created_at.desc()
    ).all()


# 3. Get one audit log by ID
@router.get("/{audit_id}", response_model=AuditLogResponse)
def get_audit_log(
    audit_id: int,
    db: Session = Depends(get_db)
):
    log = db.query(AuditLog).filter(
        AuditLog.audit_id == audit_id
    ).first()

    if not log:
        raise HTTPException(
            status_code=404,
            detail="Audit log not found"
        )

    return log