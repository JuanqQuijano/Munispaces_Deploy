from datetime import date
from uuid import UUID

from sqlalchemy.orm import Session

from app.domain.exceptions import DomainError, NotFoundError
from app.domain.geo import require_admin_space_id
from app.models.observation import Observation
from app.models.user import User
from app.repositories.observation_repository import ObservationRepository
from app.repositories.space_repository import SpaceRepository
from app.schemas.observation import ObservationCreate


class ObservationService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = ObservationRepository(db)
        self.spaces = SpaceRepository(db)

    def list_for_space(self, user: User, space_id: UUID, fecha: date | None = None) -> list[Observation]:
        if space_id != require_admin_space_id(user):
            raise DomainError("Solo puedes ver observaciones de tu espacio.", 403)
        if not self.spaces.get_by_id(space_id):
            raise NotFoundError("Espacio no encontrado.")
        return self.repo.list_for_space(space_id, fecha)

    def create(self, user: User, payload: ObservationCreate) -> Observation:
        if payload.space_id != require_admin_space_id(user):
            raise DomainError("Solo puedes anotar en tu espacio.", 403)
        if not self.spaces.get_by_id(payload.space_id):
            raise NotFoundError("Espacio no encontrado.")
        observation = Observation(
            space_id=payload.space_id,
            fecha=payload.fecha,
            texto=payload.texto.strip(),
            autor=user.nombre or user.username or "Administrador",
        )
        self.repo.add(observation)
        self.db.commit()
        self.db.refresh(observation)
        return observation
