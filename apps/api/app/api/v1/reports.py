from uuid import UUID

from fastapi import APIRouter

from app.core.deps import AdminUser, CurrentUser, DbSession
from app.domain.enums import ReportStatus, UserRole
from app.schemas.report import ReportCreate, ReportOut, ReportStatusUpdate
from app.services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["reportes"])


@router.get("/stats", summary="Estadisticas de reportes")
def report_stats(db: DbSession, _admin: AdminUser) -> list[dict]:
    return ReportService(db).stats()


@router.post("", response_model=ReportOut, summary="Crear reporte")
def create_report(payload: ReportCreate, db: DbSession, user: CurrentUser) -> ReportOut:
    return ReportOut.model_validate(ReportService(db).create(user, payload))


@router.get("", response_model=list[ReportOut], summary="Listar reportes")
def list_reports(
    db: DbSession, user: CurrentUser, estado: ReportStatus | None = None
) -> list[ReportOut]:
    service = ReportService(db)
    rows = service.list_admin(estado) if user.role == UserRole.admin else service.list_mine(user)
    return [ReportOut.model_validate(row) for row in rows]


@router.patch("/{report_id}", response_model=ReportOut, summary="Actualizar estado del reporte")
def update_report(
    report_id: UUID, payload: ReportStatusUpdate, db: DbSession, _admin: AdminUser
) -> ReportOut:
    return ReportOut.model_validate(ReportService(db).update_status(report_id, payload.estado))
