import calendar
from datetime import date

LIMA_DISTRITOS = [
    "Ancon",
    "Ate",
    "Barranco",
    "Brena",
    "Carabayllo",
    "Chaclacayo",
    "Chorrillos",
    "Cieneguilla",
    "Comas",
    "El Agustino",
    "Independencia",
    "Jesus Maria",
    "La Molina",
    "La Victoria",
    "Lima",
    "Lince",
    "Los Olivos",
    "Lurigancho",
    "Lurin",
    "Magdalena del Mar",
    "Miraflores",
    "Pachacamac",
    "Pucusana",
    "Pueblo Libre",
    "Puente Piedra",
    "Punta Hermosa",
    "Punta Negra",
    "Rimac",
    "San Bartolo",
    "San Borja",
    "San Isidro",
    "San Juan de Lurigancho",
    "San Juan de Miraflores",
    "San Luis",
    "San Martin de Porres",
    "San Miguel",
    "Santa Anita",
    "Santa Maria del Mar",
    "Santa Rosa",
    "Santiago de Surco",
    "Surquillo",
    "Villa El Salvador",
    "Villa Maria del Triunfo",
]

RESIDENT_DISCOUNT_SOLES = 5


def es_distrito_lima(nombre: str) -> bool:
    needle = nombre.strip().casefold()
    return any(item.casefold() == needle for item in LIMA_DISTRITOS)


def normalizar_distrito(nombre: str) -> str:
    needle = nombre.strip().casefold()
    for item in LIMA_DISTRITOS:
        if item.casefold() == needle:
            return item
    return nombre.strip()


def precio_hora_residente(precio_lista: int) -> int:
    return max(0, int(precio_lista) - RESIDENT_DISCOUNT_SOLES)


def es_residente_del_espacio(distrito_usuario: str | None, distrito_espacio: str) -> bool:
    if not distrito_usuario:
        return False
    return distrito_usuario.strip().casefold() == distrito_espacio.strip().casefold()


def precio_hora_para(precio_lista: int, distrito_usuario: str | None, distrito_espacio: str) -> int:
    if es_residente_del_espacio(distrito_usuario, distrito_espacio):
        return precio_hora_residente(precio_lista)
    return int(precio_lista)


def add_months(start: date, months: int) -> date:
    month_index = start.month - 1 + months
    year = start.year + month_index // 12
    month = month_index % 12 + 1
    day = min(start.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)
