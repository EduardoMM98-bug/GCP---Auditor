from fastapi import FastAPI
from auditor.firewall import analizar_reglas
from dataclasses import asdict

app = FastAPI(
    title=  "GCP-Auditor"
)

@app.get("/")
def inicio():
    return { "mensaje": "GCP-Auditor API funcionando"}

@app.get("/health")
def verificar_estado():
    return {
        "estado": "activo",
        "servicio": "GCP-Auditor"
    }

@app.post("/firewall/analizar")
def analizar_firewall(reglas: list[dict]):
    return [asdict(hallazgo) for hallazgo in analizar_reglas(reglas)]