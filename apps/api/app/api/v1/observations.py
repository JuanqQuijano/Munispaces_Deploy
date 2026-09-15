from datetime import date
from uuid import UUID

from fastapi import APIRouter

from app.core.deps import AdminUser, DbSession
from app.schemas.observation import ObservationCreate, ObservationOut
from app.services.observation_service import ObservationService

router = APIRouter(prefix="/observations", tags=["observaciones"])


@router.get("", response_model=list[ObservationOut], summary="Listar observaciones")
def list_observations(
    space_id: UUID, db: DbSession, admin: AdminUser, fecha: date | None = None
) -> list[ObservationOut]:
    rows = ObservationService(db).list_for_space(admin, space_id, fecha)
    return [ObservationOut.model_validate(row) for row in rows]


@router.post("", response_model=ObservationOut, summary="Crear observacion")
def create_observation(
    payload: ObservationCreate, db: DbSession, admin: AdminUser
) -> ObservationOut:
    return ObservationOut.model_validate(ObservationService(db).create(admin, payload))
