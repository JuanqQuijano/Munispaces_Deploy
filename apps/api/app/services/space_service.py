from uuid import UUID

from sqlalchemy.orm import Session

from app.domain.exceptions import NotFoundError
from app.domain.geo import sort_spaces_by_distance
from app.domain.lima import RESIDENT_DISCOUNT_SOLES, es_residente_del_espacio, precio_hora_para, precio_hora_residente
from app.models.space import Space
from app.models.user import User
from app.repositories.space_repository import SpaceRepository
from app.schemas.space import SpaceOut, SpaceUpdate


class SpaceService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = SpaceRepository(db)

    def list_spaces(
        self,
        distrito: str | None = None,
        lat: float | None = None,
        lng: float | None = None,
    ) -> list[Space]:
        spaces = self.repo.list_all(distrito)
        if lat is None or lng is None:
            return spaces
        return sort_spaces_by_distance(spaces, lat, lng)

    def get(self, space_id: UUID) -> Space:
        space = self.repo.get_by_id(space_id)
        if not space:
            raise NotFoundError("Espacio no encontrado.")
        return space

    def get_by_code_or_name(self, value: str) -> Space | None:
        space = self.repo.get_by_code(value)
        if space:
            return space
        needle = value.strip().upper()
        for item in self.repo.list_all():
            nombre = item.nombre.upper()
            corto = nombre.replace("PARQUE ", "").replace("CENTRO CULTURAL ", "")
            if needle in {item.code.upper(), nombre, corto} or needle in nombre or corto in needle:
                return item
        return None

    def to_out(self, space: Space, user: User | None = None) -> SpaceOut:
        distrito_usuario = user.distrito if user else None
        residente = es_residente_del_espacio(distrito_usuario, space.distrito)
        return SpaceOut(
            id=space.id,
            code=space.code,
            nombre=space.nombre,
            distrito=space.distrito,
            tipo=space.tipo,
            precio_hora=space.precio_hora,
            precio_hora_residente=precio_hora_residente(space.precio_hora),
            descuento_residente=RESIDENT_DISCOUNT_SOLES,
            precio_aplicable=precio_hora_para(space.precio_hora, distrito_usuario, space.distrito),
            es_residente=residente,
            rating=space.rating,
            disponible=space.disponible,
            imagen=space.imagen,
            direccion=space.direccion,
            lat=space.lat,
            lng=space.lng,
            distancia_km=getattr(space, "distancia_km", None),
        )

    def update(self, space_id: UUID, payload: SpaceUpdate) -> Space:
        space = self.get(space_id)
        if payload.disponible is not None:
            space.disponible = payload.disponible
        if payload.precio_hora is not None:
            space.precio_hora = payload.precio_hora
        self.db.commit()
        self.db.refresh(space)
        return space
