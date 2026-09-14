from uuid import UUID

from pydantic import BaseModel, Field

from app.domain.lima import RESIDENT_DISCOUNT_SOLES


class SpaceOut(BaseModel):
    id: UUID
    code: str
    nombre: str
    distrito: str
    tipo: str
    precio_hora: int
    precio_hora_residente: int
    descuento_residente: int = RESIDENT_DISCOUNT_SOLES
    precio_aplicable: int
    es_residente: bool = False
    rating: float
    disponible: bool
    imagen: str
    direccion: str
    lat: float
    lng: float
    distancia_km: float | None = None

    model_config = {"from_attributes": True}


class SpaceUpdate(BaseModel):
    disponible: bool | None = None
    precio_hora: int | None = Field(default=None, ge=0)
