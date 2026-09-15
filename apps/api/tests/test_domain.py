import base64
import json
from datetime import date, datetime, timedelta, timezone

from langchain_core.messages import AIMessage

from app.agent.graph import _extract_action
from app.domain.lima import precio_hora_para
from app.models.evidence import Evidence
from app.models.user import User

TINY_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)


def test_login_admin(client):
    response = client.post("/api/v1/auth/login", json={"identifier": "Admin01", "password": "123654"})
    assert response.status_code == 200
    assert response.json()["user"]["role"] == "admin"


def test_register_and_me(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "dni": "11223344",
            "password": "secreto1",
            "password_confirm": "secreto1",
            "nombre": "Ana Perez",
            "distrito": "Miraflores",
            "tipo_dni": "azul",
            "ubigeo": "150122",
            "fecha_nacimiento": "1994-05-12",
            "fecha_caducidad": "2030-05-12",
            "acepto_terminos": True,
        },
    )
    assert response.status_code == 200, response.text
    me = client.get("/api/v1/auth/me")
    assert me.status_code == 200
    assert me.json()["dni"] == "11223344"
    assert me.json()["role"] == "ciudadano"
    assert me.json()["distrito"] == "Miraflores"
    assert me.json()["distrito_bloqueado_hasta"] is not None


def test_register_requires_lima_district(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "dni": "22334455",
            "password": "secreto1",
            "nombre": "Luis Diaz",
            "distrito": "Cusco",
            "acepto_terminos": True,
            "tipo_dni": "electronico",
        },
    )
    assert response.status_code == 400


def test_citizen_cannot_tramitar(client):
    client.post("/api/v1/auth/login", json={"identifier": "87654321", "password": "ciudadano123"})
    response = client.post("/api/v1/reservations/tramitar", json={"payload": "MUNISPACES:RES:X:Y"})
    assert response.status_code == 403


def test_reservation_conflict(client):
    client.post("/api/v1/auth/login", json={"identifier": "87654321", "password": "ciudadano123"})
    space = client.get("/api/v1/spaces").json()[0]
    fecha = (date.today() + timedelta(days=1)).isoformat()
    payload = {"space_id": space["id"], "fecha": fecha, "slots": [540, 600]}
    first = client.post("/api/v1/reservations", json=payload)
    assert first.status_code == 200, first.text
    second = client.post("/api/v1/reservations", json=payload)
    assert second.status_code == 409


def test_availability_marks_occupied(client):
    client.post("/api/v1/auth/login", json={"identifier": "87654321", "password": "ciudadano123"})
    space = client.get("/api/v1/spaces").json()[0]
    fecha = (date.today() + timedelta(days=2)).isoformat()
    client.post("/api/v1/reservations", json={"space_id": space["id"], "fecha": fecha, "slots": [720]})
    availability = client.get(f"/api/v1/spaces/{space['id']}/availability", params={"fecha": fecha})
    occupied = [slot for slot in availability.json()["slots"] if slot["minutos"] == 720][0]
    assert occupied["ocupado"] is True


def test_resident_hour_is_five_soles_cheaper(client):
    client.post("/api/v1/auth/login", json={"identifier": "87654321", "password": "ciudadano123"})
    spaces = client.get("/api/v1/spaces").json()
    local = next(item for item in spaces if item["distrito"] == "San Miguel")
    other = next(item for item in spaces if item["distrito"] == "San Isidro")
    assert local["es_residente"] is True
    assert local["precio_aplicable"] == local["precio_hora"] - 5
    assert other["es_residente"] is False
    assert other["precio_aplicable"] == other["precio_hora"]
    fecha = (date.today() + timedelta(days=3)).isoformat()
    own = client.post(
        "/api/v1/reservations",
        json={"space_id": local["id"], "fecha": fecha, "slots": [540]},
    )
    away = client.post(
        "/api/v1/reservations",
        json={"space_id": other["id"], "fecha": fecha, "slots": [540]},
    )
    assert own.status_code == 200, own.text
    assert away.status_code == 200, away.text
    assert own.json()["costo"] == 25
    assert away.json()["costo"] == 40
    assert precio_hora_para(30, "San Miguel", "San Miguel") == 25
    assert precio_hora_para(40, "San Miguel", "San Isidro") == 40


def test_upload_evidence_and_create_report(client):
    client.post("/api/v1/auth/login", json={"identifier": "87654321", "password": "ciudadano123"})
    uploaded = client.post("/api/v1/evidencias", files={"file": ("dot.png", TINY_PNG, "image/png")})
    assert uploaded.status_code == 200, uploaded.text
    body = uploaded.json()
    assert body["data_url"].startswith("data:image/jpeg;base64,")
    evidence_id = body["id"]
    space = client.get("/api/v1/spaces").json()[0]

    created = client.post(
        "/api/v1/reports",
        json={
            "tipo": "Falta de mantenimiento",
            "urgencia": "medio",
            "descripcion": "Banca rota en el parque",
            "direccion": "Av. Ejemplo 123",
            "lat": -12.09,
            "lng": -77.08,
            "espacio_id": space["id"],
            "evidencia_ids": [evidence_id],
        },
    )
    assert created.status_code == 200, created.text
    assert created.json()["fotos"]
    assert created.json()["espacio_id"] == space["id"]

    reused = client.post(
        "/api/v1/reports",
        json={
            "tipo": "Falta de mantenimiento",
            "urgencia": "bajo",
            "descripcion": "Otro intento con la misma foto",
            "lat": -12.09,
            "lng": -77.08,
            "espacio_id": space["id"],
            "evidencia_ids": [evidence_id],
        },
    )
    assert reused.status_code == 400


