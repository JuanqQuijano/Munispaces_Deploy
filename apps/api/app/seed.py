from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.domain.enums import UserRole
from app.domain.lima import LIMA_DISTRITOS
from app.models.space import Space
from app.models.user import User
from app.repositories.space_repository import SpaceRepository
from app.repositories.user_repository import UserRepository

# Espacios destacados del demo original.
BASE_SPACES = [
    {
        "code": "esp-001",
        "nombre": "PARQUE SAN MIGUEL",
        "distrito": "San Miguel",
        "tipo": "Losas deportivas",
        "precio_hora": 30,
        "rating": 4.5,
        "disponible": True,
        "imagen": "/images/LosaSanMiguel.jpg",
        "direccion": "Av. Juan Bertolotto 760, San Miguel",
        "lat": -12.092,
        "lng": -77.0828,
    },
    {
        "code": "esp-002",
        "nombre": "PARQUE SAN ISIDRO",
        "distrito": "San Isidro",
        "tipo": "Losas deportivas",
        "precio_hora": 40,
        "rating": 4.5,
        "disponible": True,
        "imagen": "/images/ParqueSanIsidro.jpg",
        "direccion": "Av. Augusto Perez Aranibar 1595, San Isidro",
        "lat": -12.1039,
        "lng": -77.0572,
    },
    {
        "code": "esp-003",
        "nombre": "PARQUE PUEBLO LIBRE",
        "distrito": "Pueblo Libre",
        "tipo": "Losas deportivas",
        "precio_hora": 30,
        "rating": 4.5,
        "disponible": False,
        "imagen": "/images/ParquePuebloLibre.jpg",
        "direccion": "Jr. Juan Valer Sandoval 300, Pueblo Libre",
        "lat": -12.0781,
        "lng": -77.075,
    },
    {
        "code": "esp-004",
        "nombre": "PARQUE EL OLIVAR",
        "distrito": "San Isidro",
        "tipo": "Parques y areas verdes",
        "precio_hora": 20,
        "rating": 4.7,
        "disponible": True,
        "imagen": "/images/ParqueElOlivar.png",
        "direccion": "Av. Paz Soldan 600, San Isidro (Bosque El Olivar)",
        "lat": -12.1009,
        "lng": -77.0348,
    },
    {
        "code": "esp-005",
        "nombre": "CENTRO CULTURAL MUNA",
        "distrito": "Miraflores",
        "tipo": "Infraestructura y Areas Culturales",
        "precio_hora": 50,
        "rating": 4.3,
        "disponible": True,
        "imagen": "/images/CentroCulturalMunapng.png",
        "direccion": "Av. Jose Larco 770, Miraflores",
        "lat": -12.1254,
        "lng": -77.0294,
    },
]

