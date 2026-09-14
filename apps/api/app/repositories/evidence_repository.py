from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.evidence import Evidence


class EvidenceRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, evidence_id: UUID) -> Evidence | None:
        return self.db.get(Evidence, evidence_id)

    def add(self, evidence: Evidence) -> Evidence:
        self.db.add(evidence)
        self.db.flush()
        return evidence

    def list_expired_unused(self, now: datetime) -> list[Evidence]:
        return list(
            self.db.scalars(
                select(Evidence).where(Evidence.report_id.is_(None), Evidence.expires_at < now)
            )
        )
