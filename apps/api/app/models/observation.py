from datetime import date, datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import Date, DateTime, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Observation(Base):
    __tablename__ = "observations"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    space_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("spaces.id"), index=True)
    fecha: Mapped[date] = mapped_column(Date, index=True)
    texto: Mapped[str] = mapped_column(Text)
    autor: Mapped[str] = mapped_column(String(120))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    space = relationship("Space", back_populates="observations")
