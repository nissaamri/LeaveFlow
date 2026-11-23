
from datetime import datetime
from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator
)


class ApprovalCreate(BaseModel):
    application_id: int = Field(gt=0)
    decision: Literal["approved", "rejected"]
    comments: str | None = None

    @field_validator("comments")
    @classmethod
    def validate_comments(cls, value: str | None):
        if value is not None:
            value = value.strip()

            if not value:
                return None

        return value


class ApprovalResponse(BaseModel):
    approval_id: int
    application_id: int
    approver_id: int
    decision: Literal["approved", "rejected"]
    comments: str | None
    decided_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
