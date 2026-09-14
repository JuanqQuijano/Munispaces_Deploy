from datetime import date, datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import Boolean, Date, DateTime, Enum, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.domain.enums import UserRole


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    dni: Mapped[str | None] = mapped_column(String(8), unique=True, nullable=True)
    username: Mapped[str | None] = mapped_column(String(40), unique=True, nullable=True)
    nombre: Mapped[str] = mapped_column(String(120))
    distrito: Mapped[str] = mapped_column(String(80), default="San Miguel")
    tipo_documento: Mapped[str] = mapped_column(String(20), default="DNI")
    tipo_dni: Mapped[str] = mapped_column(String(20), default="azul")
    ubigeo: Mapped[str | None] = mapped_column(String(10), nullable=True)
    fecha_caducidad: Mapped[date | None] = mapped_column(Date, nullable=True)
    no_caduca: Mapped[bool] = mapped_column(Boolean, default=False)
    fecha_nacimiento: Mapped[date | None] = mapped_column(Date, nullable=True)
    distrito_bloqueado_hasta: Mapped[date | None] = mapped_column(Date, nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, native_enum=False, length=20))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    reservations = relationship("Reservation", back_populates="user")
    reports = relationship("Report", back_populates="user")
    evidences = relationship("Evidence", back_populates="user")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
