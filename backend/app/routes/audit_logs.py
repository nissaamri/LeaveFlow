
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_roles, get_current_employee
from app.models.audit_log import AuditLog
from app.models.employee import Employee
from app.schemas.audit_log import AuditLogResponse


router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs"]
)


# 1. Create a manual audit log - HR Admin only
@router.post(
    "/",
    response_model=AuditLogResponse,
    dependencies=[Depends(require_roles("hr_admin"))]
)
def create_audit_log(
    action: str,
    entity_type: str,
    entity_id: int,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    action = action.strip()
    entity_type = entity_type.strip()

    if not action or not entity_type:
        raise HTTPException(
            status_code=400,
            detail="Action and entity type cannot be empty"
        )

    if entity_id <= 0:
        raise HTTPException(
            status_code=400,
            detail="Entity ID must be greater than zero"
        )

    new_log = AuditLog(
        actor_id=current_employee.employee_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id
    )

    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    return new_log


# 2. Get all audit logs, newest first - HR Admin only
@router.get(
    "/",
    response_model=list[AuditLogResponse],
    dependencies=[Depends(require_roles("hr_admin"))]
)
def get_audit_logs(
    actor_id: int | None = None,
    action: str | None = None,
    entity_type: str | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)

    if actor_id is not None:
        query = query.filter(
            AuditLog.actor_id == actor_id
        )

    if action:
        query = query.filter(
            AuditLog.action.ilike(f"%{action.strip()}%")
        )

    if entity_type:
        query = query.filter(
            AuditLog.entity_type.ilike(f"%{entity_type.strip()}%")
        )

    return query.order_by(
        AuditLog.created_at.desc(),
        AuditLog.audit_id.desc()
    ).all()


# 3. Get one audit log by ID - HR Admin only
@router.get(
    "/{audit_id}",
    response_model=AuditLogResponse,
    dependencies=[Depends(require_roles("hr_admin"))]
)
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