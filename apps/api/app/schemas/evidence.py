from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class EvidenceOut(BaseModel):
    id: UUID
    content_type: str
    data_url: str
    expires_at: datetime
    report_id: UUID | None = None

    model_config = {"from_attributes": True}
