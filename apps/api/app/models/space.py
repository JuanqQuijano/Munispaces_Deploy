from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Space(Base):
    __tablename__ = "spaces"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    nombre: Mapped[str] = mapped_column(String(160))
    distrito: Mapped[str] = mapped_column(String(80), index=True)
    tipo: Mapped[str] = mapped_column(String(80))
    precio_hora: Mapped[int] = mapped_column(Integer)
    rating: Mapped[float] = mapped_column(Float, default=4.5)
    disponible: Mapped[bool] = mapped_column(Boolean, default=True)
    imagen: Mapped[str] = mapped_column(String(500))
    direccion: Mapped[str] = mapped_column(String(240))
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    reservations = relationship("Reservation", back_populates="space")
    observations = relationship("Observation", back_populates="space")
    reports = relationship("Report", back_populates="espacio")
    admins = relationship("User", back_populates="espacio")
