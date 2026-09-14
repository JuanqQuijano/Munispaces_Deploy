from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api.v1 import api_router
from app.core.config import settings
from app.core.rate_limit import limiter
from app.domain.exceptions import DomainError

app = FastAPI(
    title="MuniSpaces API",
    description="Reservas municipales, reportes ciudadanos y agente IA.",
    version="2.0.0",
    openapi_tags=[
        {"name": "auth", "description": "Registro, login y sesion (JWT)."},
        {"name": "catalogo", "description": "Listas de apoyo: distritos de Lima y tarifas."},
        {"name": "espacios", "description": "Catalogo de espacios municipales y disponibilidad."},
        {"name": "reservas", "description": "Reservas del ciudadano, listado admin y tramite por QR."},
        {"name": "reportes", "description": "Reportes ciudadanos e inbox municipal."},
        {"name": "evidencias", "description": "Fotos temporales de reporte (ID, TTL 12h)."},
        {"name": "observaciones", "description": "Notas internas del administrador por espacio y fecha."},
        {"name": "agente", "description": "Asistente IA con tools de dominio."},
        {"name": "serenazgo", "description": "Alertas anonimas a Telegram."},
        {"name": "salud", "description": "Estado del servicio."},
    ],
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, lambda request, exc: JSONResponse(
    {"detail": "Demasiadas solicitudes. Intenta en un momento."},
    status_code=429,
))
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(DomainError)
async def domain_error_handler(_request: Request, exc: DomainError) -> JSONResponse:
    return JSONResponse({"detail": exc.message}, status_code=exc.status_code)


@app.get("/health", tags=["salud"], summary="Estado del servicio")
def health() -> dict:
    return {"ok": True, "service": "munispaces-api"}


app.include_router(api_router, prefix="/api/v1")
