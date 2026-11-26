
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from database.conexion import Base


def generar_uuid() -> str:
    return str(uuid4())


def fecha_utc() -> datetime:
    return datetime.now(timezone.utc)


class Usuario(Base):
    __tablename__ = "users"

    __table_args__ = (
        CheckConstraint(
            "role IN ('admin', 'user')",
            name="ck_users_role",
        ),
        Index("ix_users_email", "email", unique=True),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generar_uuid
    )
    email: Mapped[str] = mapped_column(String(254), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        String(10), nullable=False, default="user"
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=fecha_utc
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=fecha_utc,
        onupdate=fecha_utc,
    )


class Invitacion(Base):
    __tablename__ = "invitations"

    __table_args__ = (
        Index("ix_invitations_email", "email"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generar_uuid
    )
    email: Mapped[str] = mapped_column(String(254), nullable=False)
    token_hash: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True
    )
    created_by: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=fecha_utc
    )


class Auditoria(Base):
    __tablename__ = "audits"

    __table_args__ = (
        Index("ix_audits_user_created", "user_id", "created_at"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generar_uuid
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    source_filename: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    total_rules: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    total_findings: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    critical_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    high_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    medium_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    low_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=fecha_utc
    )


class HallazgoDB(Base):
    __tablename__ = "findings"

    __table_args__ = (
        Index("ix_findings_audit", "audit_id"),
        Index("ix_findings_severity", "severidad"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generar_uuid
    )
    audit_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("audits.id", ondelete="CASCADE"),
        nullable=False,
    )
    recurso: Mapped[str] = mapped_column(String(255), nullable=False)
    severidad: Mapped[str] = mapped_column(String(30), nullable=False)
    titulo: Mapped[str] = mapped_column(String(255), nullable=False)
    detalle: Mapped[str] = mapped_column(Text, nullable=False)
    remediacion: Mapped[str] = mapped_column(Text, nullable=False)
    explicacion: Mapped[str] = mapped_column(Text, nullable=False)
    impacto: Mapped[str] = mapped_column(Text, nullable=False)
    pasos_solucion: Mapped[list | None] = mapped_column(
        JSON, nullable=True
    )
    ejemplo_configuracion: Mapped[dict | list | None] = mapped_column(
        JSON, nullable=True
    )
    referencia: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )


class Sesion(Base):
    __tablename__ = "sessions"

    __table_args__ = (
        Index("ix_sessions_user", "user_id"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generar_uuid
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    refresh_token_hash: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=fecha_utc
    )
