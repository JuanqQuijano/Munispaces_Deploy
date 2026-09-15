from datetime import date, datetime, timedelta, timezone

from fastapi import Response
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    ACCESS_COOKIE,
    REFRESH_COOKIE,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.domain.enums import UserRole
from app.domain.exceptions import AuthError, DomainError
from app.domain.lima import add_months, es_distrito_lima, normalizar_distrito
from app.models.user import User
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.users = UserRepository(db)
        self.refresh_tokens = RefreshTokenRepository(db)

    def register(self, payload: RegisterRequest) -> User:
        if not payload.acepto_terminos:
            raise DomainError("Debes aceptar los terminos y condiciones.")
        if payload.password_confirm is not None and payload.password_confirm != payload.password:
            raise DomainError("Las contrasenas no coinciden.")
        if not es_distrito_lima(payload.distrito):
            raise DomainError("Selecciona un distrito de Lima Metropolitana.")
        tipo_dni = (payload.tipo_dni or "azul").strip().lower()
        if tipo_dni not in {"azul", "electronico"}:
            raise DomainError("Tipo de DNI no valido.")
        if tipo_dni == "azul":
            ubigeo = (payload.ubigeo or "").strip()
            if not ubigeo:
                raise DomainError("Ingresa tu codigo de ubigeo.")
            if not payload.fecha_nacimiento:
                raise DomainError("Ingresa tu fecha de nacimiento.")
            if not payload.no_caduca and not payload.fecha_caducidad:
                raise DomainError("Ingresa la fecha de caducidad o marca No caduca.")
        if self.users.get_by_dni(payload.dni):
            raise DomainError("Ya existe una cuenta con ese DNI.", 409)
        today = date.today()
        user = User(
            dni=payload.dni,
            nombre=payload.nombre.strip(),
            distrito=normalizar_distrito(payload.distrito),
            tipo_documento=(payload.tipo_documento or "DNI").strip() or "DNI",
            tipo_dni=tipo_dni,
            ubigeo=(payload.ubigeo or "").strip() or None,
            fecha_caducidad=None if payload.no_caduca else payload.fecha_caducidad,
            no_caduca=payload.no_caduca,
            fecha_nacimiento=payload.fecha_nacimiento,
            distrito_bloqueado_hasta=add_months(today, 5),
            password_hash=hash_password(payload.password),
            role=UserRole.ciudadano,
        )
        self.users.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def login(self, payload: LoginRequest) -> User:
        user = self.users.get_by_identifier(payload.identifier.strip())
        if not user or not verify_password(payload.password, user.password_hash):
            raise AuthError("Usuario o contrasena incorrectos.")
        return user

    def issue_cookies(self, response: Response, user: User) -> None:
        access = create_access_token(user_id=user.id, role=user.role.value)
        refresh = create_refresh_token(user_id=user.id)
        expires = datetime.now(timezone.utc) + timedelta(days=settings.jwt_refresh_days)
        self.refresh_tokens.add(user.id, refresh, expires)
        self.db.commit()
        self._set_cookie(response, ACCESS_COOKIE, access, settings.jwt_access_minutes * 60)
        self._set_cookie(response, REFRESH_COOKIE, refresh, settings.jwt_refresh_days * 24 * 3600)

    def refresh(self, response: Response, refresh_token: str | None) -> User:
        if not refresh_token:
            raise AuthError("No hay sesion para renovar.")
        stored = self.refresh_tokens.get_valid(refresh_token)
        if not stored:
            raise AuthError("Sesion expirada. Vuelve a iniciar sesion.")
        try:
            payload = decode_token(refresh_token)
        except Exception as exc:
            raise AuthError("Sesion invalida.") from exc
        if payload.get("typ") != "refresh":
            raise AuthError("Sesion invalida.")
        user = self.users.get_by_id(stored.user_id)
        if not user:
            raise AuthError("Usuario no encontrado.")
        self.refresh_tokens.revoke(refresh_token)
        self.issue_cookies(response, user)
        return user

    def logout(self, response: Response, refresh_token: str | None) -> None:
        if refresh_token:
            self.refresh_tokens.revoke(refresh_token)
            self.db.commit()
        # Must match set_cookie flags or browsers keep SameSite=None cookies.
        for name in (ACCESS_COOKIE, REFRESH_COOKIE):
            response.delete_cookie(
                name,
                path="/",
                secure=settings.cookie_secure,
                httponly=True,
                samesite=settings.cookie_samesite,  # type: ignore[arg-type]
            )

    def _set_cookie(self, response: Response, name: str, value: str, max_age: int) -> None:
        response.set_cookie(
            key=name,
            value=value,
            httponly=True,
            secure=settings.cookie_secure,
            samesite=settings.cookie_samesite,  # type: ignore[arg-type]
            max_age=max_age,
            path="/",
        )
