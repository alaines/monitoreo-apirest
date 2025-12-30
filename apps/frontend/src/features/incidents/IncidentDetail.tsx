import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  incidentsService, 
  Incident, 
  IncidentTracking, 
  CreateTrackingDto,
  EstadoCatalog,
  EquipoCatalog 
} from '../../services/incidents.service';

interface IncidentDetailProps {
  incidentId: number;
  onClose: () => void;
}

export function IncidentDetail({ incidentId, onClose }: IncidentDetailProps) {
  const navigate = useNavigate();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackings, setTrackings] = useState<IncidentTracking[]>([]);
  const [loadingTrackings, setLoadingTrackings] = useState(false);
  const [showTrackingForm, setShowTrackingForm] = useState(false);
  const [estados, setEstados] = useState<EstadoCatalog[]>([]);
  const [equipos, setEquipos] = useState<EquipoCatalog[]>([]);
  const [trackingForm, setTrackingForm] = useState<CreateTrackingDto>({
    reporte: '',
    estadoId: undefined,
    equipoId: undefined,
  });

  useEffect(() => {
    if (incidentId) {
      loadIncident(incidentId);
      loadTrackings();
      loadCatalogs();
    }
  }, [incidentId]);

  const loadCatalogs = async () => {
    try {
      const [estadosData, equiposData] = await Promise.all([
        incidentsService.getEstadosCatalog(),
        incidentsService.getEquiposCatalog(),
      ]);
      console.log('Estados disponibles:', estadosData);
      setEstados(estadosData);
      setEquipos(equiposData);
    } catch (error) {
      console.error('Error loading catalogs:', error);
    }
  };

  const loadIncident = async (incidentId: number) => {
    setLoading(true);
    try {
      const data = await incidentsService.getIncident(incidentId);
      setIncident(data);
    } catch (error) {
      console.error('Error loading incident:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTrackings = async () => {
    if (!incidentId) return;
    
    setLoadingTrackings(true);
    try {
      const data = await incidentsService.getTrackings(incidentId);
      setTrackings(data);
    } catch (error) {
      console.error('Error loading trackings:', error);
    } finally {
      setLoadingTrackings(false);
    }
  };

  const handleSubmitTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trackingForm.reporte.trim()) {
      alert('El reporte es requerido');
      return;
    }

    console.log('Enviando seguimiento:', trackingForm);

    try {
      await incidentsService.createTracking(incidentId, trackingForm);
      setTrackingForm({ reporte: '', estadoId: undefined, equipoId: undefined });
      setShowTrackingForm(false);
      loadTrackings();
      loadIncident(incidentId); // Recargar para actualizar el estado
    } catch (error: any) {
      console.error('Error creating tracking:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error al crear el seguimiento';
      alert(errorMessage);
    }
  };

  const getStatusBadge = (estadoId: number | undefined) => {
    switch (estadoId) {
      case 1:
        return <span className="badge bg-info text-dark">Asignado</span>;
      case 2:
        return <span className="badge bg-primary">En Proceso</span>;
      case 3:
        return <span className="badge bg-danger">Cancelado</span>;
      case 4:
        return <span className="badge bg-success">Resuelto - Finalizado</span>;
      case 5:
        return <span className="badge bg-warning text-dark">Reasignado</span>;
      default:
        return <span className="badge bg-secondary">Desconocido</span>;
    }
  };

  if (loading) {
    return (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-body">
              <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <div className="modal-body">
              <div className="alert alert-warning">
                <i className="fas fa-exclamation-triangle me-2"></i>
                No se encontró la incidencia
              </div>
              <button className="btn btn-primary" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Detalle de Incidencia #{incident.id}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body p-0">
      <div className="row g-3">
        <div className="col-md-8">
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-header bg-white border-bottom">
              <h5 className="mb-0">Información General</h5>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="text-muted small mb-1">Tipo de Incidencia</label>
                  <div className="fw-bold">{incident.incidencia?.tipo || 'Sin especificar'}</div>
                </div>
                <div className="col-md-6">
                  <label className="text-muted small mb-1">Estado</label>
                  <div>{getStatusBadge(incident.estadoId)}</div>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-12">
                  <label className="text-muted small mb-1">Descripción</label>
                  <div className="p-3 bg-light rounded">
                    {incident.descripcion || 'Sin descripción'}
                  </div>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="text-muted small mb-1">Cruce</label>
                  <div className="fw-bold">
                    {incident.cruce?.nombre ? (
                      <>
                        <i className="fas fa-map-marker-alt me-2 text-primary"></i>
                        {incident.cruce.nombre}
                      </>
                    ) : (
                      <span className="text-muted">Sin cruce asignado</span>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="text-muted small mb-1">Reportador</label>
                  <div>{incident.reportadorNombres || 'No especificado'}</div>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="text-muted small mb-1">Fecha de Creación</label>
                  <div><i className="fas fa-calendar me-2"></i>{new Date(incident.createdAt).toLocaleString('es-PE')}</div>
                </div>
                <div className="col-md-6">
                  <label className="text-muted small mb-1">Última Actualización</label>
                  <div><i className="fas fa-clock me-2"></i>{incident.updatedAt ? new Date(incident.updatedAt).toLocaleString('es-PE') : 'No actualizado'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom">
              <h5 className="mb-0">Ubicación</h5>
            </div>
            <div className="card-body">
              {incident.latitude && incident.longitude ? (
                <>
                  <div className="mb-3">
                    <label className="text-muted small mb-1">Latitud</label>
                    <div className="fw-bold">{incident.latitude.toFixed(6)}</div>
                  </div>
                  <div className="mb-3">
                    <label className="text-muted small mb-1">Longitud</label>
                    <div className="fw-bold">{incident.longitude.toFixed(6)}</div>
                  </div>
                  <a 
                    href={`https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-primary w-100"
                  >
                    <i className="fas fa-map-marker-alt me-2"></i>
                    Ver en Google Maps
                  </a>
                </>
              ) : (
                <div className="text-muted text-center py-3">
                  <i className="fas fa-map-marked-alt fa-2x mb-2 d-block"></i>
                  Sin ubicación geográfica
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Seguimientos */}
      <div className="row mt-3">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-history me-2"></i>
                Seguimientos
              </h5>
              {incident.estadoId !== 4 && (
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => setShowTrackingForm(!showTrackingForm)}
                >
                  <i className="fas fa-plus me-2"></i>
                  Agregar Seguimiento
                </button>
              )}
              {incident.estadoId === 4 && (
                <span className="badge bg-success">
                  <i className="fas fa-check-circle me-1"></i>
                  Incidencia Finalizada
                </span>
              )}
            </div>
            <div className="card-body">
              {/* Formulario de nuevo seguimiento */}
              {showTrackingForm && incident.estadoId !== 4 && (
                <div className="mb-4 p-3 bg-light rounded">
                  <h6 className="mb-3">Nuevo Seguimiento</h6>
                  <form onSubmit={handleSubmitTracking}>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Cambiar Estado</label>
                        <select
                          className="form-select"
                          value={trackingForm.estadoId || ''}
                          onChange={(e) => setTrackingForm({ ...trackingForm, estadoId: e.target.value ? parseInt(e.target.value) : undefined })}
                        >
                          <option value="">Sin cambio</option>
                          {estados.map((estado) => (
                            <option key={estado.id} value={estado.id}>
                              {estado.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Equipo Asignado</label>
                        <select
                          className="form-select"
                          value={trackingForm.equipoId || ''}
                          onChange={(e) => setTrackingForm({ ...trackingForm, equipoId: e.target.value ? parseInt(e.target.value) : undefined })}
                        >
                          <option value="">Sin equipo</option>
                          {equipos.map((equipo) => (
                            <option key={equipo.id} value={equipo.id}>
                              {equipo.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Reporte / Comentario *</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={trackingForm.reporte}
                        onChange={(e) => setTrackingForm({ ...trackingForm, reporte: e.target.value.toUpperCase() })}
                        placeholder="DESCRIBE EL SEGUIMIENTO, ACCIONES TOMADAS, OBSERVACIONES..."
                        style={{ textTransform: 'uppercase' }}
                        required
                      />
                    </div>
                    <div className="d-flex gap-2">
                      <button type="submit" className="btn btn-primary">
                        <i className="fas fa-save me-2"></i>
                        Guardar Seguimiento
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => {
                          setShowTrackingForm(false);
                          setTrackingForm({ reporte: '', estadoId: undefined, equipoId: undefined });
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Lista de seguimientos */}
              {loadingTrackings ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                </div>
              ) : trackings.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="fas fa-inbox fa-3x mb-3 d-block"></i>
                  <p>No hay seguimientos registrados</p>
                </div>
              ) : (
                <div className="timeline">
                  {trackings.map((tracking, index) => (
                    <div key={tracking.id} className="timeline-item mb-3">
                      <div className="d-flex">
                        <div className="timeline-marker me-3">
                          <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                            <i className="fas fa-comment text-white"></i>
                          </div>
                          {index < trackings.length - 1 && (
                            <div className="timeline-line bg-secondary" style={{ width: '2px', height: '100%', marginLeft: '19px', marginTop: '5px' }}></div>
                          )}
                        </div>
                        <div className="flex-grow-1">
                          <div className="card border-0 shadow-sm">
                            <div className="card-body">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                  <small className="text-muted">
                                    <i className="fas fa-user me-1"></i>
                                    {tracking.usuarioRegistra || 'Sistema'}
                                  </small>
                                  <small className="text-muted ms-3">
                                    <i className="fas fa-clock me-1"></i>
                                    {new Date(tracking.createdAt).toLocaleString('es-PE')}
                                  </small>
                                </div>
                                {tracking.estado && (
                                  <div>
                                    {getStatusBadge(tracking.estadoId)}
                                  </div>
                                )}
                              </div>
                              {tracking.equipo && (
                                <div className="mb-2">
                                  <small className="badge bg-info text-dark">
                                    <i className="fas fa-users me-1"></i>
                                    {tracking.equipo.nombre}
                                  </small>
                                </div>
                              )}
                              {tracking.responsable && (
                                <div className="mb-2">
                                  <small className="badge bg-secondary">
                                    <i className="fas fa-user-tie me-1"></i>
                                    {tracking.responsable.nombre}
                                  </small>
                                </div>
                              )}
                              <p className="mb-0">{tracking.reporte}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
          </div>
        </div>
      </div>
    </div>
  );
}