# Parque representativo por distrito (nombre se muestra como PARQUE {DISTRITO}).
DISTRITO_PARQUES: dict[str, dict[str, float | str]] = {
    "Ancon": {
        "direccion": "Plaza de Armas de Ancon, Jr. Grau, Ancon",
        "lat": -11.7739,
        "lng": -77.1756,
    },
    "Ate": {
        "direccion": "Parque Zonal Huiracocha, Av. Separadora Industrial, Ate",
        "lat": -12.0338,
        "lng": -76.9285,
    },
    "Barranco": {
        "direccion": "Parque Municipal de Barranco, Av. Pedro de Osma, Barranco",
        "lat": -12.1492,
        "lng": -77.0215,
    },
    "Brena": {
        "direccion": "Parque de la Exposicion, Av. 28 de Julio, Brena",
        "lat": -12.0615,
        "lng": -77.0368,
    },
    "Carabayllo": {
        "direccion": "Parque Central de Carabayllo, Av. Tupac Amaru, Carabayllo",
        "lat": -11.8515,
        "lng": -77.0332,
    },
    "Chaclacayo": {
        "direccion": "Parque Central de Chaclacayo, Av. Nicolas Ayllon, Chaclacayo",
        "lat": -11.9758,
        "lng": -76.7689,
    },
    "Chorrillos": {
        "direccion": "Parque de la Amistad, Malecon Grau, Chorrillos",
        "lat": -12.1705,
        "lng": -77.0278,
    },
    "Cieneguilla": {
        "direccion": "Parque Central de Cieneguilla, Av. Nueva Toledo, Cieneguilla",
        "lat": -12.1198,
        "lng": -76.8142,
    },
    "Comas": {
        "direccion": "Parque Zonal Sinchi Roca, Av. Universitaria, Comas",
        "lat": -11.9335,
        "lng": -77.0588,
    },
    "El Agustino": {
        "direccion": "Parque Zonal El Agustino, Av. Riva Aguero, El Agustino",
        "lat": -12.0412,
        "lng": -76.9958,
    },
    "Independencia": {
        "direccion": "Parque Central Independencia, Av. Tahuantinsuyo, Independencia",
        "lat": -11.9908,
        "lng": -77.0545,
    },
    "Jesus Maria": {
        "direccion": "Campo de Marte, Av. Gregorio Escobedo, Jesus Maria",
        "lat": -12.0688,
        "lng": -77.0425,
    },
    "La Molina": {
        "direccion": "Parque de la Amistad, Av. La Fontana, La Molina",
        "lat": -12.0755,
        "lng": -76.9512,
    },
    "La Victoria": {
        "direccion": "Parque Cahuide, Av. Mexico, La Victoria",
        "lat": -12.0682,
        "lng": -77.0158,
    },
    "Lima": {
        "direccion": "Parque Universitario, Av. Nicolas de Pierola, Cercado de Lima",
        "lat": -12.0528,
        "lng": -77.0325,
    },
    "Lince": {
        "direccion": "Parque Castilla, Av. Arenales, Lince",
        "lat": -12.0855,
        "lng": -77.0348,
    },
    "Los Olivos": {
        "direccion": "Parque Central Los Olivos, Av. Antunez de Mayolo, Los Olivos",
        "lat": -11.9795,
        "lng": -77.0788,
    },
    "Lurigancho": {
        "direccion": "Parque Central de Chosica, Av. 28 de Julio, Lurigancho-Chosica",
        "lat": -11.9435,
        "lng": -76.7095,
    },
    "Lurin": {
        "direccion": "Parque Central de Lurin, Jr. Real, Lurin",
        "lat": -12.2748,
        "lng": -76.8695,
    },
    "Magdalena del Mar": {
        "direccion": "Parque Central Magdalena, Av. Brasil, Magdalena del Mar",
        "lat": -12.0928,
        "lng": -77.0695,
    },
    "Miraflores": {
        "direccion": "Parque Kennedy, Calle Schell, Miraflores",
        "lat": -12.1211,
        "lng": -77.0297,
    },
    "Pachacamac": {
        "direccion": "Parque Central de Pachacamac, Av. Antigua Panamericana Sur, Pachacamac",
        "lat": -12.2305,
        "lng": -76.8602,
    },
    "Pucusana": {
        "direccion": "Malecon de Pucusana, Av. San Pedro, Pucusana",
        "lat": -12.4818,
        "lng": -76.7975,
    },
    "Pueblo Libre": {
        "direccion": "Parque de la Cultura, Av. Vivanco, Pueblo Libre",
        "lat": -12.0755,
        "lng": -77.0628,
    },
    "Puente Piedra": {
        "direccion": "Parque Central Puente Piedra, Av. San Pedro, Puente Piedra",
        "lat": -11.8665,
        "lng": -77.0768,
    },
    "Punta Hermosa": {
        "direccion": "Parque Central Punta Hermosa, Calle Malecón, Punta Hermosa",
        "lat": -12.3375,
        "lng": -76.8258,
    },
    "Punta Negra": {
        "direccion": "Parque Central Punta Negra, Av. San Bartolo, Punta Negra",
        "lat": -12.3655,
        "lng": -76.7955,
    },
    "Rimac": {
        "direccion": "Alameda de los Descalzos, Jr. Chira, Rimac",
        "lat": -12.0268,
        "lng": -77.0335,
    },
    "San Bartolo": {
        "direccion": "Parque Central San Bartolo, Malecon San Bartolo, San Bartolo",
        "lat": -12.3885,
        "lng": -76.7785,
    },
    "San Borja": {
        "direccion": "Parque de la Amistad, Av. Javier Prado Este, San Borja",
        "lat": -12.1015,
        "lng": -76.9985,
    },
    "San Isidro": {
        "direccion": "Bosque El Olivar, Av. Paz Soldan, San Isidro",
        "lat": -12.1009,
        "lng": -77.0348,
    },
    "San Juan de Lurigancho": {
        "direccion": "Parque Zonal Huascar, Av. Wiesse, San Juan de Lurigancho",
        "lat": -11.9785,
        "lng": -76.9985,
    },
    "San Juan de Miraflores": {
        "direccion": "Parque Central SJM, Av. Los Heroes, San Juan de Miraflores",
        "lat": -12.1625,
        "lng": -76.9685,
    },
    "San Luis": {
        "direccion": "Parque Central San Luis, Av. San Luis, San Luis",
        "lat": -12.0735,
        "lng": -76.9955,
    },
    "San Martin de Porres": {
        "direccion": "Parque Central SMP, Av. Eduardo de Habich, San Martin de Porres",
        "lat": -12.0005,
        "lng": -77.0875,
    },
    "San Miguel": {
        "direccion": "Av. Juan Bertolotto 760, San Miguel",
        "lat": -12.092,
        "lng": -77.0828,
    },
    "Santa Anita": {
        "direccion": "Parque Central Santa Anita, Av. Los Incas, Santa Anita",
        "lat": -12.0435,
        "lng": -76.9715,
    },
    "Santa Maria del Mar": {
        "direccion": "Parque Central Santa Maria del Mar, Calle Principal, Santa Maria del Mar",
        "lat": -12.4085,
        "lng": -76.7782,
    },
    "Santa Rosa": {
        "direccion": "Parque Central Santa Rosa, Av. Santa Rosa, Santa Rosa",
        "lat": -11.7955,
        "lng": -77.1568,
    },
    "Santiago de Surco": {
        "direccion": "Parque de la Amistad, Av. Circunvalacion Golf Los Incas, Santiago de Surco",
        "lat": -12.1265,
        "lng": -76.9825,
    },
    "Surquillo": {
        "direccion": "Parque Reducto No. 2, Av. Angamos Este, Surquillo",
        "lat": -12.1135,
        "lng": -77.0185,
    },
    "Villa El Salvador": {
        "direccion": "Parque Central Villa El Salvador, Av. Revolucion, Villa El Salvador",
        "lat": -12.2125,
        "lng": -76.9435,
    },
    "Villa Maria del Triunfo": {
        "direccion": "Parque Central VMT, Av. Pachacutec, Villa Maria del Triunfo",
        "lat": -12.1655,
        "lng": -76.9225,
    },
}

