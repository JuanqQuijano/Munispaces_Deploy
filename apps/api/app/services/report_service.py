from uuid import UUID

from sqlalchemy.orm import Session

from app.domain.enums import ReportStatus
from app.domain.exceptions import DomainError, NotFoundError
from app.models.report import Report
from app.models.user import User
from app.repositories.report_repository import ReportRepository
from app.schemas.report import ReportCreate
from app.services.evidence_service import EvidenceService


class ReportService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = ReportRepository(db)
        self.evidences = EvidenceService(db)

    def create(self, user: User, payload: ReportCreate) -> Report:
        self.evidences.purge_expired()
        fotos = []
        used = []
        if payload.evidencia_ids:
            for evidence_id in payload.evidencia_ids[:2]:
                evidence = self.evidences.get_usable(user.id, evidence_id)
                if not evidence:
                    raise DomainError("Evidencia no valida, vencida o ya usada.")
                fotos.append(evidence.data_url)
                used.append(evidence)
        else:
            for foto in payload.fotos[:2]:
                if not str(foto).startswith("data:image/"):
                    raise DomainError("Las evidencias deben ser imagenes.")
                if len(foto) > 400_000:
                    raise DomainError("Cada foto debe pesar menos de ~300 KB.")
                fotos.append(foto)

        report = Report(
            public_id=f"REP-{self.repo.count() + 1:02d}",
            user_id=user.id,
            tipo=payload.tipo.strip(),
            urgencia=payload.urgencia,
            descripcion=payload.descripcion.strip(),
            direccion=payload.direccion.strip(),
            lat=payload.lat,
            lng=payload.lng,
            fotos=fotos,
        )
        self.repo.add(report)
        if used:
            self.evidences.mark_used(used, report.id)
        self.db.commit()
        self.db.refresh(report)
        return report

    def list_mine(self, user: User) -> list[Report]:
        return self.repo.list_for_user(user.id)

    def list_admin(self, estado: ReportStatus | None = None) -> list[Report]:
        return self.repo.list_all(estado)

    def update_status(self, report_id: UUID, estado: ReportStatus) -> Report:
        report = self.repo.get_by_id(report_id)
        if not report:
            raise NotFoundError("Reporte no encontrado.")
        report.estado = estado
        self.db.commit()
        self.db.refresh(report)
        return report

    def stats(self) -> list[dict]:
        return self.repo.stats_by_tipo()
