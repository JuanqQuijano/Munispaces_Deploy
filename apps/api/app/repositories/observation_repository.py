from datetime import date
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.observation import Observation


class ObservationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_for_space(self, space_id: UUID, fecha: date | None = None) -> list[Observation]:
        stmt = (
            select(Observation)
            .where(Observation.space_id == space_id)
            .order_by(Observation.created_at.desc())
        )
        if fecha:
            stmt = stmt.where(Observation.fecha == fecha)
        return list(self.db.scalars(stmt))

    def add(self, observation: Observation) -> Observation:
        self.db.add(observation)
        self.db.flush()
        return observation
