from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ObservationCreate(BaseModel):
    space_id: UUID
    fecha: date
    texto: str = Field(min_length=2, max_length=800)


class ObservationOut(BaseModel):
    id: UUID
    space_id: UUID
    fecha: date
    texto: str
    autor: str
    created_at: datetime

    model_config = {"from_attributes": True}
