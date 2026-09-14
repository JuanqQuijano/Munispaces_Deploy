from enum import StrEnum


class UserRole(StrEnum):
    ciudadano = "ciudadano"
    admin = "admin"


class ReservationStatus(StrEnum):
    confirmada = "confirmada"
    pendiente = "pendiente"
    tramitada = "tramitada"
    culminada = "culminada"


class ReportStatus(StrEnum):
    en_proceso = "en_proceso"
    resuelto = "resuelto"


class ReportUrgency(StrEnum):
    bajo = "bajo"
    medio = "medio"
    alto = "alto"


DAY_SLOTS = [540, 600, 660, 720, 780, 840, 900, 960]
ACTIVE_RESERVATION_STATUSES = (
    ReservationStatus.confirmada,
    ReservationStatus.pendiente,
    ReservationStatus.tramitada,
)
