import os
from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# =====================================================
# CONFIGURACIÓN DE ALMACENAMIENTO
# =====================================================

APP_DATA_DIR = (
    Path.home()
    / "Documents"
    /"GCP-Auditor_Data"
)

APP_DATA_DIR.mkdir(parents=True, exist_ok=True)
DATABASE_PATH = APP_DATA_DIR / "gcp_auditor.db"
DATABASE_URL = f"sqlite:///{DATABASE_PATH.as_posix()}"

# =====================================================
# BASE DE MODELOS
# =====================================================

class Base(DeclarativeBase):
    pass

# =====================================================
# MOTOR DE BASE DE DATOS
# =====================================================

engine = create_engine(
    DATABASE_URL,
    connect_args={
        "check_same_thread": False,
        "timeout": 30,
    },
    echo=False,
)

# =====================================================
# CLAVES FORÁNEAS SQLITE
# =====================================================


@event.listens_for(engine, "connect")
def activar_claves_foraneas(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys = ON")
    cursor.close()


# =====================================================
# SESIONES
# =====================================================

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)

def obtener_sesion():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()