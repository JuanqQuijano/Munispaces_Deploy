from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

import bcrypt
import jwt

from app.core.config import settings

ACCESS_COOKIE = "ms_access"
REFRESH_COOKIE = "ms_refresh"


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def _encode(payload: dict, expires_delta: timedelta) -> str:
    data = payload.copy()
    data["exp"] = datetime.now(timezone.utc) + expires_delta
    data["jti"] = str(uuid4())
    return jwt.encode(data, settings.jwt_secret, algorithm="HS256")


def create_access_token(*, user_id: UUID, role: str) -> str:
    return _encode(
        {"sub": str(user_id), "role": role, "typ": "access"},
        timedelta(minutes=settings.jwt_access_minutes),
    )


def create_refresh_token(*, user_id: UUID) -> str:
    return _encode(
        {"sub": str(user_id), "typ": "refresh"},
        timedelta(days=settings.jwt_refresh_days),
    )


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