PARK_IMAGES = [
    "/images/ParqueElOlivar.png",
    "/images/LosaSanMiguel.jpg",
    "/images/ParqueSanIsidro.jpg",
    "/images/ParquePuebloLibre.jpg",
]


def build_spaces() -> list[dict]:
    spaces = list(BASE_SPACES)
    covered = {item["distrito"] for item in BASE_SPACES}
    next_index = len(BASE_SPACES) + 1

    for distrito in LIMA_DISTRITOS:
        if distrito in covered:
            continue
        parque = DISTRITO_PARQUES.get(distrito, {})
        spaces.append(
            {
                "code": f"esp-{next_index:03d}",
                "nombre": f"PARQUE {distrito.upper()}",
                "distrito": distrito,
                "tipo": "Parques y areas verdes",
                "precio_hora": 25,
                "rating": 4.4,
                "disponible": True,
                "imagen": PARK_IMAGES[(next_index - 1) % len(PARK_IMAGES)],
                "direccion": str(parque.get("direccion", f"Parque central, {distrito}")),
                "lat": float(parque.get("lat", -12.046)),
                "lng": float(parque.get("lng", -77.043)),
            }
        )
        next_index += 1

    return spaces


SPACES = build_spaces()


def run() -> None:
    db = SessionLocal()
    try:
        users = UserRepository(db)
        spaces = SpaceRepository(db)

        if not users.get_by_username(settings.admin_username):
            users.add(
                User(
                    username=settings.admin_username,
                    nombre="Administrador",
                    distrito="San Miguel",
                    password_hash=hash_password(settings.admin_password),
                    role=UserRole.admin,
                )
            )

        if not users.get_by_dni("87654321"):
            users.add(
                User(
                    dni="87654321",
                    nombre="Ciudadano Demo",
                    distrito="San Miguel",
                    password_hash=hash_password("ciudadano123"),
                    role=UserRole.ciudadano,
                )
            )

        for item in SPACES:
            existing = spaces.get_by_code(item["code"])
            if existing:
                existing.imagen = item["imagen"]
                existing.nombre = item["nombre"]
                existing.distrito = item["distrito"]
                existing.tipo = item["tipo"]
                existing.precio_hora = item["precio_hora"]
                existing.rating = item["rating"]
                existing.disponible = item["disponible"]
                existing.direccion = item["direccion"]
                existing.lat = item["lat"]
                existing.lng = item["lng"]
            else:
                spaces.add(Space(**item))

        db.commit()
        extras = len(SPACES) - len(BASE_SPACES)
        print(
            f"Seed listo: {len(SPACES)} espacios "
            f"({len(BASE_SPACES)} demo + {extras} parques por distrito). "
            "Admin01 / 123654 | ciudadano 87654321 / ciudadano123"
        )
    finally:
        db.close()


if __name__ == "__main__":
    run()
