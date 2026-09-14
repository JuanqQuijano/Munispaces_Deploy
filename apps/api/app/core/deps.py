from collections.abc import Callable
from typing import Annotated
from uuid import UUID

import jwt
from fastapi import Cookie, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import ACCESS_COOKIE, decode_token
from app.domain.enums import UserRole
from app.models.user import User
from app.repositories.user_repository import UserRepository

DbSession = Annotated[Session, Depends(get_db)]


def _extract_access_token(
    access_cookie: str | None,
    authorization: str | None,
) -> str | None:
    if access_cookie:
        return access_cookie
    if authorization and authorization.lower().startswith("bearer "):
        return authorization.split(" ", 1)[1].strip()
    return None


def get_current_user(
    db: DbSession,
    ms_access: Annotated[str | None, Cookie()] = None,
    authorization: Annotated[str | None, Header()] = None,
) -> User:
    token = _extract_access_token(ms_access, authorization)
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "No autenticado.")

    try:
        payload = decode_token(token)
    except jwt.PyJWTError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token invalido o vencido.") from exc

    if payload.get("typ") != "access":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token invalido.")

    user = UserRepository(db).get_by_id(UUID(payload["sub"]))
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Usuario no encontrado.")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def get_current_user_optional(
    db: DbSession,
    ms_access: Annotated[str | None, Cookie()] = None,
    authorization: Annotated[str | None, Header()] = None,
) -> User | None:
    token = _extract_access_token(ms_access, authorization)
    if not token:
        return None
    try:
        payload = decode_token(token)
    except jwt.PyJWTError:
        return None
    if payload.get("typ") != "access":
        return None
    try:
        return UserRepository(db).get_by_id(UUID(payload["sub"]))
    except Exception:
        return None


OptionalUser = Annotated[User | None, Depends(get_current_user_optional)]


def require_role(*roles: UserRole) -> Callable[[User], User]:
    def dependency(user: CurrentUser) -> User:
        if user.role not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "No tienes permiso para esta accion.")
        return user

    return dependency


AdminUser = Annotated[User, Depends(require_role(UserRole.admin))]
CitizenUser = Annotated[User, Depends(require_role(UserRole.ciudadano))]
