from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    dni: str = Field(min_length=8, max_length=8, pattern=r"^\d{8}$")
    password: str = Field(min_length=6, max_length=72)
    password_confirm: str | None = None
    nombre: str = Field(min_length=2, max_length=120)
    distrito: str = Field(min_length=2, max_length=80)
    tipo_documento: str = "DNI"
    tipo_dni: str = "azul"
    ubigeo: str | None = None
    fecha_caducidad: date | None = None
    no_caduca: bool = False
    fecha_nacimiento: date | None = None
    acepto_terminos: bool = False


class LoginRequest(BaseModel):
    identifier: str = Field(min_length=3, max_length=40)
    password: str = Field(min_length=1, max_length=72)


class UserOut(BaseModel):
    id: UUID
    dni: str | None
    username: str | None
    nombre: str
    distrito: str
    role: str
    tipo_documento: str = "DNI"
    tipo_dni: str = "azul"
    ubigeo: str | None = None
    fecha_caducidad: date | None = None
    no_caduca: bool = False
    fecha_nacimiento: date | None = None
    distrito_bloqueado_hasta: date | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    user: UserOut
