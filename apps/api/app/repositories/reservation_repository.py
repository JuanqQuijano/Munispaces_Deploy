from datetime import date
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.domain.enums import ACTIVE_RESERVATION_STATUSES, ReservationStatus
from app.models.reservation import Reservation


class ReservationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, reservation_id: UUID) -> Reservation | None:
        return self.db.scalar(
            select(Reservation)
            .options(joinedload(Reservation.space), joinedload(Reservation.user))
            .where(Reservation.id == reservation_id)
        )

    def get_by_public_id(self, public_id: str) -> Reservation | None:
        return self.db.scalar(
            select(Reservation)
            .options(joinedload(Reservation.space), joinedload(Reservation.user))
            .where(Reservation.public_id == public_id)
        )

    def list_for_user(self, user_id: UUID) -> list[Reservation]:
        return list(
            self.db.scalars(
                select(Reservation)
                .options(joinedload(Reservation.space))
                .where(Reservation.user_id == user_id)
                .order_by(Reservation.created_at.desc())
            )
        )

    def list_for_space(self, space_id: UUID) -> list[Reservation]:
        stmt = (
            select(Reservation)
            .options(joinedload(Reservation.space), joinedload(Reservation.user))
            .where(Reservation.space_id == space_id)
            .order_by(Reservation.created_at.desc())
        )
        return list(self.db.scalars(stmt).unique())

    def list_active_for_space_date(self, space_id: UUID, fecha: date) -> list[Reservation]:
        stmt = select(Reservation).where(
            Reservation.space_id == space_id,
            Reservation.fecha == fecha,
            Reservation.estado.in_(ACTIVE_RESERVATION_STATUSES),
        )
        return list(self.db.scalars(stmt))

    def lock_active_for_space_date(self, space_id: UUID, fecha: date) -> list[Reservation]:
        stmt = (
            select(Reservation)
            .where(
                Reservation.space_id == space_id,
                Reservation.fecha == fecha,
                Reservation.estado.in_(ACTIVE_RESERVATION_STATUSES),
            )
            .with_for_update()
        )
        return list(self.db.scalars(stmt))

    def add(self, reservation: Reservation) -> Reservation:
        self.db.add(reservation)
        self.db.flush()
        return reservation

    def count(self) -> int:
        return int(self.db.scalar(select(func.count()).select_from(Reservation)) or 0)
