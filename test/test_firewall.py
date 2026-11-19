
from auditor.firewall import analizar_reglas


def crear_regla(nombre, origen, protocolo, puertos=None, deshabilitada=False):

    permitido = {"IPProtocol": protocolo}

    if puertos is not None:
        permitido["ports"] = puertos

    return {
        "name": nombre,
        "direction": "INGRESS",
        "disabled": deshabilitada,
        "sourceRanges": origen,
        "allowed": [permitido]
    }


def test_detecta_ssh_expuesto():

    regla = crear_regla(
        "ssh-publico", ["0.0.0.0/0"], "tcp", ["22"]
    )

    hallazgos = analizar_reglas([regla])

    assert len(hallazgos) == 1
    assert hallazgos[0].severidad == "alta"


def test_detecta_rdp_expuesto():

    regla = crear_regla(
        "rdp-publico", ["0.0.0.0/0"], "tcp", ["3389"]
    )

    hallazgos = analizar_reglas([regla])

    assert len(hallazgos) == 1
    assert hallazgos[0].severidad == "alta"


def test_detecta_mysql_expuesto():

    regla = crear_regla(
        "mysql-publico", ["0.0.0.0/0"], "tcp", ["3306"]
    )

    hallazgos = analizar_reglas([regla])

    assert len(hallazgos) == 1
    assert hallazgos[0].severidad == "critica"


def test_detecta_rango_de_puertos():

    regla = crear_regla(
        "rango-ssh", ["0.0.0.0/0"], "tcp", ["20-30"]
    )

    hallazgos = analizar_reglas([regla])

    assert len(hallazgos) == 1
    assert hallazgos[0].recurso == "rango-ssh"


def test_detecta_todos_los_protocolos():

    regla = crear_regla(
        "todo-abierto", ["0.0.0.0/0"], "all"
    )

    hallazgos = analizar_reglas([regla])

    assert len(hallazgos) == 1
    assert hallazgos[0].severidad == "critica"


def test_detecta_tcp_sin_puertos():

    regla = crear_regla(
        "tcp-abierto", ["0.0.0.0/0"], "tcp"
    )

    hallazgos = analizar_reglas([regla])

    assert len(hallazgos) == 1
    assert hallazgos[0].severidad == "critica"


def test_ignora_regla_privada():

    regla = crear_regla(
        "red-interna", ["10.128.0.0/9"], "tcp", ["3306"]
    )

    assert analizar_reglas([regla]) == []


def test_ignora_regla_deshabilitada():

    regla = crear_regla(
        "ssh-deshabilitado",
        ["0.0.0.0/0"],
        "tcp",
        ["22"],
        deshabilitada=True
    )

    assert analizar_reglas([regla]) == []
