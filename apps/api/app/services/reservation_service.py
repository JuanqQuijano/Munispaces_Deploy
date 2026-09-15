from datetime import date, datetime, timezone
from secrets import token_hex
from uuid import UUID

from sqlalchemy.orm import Session

from app.domain.enums import DAY_SLOTS, ReservationStatus
from app.domain.exceptions import ConflictError, DomainError, NotFoundError
from app.domain.geo import require_admin_space_id
from app.domain.lima import precio_hora_para
from app.domain.time import is_valid_day_slots, minutes_to_label, slot_range_label, slots_overlap
from app.models.reservation import Reservation
from app.models.user import User
from app.repositories.reservation_repository import ReservationRepository
from app.repositories.space_repository import SpaceRepository
from app.schemas.reservation import AvailabilityOut, AvailabilitySlot, ReservationCreate, ReservationOut


class ReservationService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = ReservationRepository(db)
        self.spaces = SpaceRepository(db)

    def availability(self, space_id: UUID, fecha: date) -> AvailabilityOut:
        space = self.spaces.get_by_id(space_id)
        if not space:
            raise NotFoundError("Espacio no encontrado.")
        occupied = self._occupied_slots(space_id, fecha)
        return AvailabilityOut(
            space_id=space_id,
            fecha=fecha,
            slots=[
                AvailabilitySlot(
                    minutos=slot,
                    etiqueta=minutes_to_label(slot),
                    ocupado=slot in occupied,
                )
                for slot in DAY_SLOTS
            ],
        )

    def has_free_slot(self, space_id: UUID, fecha: date) -> bool:
        occupied = self._occupied_slots(space_id, fecha)
        return any(slot not in occupied for slot in DAY_SLOTS)

    def create(self, user: User, payload: ReservationCreate) -> Reservation:
        if not is_valid_day_slots(payload.slots):
            raise DomainError("Selecciona bloques consecutivos de 1 hora (9:00 am a 5:00 pm).")
        space = self.spaces.get_by_id(payload.space_id)
        if not space:
            raise NotFoundError("Espacio no encontrado.")
        if not space.disponible:
            raise DomainError("Este espacio no admite reservas por ahora.")

        occupied_rows = self.repo.lock_active_for_space_date(space.id, payload.fecha)
        taken: list[int] = []
        for row in occupied_rows:
            taken.extend(row.slots or [])
        if slots_overlap(payload.slots, taken):
            raise ConflictError("Ese horario ya esta reservado para este espacio.")

        ordered = sorted(payload.slots)
        tarifa = precio_hora_para(space.precio_hora, user.distrito, space.distrito)
        reservation = Reservation(
            public_id=f"RES-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
            space_id=space.id,
            user_id=user.id,
            fecha=payload.fecha,
            slots=ordered,
            duracion=len(ordered),
            costo=tarifa * len(ordered),
            estado=ReservationStatus.confirmada,
            token=f"TK-{token_hex(6).upper()}",
        )
        self.repo.add(reservation)
        self.db.commit()
        return self.repo.get_by_id(reservation.id)  # type: ignore[return-value]

    def list_mine(self, user: User) -> list[Reservation]:
        return self.repo.list_for_user(user.id)

    def list_admin(self, user: User) -> list[Reservation]:
        return self.repo.list_for_space(require_admin_space_id(user))

    def tramitar(self, user: User, public_id: str, token: str) -> Reservation:
        reservation = self.repo.get_by_public_id(public_id)
        if not reservation or reservation.token != token:
            raise DomainError("QR o token invalido.", 422)
        if reservation.space_id != require_admin_space_id(user):
            raise DomainError("Esta reserva no pertenece a tu espacio.", 403)
        if reservation.estado == ReservationStatus.tramitada:
            raise DomainError("Esta reserva ya fue tramitada.")
        if reservation.estado == ReservationStatus.culminada:
            raise DomainError("Esta reserva ya culmino.")
        reservation.estado = ReservationStatus.tramitada
        reservation.tramitada_en = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(reservation)
        return reservation

    def to_out(self, reservation: Reservation) -> ReservationOut:
        space = reservation.space
        return ReservationOut(
            id=reservation.id,
            public_id=reservation.public_id,
            space_id=reservation.space_id,
            user_id=reservation.user_id,
            fecha=reservation.fecha,
            slots=reservation.slots,
            hora_texto=slot_range_label(reservation.slots),
            duracion=reservation.duracion,
            costo=reservation.costo,
            estado=reservation.estado,
            qr_payload=f"MUNISPACES:RES:{reservation.public_id}:{reservation.token}",
            espacio_nombre=space.nombre if space else "",
            espacio_distrito=space.distrito if space else "",
            espacio_direccion=space.direccion if space else "",
            espacio_imagen=space.imagen if space else "",
            lat=space.lat if space else None,
            lng=space.lng if space else None,
            created_at=reservation.created_at,
            tramitada_en=reservation.tramitada_en,
        )

    def parse_qr_payload(self, payload: str) -> tuple[str, str]:
        parts = payload.strip().split(":")
        if len(parts) >= 4 and parts[0] == "MUNISPACES" and parts[1] == "RES":
            return parts[2], parts[3]
        raise DomainError("Formato de QR no reconocido.", 422)

    def _occupied_slots(self, space_id: UUID, fecha: date) -> set[int]:
        occupied: set[int] = set()
        for row in self.repo.list_active_for_space_date(space_id, fecha):
            occupied.update(row.slots or [])
        return occupied
