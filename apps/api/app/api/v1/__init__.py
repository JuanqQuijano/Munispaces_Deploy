from fastapi import APIRouter

from app.api.v1.agent import router as agent_router
from app.api.v1.auth import router as auth_router
from app.api.v1.catalog import router as catalog_router
from app.api.v1.evidences import router as evidences_router
from app.api.v1.observations import router as observations_router
from app.api.v1.reports import router as reports_router
from app.api.v1.reservations import router as reservations_router
from app.api.v1.serenazgo import router as serenazgo_router
from app.api.v1.spaces import router as spaces_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(catalog_router)
api_router.include_router(spaces_router)
api_router.include_router(reservations_router)
api_router.include_router(reports_router)
api_router.include_router(evidences_router)
api_router.include_router(observations_router)
api_router.include_router(agent_router)
api_router.include_router(serenazgo_router)
