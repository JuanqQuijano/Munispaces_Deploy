from typing import Annotated

from fastapi import APIRouter, Cookie, Request, Response

from app.core.deps import CurrentUser, DbSession
from app.core.rate_limit import limiter
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, UserOut
from app.services.auth_service import AuthService


def to_user_out(user) -> UserOut:
    data = UserOut.model_validate(user)
    espacio = getattr(user, "espacio", None)
    if espacio is not None:
        data.espacio_nombre = espacio.nombre
    return data

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, summary="Registrar ciudadano")
@limiter.limit("8/minute")
def register(
    request: Request, payload: RegisterRequest, response: Response, db: DbSession
) -> AuthResponse:
    service = AuthService(db)
    user = service.register(payload)
    service.issue_cookies(response, user)
    return AuthResponse(user=to_user_out(user))


@router.post("/login", response_model=AuthResponse, summary="Iniciar sesion")
@limiter.limit("10/minute")
def login(request: Request, payload: LoginRequest, response: Response, db: DbSession) -> AuthResponse:
    service = AuthService(db)
    user = service.login(payload)
    service.issue_cookies(response, user)
    return AuthResponse(user=to_user_out(user))


@router.post("/refresh", response_model=AuthResponse, summary="Renovar token")
def refresh(
    response: Response,
    db: DbSession,
    ms_refresh: Annotated[str | None, Cookie()] = None,
) -> AuthResponse:
    user = AuthService(db).refresh(response, ms_refresh)
    return AuthResponse(user=to_user_out(user))


@router.post("/logout", summary="Cerrar sesion")
def logout(
    response: Response,
    db: DbSession,
    ms_refresh: Annotated[str | None, Cookie()] = None,
) -> dict:
    AuthService(db).logout(response, ms_refresh)
    return {"ok": True}


@router.get("/me", response_model=UserOut, summary="Usuario actual")
def me(user: CurrentUser) -> UserOut:
    return to_user_out(user)
