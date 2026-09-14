from uuid import UUID

from fastapi import APIRouter, File, Request, UploadFile

from app.core.deps import CurrentUser, DbSession
from app.core.rate_limit import limiter
from app.domain.exceptions import DomainError
from app.schemas.evidence import EvidenceOut
from app.services.evidence_service import MAX_UPLOAD_BYTES, EvidenceService

router = APIRouter(prefix="/evidencias", tags=["evidencias"])


@router.post("", response_model=EvidenceOut, summary="Subir evidencia de reporte")
@limiter.limit("20/minute")
async def upload_evidence(
    request: Request,
    db: DbSession,
    user: CurrentUser,
    file: UploadFile = File(...),
) -> EvidenceOut:
    data = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise DomainError("La imagen es demasiado grande (maximo 8 MB).")
    return EvidenceOut.model_validate(
        EvidenceService(db).create_from_upload(user, file.content_type or "", data)
    )


@router.get("/{evidence_id}", response_model=EvidenceOut, summary="Obtener evidencia propia")
def get_evidence(evidence_id: UUID, db: DbSession, user: CurrentUser) -> EvidenceOut:
    return EvidenceOut.model_validate(EvidenceService(db).get_for_owner(user.id, evidence_id))
