from datetime import date, datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, String, Uuid
from sqlalchemy.dialects.sqlite import JSON as SQLITE_JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.core.database import Base
from app.domain.enums import ReservationStatus


class Reservation(Base):
    __tablename__ = "reservations"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    public_id: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    space_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("spaces.id"), index=True)
    user_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("users.id"), index=True)
    fecha: Mapped[date] = mapped_column(Date, index=True)
    slots: Mapped[list[int]] = mapped_column(JSON().with_variant(SQLITE_JSON(), "sqlite"))
    duracion: Mapped[int] = mapped_column(Integer)
    costo: Mapped[int] = mapped_column(Integer)
    estado: Mapped[ReservationStatus] = mapped_column(
        Enum(ReservationStatus, native_enum=False, length=20),
        default=ReservationStatus.confirmada,
    )
    token: Mapped[str] = mapped_column(String(40), unique=True)
    tramitada_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    space = relationship("Space", back_populates="reservations")
    user = relationship("User", back_populates="reservations")
