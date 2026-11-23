
from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator
)


class AuditLogResponse(BaseModel):
    audit_id: int = Field(gt=0)
    actor_id: int = Field(gt=0)
    action: str
    entity_type: str
    entity_id: int = Field(gt=0)
    created_at: datetime

    @field_validator("action", "entity_type")
    @classmethod
    def validate_text_fields(cls, value: str):
        value = value.strip()

        if not value:
            raise ValueError("This field cannot be empty")

        return value

    model_config = ConfigDict(from_attributes=True)
