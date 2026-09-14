from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.domain.enums import ReportStatus, ReportUrgency


class ReportCreate(BaseModel):
    tipo: str = Field(min_length=3, max_length=80)
    urgencia: ReportUrgency = ReportUrgency.medio
    descripcion: str = Field(min_length=4, max_length=800)
    direccion: str = Field(default="", max_length=240)
    lat: float | None = None
    lng: float | None = None
    fotos: list[str] = Field(default_factory=list, max_length=2)
    evidencia_ids: list[UUID] = Field(default_factory=list, max_length=2)


class ReportOut(BaseModel):
    id: UUID
    public_id: str
    user_id: UUID
    tipo: str
    urgencia: ReportUrgency
    estado: ReportStatus
    descripcion: str
    direccion: str
    lat: float | None
    lng: float | None
    fotos: list[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class ReportStatusUpdate(BaseModel):
    estado: ReportStatus
