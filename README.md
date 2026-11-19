# GCP-Auditor

Auditor de seguridad para identificar configuraciones
inseguras en reglas de firewall de Google Cloud Platform.

## Objetivo

Detectar reglas de firewall que permitan tráfico
desde Internet y representen riesgos de seguridad.

## Funcionalidades

- Detección de SSH y RDP expuestos.
- Detección de bases de datos expuestas.
- Detección de todos los protocolos.
- Detección de rangos de puertos.
- Generación de hallazgos y recomendaciones.

## Tecnologías

- Python 3.12
- JSON
- Git

## Ejecución

```bash
python prueba.py