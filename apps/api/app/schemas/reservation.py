from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.domain.enums import ReservationStatus


class ReservationCreate(BaseModel):
    space_id: UUID
    fecha: date
    slots: list[int] = Field(min_length=1, max_length=8)


class ReservationOut(BaseModel):
    id: UUID
    public_id: str
    space_id: UUID
    user_id: UUID
    fecha: date
    slots: list[int]
    hora_texto: str
    duracion: int
    costo: int
    estado: ReservationStatus
    qr_payload: str
    espacio_nombre: str
    espacio_distrito: str
    espacio_direccion: str
    espacio_imagen: str
    lat: float | None = None
    lng: float | None = None
    created_at: datetime
    tramitada_en: datetime | None

    model_config = {"from_attributes": True}


class TramitarRequest(BaseModel):
    payload: str | None = None
    public_id: str | None = None
    token: str | None = None


class AvailabilitySlot(BaseModel):
    minutos: int
    etiqueta: str
    ocupado: bool


class AvailabilityOut(BaseModel):
    space_id: UUID
    fecha: date
    slots: list[AvailabilitySlot]
