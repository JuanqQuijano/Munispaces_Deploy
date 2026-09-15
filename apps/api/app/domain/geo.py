from math import atan2, cos, radians, sin, sqrt
from uuid import UUID

from app.models.space import Space
from app.models.user import User
from app.domain.enums import UserRole
from app.domain.exceptions import DomainError


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    radius = 6371
    d_lat = radians(lat2 - lat1)
    d_lng = radians(lng2 - lng1)
    a = sin(d_lat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lng / 2) ** 2
    return radius * 2 * atan2(sqrt(a), sqrt(1 - a))


def sort_spaces_by_distance(spaces: list[Space], lat: float, lng: float) -> list[Space]:
    decorated: list[Space] = []
    for space in spaces:
        space.distancia_km = round(haversine_km(lat, lng, space.lat, space.lng), 2)  # type: ignore[attr-defined]
        decorated.append(space)
    decorated.sort(key=lambda item: (getattr(item, "distancia_km") or 0, item.code))
    return decorated


def nearest_space(spaces: list[Space], lat: float, lng: float) -> Space | None:
    ordered = sort_spaces_by_distance(spaces, lat, lng)
    return ordered[0] if ordered else None


def require_admin_space_id(user: User) -> UUID:
    if user.role != UserRole.admin:
        raise DomainError("No tienes permiso para esta accion.", 403)
    if not user.espacio_id:
        raise DomainError("Este administrador no tiene un espacio asignado.", 403)
    return user.espacio_id
