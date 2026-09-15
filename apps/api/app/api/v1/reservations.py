from fastapi import APIRouter

from app.core.deps import AdminUser, CurrentUser, DbSession
from app.domain.enums import UserRole
from app.domain.exceptions import DomainError
from app.schemas.reservation import ReservationCreate, ReservationOut, TramitarRequest
from app.services.reservation_service import ReservationService

router = APIRouter(prefix="/reservations", tags=["reservas"])


@router.post("", response_model=ReservationOut, summary="Crear reserva")
def create_reservation(payload: ReservationCreate, db: DbSession, user: CurrentUser) -> ReservationOut:
    service = ReservationService(db)
    return service.to_out(service.create(user, payload))


@router.get("", response_model=list[ReservationOut], summary="Listar reservas")
def list_reservations(db: DbSession, user: CurrentUser) -> list[ReservationOut]:
    service = ReservationService(db)
    rows = service.list_admin(user) if user.role == UserRole.admin else service.list_mine(user)
    return [service.to_out(row) for row in rows]


@router.post("/tramitar", response_model=ReservationOut, summary="Tramitar reserva por QR")
def tramitar(payload: TramitarRequest, db: DbSession, admin: AdminUser) -> ReservationOut:
    service = ReservationService(db)
    public_id, token = payload.public_id, payload.token
    if payload.payload:
        public_id, token = service.parse_qr_payload(payload.payload)
    if not public_id or not token:
        raise DomainError("Falta el QR o el token de la reserva.", 422)
    return service.to_out(service.tramitar(admin, public_id, token))