def test_cannot_use_other_user_evidence(client):
    client.post("/api/v1/auth/login", json={"identifier": "87654321", "password": "ciudadano123"})
    uploaded = client.post("/api/v1/evidencias", files={"file": ("dot.png", TINY_PNG, "image/png")})
    evidence_id = uploaded.json()["id"]

    client.post("/api/v1/auth/login", json={"identifier": "Admin01", "password": "123654"})
    space = client.get("/api/v1/spaces").json()[0]
    created = client.post(
        "/api/v1/reports",
        json={
            "tipo": "Falta de mantenimiento",
            "urgencia": "alto",
            "descripcion": "Intento con evidencia ajena",
            "lat": -12.09,
            "lng": -77.08,
            "espacio_id": space["id"],
            "evidencia_ids": [evidence_id],
        },
    )
    assert created.status_code == 400


def test_expired_evidence_is_rejected(client, db_session):
    client.post("/api/v1/auth/login", json={"identifier": "87654321", "password": "ciudadano123"})
    user = db_session.query(User).filter_by(dni="87654321").one()
    evidence = Evidence(
        user_id=user.id,
        content_type="image/jpeg",
        data_url="data:image/jpeg;base64,xx",
        expires_at=datetime.now(timezone.utc) - timedelta(hours=1),
    )
    db_session.add(evidence)
    db_session.commit()

    space = client.get("/api/v1/spaces").json()[0]
    created = client.post(
        "/api/v1/reports",
        json={
            "tipo": "Ocupacion informal",
            "urgencia": "medio",
            "descripcion": "Puesto improvisado en la losa",
            "lat": -12.09,
            "lng": -77.08,
            "espacio_id": space["id"],
            "evidencia_ids": [str(evidence.id)],
        },
    )
    assert created.status_code == 400


def test_extract_report_draft_action():
    action = _extract_action(
        [
            AIMessage(
                content=json.dumps(
                    {
                        "accion": {
                            "type": "report_draft",
                            "draft": {
                                "tipo": "Falta de mantenimiento",
                                "descripcion": "Banca rota junto a la losa",
                                "urgencia": "alto",
                                "evidencia_ids": [],
                            },
                        }
                    }
                )
            )
        ]
    )
    assert action is not None
    assert action.type == "report_draft"
    assert action.draft is not None
    assert action.draft.tipo == "Falta de mantenimiento"
    assert action.url is None


def test_admin_only_sees_own_space(client):
    client.post("/api/v1/auth/login", json={"identifier": "87654321", "password": "ciudadano123"})
    spaces = client.get("/api/v1/spaces").json()
    local = next(item for item in spaces if item["code"] == "esp-001")
    other = next(item for item in spaces if item["code"] == "esp-002")
    fecha = (date.today() + timedelta(days=4)).isoformat()
    mine = client.post(
        "/api/v1/reservations",
        json={"space_id": local["id"], "fecha": fecha, "slots": [540]},
    )
    away = client.post(
        "/api/v1/reservations",
        json={"space_id": other["id"], "fecha": fecha, "slots": [600]},
    )
    assert mine.status_code == 200, mine.text
    assert away.status_code == 200, away.text
    client.post(
        "/api/v1/reports",
        json={
            "tipo": "Falta de mantenimiento",
            "urgencia": "medio",
            "descripcion": "Banca rota San Miguel",
            "lat": -12.092,
            "lng": -77.0828,
            "espacio_id": local["id"],
        },
    )
    client.post(
        "/api/v1/reports",
        json={
            "tipo": "Falta de mantenimiento",
            "urgencia": "medio",
            "descripcion": "Banca rota San Isidro",
            "lat": -12.1039,
            "lng": -77.0572,
            "espacio_id": other["id"],
        },
    )

    client.post("/api/v1/auth/login", json={"identifier": "Admin01", "password": "123654"})
    me = client.get("/api/v1/auth/me")
    assert me.status_code == 200, me.text
    assert me.json()["espacio_id"] == local["id"]
    reservas = client.get("/api/v1/reservations").json()
    assert {row["space_id"] for row in reservas} == {local["id"]}
    reportes = client.get("/api/v1/reports").json()
    assert {row["espacio_id"] for row in reportes} == {local["id"]}
    blocked = client.post(
        "/api/v1/reservations/tramitar",
        json={"payload": away.json()["qr_payload"]},
    )
    assert blocked.status_code == 403
