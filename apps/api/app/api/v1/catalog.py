from fastapi import APIRouter

from app.domain.lima import LIMA_DISTRITOS, RESIDENT_DISCOUNT_SOLES

router = APIRouter(prefix="/catalog", tags=["catalogo"])


@router.get("/distritos", summary="Distritos de Lima Metropolitana")
def list_distritos() -> dict:
    return {
        "distritos": LIMA_DISTRITOS,
        "descuento_residente": RESIDENT_DISCOUNT_SOLES,
    }
