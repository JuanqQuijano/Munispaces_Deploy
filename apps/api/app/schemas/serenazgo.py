from uuid import UUID

from pydantic import BaseModel, Field


class SerenazgoAlertRequest(BaseModel):
    report_id: UUID | None = None
    cantidad: int = Field(default=1, ge=1, le=5)


class SerenazgoAlertResponse(BaseModel):
    enviados: int
    detalle: str
