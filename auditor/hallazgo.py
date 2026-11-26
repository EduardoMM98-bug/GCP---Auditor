from dataclasses import dataclass, field


@dataclass
class Hallazgo:
    # Identificación del problema
    id: str
    recurso: str
    severidad: str
    titulo: str
    detalle: str
    remediacion: str

    # Información para explicar el problema al usuario
    explicacion: str = ""
    impacto: str = ""

    # Guía para corregir el problema
    pasos_solucion: list[str] = field(default_factory=list)
    ejemplo_configuracion: str = ""

    # Documentación de referencia
    referencia: str = ""