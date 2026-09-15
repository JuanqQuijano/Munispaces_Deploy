from __future__ import annotations

import base64
import re
from uuid import UUID

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.domain.enums import ReportStatus
from app.domain.exceptions import DomainError, NotFoundError
from app.domain.geo import require_admin_space_id
from app.models.report import Report
from app.repositories.report_repository import ReportRepository

DATA_URL_RE = re.compile(r"^data:(image/(?:png|jpe?g));base64,(.+)$", re.I)


def build_anonymous_message(report: Report) -> str:
    urgencia = {"bajo": "Baja", "medio": "Media", "alto": "Alta"}.get(
        report.urgencia.value, report.urgencia.value.capitalize()
    )
    estado = {
        "en_proceso": "En proceso",
        "resuelto": "Resuelto",
    }.get(report.estado.value, report.estado.value.replace("_", " "))
    lines = [
        "[MuniSpaces - Reporte anonimo]",
        "Canal seguro municipal. Sin datos del remitente.",
        "",
        f"ID: {report.public_id}",
        f"Tipo: {report.tipo}",
        f"Urgencia: {urgencia}",
        f"Estado: {estado}",
        f"Fecha: {report.created_at.strftime('%d/%m/%Y')}",
        f"Descripcion: {report.descripcion}",
    ]
    if report.direccion:
        lines.append(f"Direccion: {report.direccion}")
    if getattr(report, "espacio", None):
        lines.append(f"Espacio: {report.espacio.nombre}")
    if report.lat is not None and report.lng is not None:
        lines.append(f"Ubicacion: https://www.google.com/maps?q={report.lat},{report.lng}")
    return "\n".join(lines)


class TelegramService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.reports = ReportRepository(db)

    def _chat_ids(self) -> list[str]:
        """Normaliza IDs de canal/grupo de Telegram.

        Canales suelen requerir prefijo -100. Si llega solo el numero
        (ej. 3872166365), tambien probamos -1003872166365.
        """
        raw = str(settings.telegram_chat_id or "").strip().replace(" ", "")
        if not raw:
            return []

        ids: list[str] = [raw]

        if re.fullmatch(r"\d{9,14}", raw):
            ids.append(f"-100{raw}")
            ids.append(f"-{raw}")
        elif re.fullmatch(r"-(\d{9,12})", raw) and not raw.startswith("-100"):
            ids.append(f"-100{raw[1:]}")
        elif raw.startswith("-100") and re.fullmatch(r"-100\d{9,14}", raw):
            ids.append(f"-{raw[4:]}")

        return list(dict.fromkeys(ids))

    def _send_message(self, client: httpx.Client, chat_id: str, text: str) -> httpx.Response:
        return client.post(
            f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage",
            json={
                "chat_id": chat_id,
                "text": text,
                "disable_web_page_preview": True,
            },
        )

    def _send_photo(self, client: httpx.Client, chat_id: str, data_url: str, caption: str = "") -> bool:
        match = DATA_URL_RE.match(data_url or "")
        if not match:
            return False
        mime, b64 = match.group(1), match.group(2)
        ext = "png" if "png" in mime.lower() else "jpg"
        try:
            raw = base64.b64decode(b64)
        except Exception:
            return False
        files = {"photo": (f"reporte.{ext}", raw, mime)}
        data: dict[str, str] = {"chat_id": chat_id}
        if caption:
            data["caption"] = caption[:1000]
        response = client.post(
            f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendPhoto",
            data=data,
            files=files,
        )
        payload = response.json()
        return bool(response.is_success and payload.get("ok"))

    def send_report(self, report: Report) -> None:
        if not settings.telegram_bot_token or not settings.telegram_chat_id:
            raise DomainError("Telegram no esta configurado en el servidor.", 503)

        message = build_anonymous_message(report)
        chat_ids = self._chat_ids()
        last_error = "No se pudo enviar por Telegram."
        used_chat = ""

        with httpx.Client(timeout=30) as client:
            for chat_id in chat_ids:
                response = self._send_message(client, chat_id, message)
                data = response.json()
                if response.is_success and data.get("ok"):
                    used_chat = chat_id
                    break
                last_error = str(data.get("description") or last_error)
                if "chat not found" not in last_error.lower():
                    break

            if not used_chat:
                raise DomainError(last_error, 502)

            fotos = list(report.fotos or [])[:2]
            for index, foto in enumerate(fotos):
                caption = f"Evidencia fotografica del reporte {report.public_id}" if index == 0 else ""
                self._send_photo(client, used_chat, foto, caption)

    def alert(self, admin, report_id: UUID | None, cantidad: int) -> tuple[int, str]:
        space_id = require_admin_space_id(admin)
        if report_id:
            report = self.reports.get_by_id(report_id)
            if not report or report.espacio_id != space_id:
                raise NotFoundError("Reporte no encontrado.")
            self.send_report(report)
            return 1, f"Se envio {report.public_id} a Serenazgo por Telegram."

        pending = self.reports.list_for_space(space_id, ReportStatus.en_proceso)[:cantidad]
        if not pending:
            raise DomainError("No hay reportes activos para enviar.")
        sent = 0
        for report in pending:
            self.send_report(report)
            sent += 1
        return sent, f"Se enviaron {sent} reporte(s) directos a Telegram."
