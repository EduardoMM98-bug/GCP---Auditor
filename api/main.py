
from dataclasses import asdict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from auditor.firewall import analizar_reglas
from api.esquemas import ReglaFirewall


app = FastAPI(
    title="GCP-Auditor",
    description=(
        "API para analizar reglas de firewall "
        "y detectar riesgos de seguridad."
    ),
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://TU-PROYECTO.vercel.app",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/")
def inicio():

    return {
        "mensaje": "GCP-Auditor API funcionando",
        "version": "1.0.0",
        "documentacion": "/docs",
    }


@app.get("/health")
def verificar_estado():

    return {
        "estado": "activo",
        "servicio": "GCP-Auditor",
    }


@app.post("/firewall/analizar")
def analizar_firewall(reglas: list[ReglaFirewall]):

    if not reglas:
        raise HTTPException(
            status_code=400,
            detail="Debes proporcionar al menos una regla.",
        )

    reglas_dict = [
        regla.model_dump(by_alias=True)
        for regla in reglas
    ]

    hallazgos = analizar_reglas(reglas_dict)

    resultados = [
        asdict(hallazgo)
        for hallazgo in hallazgos
    ]

    return {
        "total_reglas_analizadas": len(reglas_dict),
        "total_hallazgos": len(resultados),
        "hallazgos": resultados,
    }
