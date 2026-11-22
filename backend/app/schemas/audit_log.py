from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AuditLogResponse(BaseModel):
    audit_id: int
    actor_id: int
    action: str
    entity_type: str
    entity_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)