from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.rate_limit import limiter
from app.core.security import hash_password
from app.domain.enums import UserRole
from app.main import app
from app.models.space import Space
from app.models.user import User

limiter.enabled = False

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)


@pytest.fixture()
def db_session():
    Base.metadata.create_all(engine)
    session = TestingSession()
    session.add(
        User(
            username="Admin01",
            nombre="Administrador",
            distrito="San Miguel",
            password_hash=hash_password("123654"),
            role=UserRole.admin,
        )
    )
    session.add(
        User(
            dni="87654321",
            nombre="Ciudadano Demo",
            distrito="San Miguel",
            password_hash=hash_password("ciudadano123"),
            role=UserRole.ciudadano,
        )
    )
    san_miguel = Space(
        code="esp-001",
        nombre="PARQUE SAN MIGUEL",
        distrito="San Miguel",
        tipo="Losas deportivas",
        precio_hora=30,
        rating=4.5,
        disponible=True,
        imagen="https://example.com/losa.jpg",
        direccion="Av. Juan Bertolotto 760, San Miguel",
        lat=-12.092,
        lng=-77.0828,
    )
    session.add(san_miguel)
    session.add(
        Space(
            code="esp-002",
            nombre="PARQUE SAN ISIDRO",
            distrito="San Isidro",
            tipo="Losas deportivas",
            precio_hora=40,
            rating=4.5,
            disponible=True,
            imagen="https://example.com/san-isidro.jpg",
            direccion="Av. Augusto Perez Aranibar 1595, San Isidro",
            lat=-12.1039,
            lng=-77.0572,
        )
    )
    session.flush()
    session.query(User).filter_by(username="Admin01").one().espacio_id = san_miguel.id
    session.commit()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            db_session.flush()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def login(client: TestClient, identifier: str, password: str) -> TestClient:
    response = client.post("/api/v1/auth/login", json={"identifier": identifier, "password": password})
    assert response.status_code == 200, response.text
    return client


def space_id(client: TestClient) -> str:
    login(client, "Admin01", "123654")
    spaces = client.get("/api/v1/spaces")
    return spaces.json()[0]["id"]
