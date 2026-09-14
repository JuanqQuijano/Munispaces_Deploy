REPORT_TYPES = [
    "Individuo sospechoso",
    "Instalaciones danadas",
    "Ocupacion informal",
    "Falta de mantenimiento",
]

_TIPO_ALIASES = {
    "sospechoso": "Individuo sospechoso",
    "individuo": "Individuo sospechoso",
    "danada": "Instalaciones danadas",
    "danadas": "Instalaciones danadas",
    "danado": "Instalaciones danadas",
    "infraestructura": "Instalaciones danadas",
    "banc": "Instalaciones danadas",
    "ocupacion": "Ocupacion informal",
    "informal": "Ocupacion informal",
    "ambulante": "Ocupacion informal",
    "mantenimiento": "Falta de mantenimiento",
    "sucio": "Falta de mantenimiento",
    "basura": "Falta de mantenimiento",
}


def normalize_report_tipo(raw: str) -> str | None:
    text = (raw or "").strip().lower()
    if not text:
        return None
    for official in REPORT_TYPES:
        if text == official.lower():
            return official
    for key, official in _TIPO_ALIASES.items():
        if key in text:
            return official
    return None
