
from dataclasses import asdict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from api.esquemas import ReglaFirewall
from auditor.firewall import analizar_reglas


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

ORIGENES_PERMITIDOS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "https://gcp-auditor.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGENES_PERMITIDOS,
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
        "version": app.version,
        "documentacion": "/docs",
    }


# ==========================================
# ESTADO DEL SERVICIO
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

@app.post(
    "/firewall/analizar",
    summary="Analizar reglas de firewall",
    description=(
        "Analiza reglas de firewall y devuelve "
        "los riesgos de seguridad identificados."
    ),
    responses={
        400: {
            "description": "No se proporcionaron reglas."
        }
    },
)
def analizar_firewall(reglas: list[ReglaFirewall]):

    # 1. Validar que existan reglas
    if not reglas:
        raise HTTPException(
            status_code=400,
            detail="Debes proporcionar al menos una regla.",
        )

    # 2. Convertir modelos Pydantic a diccionarios
    reglas_dict = [
        regla.model_dump(by_alias=True)
        for regla in reglas
    ]

    # 3. Ejecutar el motor de análisis
    hallazgos = analizar_reglas(reglas_dict)

    # 4. Convertir los hallazgos a diccionarios
    resultados = [
        asdict(hallazgo)
        for hallazgo in hallazgos
    ]

    # 5. Construir el reporte
    return {
        "total_reglas_analizadas": len(reglas_dict),
        "total_hallazgos": len(resultados),
        "hallazgos": resultados,
    }
