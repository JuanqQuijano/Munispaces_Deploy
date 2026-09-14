# MuniSpaces v2

Plataforma para reservar espacios municipales en Lima, reportar incidencias y operar un panel admin. El diferenciador es un **agente IA con tools atadas al dominio** (horarios reales, navegacion a reserva, alertas a Serenazgo), no un chatbot generico.

Stack: **FastAPI + PostgreSQL + Next.js**. El vanilla original queda como referencia de UX; este repo es el producto desplegable.

## Arquitectura

```
apps/web  (Vercel)  --JWT cookies-->  apps/api (Railway)  -->  PostgreSQL
                                         |-- LangGraph agent
                                         |-- Telegram Serenazgo
```

- Routers HTTP → services → repositories → SQLAlchemy
- JWT en cookies httpOnly (`ms_access`, `ms_refresh`) + `Authorization: Bearer` para OpenAPI
- Roles `ciudadano` / `admin`
- Conflicto de reservas con `SELECT … FOR UPDATE` (no last-write-wins)

API docs: `http://localhost:8000/docs`

## Requisitos locales

- Python 3.14
- Node 24 LTS
- Docker (Postgres) o un PostgreSQL propio

## Arranque local (Git Bash)

Si no tienes Docker/Postgres, usa SQLite (vale para Swagger y demo local). En produccion sigue siendo PostgreSQL.

```bash
# Desde la raiz del repo
py -3.14 -m venv .venv
source .venv/Scripts/activate   # Windows Git Bash
cd apps/api
python -m pip install -r requirements.txt
cp .env.example .env
# En .env deja: DATABASE_URL=sqlite:///./munispaces.db
python -m alembic upgrade head
python -m app.seed
python -m uvicorn app.main:app --reload --port 8000
```

Swagger: http://localhost:8000/docs

Cuando tengas Docker:

```bash
# Desde la raiz del repo
docker compose up db -d
```

Y en `.env` usa `postgresql+psycopg://munispaces:munispaces@localhost:5432/munispaces`.

Web: http://localhost:3000  
API: http://localhost:8000

Tambien puedes levantar API+DB con `docker compose up --build`.

## Cuentas demo

| Rol | Identificador | Contrasena |
|-----|---------------|------------|
| Admin | `Admin01` | `123654` |
| Ciudadano | DNI `87654321` | `ciudadano123` |

## Variables de entorno

API (`apps/api/.env`):

- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGINS` (origines del front, separados por coma)
- `COOKIE_SECURE=true` y `COOKIE_SAMESITE=none` en produccion (Vercel + Railway son sitios distintos)
- `OPENAI_API_KEY` (asistente)
- `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` (Serenazgo)

Web (`apps/web/.env.local`, copia desde `.env.example`):

- `NEXT_PUBLIC_API_URL` (local: `http://localhost:8000`; en Vercel: URL publica de la API)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (Places + geocoding; no la subas al repo)

## Deploy

### API + Postgres (Railway)

1. Nuevo proyecto Railway → anade PostgreSQL.
2. Servicio desde `apps/api` (Dockerfile incluido).
3. Root directory: `apps/api`.
4. Env:
   - `DATABASE_URL` (Railway la inyecta; si viene `postgres://`, cambia a `postgresql+psycopg://`)
   - `JWT_SECRET`, `CORS_ORIGINS=https://tu-front.vercel.app`
   - `COOKIE_SECURE=true`, `COOKIE_SAMESITE=none`
   - `OPENAI_API_KEY`, `TELEGRAM_*`
5. El Dockerfile corre `alembic upgrade head`, seed y `uvicorn`.
6. Healthcheck: `/health`

### Web (Vercel)

1. Importa el repo, root directory `apps/web`.
2. Env: `NEXT_PUBLIC_API_URL=https://tu-api.up.railway.app`
3. Node: el `package.json` pide `24.x` (LTS). Vercel lo tomara de `engines.node`.
4. Deploy.

## Guion de demo (entrevista)

1. Landing → registro o login ciudadano `87654321`.
2. Espacios → Parque San Miguel → dos bloques horarios → confirmar.
3. Intentar la misma hora: la API responde **409**.
4. Mis reservas → mostrar QR `MUNISPACES:RES:...`.
5. Asistente: “quiero un parque cerca” (usar ubicacion) → “reserva San Miguel manana 9 a 11” → navega al formulario.
6. Nuevo reporte con punto en el mapa.
7. Login admin `Admin01` → inbox de reportes → Serenazgo (Telegram anonimo).
8. Tramitar: pegar el payload del QR → estado `tramitada`.
9. Mostrar `/docs` y el grafico LangGraph (tools sobre services, no JSON suelto).

## Tests

```bash
cd apps/api
pytest
```

Cubre login/registro, permiso admin en tramitar, y conflicto de reservas.
