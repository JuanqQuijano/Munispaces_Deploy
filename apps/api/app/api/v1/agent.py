from fastapi import APIRouter, Request

from app.agent.graph import AgentService
from app.core.deps import CurrentUser, DbSession
from app.core.rate_limit import limiter
from app.schemas.agent import AgentChatRequest, AgentChatResponse

router = APIRouter(prefix="/agent", tags=["agente"])


@router.post("/chat", response_model=AgentChatResponse, summary="Chatear con el asistente")
@limiter.limit("20/minute")
def chat(
    request: Request, payload: AgentChatRequest, db: DbSession, user: CurrentUser
) -> AgentChatResponse:
    return AgentService(db).chat(user, payload)
