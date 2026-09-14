from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Enum, Float, ForeignKey, String, Text, Uuid
from sqlalchemy.dialects.sqlite import JSON as SQLITE_JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.core.database import Base
from app.domain.enums import ReportStatus, ReportUrgency


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    public_id: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    user_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("users.id"), index=True)
    tipo: Mapped[str] = mapped_column(String(80))
    urgencia: Mapped[ReportUrgency] = mapped_column(Enum(ReportUrgency, native_enum=False, length=20))
    estado: Mapped[ReportStatus] = mapped_column(
        Enum(ReportStatus, native_enum=False, length=20),
        default=ReportStatus.en_proceso,
    )
    descripcion: Mapped[str] = mapped_column(Text)
    direccion: Mapped[str] = mapped_column(String(240), default="")
    lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    fotos: Mapped[list[str]] = mapped_column(JSON().with_variant(SQLITE_JSON(), "sqlite"), default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user = relationship("User", back_populates="reports")
