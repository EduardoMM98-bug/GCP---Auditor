
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import './App.css'

const API_URL =
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const EJEMPLO_REGLAS = [
  {
    name: 'default-allow-ssh',
    direction: 'INGRESS',
    sourceRanges: ['0.0.0.0/0'],
    allowed: [{ IPProtocol: 'tcp', ports: ['22'] }],
  },
  {
    name: 'default-allow-rdp',
    direction: 'INGRESS',
    sourceRanges: ['0.0.0.0/0'],
    allowed: [{ IPProtocol: 'tcp', ports: ['3389'] }],
  },
  {
    name: 'lab-bd-abierta',
    direction: 'INGRESS',
    sourceRanges: ['0.0.0.0/0'],
    allowed: [{ IPProtocol: 'tcp', ports: ['3306'] }],
  },
  {
    name: 'lab-todo-abierto',
    direction: 'INGRESS',
    sourceRanges: ['0.0.0.0/0'],
    allowed: [{ IPProtocol: 'all' }],
  },
  {
    name: 'interna-segura',
    direction: 'INGRESS',
    sourceRanges: ['10.128.0.0/9'],
    allowed: [{ IPProtocol: 'tcp', ports: ['3306', '5432'] }],
  },
]

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { id: 'auditorias', label: 'Auditorías', icon: 'shield' },
  { id: 'hallazgos', label: 'Hallazgos', icon: 'alert' },
  { id: 'reportes', label: 'Reportes', icon: 'chart' },
]

function Icon({ name }) {
  const paths = {
    grid: <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>,
    shield: <>
      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
      <path d="m9 12 2 2 4-4" />
    </>,
    alert: <>
      <path d="m10.3 3.9-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.1l-8-14a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4m0 4h.01" />
    </>,
    chart: <>
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-5 5" />
    </>,
    upload: <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m17 8-5-5-5 5m5-5v12" />
    </>,
    check: <path d="m5 12 4 4L19 6" />,
    clock: <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </>,
    server: <>
      <rect x="3" y="3" width="18" height="8" rx="2" />
      <rect x="3" y="13" width="18" height="8" rx="2" />
      <path d="M7 7h.01M7 17h.01M11 7h6m-6 10h6" />
    </>,
    file: <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6M8 13h8m-8 4h8" />
    </>,
    refresh: <>
      <path d="M20 7v5h-5M4 17v-5h5" />
      <path d="M5.6 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.4-3" />
    </>,
    cloud: (
      <path d="M20 16.2A4.5 4.5 0 0 0 18 7.5a6 6 0 0 0-11.5 1.8A4 4 0 0 0 7 17h12" />
    ),
    copy: <>
      <rect x="8" y="8" width="13" height="13" rx="2" />
      <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
    </>,
    chevron: <path d="m6 9 6 6 6-6" />,
    download: <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5M12 15V3" />
    </>,
  }

  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || null}
    </svg>
  )
}

function StatCard({ label, value, detail, icon, tone }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon name={icon} />
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-detail">{detail}</div>
    </article>
  )
}

function SeverityBadge({ severity }) {
  const normalized = (severity || '').toLowerCase()

  const labels = {
    critica: 'Crítica',
    'crítica': 'Crítica',
    alta: 'Alta',
    media: 'Media',
    baja: 'Baja',
  }

  return (
    <span className={`severity-badge ${normalized}`}>
      {labels[normalized] || 'Sin clasificar'}
    </span>
  )
}

function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon name="file" />
      </div>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  )
}

