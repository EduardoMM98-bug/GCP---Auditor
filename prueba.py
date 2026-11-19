import json

from auditor.firewall import analizar_reglas


with open("datos/reglas_ejemplo.json", encoding="utf-8") as archivo:
    reglas = json.load(archivo)


print("Total de reglas:", len(reglas))

hallazgos = analizar_reglas(reglas)

print("\nREPORTE DE SEGURIDAD")
print("-" * 40)

for hallazgo in hallazgos:

    print(f"ID: {hallazgo.id}")
    print(f"Recurso: {hallazgo.recurso}")
    print(f"Severidad: {hallazgo.severidad.upper()}")
    print(f"Título: {hallazgo.titulo}")
    print(f"Detalle: {hallazgo.detalle}")
    print(f"Remediación: {hallazgo.remediacion}")
    print("-" * 40)

print("Total de hallazgos:", len(hallazgos))


# Prueba independiente de rangos de puertos

regla_rango = {
    "name": "lab-rango-ssh",
    "direction": "INGRESS",
    "disabled": False,
    "sourceRanges": ["0.0.0.0/0"],
    "allowed": [
        {
            "IPProtocol": "tcp",
            "ports": ["20-30"]
        }
    ]
}

resultado_rango = analizar_reglas([regla_rango])

print("\nPRUEBA DE RANGOS")
print("-" * 40)

for hallazgo in resultado_rango:

    print(hallazgo.titulo)
    print("Recurso:", hallazgo.recurso)
    print("Severidad:", hallazgo.severidad)

print("Total de hallazgos en rango:", len(resultado_rango))