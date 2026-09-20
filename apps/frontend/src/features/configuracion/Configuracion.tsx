import { useState, useEffect } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import toast from 'react-hot-toast';

interface AppSettings {
  theme: 'light' | 'dark';
  notificaciones: boolean;
  notificacionesEmail: boolean;
  notificacionesSonido: boolean;
  idioma: string;
  registrosPorPagina: number;
}

export function Configuracion() {
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'light',
    notificaciones: true,
    notificacionesEmail: false,
    notificacionesSonido: true,
    idioma: 'es',
    registrosPorPagina: 10,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Cargar configuración guardada de localStorage
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Guardar en localStorage
      localStorage.setItem('appSettings', JSON.stringify(settings));
      
      // Aquí podrías también guardar en el backend
      // await settingsService.update(settings);
      
      toast.success('Configuración guardada correctamente');
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const defaultSettings: AppSettings = {
      theme: 'light',
      notificaciones: true,
      notificacionesEmail: false,
      notificacionesSonido: true,
      idioma: 'es',
      registrosPorPagina: 10,
    };
    setSettings(defaultSettings);
    localStorage.setItem('appSettings', JSON.stringify(defaultSettings));
    toast.success('Configuración restaurada por defecto');
  };

  return (
    <div className="container-fluid p-3">
      <PageHeader
        icon="fa-solid fa-sliders"
        title="Configuración del Sistema"
        subtitle="Ajustes generales de la aplicación, preferencias de notificación y visualización"
      />

      <div className="row g-3">
        <div className="col-lg-9 mx-auto">
          <form onSubmit={handleSave}>
            {/* Apariencia */}
            <div className="card border shadow-sm mb-3">
              <div className="card-header bg-white border-bottom py-2">
                <span className="small fw-bold text-secondary text-uppercase">
                  <i className="fa-solid fa-palette me-2 text-primary"></i>
                  Apariencia e Idioma
                </span>
              </div>
              <div className="card-body p-3">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-secondary">Tema Visual de la Plataforma</label>
                    <select
                      className="form-select form-select-sm"
                      value={settings.theme}
                      onChange={(e) => setSettings({ ...settings, theme: e.target.value as 'light' | 'dark' })}
                    >
                      <option value="light">Claro Enterprise (Por Defecto)</option>
                      <option value="dark">Oscuro Técnico (Próximamente)</option>
                    </select>
                    <small className="text-muted" style={{ fontSize: '11px' }}>El modo oscuro estará disponible en la siguiente actualización.</small>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-secondary">Idioma del Sistema</label>
                    <select
                      className="form-select form-select-sm"
                      value={settings.idioma}
                      onChange={(e) => setSettings({ ...settings, idioma: e.target.value })}
                    >
                      <option value="es">Español (Perú / Internacional)</option>
                      <option value="en">English (US)</option>
                    </select>
                    <small className="text-muted" style={{ fontSize: '11px' }}>Cambiar de idioma requiere recargar los catálogos.</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Notificaciones */}
            <div className="card border shadow-sm mb-3">
              <div className="card-header bg-white border-bottom py-2">
                <span className="small fw-bold text-secondary text-uppercase">
                  <i className="fa-solid fa-bell me-2 text-primary"></i>
                  Notificaciones y Alertas Críticas
                </span>
              </div>
              <div className="card-body p-3">
                <div className="d-flex flex-column gap-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="notificaciones"
                      checked={settings.notificaciones}
                      onChange={(e) => setSettings({ ...settings, notificaciones: e.target.checked })}
                    />
                    <label className="form-check-label fw-bold small text-dark" htmlFor="notificaciones">
                      Habilitar Notificaciones en Tiempo Real
                    </label>
                    <div className="text-muted small" style={{ fontSize: '12px' }}>
                      Muestra badges y alertas emergentes ante incidencias de atención crítica en la barra superior.
                    </div>
                  </div>

                  <hr className="my-1 opacity-25" />

                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="notificacionesEmail"
                      checked={settings.notificacionesEmail}
                      onChange={(e) => setSettings({ ...settings, notificacionesEmail: e.target.checked })}
                      disabled={!settings.notificaciones}
                    />
                    <label className="form-check-label fw-bold small text-dark" htmlFor="notificacionesEmail">
                      Notificaciones por Correo Electrónico
                    </label>
                    <div className="text-muted small" style={{ fontSize: '12px' }}>
                      Envía un resumen de eventos críticos y tickets no atendidos al correo configurado.
                    </div>
                  </div>

                  <hr className="my-1 opacity-25" />

                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="notificacionesSonido"
                      checked={settings.notificacionesSonido}
                      onChange={(e) => setSettings({ ...settings, notificacionesSonido: e.target.checked })}
                      disabled={!settings.notificaciones}
                    />
                    <label className="form-check-label fw-bold small text-dark" htmlFor="notificacionesSonido">
                      Alerta Sonora de Incidencia Crítica
                    </label>
                    <div className="text-muted small" style={{ fontSize: '12px' }}>
                      Emite una señal auditiva discreta cuando ingresa un ticket crítico con semáforo apagado o intermitente.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Preferencias de Visualización */}
            <div className="card border shadow-sm mb-3">
              <div className="card-header bg-white border-bottom py-2">
                <span className="small fw-bold text-secondary text-uppercase">
                  <i className="fa-solid fa-table-list me-2 text-primary"></i>
                  Visualización de Tablas y Listados
                </span>
              </div>
              <div className="card-body p-3">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-secondary">Registros por página (Por Defecto)</label>
                    <select
                      className="form-select form-select-sm"
                      value={settings.registrosPorPagina}
                      onChange={(e) => setSettings({ ...settings, registrosPorPagina: Number(e.target.value) })}
                    >
                      <option value={10}>10 registros por página</option>
                      <option value={25}>25 registros por página</option>
                      <option value={50}>50 registros por página</option>
                      <option value={100}>100 registros por página</option>
                    </select>
                    <small className="text-muted" style={{ fontSize: '11px' }}>Define el paginado inicial de tablas de administración e incidencias.</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Información del Sistema */}
            <div className="card border shadow-sm mb-4">
              <div className="card-header bg-white border-bottom py-2">
                <span className="small fw-bold text-secondary text-uppercase">
                  <i className="fa-solid fa-circle-info me-2 text-primary"></i>
                  Información del Sistema
                </span>
              </div>
              <div className="card-body p-3">
                <div className="row g-3 small">
                  <div className="col-md-4">
                    <div className="text-muted mb-1">Versión del Dashboard:</div>
                    <span className="badge bg-light text-primary border fw-bold px-2 py-1">
                      v2.0.0 Enterprise (ArchitectUI)
                    </span>
                  </div>
                  <div className="col-md-4">
                    <div className="text-muted mb-1">Entorno de Ejecución:</div>
                    <span className="badge bg-light text-dark border px-2 py-1">
                      Docker Compose / NodeJS
                    </span>
                  </div>
                  <div className="col-md-4">
                    <div className="text-muted mb-1">Estado del Servicio API:</div>
                    <span className="badge bg-success px-2 py-1">
                      <i className="fa-solid fa-circle-check me-1"></i> Operativo
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <button 
                type="button" 
                className="btn btn-outline-secondary btn-sm"
                onClick={handleReset}
              >
                <i className="fa-solid fa-rotate-left me-1"></i>
                Restaurar por Defecto
              </button>

              <button 
                type="submit" 
                className="btn btn-primary btn-sm px-4"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Guardando...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-floppy-disk me-1"></i>
                    Guardar Configuración
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

