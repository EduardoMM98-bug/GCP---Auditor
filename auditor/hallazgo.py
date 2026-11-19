from dataclasses import dataclass


@dataclass
class Hallazgo:
    id: str
    recurso: str
    severidad: str
    titulo: str
    detalle: str
    remediacion: str