from uuid import UUID

from sqlalchemy.orm import Session

from app.domain.enums import ReportStatus
from app.domain.exceptions import DomainError, NotFoundError
from app.domain.geo import require_admin_space_id
from app.models.report import Report
from app.models.user import User
from app.repositories.report_repository import ReportRepository
from app.repositories.space_repository import SpaceRepository
from app.schemas.report import ReportCreate, ReportOut
from app.services.evidence_service import EvidenceService


def report_to_out(report: Report) -> ReportOut:
    data = ReportOut.model_validate(report)
    if report.espacio:
        data.espacio_nombre = report.espacio.nombre
    return data


class ReportService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = ReportRepository(db)
        self.spaces = SpaceRepository(db)
        self.evidences = EvidenceService(db)

    def create(self, user: User, payload: ReportCreate) -> Report:
        space = self.spaces.get_by_id(payload.espacio_id)
        if not space:
            raise NotFoundError("Espacio no encontrado.")
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
            espacio_id=space.id,
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

    def list_admin(self, user: User, estado: ReportStatus | None = None) -> list[Report]:
        return self.repo.list_for_space(require_admin_space_id(user), estado)

    def update_status(self, user: User, report_id: UUID, estado: ReportStatus) -> Report:
        space_id = require_admin_space_id(user)
        report = self.repo.get_by_id(report_id)
        if not report or report.espacio_id != space_id:
            raise NotFoundError("Reporte no encontrado.")
        report.estado = estado
        self.db.commit()
        self.db.refresh(report)
        return report

    def stats(self, user: User) -> list[dict]:
        return self.repo.stats_by_tipo(require_admin_space_id(user))