function FindingList({ findings, detailed = false }) {
  const [expanded, setExpanded] = useState({})
  const [copiedId, setCopiedId] = useState(null)
  const [copyError, setCopyError] = useState(null)

  const allExpanded =
    findings.length > 0 &&
    findings.every((finding, index) => {
      const id = finding.id || `${finding.recurso || 'hallazgo'}-${index}`
      return Boolean(expanded[id])
    })

  const toggleFinding = (id) => {
    setExpanded((previous) => ({
      ...previous,
      [id]: !previous[id],
    }))
  }

  const toggleAll = () => {
    const nextState = {}

    findings.forEach((finding, index) => {
      const id = finding.id || `${finding.recurso || 'hallazgo'}-${index}`
      nextState[id] = !allExpanded
    })

    setExpanded(nextState)
  }

  const handleCopy = async (configuration, id) => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('El navegador no permite copiar automáticamente.')
      }

      await navigator.clipboard.writeText(configuration)
      setCopiedId(id)
      setCopyError(null)

      window.setTimeout(() => {
        setCopiedId((current) => current === id ? null : current)
      }, 2500)
    } catch {
      setCopyError(id)

      window.setTimeout(() => {
        setCopyError((current) => current === id ? null : current)
      }, 4000)
    }
  }

  return (
    <>
      {detailed && findings.length > 0 && (
        <div className="finding-list-actions">
          <span>{findings.length} hallazgos encontrados</span>

          <button
            type="button"
            className="finding-toggle"
            onClick={toggleAll}
          >
            <Icon name="chevron" />
            {allExpanded ? 'Contraer todos' : 'Expandir todos'}
          </button>
        </div>
      )}

      <div className="findings-list">
        {findings.map((finding, index) => {
          const id = finding.id || `${finding.recurso || 'hallazgo'}-${index}`
          const isExpanded = Boolean(expanded[id])

          return (
            <article className="finding-card" key={id}>
              <div className="finding-main">
                <div className="finding-symbol">
                  <Icon name="alert" />
                </div>

                <div className="finding-content">
                  <div className="finding-title-row">
                    <h4>{finding.titulo || 'Hallazgo de seguridad'}</h4>
                    <SeverityBadge severity={finding.severidad} />
                  </div>

                  <p>{finding.detalle || 'Sin descripción disponible.'}</p>

                  <div className="finding-resource">
                    <span>Recurso:</span> {finding.recurso || 'No especificado'}
                  </div>

                  {detailed && (
                    <button
                      type="button"
                      className="finding-toggle"
                      onClick={() => toggleFinding(id)}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? 'Contraer detalles' : 'Ver detalles'}
                      <Icon name="chevron" />
                    </button>
                  )}

                  {detailed && isExpanded && (
                    <div className="finding-details-content">
                      <div className="remediation">
                        <div className="remediation-section">
                          <strong>¿Qué significa este riesgo?</strong>
                          <p>{finding.explicacion || finding.detalle}</p>
                        </div>

                        <div className="remediation-section">
                          <strong>¿Qué podría pasar?</strong>
                          <p>
                            {finding.impacto ||
                              'Este riesgo podría comprometer la seguridad del recurso.'}
                          </p>
                        </div>

                        <div className="remediation-section">
                          <strong>¿Cómo solucionarlo?</strong>
                          <p>
                            {finding.remediacion ||
                              'Revisa la configuración de la regla y aplica las medidas de seguridad correspondientes.'}
                          </p>

                          {Array.isArray(finding.pasos_solucion) &&
                            finding.pasos_solucion.length > 0 && (
                              <ol className="solution-steps">
                                {finding.pasos_solucion.map((paso, stepIndex) => (
                                  <li key={`${id}-paso-${stepIndex}`}>
                                    {paso}
                                  </li>
                                ))}
                              </ol>
                            )}
                        </div>

                        {finding.ejemplo_configuracion && (
                          <div className="remediation-section">
                            <div className="configuration-heading">
                              <strong>Ejemplo de configuración</strong>
                            </div>

                            <pre className="configuration-example">
                              <code>{finding.ejemplo_configuracion}</code>
                            </pre>

                            <button
                              type="button"
                              className="copy-button"
                              onClick={() =>
                                handleCopy(finding.ejemplo_configuracion, id)
                              }
                            >
                              <Icon name="copy" />
                              {copiedId === id
                                ? 'Copiado ✓'
                                : 'Copiar configuración'}
                            </button>

                            {copyError === id && (
                              <p className="copy-error" role="alert">
                                No se pudo copiar. Selecciona el texto manualmente.
                              </p>
                            )}
                          </div>
                        )}

                        {finding.referencia && (
                          <div className="remediation-section">
                            <strong>Documentación de referencia</strong>
                            <p>{finding.referencia}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </>
  )
}

function AuditMetadata({ fileName, date, totalRules }) {
  return (
    <section className="panel audit-metadata">
      <div className="audit-metadata-item">
        <span>Archivo analizado</span>
        <strong>{fileName || 'No especificado'}</strong>
      </div>

      <div className="audit-metadata-item">
        <span>Fecha y hora</span>
        <strong>{date}</strong>
      </div>

      <div className="audit-metadata-item">
        <span>Reglas analizadas</span>
        <strong className="highlight">{totalRules}</strong>
      </div>
    </section>
  )
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [apiOnline, setApiOnline] = useState(false)
  const [checkingApi, setCheckingApi] = useState(true)

  const [rules, setRules] = useState([])
  const [fileName, setFileName] = useState('')
  const [findings, setFindings] = useState([])
  const [totalRules, setTotalRules] = useState(0)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [auditCount, setAuditCount] = useState(0)
  const [lastAudit, setLastAudit] = useState(null)

  const severityCounts = useMemo(() => {
    return findings.reduce((counts, item) => {
      const severity = (item.severidad || '').toLowerCase()

      if (['critica', 'crítica'].includes(severity)) {
        counts.critical += 1
      } else if (severity === 'alta') {
        counts.high += 1
      } else if (severity === 'media') {
        counts.medium += 1
      } else if (severity === 'baja') {
        counts.low += 1
      }

      return counts
    }, { critical: 0, high: 0, medium: 0, low: 0 })
  }, [findings])

  const checkApi = useCallback(async () => {
    setCheckingApi(true)

    try {
      const response = await fetch(`${API_URL}/health`)

      if (!response.ok) {
        throw new Error('API no disponible')
      }

      const data = await response.json()
      setApiOnline(data.estado === 'activo')
    } catch {
      setApiOnline(false)
    } finally {
      setCheckingApi(false)
    }
  }, [])

  useEffect(() => {
    checkApi()

    const interval = window.setInterval(checkApi, 15000)

    return () => window.clearInterval(interval)
  }, [checkApi])

  const clearAuditResults = () => {
    setFindings([])
    setTotalRules(0)
    setLastAudit(null)
  }

  const handleFile = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError('')
    setSuccess('')

    try {
      if (!file.name.toLowerCase().endsWith('.json')) {
        throw new Error('Selecciona un archivo con extensión .json.')
      }

      const parsed = JSON.parse(await file.text())

      if (
        !Array.isArray(parsed) ||
        parsed.length === 0 ||
        !parsed.every((rule) =>
          rule && typeof rule === 'object' && !Array.isArray(rule)
        )
      ) {
        throw new Error('El archivo debe contener una lista JSON de reglas.')
      }

      setRules(parsed)
      setFileName(file.name)
      clearAuditResults()

      setSuccess(`${parsed.length} reglas cargadas correctamente.`)
    } catch (err) {
      setRules([])
      setFileName('')
      clearAuditResults()
      setError(err.message || 'No se pudo leer el archivo JSON.')
    } finally {
      event.target.value = ''
    }
  }

  const loadExample = () => {
    setRules(EJEMPLO_REGLAS)
    setFileName('reglas_ejemplo.json')
    clearAuditResults()
    setError('')
    setSuccess('Se cargaron 5 reglas de ejemplo.')
  }

  const runAudit = async () => {
    if (!rules.length) {
      setError('Primero carga un archivo JSON o utiliza las reglas de ejemplo.')
      return
    }

    if (!apiOnline) {
      setError('La API no está disponible. Comprueba la conexión.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${API_URL}/firewall/analizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rules),
      })

      let data

      try {
        data = await response.json()
      } catch {
        throw new Error('El servidor devolvió una respuesta no válida.')
      }

      if (!response.ok) {
        const detail = data.detail

        const message = Array.isArray(detail)
          ? detail.map((item) => item.msg || 'Error de validación').join('; ')
          : typeof detail === 'string'
            ? detail
            : 'No se pudo completar la auditoría.'

        throw new Error(message)
      }

      if (!Array.isArray(data.hallazgos)) {
        throw new Error('La respuesta de la API tiene un formato inesperado.')
      }

      setFindings(data.hallazgos)
      setTotalRules(data.total_reglas_analizadas ?? rules.length)
      setAuditCount((count) => count + 1)
      setLastAudit(new Date())

      setSuccess('Auditoría completada correctamente.')
      setActiveTab('hallazgos')
    } catch (err) {
      setError(err.message || 'No fue posible conectar con la API.')
    } finally {
      setLoading(false)
    }
  }

  const hasAudit = lastAudit !== null

  const formattedAuditDate = lastAudit
    ? lastAudit.toLocaleString('es-MX', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Sin auditorías'

  const exportAudit = () => {
    if (!hasAudit) {
      setError('Primero debes ejecutar una auditoría para exportar resultados.')
      return
    }

    const report = {
      herramienta: 'GCP-Auditor',
      version: '1.0.0',
      fecha_hora: lastAudit.toISOString(),
      archivo_analizado: fileName || 'No especificado',
      total_reglas_analizadas: totalRules,
      total_hallazgos: findings.length,
      resumen_severidad: {
        critica: severityCounts.critical,
        alta: severityCounts.high,
        media: severityCounts.medium,
        baja: severityCounts.low,
      },
      hallazgos: findings,
    }

    const blob = new Blob(
      [JSON.stringify(report, null, 2)],
      { type: 'application/json;charset=utf-8' }
    )

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    const timestamp = lastAudit
      .toISOString()
      .replace(/[:.]/g, '-')

    link.href = url
    link.download = `gcp-auditor-${timestamp}.json`

    document.body.appendChild(link)
    link.click()
    link.remove()

    window.setTimeout(() => URL.revokeObjectURL(url), 1000)

    setSuccess('Reporte de auditoría exportado correctamente.')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Icon name="shield" />
          </div>

          <div>
            <div className="brand-name">GCP-Auditor</div>
            <div className="brand-version">SECURITY ANALYZER · 1.0</div>
          </div>
        </div>

        <div className="nav-caption">MENÚ PRINCIPAL</div>

        <nav className="navigation">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              title={tab.label}
            >
              <Icon name={tab.icon} />
              <span>{tab.label}</span>

              {tab.id === 'hallazgos' && findings.length > 0 && (
                <span className="nav-count">{findings.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-api">
            <span className={`status-dot ${apiOnline ? 'online' : 'offline'}`} />
            <div>
              <strong>Estado de API</strong>
              <small>
                {checkingApi
                  ? 'Comprobando...'
                  : apiOnline
                    ? 'Conectada'
                    : 'Desconectada'}
              </small>
            </div>
          </div>

          <div className="sidebar-footer">GCP-Auditor · MVP 1.0</div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="breadcrumb">
              Seguridad / {TABS.find((tab) => tab.id === activeTab)?.label}
            </div>

            <h1>
              {{
                dashboard: 'Panel de control',
                auditorias: 'Auditorías de firewall',
                hallazgos: 'Hallazgos de seguridad',
                reportes: 'Resumen de resultados',
              }[activeTab]}
            </h1>
          </div>

          <div className="topbar-actions">
            <div className={`connection-pill ${apiOnline ? 'connected' : 'disconnected'}`}>
              <span className={`status-dot ${apiOnline ? 'online' : 'offline'}`} />
              {apiOnline ? 'API conectada' : 'API desconectada'}
            </div>

            <button
              type="button"
              className="icon-button"
              onClick={checkApi}
              title="Comprobar conexión"
              aria-label="Comprobar conexión"
              disabled={checkingApi}
            >
              <Icon name="refresh" />
            </button>
          </div>
        </header>

        <div className="page-content">
          {error && (
            <div className="alert-message error-message" role="alert">
              <Icon name="alert" />
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError('')}
                aria-label="Cerrar mensaje"
              >
                ×
              </button>
            </div>
          )}

          {success && (
            <div className="alert-message success-message" role="status">
              <Icon name="check" />
              <span>{success}</span>
              <button
                type="button"
                onClick={() => setSuccess('')}
                aria-label="Cerrar mensaje"
              >
                ×
              </button>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <>
              <section className="welcome-row">
                <div>
                  <h2>Resumen de seguridad</h2>
                  <p>Supervisa y analiza la exposición de tus reglas de firewall.</p>
                </div>

                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setActiveTab('auditorias')}
                >
                  <Icon name="shield" /> Nueva auditoría
                </button>
              </section>

              <section className="stats-grid">
                <StatCard
                  label="Reglas analizadas"
                  value={totalRules}
                  detail="En la última auditoría"
                  icon="server"
                  tone="mint"
                />
                <StatCard
                  label="Hallazgos detectados"
                  value={findings.length}
                  detail="Riesgos identificados"
                  icon="alert"
                  tone="orange"
                />
                <StatCard
                  label="Riesgos críticos"
                  value={severityCounts.critical}
                  detail="Atención prioritaria"
                  icon="shield"
                  tone="red"
                />
                <StatCard
                  label="Auditorías realizadas"
                  value={auditCount}
                  detail="Durante esta sesión"
                  icon="chart"
                  tone="blue"
                />
              </section>

              <section className="dashboard-grid">
                <article className="panel audit-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Iniciar análisis</h3>
                      <p>Carga las reglas de firewall en formato JSON.</p>
                    </div>
                    <div className="panel-icon"><Icon name="upload" /></div>
                  </div>

                  <label className="upload-zone">
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleFile}
                    />
                    <div className="upload-icon"><Icon name="upload" /></div>
                    <strong>Seleccionar archivo JSON</strong>
                    <span>Arrastra o selecciona tu archivo de reglas</span>
                    <small>Formato admitido: .json</small>
                  </label>

                  {fileName && (
                    <div className="selected-file">
                      <Icon name="file" />
                      <div>
                        <strong>{fileName}</strong>
                        <small>{rules.length} reglas cargadas</small>
                      </div>
                      <span className="file-ready">Listo</span>
                    </div>
                  )}

                  <div className="action-row">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={loadExample}
                      disabled={loading}
                    >
                      Cargar ejemplo
                    </button>

                    <button
                      type="button"
                      className="primary-button"
                      onClick={runAudit}
                      disabled={loading || !apiOnline || rules.length === 0}
                    >
                      {loading ? 'Analizando...' : 'Ejecutar auditoría'}
                    </button>
                  </div>

                  {!apiOnline && (
                    <p className="helper-text">
                      Conecta el backend para ejecutar el análisis.
                    </p>
                  )}
                </article>

                <article className="panel status-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Estado del sistema</h3>
                      <p>Disponibilidad del servicio de análisis.</p>
                    </div>
                    <div className="panel-icon"><Icon name="cloud" /></div>
                  </div>

                  <div className="system-status">
                    <div className={`system-status-icon ${apiOnline ? 'good' : 'bad'}`}>
                      <Icon name={apiOnline ? 'check' : 'alert'} />
                    </div>
                    <div>
                      <strong>
                        {apiOnline ? 'Servicio operativo' : 'Servicio no disponible'}
                      </strong>
                      <span>
                        {apiOnline
                          ? 'FastAPI responde correctamente.'
                          : 'No se pudo contactar al backend.'}
                      </span>
                    </div>
                  </div>

                  <div className="system-detail">
                    <span>Endpoint</span>
                    <code>{API_URL}/health</code>
                  </div>

                  <div className="system-detail">
                    <span>Última auditoría</span>
                    <strong>{formattedAuditDate}</strong>
                  </div>

                  <div className="system-detail">
                    <span>Archivo analizado</span>
                    <strong>{hasAudit ? fileName : 'Sin auditorías'}</strong>
                  </div>

                  <button
                    type="button"
                    className="text-button"
                    onClick={checkApi}
                    disabled={checkingApi}
                  >
                    Comprobar servicio <span>→</span>
                  </button>
                </article>
              </section>

              <section className="panel recent-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Hallazgos recientes</h3>
                    <p>Resultados de la última auditoría.</p>
                  </div>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setActiveTab('hallazgos')}
                  >
                    Ver todos <span>→</span>
                  </button>
                </div>

                {findings.length > 0 ? (
                  <FindingList findings={findings.slice(0, 4)} />
                ) : (
                  <EmptyState
                    title="Todavía no hay resultados"
                    description="Carga un archivo JSON y ejecuta tu primera auditoría."
                  />
                )}
              </section>
            </>
          )}

          {activeTab === 'auditorias' && (
            <>
              <section className="welcome-row">
                <div>
                  <h2>Analizador de reglas</h2>
                  <p>
                    Importa un conjunto de reglas para detectar configuraciones riesgosas.
                  </p>
                </div>
              </section>

              <section className="panel audit-panel full-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Archivo de entrada</h3>
                    <p>El motor recibe una lista de reglas de firewall en JSON.</p>
                  </div>
                  <div className="panel-icon"><Icon name="file" /></div>
                </div>

                <label className="upload-zone large-upload">
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFile}
                  />
                  <div className="upload-icon"><Icon name="upload" /></div>
                  <strong>Seleccionar archivo JSON</strong>
                  <span>Selecciona un archivo de reglas de firewall.</span>
                  <small>Solo archivos .json</small>
                </label>

                {fileName && (
                  <div className="selected-file">
                    <Icon name="file" />
                    <div>
                      <strong>{fileName}</strong>
                      <small>{rules.length} reglas cargadas</small>
                    </div>
                    <span className="file-ready">Listo</span>
                  </div>
                )}

                <div className="action-row">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={loadExample}
                    disabled={loading}
                  >
                    Cargar datos de ejemplo
                  </button>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={runAudit}
                    disabled={loading || !apiOnline || rules.length === 0}
                  >
                    {loading ? 'Analizando...' : 'Ejecutar análisis'}
                  </button>
                </div>
              </section>

              <section className="panel info-panel">
                <h3>¿Qué analiza GCP-Auditor?</h3>
                <div className="capability-grid">
                  {[
                    ['SSH', 'Puerto 22', 'red'],
                    ['RDP', 'Puerto 3389', 'red'],
                    ['MySQL', 'Puerto 3306', 'orange'],
                    ['PostgreSQL', 'Puerto 5432', 'orange'],
                    ['Protocolos', 'Reglas abiertas', 'red'],
                  ].map(([name, description, tone]) => (
                    <div key={name}>
                      <span className={`capability-dot ${tone}`} />
                      <strong>{name}</strong>
                      <small>{description}</small>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {activeTab === 'hallazgos' && (
            <>
              <section className="welcome-row">
                <div>
                  <h2>Resultados del análisis</h2>
                  <p>Revisa los riesgos detectados y sus recomendaciones.</p>
                </div>

                <div className="result-actions">
                  <span className="result-count">
                    {findings.length} hallazgos
                  </span>

                  <button
                    type="button"
                    className="export-button"
                    onClick={exportAudit}
                    disabled={!hasAudit}
                  >
                    <Icon name="download" /> Exportar auditoría
                  </button>
                </div>
              </section>

              {hasAudit && (
                <AuditMetadata
                  fileName={fileName}
                  date={formattedAuditDate}
                  totalRules={totalRules}
                />
              )}

              <section className="stats-grid compact-stats">
                <StatCard
                  label="Críticos"
                  value={severityCounts.critical}
                  detail="Prioridad máxima"
                  icon="alert"
                  tone="red"
                />
                <StatCard
                  label="Altos"
                  value={severityCounts.high}
                  detail="Atención prioritaria"
                  icon="shield"
                  tone="orange"
                />
                <StatCard
                  label="Reglas analizadas"
                  value={totalRules}
                  detail="Último análisis"
                  icon="server"
                  tone="mint"
                />
              </section>

              <section className="panel recent-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Detalle de hallazgos</h3>
                    <p>Identificación y remediación de riesgos.</p>
                  </div>
                </div>

                {findings.length > 0 ? (
                  <FindingList findings={findings} detailed />
                ) : (
                  <EmptyState
                    title="No hay hallazgos para mostrar"
                    description="Ejecuta una auditoría para visualizar los riesgos identificados."
                  />
                )}
              </section>
            </>
          )}

          {activeTab === 'reportes' && (
            <>
              <section className="welcome-row">
                <div>
                  <h2>Resumen de auditoría</h2>
                  <p>Indicadores del último análisis realizado en esta sesión.</p>
                </div>

                <button
                  type="button"
                  className="export-button"
                  onClick={exportAudit}
                  disabled={!hasAudit}
                >
                  <Icon name="download" /> Exportar auditoría
                </button>
              </section>

              <section className="stats-grid">
                <StatCard
                  label="Reglas analizadas"
                  value={totalRules}
                  detail="Último análisis"
                  icon="server"
                  tone="mint"
                />
                <StatCard
                  label="Hallazgos"
                  value={findings.length}
                  detail="Total detectado"
                  icon="alert"
                  tone="orange"
                />
                <StatCard
                  label="Críticos"
                  value={severityCounts.critical}
                  detail="Prioridad máxima"
                  icon="shield"
                  tone="red"
                />
                <StatCard
                  label="Altos"
                  value={severityCounts.high}
                  detail="Atención prioritaria"
                  icon="chart"
                  tone="blue"
                />
              </section>

              {hasAudit && (
                <AuditMetadata
                  fileName={fileName}
                  date={formattedAuditDate}
                  totalRules={totalRules}
                />
              )}

              <section className="panel report-panel">
                <h3>Distribución de severidad</h3>

                {findings.length > 0 ? (
                  <div className="severity-summary">
                    {[
                      ['Crítica', severityCounts.critical, 'critical-fill'],
                      ['Alta', severityCounts.high, 'high-fill'],
                      ['Media', severityCounts.medium, 'medium-fill'],
                      ['Baja', severityCounts.low, 'low-fill'],
                    ].map(([label, count, className]) => (
                      <div className="severity-line" key={label}>
                        <span>{label}</span>
                        <div className="bar-track">
                          <div
                            className={`bar-fill ${className}`}
                            style={{
                              width: `${(count / findings.length) * 100}%`,
                            }}
                          />
                        </div>
                        <strong>{count}</strong>
                      </div>
                    ))}

                    <div className="report-note">
                      <Icon name="clock" />
                      Último análisis: {formattedAuditDate}
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    title="No hay datos para generar el resumen"
                    description="Primero ejecuta una auditoría."
                  />
                )}
              </section>
            </>
          )}

          <footer className="page-footer">
            <span>
              GCP-Auditor · Herramienta de análisis de reglas de firewall
            </span>
            <span>Versión 1.0.0</span>
          </footer>
        </div>
      </main>
    </div>
  )
}

export default App
