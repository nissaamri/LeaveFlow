
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ApprovalCreate(BaseModel):
    application_id: int
    decision: str
    comments: str | None = None


class ApprovalResponse(BaseModel):
    approval_id: int
    application_id: int
    approver_id: int
    decision: str
    comments: str | None
    decided_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
