
from dataclasses import asdict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from auditor.firewall import analizar_reglas
from api.esquemas import ReglaFirewall


# ==========================================
# CONFIGURACIÓN DE LA API
# ==========================================

app = FastAPI(
    title="GCP-Auditor",
    description=(
        "API para analizar reglas de firewall "
        "y detectar riesgos de seguridad."
    ),
    version="1.0.0",
)


# ==========================================
# CONFIGURACIÓN CORS
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://gcp-auditor.vercel.app",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


# ==========================================
# ENDPOINT PRINCIPAL
# ==========================================

@app.get("/")
def inicio():
    return {
        "mensaje": "GCP-Auditor API funcionando",
        "version": "1.0.0",
        "documentacion": "/docs",
    }


# ==========================================
# COMPROBACIÓN DEL ESTADO DEL SERVICIO
# ==========================================

@app.get("/health")
def verificar_estado():
    return {
        "estado": "activo",
        "servicio": "GCP-Auditor",
    }


# ==========================================
# ANÁLISIS DE REGLAS DE FIREWALL
# ==========================================

@app.post("/firewall/analizar")
def analizar_firewall(reglas: list[ReglaFirewall]):

    # Validar que se reciban reglas
    if not reglas:
        raise HTTPException(
            status_code=400,
            detail="Debes proporcionar al menos una regla.",
        )

    # Convertir los modelos Pydantic a diccionarios
    reglas_dict = [
        regla.model_dump(by_alias=True)
        for regla in reglas
    ]

    # Ejecutar el motor de análisis
    hallazgos = analizar_reglas(reglas_dict)

    # Convertir los hallazgos a diccionarios
    resultados = [
        asdict(hallazgo)
        for hallazgo in hallazgos
    ]

    # Devolver el reporte
    return {
        "total_reglas_analizadas": len(reglas_dict),
        "total_hallazgos": len(resultados),
        "hallazgos": resultados,
    }
