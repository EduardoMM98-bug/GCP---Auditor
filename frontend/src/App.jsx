
import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

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

function Icon({ name }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    alert: <><path d="m10.3 3.9-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.1l-8-14a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4m0 4h.01" /></>,
    chart: <><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-5 5" /></>,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m17 8-5-5-5 5m5-5v12" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    clock: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
    server: <><rect x="3" y="3" width="18" height="8" rx="2" /><rect x="3" y="13" width="18" height="8" rx="2" /><path d="M7 7h.01M7 17h.01M11 7h6m-6 10h6" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8m-8 4h8" /></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.6 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.4-3" /></>,
    cloud: <><path d="M20 16.2A4.5 4.5 0 0 0 18 7.5a6 6 0 0 0-11.5 1.8A4 4 0 0 0 7 17h12" /></>,
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
      {paths[name]}
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

  const label =
    normalized === 'critica' || normalized === 'crítica'
      ? 'Crítica'
      : normalized === 'alta'
        ? 'Alta'
        : normalized === 'media'
          ? 'Media'
          : 'Baja'

  return (
    <span className={`severity-badge ${normalized}`}>
      {label}
    </span>
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

  const checkApi = useCallback(async () => {
    setCheckingApi(true)

    try {
      const response = await fetch(`${API_URL}/health`)
      if (!response.ok) throw new Error('API no disponible')

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

  const handleFile = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError('')
    setSuccess('')
    setFindings([])
    setLastAudit(null)

    try {
      const content = await file.text()
      const parsed = JSON.parse(content)

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('El archivo debe contener una lista JSON de reglas.')
      }

      setRules(parsed)
      setFileName(file.name)
      setSuccess(`${parsed.length} reglas cargadas correctamente.`)
    } catch (err) {
      setRules([])
      setFileName('')
      setError(err.message || 'No se pudo leer el archivo JSON.')
    }

    event.target.value = ''
  }

  const loadExample = () => {
    setRules(EJEMPLO_REGLAS)
    setFileName('reglas_ejemplo.json')
    setFindings([])
    setTotalRules(0)
    setLastAudit(null)
    setError('')
    setSuccess('Se cargaron 5 reglas de ejemplo.')
  }

  const runAudit = async () => {
    if (rules.length === 0) {
      setError('Primero carga un archivo JSON o utiliza las reglas de ejemplo.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${API_URL}/firewall/analizar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rules),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'No se pudo completar la auditoría.')
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
      setError(
        err.message ||
          'No fue posible conectar con la API. Comprueba que FastAPI esté ejecutándose.'
      )
      setApiOnline(false)
    } finally {
      setLoading(false)
    }
  }

  const criticalCount = useMemo(
    () =>
      findings.filter((item) =>
        ['critica', 'crítica'].includes((item.severidad || '').toLowerCase())
      ).length,
    [findings]
  )

  const highCount = useMemo(
    () =>
      findings.filter(
        (item) => (item.severidad || '').toLowerCase() === 'alta'
      ).length,
    [findings]
  )

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
    { id: 'auditorias', label: 'Auditorías', icon: 'shield' },
    { id: 'hallazgos', label: 'Hallazgos', icon: 'alert' },
    { id: 'reportes', label: 'Reportes', icon: 'chart' },
  ]

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
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
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
            <div className="breadcrumb">Seguridad / {tabs.find((tab) => tab.id === activeTab)?.label}</div>
            <h1>
              {activeTab === 'dashboard' && 'Panel de control'}
              {activeTab === 'auditorias' && 'Auditorías de firewall'}
              {activeTab === 'hallazgos' && 'Hallazgos de seguridad'}
              {activeTab === 'reportes' && 'Resumen de resultados'}
            </h1>
          </div>

          <div className="topbar-actions">
            <div className={`connection-pill ${apiOnline ? 'connected' : 'disconnected'}`}>
              <span className={`status-dot ${apiOnline ? 'online' : 'offline'}`} />
              {apiOnline ? 'API conectada' : 'API desconectada'}
            </div>
            <button
              className="icon-button"
              onClick={checkApi}
              title="Comprobar conexión"
              aria-label="Comprobar conexión"
            >
              <Icon name="refresh" />
            </button>
          </div>
        </header>

        <div className="page-content">
          {error && (
            <div className="alert-message error-message">
              <Icon name="alert" />
              <span>{error}</span>
              <button onClick={() => setError('')} aria-label="Cerrar">×</button>
            </div>
          )}

          {success && (
            <div className="alert-message success-message">
              <Icon name="check" />
              <span>{success}</span>
              <button onClick={() => setSuccess('')} aria-label="Cerrar">×</button>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <>
              <section className="welcome-row">
                <div>
                  <h2>Resumen de seguridad</h2>
                  <p>
                    Supervisa y analiza la exposición de tus reglas de firewall.
                  </p>
                </div>
                <button
                  className="primary-button"
                  onClick={() => setActiveTab('auditorias')}
                >
                  <Icon name="shield" />
                  Nueva auditoría
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
                  value={criticalCount}
                  detail="Requieren atención prioritaria"
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
                      className="secondary-button"
                      onClick={loadExample}
                    >
                      Cargar ejemplo
                    </button>
                    <button
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
                      <strong>{apiOnline ? 'Servicio operativo' : 'Servicio no disponible'}</strong>
                      <span>{apiOnline ? 'FastAPI responde correctamente.' : 'No se pudo contactar al backend.'}</span>
                    </div>
                  </div>

                  <div className="system-detail">
                    <span>Endpoint</span>
                    <code>{API_URL}/health</code>
                  </div>
                  <div className="system-detail">
                    <span>Última auditoría</span>
                    <strong>
                      {lastAudit ? lastAudit.toLocaleString() : 'Sin auditorías'}
                    </strong>
                  </div>
                  <button className="text-button" onClick={checkApi}>
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
                  <p>Importa un conjunto de reglas para detectar configuraciones riesgosas.</p>
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
                  <button className="secondary-button" onClick={loadExample}>
                    Cargar datos de ejemplo
                  </button>
                  <button
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
                  <div><span className="capability-dot red" /><strong>SSH</strong><small>Puerto 22</small></div>
                  <div><span className="capability-dot red" /><strong>RDP</strong><small>Puerto 3389</small></div>
                  <div><span className="capability-dot orange" /><strong>MySQL</strong><small>Puerto 3306</small></div>
                  <div><span className="capability-dot orange" /><strong>PostgreSQL</strong><small>Puerto 5432</small></div>
                  <div><span className="capability-dot red" /><strong>Protocolos</strong><small>Reglas abiertas</small></div>
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
                <div className="result-count">{findings.length} hallazgos</div>
              </section>

              <section className="stats-grid compact-stats">
                <StatCard label="Críticos" value={criticalCount} detail="Prioridad máxima" icon="alert" tone="red" />
                <StatCard label="Altos" value={highCount} detail="Atención prioritaria" icon="shield" tone="orange" />
                <StatCard label="Reglas analizadas" value={totalRules} detail="Último análisis" icon="server" tone="mint" />
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
              </section>

              <section className="stats-grid">
                <StatCard label="Reglas analizadas" value={totalRules} detail="Último análisis" icon="server" tone="mint" />
                <StatCard label="Hallazgos" value={findings.length} detail="Total detectado" icon="alert" tone="orange" />
                <StatCard label="Críticos" value={criticalCount} detail="Prioridad máxima" icon="shield" tone="red" />
                <StatCard label="Altos" value={highCount} detail="Atención prioritaria" icon="chart" tone="blue" />
              </section>

              <section className="panel report-panel">
                <h3>Distribución de severidad</h3>
                {findings.length > 0 ? (
                  <div className="severity-summary">
                    <div className="severity-line">
                      <span>Crítica</span>
                      <div className="bar-track"><div className="bar-fill critical-fill" style={{ width: `${(criticalCount / findings.length) * 100}%` }} /></div>
                      <strong>{criticalCount}</strong>
                    </div>
                    <div className="severity-line">
                      <span>Alta</span>
                      <div className="bar-track"><div className="bar-fill high-fill" style={{ width: `${(highCount / findings.length) * 100}%` }} /></div>
                      <strong>{highCount}</strong>
                    </div>
                    <div className="report-note">
                      <Icon name="clock" />
                      Último análisis: {lastAudit ? lastAudit.toLocaleString() : 'No disponible'}
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
            <span>GCP-Auditor · Herramienta de análisis de reglas de firewall</span>
            <span>Versión 1.0.0</span>
          </footer>
        </div>
      </main>
    </div>
  )
}

function FindingList({ findings, detailed = false }) {
  return (
    <div className="findings-list">
      {findings.map((finding, index) => (
        <article className="finding-card" key={finding.id || `${finding.recurso}-${index}`}>
          <div className="finding-main">
            <div className="finding-symbol"><Icon name="alert" /></div>
            <div className="finding-content">
              <div className="finding-title-row">
                <h4>{finding.titulo}</h4>
                <SeverityBadge severity={finding.severidad} />
              </div>
              <p>{finding.detalle}</p>
              <div className="finding-resource">
                <span>Recurso:</span> {finding.recurso}
              </div>
              {detailed && (
                <div className="remediation">
                  <strong>Recomendación</strong>
                  <p>{finding.remediacion}</p>
                </div>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon name="file" /></div>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  )
}

export default App
