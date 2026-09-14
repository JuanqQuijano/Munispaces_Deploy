from fastapi import APIRouter

from app.core.deps import AdminUser, DbSession
from app.schemas.serenazgo import SerenazgoAlertRequest, SerenazgoAlertResponse
from app.services.telegram_service import TelegramService

router = APIRouter(prefix="/serenazgo", tags=["serenazgo"])


@router.post("/alert", response_model=SerenazgoAlertResponse, summary="Enviar alerta a Serenazgo")
def alert(payload: SerenazgoAlertRequest, db: DbSession, _admin: AdminUser) -> SerenazgoAlertResponse:
    enviados, detalle = TelegramService(db).alert(payload.report_id, payload.cantidad)
    return SerenazgoAlertResponse(enviados=enviados, detalle=detalle)
