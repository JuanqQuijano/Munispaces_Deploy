# MuniSpaces v2

Hice esta plataforma de forma personal pensando en resolver un problema que se me vino a la mente al ver el proceso de reserva de espacios municipales para distintas actividades, así como un proceso de quejas que podría ser algo enogorroso.

Es basicamente una plataforma digital para la reserva de espacios publicos y reportes ciudadanos. Las funcionalidades fueron definidas luego de un proceso de entrevistas a los trabajadores publicos (a los que les agradezco su cooperación), traté de adaptar lo mejor posible sus necesidades a una aplicación web.

Está principalmente pensada su uso en celular, ya que se pueden adjuntar imagenes, tomar fotos y compartir ubicación. Aunque es funcional en desktop, algunas funciones están algo limitadas ya que una computadora de sobremesa no suele tener gps.

En este caso, ya que trato de trabajar algo de mi diseño de arquitectura de soluciones agenticas, se agregó un **chatbot** hecho con LangGraph y API de open AI. Hice uso de tools, api calls a servicios externos como telegram y google maps y algo de arquitectura propia.

Stack: **FastAPI + PostgreSQL + Next.js**.

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

Si no tienes a la mano Docker/Postgres, usa SQLite (vale para Swagger y demo local). En produccion sigue siendo PostgreSQL.

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

Y en `.env` usa `postgresql+psycopg://munispaces:munispaces@localhost:5432/munispaces`. ó como sea que decidas llamar a la bd.

Web: http://localhost:3000  
API: http://localhost:8000


## Cuentas demo

Solo están para que puedas probar la app.

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



## Funciones principales:

### Flujo del ciudadano

- Primero creas tu cuenta indicando, entre otros datos, el distrito en el que vives. Este dato es importante porque la tarifa de una reserva puede cambiar dependiendo de si eres vecino del distrito o no.
- Una vez dentro, las funciones principales son bastante sencillas: reservar un espacio municipal o reportar una incidencia.
- En la sección de espacios puedes buscar por nombre y filtrar por tipo. Al seleccionar uno verás su ubicación, tarifas, fechas y horarios disponibles, los cuales se calculan a partir de la fecha actual.
- El proceso de reserva es parecido a comprar entradas para el cine: eliges uno o más bloques horarios y confirmas la solicitud. Si dos personas intentan reservar el mismo horario, la reserva queda para quien la confirme primero.
- Luego puedes consultar todo desde **Mis reservas**. Al abrir una reserva se muestran sus detalles, la ubicación en el mapa y un código QR.
- Cuando llegues al lugar, el administrador podrá escanear ese QR para validar la reserva y marcarla como tramitada.
- También puedes crear reportes ciudadanos indicando el tipo de incidencia, una descripción, el nivel de urgencia y el punto exacto en el mapa. Desde el celular es posible tomar o adjuntar una fotografía como evidencia.

### Asistente virtual

El asistente permite realizar varias de estas acciones mediante una conversación. Puede ayudarte a encontrar espacios, consultar horarios disponibles, preparar una reserva o crear el borrador de un reporte. Antes de registrar una operación importante, la aplicación muestra un formulario de confirmación para que puedas revisar y corregir los datos.

El chatbot no trabaja de forma aislada: utiliza herramientas conectadas con los servicios de la aplicación. De esta manera consulta información real de espacios y horarios, puede abrir los flujos correspondientes y, en situaciones de emergencia, enviar una alerta anónima a Serenazgo mediante Telegram.

### Flujo del administrador

- Consultar los reportes enviados por los ciudadanos y revisar su ubicación en el mapa.
- Ver el detalle y la evidencia adjunta de cada incidencia.
- Escanear o ingresar el código de una reserva para comprobar que sea válida y tramitarla.
- Consultar información general desde su panel y utilizar una versión del asistente adaptada a sus tareas.

En conjunto, la idea es concentrar en una sola aplicación procesos que normalmente se realizan por canales separados, manteniendo una experiencia sencilla tanto para el ciudadano como para el personal municipal.
