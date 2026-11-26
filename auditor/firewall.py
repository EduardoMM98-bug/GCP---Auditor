
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


def _crear_hallazgo(
    nombre: str,
    severidad: str,
    titulo: str,
    detalle: str,
    explicacion: str,
    impacto: str,
    remediacion: str,
    pasos: list[str],
    ejemplo: str,
    referencia: str,
) -> Hallazgo:
    """Construye un hallazgo con diagnóstico y solución guiada."""

    return Hallazgo(
        id=f"FW-{nombre}-{titulo.lower().replace(' ', '-')}",
        recurso=nombre,
        severidad=severidad,
        titulo=titulo,
        detalle=detalle,
        remediacion=remediacion,
        explicacion=explicacion,
        impacto=impacto,
        pasos_solucion=pasos,
        ejemplo_configuracion=ejemplo,
        referencia=referencia,
    )


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
                    _crear_hallazgo(
                        nombre=nombre,
                        severidad="critica",
                        titulo="Todos los protocolos permitidos",
                        detalle=(
                            "La regla permite tráfico de cualquier "
                            "protocolo desde Internet."
                        ),
                        explicacion=(
                            "Tu firewall permite conexiones entrantes "
                            "desde cualquier dirección y sin limitar "
                            "el tipo de protocolo."
                        ),
                        impacto=(
                            "Un servicio que no debería estar expuesto "
                            "podría quedar accesible desde Internet."
                        ),
                        remediacion=(
                            "Define únicamente los protocolos y puertos "
                            "que realmente necesita tu aplicación."
                        ),
                        pasos=[
                            "Abre Google Cloud Console.",
                            "Entra en VPC Network y selecciona Firewall.",
                            f"Localiza la regla {nombre}.",
                            "Identifica qué servicios necesitan recibir conexiones.",
                            "Sustituye la autorización de todos los protocolos "
                            "por reglas específicas.",
                            "Comprueba que los servicios necesarios sigan funcionando.",
                            "Ejecuta nuevamente la auditoría.",
                        ],
                        ejemplo=(
                            'Ejemplo orientativo:\n'
                            '{\n'
                            '  "IPProtocol": "tcp",\n'
                            '  "ports": ["443"]\n'
                            '}\n'
                            'Utiliza solamente los puertos que tu servicio necesita.'
                        ),
                        referencia=(
                            "Documentación de Google Cloud: "
                            "Reglas de firewall de VPC."
                        ),
                    )
                )

                continue

            if protocolo == "tcp" and not puertos:

                hallazgos.append(
                    _crear_hallazgo(
                        nombre=nombre,
                        severidad="critica",
                        titulo="Todos los puertos TCP permitidos",
                        detalle=(
                            "La regla permite tráfico TCP sin "
                            "restricción de puertos desde Internet."
                        ),
                        explicacion=(
                            "La regla acepta conexiones TCP hacia "
                            "cualquier puerto de los recursos a los "
                            "que se aplica."
                        ),
                        impacto=(
                            "Los servicios que escuchen en otros puertos "
                            "podrían quedar expuestos innecesariamente."
                        ),
                        remediacion=(
                            "Limita la regla a los puertos TCP "
                            "estrictamente necesarios."
                        ),
                        pasos=[
                            "Abre Google Cloud Console.",
                            "Entra en VPC Network y selecciona Firewall.",
                            f"Busca la regla {nombre}.",
                            "Revisa qué aplicaciones utilizan la máquina virtual.",
                            "Identifica los puertos que realmente necesitan acceso.",
                            "Configura únicamente esos puertos.",
                            "Verifica la conectividad de las aplicaciones.",
                            "Vuelve a ejecutar la auditoría.",
                        ],
                        ejemplo=(
                            'Ejemplo orientativo:\n'
                            '{\n'
                            '  "IPProtocol": "tcp",\n'
                            '  "ports": ["443"]\n'
                            '}\n'
                            'El puerto debe corresponder al servicio real.'
                        ),
                        referencia=(
                            "Documentación de Google Cloud: "
                            "Reglas de firewall de VPC."
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

                if puerto == "22":
                    explicacion = (
                        "SSH permite administrar servidores "
                        "remotamente mediante una conexión segura. "
                        "En este caso, cualquier dirección IPv4 "
                        "puede intentar conectarse."
                    )
                    impacto = (
                        "Podrían producirse intentos de acceso no "
                        "autorizado contra el servidor."
                    )
                    pasos = [
                        "Abre Google Cloud Console.",
                        "Entra en VPC Network y selecciona Firewall.",
                        f"Localiza la regla {nombre}.",
                        "Comprueba qué administradores necesitan acceso SSH.",
                        "Restringe las IP de origen a las direcciones autorizadas.",
                        "Comprueba que puedes seguir administrando el servidor.",
                        "Vuelve a ejecutar la auditoría.",
                    ]

                elif puerto == "3389":
                    explicacion = (
                        "RDP permite controlar remotamente un equipo "
                        "Windows. La regla permite intentos de conexión "
                        "desde cualquier dirección IPv4."
                    )
                    impacto = (
                        "El servidor puede recibir intentos de acceso "
                        "no autorizado mediante escritorio remoto."
                    )
                    pasos = [
                        "Abre Google Cloud Console.",
                        "Entra en VPC Network y selecciona Firewall.",
                        f"Localiza la regla {nombre}.",
                        "Identifica quién necesita utilizar escritorio remoto.",
                        "Restringe el origen a las IP autorizadas.",
                        "Comprueba que los administradores mantienen el acceso.",
                        "Vuelve a ejecutar la auditoría.",
                    ]

                elif puerto == "3306":
                    explicacion = (
                        "MySQL utiliza este puerto para conexiones "
                        "a bases de datos. No suele ser recomendable "
                        "permitir conexiones públicas sin restricciones."
                    )
                    impacto = (
                        "Una base de datos expuesta puede recibir "
                        "intentos de acceso y explotación desde Internet."
                    )
                    pasos = [
                        "Identifica qué aplicación necesita conectarse a MySQL.",
                        "Comprueba si la base de datos necesita acceso público.",
                        "Prioriza utilizar una conexión privada.",
                        "Si necesita acceso remoto, limita el origen a las IP autorizadas.",
                        "Verifica que la aplicación pueda conectarse.",
                        "Ejecuta nuevamente la auditoría.",
                    ]

                else:
                    explicacion = (
                        "PostgreSQL utiliza este puerto para conexiones "
                        "a bases de datos. La regla permite conexiones "
                        "desde cualquier dirección IPv4."
                    )
                    impacto = (
                        "La base de datos puede recibir intentos de "
                        "conexión no autorizados desde Internet."
                    )
                    pasos = [
                        "Identifica qué aplicación utiliza PostgreSQL.",
                        "Comprueba si necesita acceso público.",
                        "Prioriza una conexión mediante red privada.",
                        "Restringe el origen a las IP autorizadas.",
                        "Verifica que la aplicación siga funcionando.",
                        "Ejecuta nuevamente la auditoría.",
                    ]

                hallazgos.append(
                    _crear_hallazgo(
                        nombre=nombre,
                        severidad=severidad,
                        titulo=f"{servicio} expuesto a Internet",
                        detalle=(
                            f"El puerto {puerto} ({servicio}) "
                            "está accesible desde cualquier "
                            "dirección IPv4."
                        ),
                        explicacion=explicacion,
                        impacto=impacto,
                        remediacion=(
                            "Restringe las IP de origen y permite "
                            "únicamente los accesos necesarios."
                        ),
                        pasos=pasos,
                        ejemplo=(
                            '{\n'
                            '  "sourceRanges": ["IP_AUTORIZADA/32"]\n'
                            '}\n'
                            'Sustituye IP_AUTORIZADA por una dirección '
                            'real y autorizada.'
                        ),
                        referencia=(
                            "Documentación de Google Cloud: "
                            "Reglas de firewall de VPC."
                        ),
                    )
                )

    return hallazgos
