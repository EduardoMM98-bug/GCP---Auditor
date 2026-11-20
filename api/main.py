from fastapi import FastAPI
from dataclasses import asdict

from auditor.firewall import analizar_reglas
from api.esquemas import ReglaFirewall


app = FastAPI(
    title="GCP-Auditor"
)


@app.get("/")
def inicio():
    return {
        "mensaje": "GCP-Auditor API funcionando"
    }


@app.get("/health")
def verificar_estado():
    return {
        "estado": "activo",
        "servicio": "GCP-Auditor"
    }


@app.post("/firewall/analizar")
def analizar_firewall(reglas: list[ReglaFirewall]):
    reglas_dict = [
        regla.model_dump(by_alias=True)
        for regla in reglas
    ]

    hallazgos = analizar_reglas(reglas_dict)

    return [
        asdict(hallazgo)
        for hallazgo in hallazgos
    ]