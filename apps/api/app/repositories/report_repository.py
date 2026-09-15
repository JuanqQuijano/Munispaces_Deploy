from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.domain.enums import ReportStatus
from app.models.report import Report


class ReportRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, report_id: UUID) -> Report | None:
        return self.db.scalar(select(Report).options(joinedload(Report.espacio)).where(Report.id == report_id))

    def list_for_user(self, user_id: UUID) -> list[Report]:
        return list(
            self.db.scalars(
                select(Report)
                .options(joinedload(Report.espacio))
                .where(Report.user_id == user_id)
                .order_by(Report.created_at.desc())
            )
        )

    def list_for_space(self, space_id: UUID, estado: ReportStatus | None = None) -> list[Report]:
        stmt = (
            select(Report)
            .options(joinedload(Report.espacio))
            .where(Report.espacio_id == space_id)
            .order_by(Report.created_at.desc())
        )
        if estado:
            stmt = stmt.where(Report.estado == estado)
        return list(self.db.scalars(stmt))

    def add(self, report: Report) -> Report:
        self.db.add(report)
        self.db.flush()
        return report

    def count(self) -> int:
        return int(self.db.scalar(select(func.count()).select_from(Report)) or 0)

    def stats_by_tipo(self, space_id: UUID | None = None) -> list[dict]:
        stmt = select(Report.tipo, func.count()).group_by(Report.tipo).order_by(func.count().desc())
        if space_id:
            stmt = stmt.where(Report.espacio_id == space_id)
        rows = self.db.execute(stmt)
        return [{"tipo": tipo, "total": total} for tipo, total in rows]
