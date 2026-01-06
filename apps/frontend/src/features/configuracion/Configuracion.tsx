import { useState, useEffect } from 'react';

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
      
      alert('Configuración guardada correctamente');
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      alert('Error al guardar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm('¿Estás seguro de restaurar la configuración por defecto?')) {
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
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-lg-8 mx-auto">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom">
              <h4 className="mb-0">
                <i className="fas fa-cog me-2"></i>
                Configuración
              </h4>
            </div>
            <div className="card-body">
              <form onSubmit={handleSave}>
                {/* Apariencia */}
                <h5 className="mb-3">
                  <i className="fas fa-palette me-2"></i>
                  Apariencia
                </h5>
                <div className="row mb-4">
                  <div className="col-md-6">
                    <label className="form-label">Tema</label>
                    <select
                      className="form-select"
                      value={settings.theme}
                      onChange={(e) => setSettings({ ...settings, theme: e.target.value as 'light' | 'dark' })}
                    >
                      <option value="light">Claro</option>
                      <option value="dark">Oscuro</option>
                    </select>
                    <small className="text-muted">El tema oscuro estará disponible próximamente</small>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Idioma</label>
                    <select
                      className="form-select"
                      value={settings.idioma}
                      onChange={(e) => setSettings({ ...settings, idioma: e.target.value })}
                    >
                      <option value="es">Español</option>
                      <option value="en">English</option>
                    </select>
                    <small className="text-muted">Cambiar idioma requiere recargar la página</small>
                  </div>
                </div>

                <hr className="my-4" />

                {/* Notificaciones */}
                <h5 className="mb-3">
                  <i className="fas fa-bell me-2"></i>
                  Notificaciones
                </h5>
                <div className="mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="notificaciones"
                      checked={settings.notificaciones}
                      onChange={(e) => setSettings({ ...settings, notificaciones: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="notificaciones">
                      Habilitar notificaciones
                    </label>
                  </div>
                  <small className="text-muted">Activa las notificaciones del sistema</small>
                </div>

                <div className="mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="notificacionesEmail"
                      checked={settings.notificacionesEmail}
                      onChange={(e) => setSettings({ ...settings, notificacionesEmail: e.target.checked })}
                      disabled={!settings.notificaciones}
                    />
                    <label className="form-check-label" htmlFor="notificacionesEmail">
                      Notificaciones por correo electrónico
                    </label>
                  </div>
                  <small className="text-muted">Recibe alertas importantes por email</small>
                </div>

                <div className="mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="notificacionesSonido"
                      checked={settings.notificacionesSonido}
                      onChange={(e) => setSettings({ ...settings, notificacionesSonido: e.target.checked })}
                      disabled={!settings.notificaciones}
                    />
                    <label className="form-check-label" htmlFor="notificacionesSonido">
                      Sonido de notificaciones
                    </label>
                  </div>
                  <small className="text-muted">Reproduce un sonido al recibir notificaciones</small>
                </div>

                <hr className="my-4" />

                {/* Preferencias de Visualización */}
                <h5 className="mb-3">
                  <i className="fas fa-table me-2"></i>
                  Visualización de Datos
                </h5>
                <div className="row mb-4">
                  <div className="col-md-6">
                    <label className="form-label">Registros por página (por defecto)</label>
                    <select
                      className="form-select"
                      value={settings.registrosPorPagina}
                      onChange={(e) => setSettings({ ...settings, registrosPorPagina: Number(e.target.value) })}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <small className="text-muted">Cantidad de registros por defecto en las tablas</small>
                  </div>
                </div>

                <hr className="my-4" />

                {/* Información del Sistema */}
                <h5 className="mb-3">
                  <i className="fas fa-info-circle me-2"></i>
                  Información del Sistema
                </h5>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <p className="mb-1"><strong>Versión:</strong></p>
                    <p className="text-muted">1.0.0</p>
                  </div>
                  <div className="col-md-6">
                    <p className="mb-1"><strong>Última actualización:</strong></p>
                    <p className="text-muted">Enero 2026</p>
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="d-flex gap-2 mt-4">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Guardar Cambios
                      </>
                    )}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary"
                    onClick={handleReset}
                  >
                    <i className="fas fa-undo me-2"></i>
                    Restaurar por Defecto
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
