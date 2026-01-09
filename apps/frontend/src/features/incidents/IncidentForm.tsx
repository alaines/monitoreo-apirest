import { useState, useEffect } from 'react';
import {
  incidentsService,
  CreateIncidentDto,
  UpdateIncidentDto,
  IncidenciaCatalog,
  PrioridadCatalog,
  EstadoCatalog,
  CruceCatalog,
  EquipoCatalog,
  ReportadorCatalog,
} from '../../services/incidents.service';
import { useAuthStore } from '../auth/authStore';

interface IncidentFormProps {
  incidentId: number | null;
  onClose: () => void;
  onSave: () => void;
}

export function IncidentForm({ incidentId, onClose, onSave }: IncidentFormProps) {
  const isEditing = Boolean(incidentId);
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [incidencias, setIncidencias] = useState<IncidenciaCatalog[]>([]);
  const [prioridades, setPrioridades] = useState<PrioridadCatalog[]>([]);
  const [estados, setEstados] = useState<EstadoCatalog[]>([]);
  const [cruces, setCruces] = useState<CruceCatalog[]>([]);
  const [equipos, setEquipos] = useState<EquipoCatalog[]>([]);
  const [reportadores, setReportadores] = useState<ReportadorCatalog[]>([]);
  const [incidentLocation, setIncidentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  // Para autocomplete de cruces
  const [cruceSearch, setCruceSearch] = useState('');
  const [filteredCruces, setFilteredCruces] = useState<CruceCatalog[]>([]);
  const [showCruceDropdown, setShowCruceDropdown] = useState(false);
  const [selectedCruce, setSelectedCruce] = useState<CruceCatalog | null>(null);
  
  // Para autocomplete de incidencias
  const [incidenciaSearch, setIncidenciaSearch] = useState('');
  const [filteredIncidencias, setFilteredIncidencias] = useState<IncidenciaCatalog[]>([]);
  const [showIncidenciaDropdown, setShowIncidenciaDropdown] = useState(false);
  const [selectedIncidencia, setSelectedIncidencia] = useState<IncidenciaCatalog | null>(null);
  
  const [formData, setFormData] = useState({
    incidenciaId: '',
    prioridadId: '',
    cruceId: '',
    equipoId: '',
    estadoId: '',
    descripcion: '',
    reportadorId: '',
    reportadorNombres: '',
    reportadorDatoContacto: '',
  });

  useEffect(() => {
    loadCatalogs();
    if (isEditing && incidentId) {
      loadIncident(incidentId);
    }
    
    // Cerrar dropdowns al hacer clic fuera
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.cruce-autocomplete')) {
        setShowCruceDropdown(false);
      }
      if (!target.closest('.incidencia-autocomplete')) {
        setShowIncidenciaDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [incidentId, isEditing]);

  useEffect(() => {
    // Filtrar cruces basado en búsqueda
    if (cruceSearch.trim() === '') {
      setFilteredCruces(cruces.slice(0, 20));
    } else {
      const filtered = cruces.filter(cruce => 
        cruce.nombre.toLowerCase().includes(cruceSearch.toLowerCase())
      ).slice(0, 20);
      setFilteredCruces(filtered);
    }
  }, [cruceSearch, cruces]);

  useEffect(() => {
    // Filtrar incidencias basado en búsqueda
    if (incidenciaSearch.trim() === '') {
      setFilteredIncidencias(incidencias.slice(0, 20));
    } else {
      const filtered = incidencias.filter(inc => 
        inc.tipo.toLowerCase().includes(incidenciaSearch.toLowerCase())
      ).slice(0, 20);
      setFilteredIncidencias(filtered);
    }
  }, [incidenciaSearch, incidencias]);

  const loadCatalogs = async () => {
    try {
      const [incidenciasData, prioridadesData, estadosData, crucesData, equiposData, reportadoresData] = await Promise.all([
        incidentsService.getIncidenciasCatalog(),
        incidentsService.getPrioridadesCatalog(),
        incidentsService.getEstadosCatalog(),
        incidentsService.getCrucesCatalog(),
        incidentsService.getEquiposCatalog(),
        incidentsService.getReportadoresCatalog(),
      ]);
      setIncidencias(incidenciasData);
      setPrioridades(prioridadesData);
      setEstados(estadosData);
      setCruces(crucesData);
      setEquipos(equiposData);
      setReportadores(reportadoresData);
      setFilteredCruces(crucesData.slice(0, 20));
      setFilteredIncidencias(incidenciasData.slice(0, 20));
    } catch (error) {
      console.error('Error loading catalogs:', error);
    }
  };

  const loadIncident = async (incidentId: number) => {
    try {
      const incident = await incidentsService.getIncident(incidentId);
      setFormData({
        incidenciaId: incident.incidenciaId?.toString() || '',
        prioridadId: incident.prioridadId?.toString() || '',
        cruceId: incident.cruceId?.toString() || '',
        equipoId: incident.equipoId?.toString() || '',
        estadoId: incident.estadoId?.toString() || '',
        descripcion: incident.descripcion || '',
        reportadorId: incident.reportador?.id?.toString() || '',
        reportadorNombres: incident.reportadorNombres || '',
        reportadorDatoContacto: incident.reportadorDatoContacto || '',
      });
      
      // Cargar cruce seleccionado
      if (incident.cruce) {
        setSelectedCruce({ id: incident.cruce.id, nombre: incident.cruce.nombre || '' });
        setCruceSearch(incident.cruce.nombre || '');
      }
      
      // Cargar incidencia seleccionada
      if (incident.incidencia) {
        setSelectedIncidencia({ 
          id: incident.incidencia.id, 
          tipo: incident.incidencia.tipo,
          prioridadeId: incident.incidencia.prioridad?.id
        });
        setIncidenciaSearch(incident.incidencia.tipo);
      }
      
      if (incident.latitude && incident.longitude) {
        setIncidentLocation({ latitude: incident.latitude, longitude: incident.longitude });
      }
    } catch (error) {
      console.error('Error loading incident:',error);
      setError('Error al cargar la incidencia');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCruceSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCruceSearch(e.target.value);
    setShowCruceDropdown(true);
    if (!e.target.value.trim()) {
      setSelectedCruce(null);
      setFormData({ ...formData, cruceId: '' });
    }
  };

  const handleCruceSelect = (cruce: CruceCatalog) => {
    setSelectedCruce(cruce);
    setCruceSearch(cruce.nombre);
    setFormData({ ...formData, cruceId: cruce.id.toString() });
    setShowCruceDropdown(false);
  };
  const handleIncidenciaSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIncidenciaSearch(e.target.value);
    setShowIncidenciaDropdown(true);
    if (!e.target.value.trim()) {
      setSelectedIncidencia(null);
      setFormData({ ...formData, incidenciaId: '', prioridadId: '' });
    }
  };

  const handleIncidenciaSelect = (incidencia: IncidenciaCatalog) => {
    setSelectedIncidencia(incidencia);
    setIncidenciaSearch(incidencia.tipo);
    setFormData({ 
      ...formData, 
      incidenciaId: incidencia.id.toString(),
      prioridadId: incidencia.prioridadeId?.toString() || ''
    });
    setShowIncidenciaDropdown(false);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.incidenciaId) {
      setError('El tipo de incidencia es requerido');
      return;
    }

    if (!formData.cruceId) {
      setError('Debe seleccionar un cruce/semáforo');
      return;
    }

    setLoading(true);

    try {
      const data: CreateIncidentDto | UpdateIncidentDto = {
        incidenciaId: parseInt(formData.incidenciaId),
        prioridadId: formData.prioridadId ? parseInt(formData.prioridadId) : undefined,
        cruceId: parseInt(formData.cruceId),
        descripcion: formData.descripcion,
        reportadorId: formData.reportadorId ? parseInt(formData.reportadorId) : undefined,
        reportadorNombres: formData.reportadorNombres,
        reportadorDatoContacto: formData.reportadorDatoContacto,
      };

      if (isEditing && incidentId) {
        await incidentsService.updateIncident(incidentId, {
          ...data,
          equipoId: formData.equipoId ? parseInt(formData.equipoId) : undefined,
          estadoId: formData.estadoId ? parseInt(formData.estadoId) : undefined,
        });
      } else {
        await incidentsService.createIncident(data as CreateIncidentDto);
      }

      onSave();
    } catch (error: any) {
      console.error('Error saving incident:', error);
      setError(error.response?.data?.message || 'Error al guardar la incidencia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-2">
      {error && (
        <div className="alert alert-danger mb-3" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="card-body">
            <h6 className="card-title mb-3">Información de la Incidencia</h6>

            <div className="mb-3 incidencia-autocomplete">
              <label className="form-label">Tipo de Incidencia *</label>
              <div className="position-relative">
                <input
                  type="text"
                  className="form-control custom-input"
                  placeholder="Buscar tipo de incidencia..."
                  value={incidenciaSearch}
                  onChange={handleIncidenciaSearchChange}
                  onFocus={() => setShowIncidenciaDropdown(true)}
                  required
                />
                {showIncidenciaDropdown && filteredIncidencias.length > 0 && (
                  <div 
                    className="position-absolute w-100 bg-white border rounded shadow-sm mt-1" 
                    style={{ maxHeight: '200px', overflowY: 'auto', zIndex: 1000 }}
                  >
                    {filteredIncidencias.map((inc) => (
                      <div
                        key={inc.id}
                        className="p-2 cursor-pointer hover-bg-light"
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                        onClick={() => handleIncidenciaSelect(inc)}
                      >
                        <small>{inc.tipo}</small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedIncidencia && (
                <small className="text-success">
                  <i className="fas fa-check-circle me-1"></i>
                  Seleccionado: {selectedIncidencia.tipo}
                </small>
              )}
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Prioridad (auto-asignada)</label>
                <select
                  className="form-select"
                  name="prioridadId"
                  value={formData.prioridadId}
                  disabled
                  style={{ backgroundColor: '#e9ecef', cursor: 'not-allowed' }}
                >
                  <option value="">Sin prioridad</option>
                  {prioridades.map((prio) => (
                    <option key={prio.id} value={prio.id}>
                      {prio.nombre}
                    </option>
                  ))}
                </select>
                <small className="text-muted">La prioridad se asigna automáticamente según el tipo de incidencia</small>
              </div>

              <div className="col-md-6 mb-3 cruce-autocomplete">
                    <label className="form-label">Cruce/Semáforo *</label>
                    <div className="position-relative">
                      <input
                        type="text"
                        className="form-control custom-input"
                        placeholder="Buscar cruce..."
                        value={cruceSearch}
                        onChange={handleCruceSearchChange}
                        onFocus={() => setShowCruceDropdown(true)}
                        required
                      />
                      {showCruceDropdown && filteredCruces.length > 0 && (
                        <div 
                          className="position-absolute w-100 bg-white border rounded shadow-sm mt-1" 
                          style={{ maxHeight: '200px', overflowY: 'auto', zIndex: 1000 }}
                        >
                          {filteredCruces.map((cruce) => (
                            <div
                              key={cruce.id}
                              className="p-2 cursor-pointer hover-bg-light"
                              style={{ cursor: 'pointer' }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                              onClick={() => handleCruceSelect(cruce)}
                            >
                              <small>{cruce.nombre}</small>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedCruce && (
                      <small className="text-success">
                        <i className="fas fa-check-circle me-1"></i>
                        Seleccionado: {selectedCruce.nombre}
                      </small>
                    )}
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Equipo Asignado</label>
                    <select
                      className="form-select"
                      name="equipoId"
                      value={formData.equipoId}
                      onChange={handleChange}
                    >
                      <option value="">Sin equipo asignado</option>
                      {equipos.map((equipo) => (
                        <option key={equipo.id} value={equipo.id}>
                          {equipo.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {isEditing && (
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Estado</label>
                      <select
                        className="form-select"
                        name="estadoId"
                        value={formData.estadoId}
                        onChange={handleChange}
                      >
                        <option value="">Sin cambio</option>
                        {estados.map((estado) => (
                          <option key={estado.id} value={estado.id}>
                            {estado.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Descripción</label>
                  <textarea
                    className="form-control custom-textarea"
                    name="descripcion"
                    rows={4}
                    value={formData.descripcion}
                    onChange={(e) => {
                      e.target.value = e.target.value.toUpperCase();
                      handleChange(e);
                    }}
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>

                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Tipo de Reportador</label>
                    <select
                      className="form-select"
                      name="reportadorId"
                      value={formData.reportadorId}
                      onChange={handleChange}
                    >
                      <option value="">Seleccionar...</option>
                      {reportadores.map((rep) => (
                        <option key={rep.id} value={rep.id}>
                          {rep.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Nombre del Reportador</label>
                    <input
                      type="text"
                      className="form-control custom-input"
                      name="reportadorNombres"
                      value={formData.reportadorNombres}
                      onChange={(e) => {
                        e.target.value = e.target.value.toUpperCase();
                        handleChange(e);
                      }}
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Contacto del Reportador</label>
                    <input
                      type="text"
                      className="form-control custom-input"
                      name="reportadorDatoContacto"
                      value={formData.reportadorDatoContacto}
                      onChange={(e) => {
                        e.target.value = e.target.value.toUpperCase();
                        handleChange(e);
                      }}
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>
                </div>

                {incidentLocation && (
              <div className="alert alert-info mb-0">
                <strong><i className="fas fa-map-marker-alt me-2"></i>Ubicación heredada del cruce:</strong>
                <div className="mt-2">
                  <small>Latitud: {incidentLocation.latitude.toFixed(6)}</small><br />
                  <small>Longitud: {incidentLocation.longitude.toFixed(6)}</small>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="d-flex gap-2 justify-content-end mt-3">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onClose}
          >
            <i className="fas fa-times me-2"></i>
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            <i className="fas fa-save me-2"></i>
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
