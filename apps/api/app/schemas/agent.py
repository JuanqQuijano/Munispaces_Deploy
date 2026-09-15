from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

from app.domain.enums import ReportUrgency


class ChatMessageIn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2000)


class AgentAttachmentIn(BaseModel):
    tipo: Literal["imagen"]
    evidencia_id: UUID


class AgentChatRequest(BaseModel):
    mensajes: list[ChatMessageIn] = Field(min_length=1, max_length=12)
    adjuntos: list[AgentAttachmentIn] = Field(default_factory=list, max_length=2)
    lat: float | None = None
    lng: float | None = None


class ReportDraftOut(BaseModel):
    tipo: str
    descripcion: str
    urgencia: ReportUrgency = ReportUrgency.medio
    evidencia_ids: list[UUID] = Field(default_factory=list)
    lat: float | None = None
    lng: float | None = None
    direccion: str = ""
    espacio_id: UUID | None = None
    espacio_nombre: str = ""


class AgentAction(BaseModel):
    type: str
    url: str | None = None
    draft: ReportDraftOut | None = None


class AgentChatResponse(BaseModel):
    respuesta: str
    accion: AgentAction | None = None
