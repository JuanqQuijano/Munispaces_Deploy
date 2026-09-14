from datetime import datetime, timezone
from hashlib import sha256
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.refresh_token import RefreshToken


class RefreshTokenRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    @staticmethod
    def hash_token(token: str) -> str:
        return sha256(token.encode("utf-8")).hexdigest()

    def add(self, user_id: UUID, token: str, expires_at: datetime) -> RefreshToken:
        row = RefreshToken(user_id=user_id, token_hash=self.hash_token(token), expires_at=expires_at)
        self.db.add(row)
        self.db.flush()
        return row

    def get_valid(self, token: str) -> RefreshToken | None:
        row = self.db.scalar(
            select(RefreshToken).where(RefreshToken.token_hash == self.hash_token(token))
        )
        if not row or row.revoked_at:
            return None
        if row.expires_at < datetime.now(timezone.utc):
            return None
        return row

    def revoke(self, token: str) -> None:
        row = self.db.scalar(
            select(RefreshToken).where(RefreshToken.token_hash == self.hash_token(token))
        )
        if row and not row.revoked_at:
            row.revoked_at = datetime.now(timezone.utc)
