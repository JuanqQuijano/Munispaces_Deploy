import base64
from datetime import datetime, timedelta, timezone
from io import BytesIO
from uuid import UUID

from PIL import Image, UnidentifiedImageError
from sqlalchemy.orm import Session

from app.domain.exceptions import DomainError, NotFoundError
from app.models.evidence import Evidence
from app.models.user import User
from app.repositories.evidence_repository import EvidenceRepository

MAX_UPLOAD_BYTES = 8 * 1024 * 1024
MAX_STORED_CHARS = 400_000
EVIDENCE_TTL = timedelta(hours=12)
MAX_SIDE = 720


class EvidenceService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = EvidenceRepository(db)

    def purge_expired(self) -> int:
        now = datetime.now(timezone.utc)
        rows = self.repo.list_expired_unused(now)
        for row in rows:
            self.db.delete(row)
        if rows:
            self.db.flush()
        return len(rows)

    def create_from_upload(self, user: User, content_type: str, data: bytes) -> Evidence:
        self.purge_expired()
        if not data:
            raise DomainError("La imagen esta vacia.")
        if len(data) > MAX_UPLOAD_BYTES:
            raise DomainError("La imagen es demasiado grande (maximo 8 MB).")
        if not (content_type or "").startswith("image/"):
            raise DomainError("Solo se aceptan imagenes.")

        evidence = Evidence(
            user_id=user.id,
            content_type="image/jpeg",
            data_url=self._compress_to_data_url(data),
            expires_at=datetime.now(timezone.utc) + EVIDENCE_TTL,
        )
        self.repo.add(evidence)
        self.db.commit()
        self.db.refresh(evidence)
        return evidence

    def get_for_owner(self, user_id: UUID, evidence_id: UUID) -> Evidence:
        self.purge_expired()
        row = self.repo.get_by_id(evidence_id)
        if not row or row.user_id != user_id:
            raise NotFoundError("Evidencia no encontrada.")
        return row

    def get_usable(self, user_id: UUID, evidence_id: UUID) -> Evidence | None:
        row = self.repo.get_by_id(evidence_id)
        if not row or row.user_id != user_id or row.report_id is not None:
            return None
        expires = row.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if expires < datetime.now(timezone.utc):
            return None
        return row

    def mark_used(self, rows: list[Evidence], report_id: UUID) -> None:
        for row in rows:
            row.report_id = report_id

    def _compress_to_data_url(self, data: bytes) -> str:
        try:
            image = Image.open(BytesIO(data))
        except UnidentifiedImageError as exc:
            raise DomainError("Imagen invalida.") from exc

        image = image.convert("RGB")
        width, height = image.size
        scale = min(1.0, MAX_SIDE / max(width, height, 1))
        if scale < 1:
            image = image.resize(
                (max(1, int(width * scale)), max(1, int(height * scale))),
                Image.Resampling.LANCZOS,
            )

        buffer = BytesIO()
        image.save(buffer, format="JPEG", quality=72, optimize=True)
        encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
        data_url = f"data:image/jpeg;base64,{encoded}"
        if len(data_url) > MAX_STORED_CHARS:
            raise DomainError("Cada foto debe pesar menos de ~300 KB.")
        return data_url
