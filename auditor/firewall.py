
from auditor.hallazgo import Hallazgo


PUERTOS_SENSIBLES = {
    "22": "SSH",
    "3389": "RDP",
    "3306": "MySQL",
    "5432": "PostgreSQL",
}

BASES_DE_DATOS = {"3306", "5432"}


def _cubre_puerto(rango: str, puerto: str) -> bool:
    """Comprueba si un puerto está dentro de un puerto o rango."""

    try:
        if "-" not in rango:
            return rango == puerto

        inicio, fin = rango.split("-", 1)

        return int(inicio) <= int(puerto) <= int(fin)

    except (ValueError, TypeError):
        return False


def analizar_reglas(reglas: list[dict]) -> list[Hallazgo]:

    hallazgos = []

    for regla in reglas:

        if regla.get("direction") != "INGRESS":
            continue

        if regla.get("disabled", False):
            continue

        origenes = regla.get("sourceRanges", [])

        if "0.0.0.0/0" not in origenes:
            continue

        nombre = regla.get("name", "regla-desconocida")

        for permitido in regla.get("allowed", []):

            protocolo = permitido.get("IPProtocol")
            puertos = permitido.get("ports", [])

            if protocolo == "all":

                hallazgos.append(
                    Hallazgo(
                        id=f"FW-{nombre}-all",
                        recurso=nombre,
                        severidad="critica",
                        titulo="Todos los protocolos permitidos",
                        detalle=(
                            "La regla permite tráfico de cualquier "
                            "protocolo desde Internet."
                        ),
                        remediacion=(
                            "Restringe los protocolos y las IP de origen "
                            "a los estrictamente necesarios."
                        ),
                    )
                )

                continue

            if protocolo == "tcp" and not puertos:

                hallazgos.append(
                    Hallazgo(
                        id=f"FW-{nombre}-tcp-all",
                        recurso=nombre,
                        severidad="critica",
                        titulo="Todos los puertos TCP permitidos",
                        detalle=(
                            "La regla permite tráfico TCP sin "
                            "restricción de puertos desde Internet."
                        ),
                        remediacion=(
                            "Limita los puertos TCP y las IP de origen."
                        ),
                    )
                )

                continue

            if protocolo != "tcp":
                continue

            for puerto, servicio in PUERTOS_SENSIBLES.items():

                expuesto = any(
                    _cubre_puerto(rango, puerto)
                    for rango in puertos
                )

                if not expuesto:
                    continue

                severidad = (
                    "critica"
                    if puerto in BASES_DE_DATOS
                    else "alta"
                )

                hallazgos.append(
                    Hallazgo(
                        id=f"FW-{nombre}-{puerto}",
                        recurso=nombre,
                        severidad=severidad,
                        titulo=f"{servicio} expuesto a Internet",
                        detalle=(
                            f"El puerto {puerto} ({servicio}) "
                            "está accesible desde cualquier "
                            "dirección IPv4."
                        ),
                        remediacion=(
                            "Restringe las IP de origen y permite "
                            "únicamente los accesos necesarios."
                        ),
                    )
                )

    return hallazgos
