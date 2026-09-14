from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.space import Space


class SpaceRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_all(self, distrito: str | None = None) -> list[Space]:
        stmt = select(Space).order_by(Space.nombre)
        if distrito:
            stmt = stmt.where(Space.distrito.ilike(distrito))
        return list(self.db.scalars(stmt))

    def get_by_id(self, space_id: UUID) -> Space | None:
        return self.db.get(Space, space_id)

    def get_by_code(self, code: str) -> Space | None:
        return self.db.scalar(select(Space).where(Space.code == code))

    def add(self, space: Space) -> Space:
        self.db.add(space)
        self.db.flush()
        return space
