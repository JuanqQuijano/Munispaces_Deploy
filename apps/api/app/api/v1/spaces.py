from datetime import date
from uuid import UUID

from fastapi import APIRouter, Query

from app.core.deps import AdminUser, DbSession, OptionalUser
from app.schemas.reservation import AvailabilityOut
from app.schemas.space import SpaceOut, SpaceUpdate
from app.services.reservation_service import ReservationService
from app.services.space_service import SpaceService

router = APIRouter(prefix="/spaces", tags=["espacios"])


@router.get("", response_model=list[SpaceOut], summary="Listar espacios")
def list_spaces(
    db: DbSession,
    user: OptionalUser,
    distrito: str | None = None,
    lat: float | None = Query(default=None),
    lng: float | None = Query(default=None),
) -> list[SpaceOut]:
    service = SpaceService(db)
    spaces = service.list_spaces(distrito=distrito, lat=lat, lng=lng)
    return [service.to_out(space, user) for space in spaces]


@router.get("/{space_id}", response_model=SpaceOut, summary="Obtener espacio")
def get_space(space_id: UUID, db: DbSession, user: OptionalUser) -> SpaceOut:
    service = SpaceService(db)
    return service.to_out(service.get(space_id), user)


@router.get("/{space_id}/availability", response_model=AvailabilityOut, summary="Consultar disponibilidad")
def availability(space_id: UUID, db: DbSession, fecha: date) -> AvailabilityOut:
    return ReservationService(db).availability(space_id, fecha)


@router.patch("/{space_id}", response_model=SpaceOut, summary="Actualizar espacio")
def update_space(space_id: UUID, payload: SpaceUpdate, db: DbSession, _admin: AdminUser) -> SpaceOut:
    service = SpaceService(db)
    return service.to_out(service.update(space_id, payload), _admin)
