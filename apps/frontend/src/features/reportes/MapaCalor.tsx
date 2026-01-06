import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Popup, useMap } from 'react-leaflet';
import { incidentsService, type Incident } from '../../services/incidents.service';
import 'leaflet/dist/leaflet.css';

// Componente para ajustar el mapa a los bounds
function FitBounds({ incidents }: { incidents: Incident[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (incidents.length > 0) {
      const validIncidents = incidents.filter(i => i.latitude && i.longitude);
      if (validIncidents.length > 0) {
        const bounds = validIncidents.map(i => [i.latitude!, i.longitude!] as [number, number]);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [incidents, map]);
  
  return null;
}

export function MapaCalor() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string>('');

  // Filtros
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState({
    year: new Date().getFullYear().toString(),
    month: '',
    tipoIncidencia: '',
  });

  // Catálogos
  const [tiposIncidencia, setTiposIncidencia] = useState<Array<{ id: number; tipo: string }>>([]);
  
  // Generar años (últimos 5 años)
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const months = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ];

  useEffect(() => {
    loadData();
    loadCatalogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, incidents]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await incidentsService.getIncidents({ limit: 10000 });
      const incidentsData = response.data || [];
      // Filtrar solo incidentes con coordenadas
      const withCoords = incidentsData.filter((i: Incident) => i.latitude && i.longitude);
      setIncidents(withCoords);
    } catch (error: any) {
      setErrors(error.response?.data?.message || 'Error al cargar incidencias');
    } finally {
      setLoading(false);
    }
  };

  const loadCatalogs = async () => {
    try {
      const tipos = await incidentsService.getIncidenciasCatalog();
      setTiposIncidencia(tipos);
    } catch (error: any) {
      console.error('Error loading catalogs:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...incidents];

    // Filtro por año
    if (filters.year) {
      filtered = filtered.filter(incident => {
        const year = new Date(incident.createdAt).getFullYear().toString();
        return year === filters.year;
      });
    }

    // Filtro por mes
    if (filters.month) {
      filtered = filtered.filter(incident => {
        const month = (new Date(incident.createdAt).getMonth() + 1).toString();
        return month === filters.month;
      });
    }

    // Filtro por tipo de incidencia
    if (filters.tipoIncidencia) {
      filtered = filtered.filter(incident => 
        incident.incidenciaId === parseInt(filters.tipoIncidencia)
      );
    }

    setFilteredIncidents(filtered);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      year: new Date().getFullYear().toString(),
      month: '',
      tipoIncidencia: '',
    });
  };

  // Calcular intensidad del calor basado en la densidad
  const getHeatIntensity = (lat: number, lng: number) => {
    const radius = 0.01; // aproximadamente 1km
    const nearby = filteredIncidents.filter(i => {
      if (!i.latitude || !i.longitude) return false;
      const distance = Math.sqrt(
        Math.pow(i.latitude - lat, 2) + Math.pow(i.longitude - lng, 2)
      );
      return distance <= radius;
    });
    return nearby.length;
  };

  const getColorByIntensity = (intensity: number): string => {
    if (intensity >= 10) return '#8b0000'; // rojo oscuro
    if (intensity >= 7) return '#dc143c'; // rojo
    if (intensity >= 5) return '#ff6347'; // tomate
    if (intensity >= 3) return '#ffa500'; // naranja
    if (intensity >= 2) return '#ffd700'; // dorado
    return '#ffff00'; // amarillo
  };

  const getRadiusByIntensity = (intensity: number): number => {
    if (intensity >= 10) return 300;
    if (intensity >= 7) return 250;
    if (intensity >= 5) return 200;
    if (intensity >= 3) return 150;
    if (intensity >= 2) return 100;
    return 80;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <i className="fas fa-map-marked-alt me-2"></i>
          Mapa de Calor de Incidencias
        </h2>
      </div>

      {errors && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {errors}
          <button type="button" className="btn-close" onClick={() => setErrors('')}></button>
        </div>
      )}

      {/* Filtros */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <i className="fas fa-filter me-2"></i>
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </button>
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-primary">{filteredIncidents.length} incidencias</span>
          </div>
        </div>
        {showFilters && (
          <div className="card-body">
            <div className="row g-2">
              <div className="col-md-3">
                <label className="form-label small">Año</label>
                <select
                  className="form-select form-select-sm"
                  value={filters.year}
                  onChange={(e) => handleFilterChange('year', e.target.value)}
                >
                  <option value="">Todos</option>
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label small">Mes</label>
                <select
                  className="form-select form-select-sm"
                  value={filters.month}
                  onChange={(e) => handleFilterChange('month', e.target.value)}
                >
                  <option value="">Todos</option>
                  {months.map(month => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label small">Tipo de Incidencia</label>
                <select
                  className="form-select form-select-sm"
                  value={filters.tipoIncidencia}
                  onChange={(e) => handleFilterChange('tipoIncidencia', e.target.value)}
                >
                  <option value="">Todos</option>
                  {tiposIncidencia.map(tipo => (
                    <option key={tipo.id} value={tipo.id}>{tipo.tipo}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <button
                  className="btn btn-outline-secondary btn-sm w-100"
                  onClick={clearFilters}
                  title="Limpiar filtros"
                >
                  <i className="fas fa-eraser me-1"></i>
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Leyenda */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body py-2">
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <small className="fw-bold">Intensidad:</small>
            <div className="d-flex align-items-center gap-1">
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#ffff00' }}></div>
              <small>Baja (1-2)</small>
            </div>
            <div className="d-flex align-items-center gap-1">
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#ffd700' }}></div>
              <small>Media-Baja (2-3)</small>
            </div>
            <div className="d-flex align-items-center gap-1">
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#ffa500' }}></div>
              <small>Media (3-5)</small>
            </div>
            <div className="d-flex align-items-center gap-1">
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#ff6347' }}></div>
              <small>Media-Alta (5-7)</small>
            </div>
            <div className="d-flex align-items-center gap-1">
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#dc143c' }}></div>
              <small>Alta (7-10)</small>
            </div>
            <div className="d-flex align-items-center gap-1">
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#8b0000' }}></div>
              <small>Muy Alta (10+)</small>
            </div>
          </div>
        </div>
      </div>

      {/* Mapa */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {filteredIncidents.length === 0 ? (
            <div className="alert alert-info m-3">
              <i className="fas fa-info-circle me-2"></i>
              No hay incidencias con coordenadas para los filtros seleccionados.
            </div>
          ) : (
            <MapContainer
              center={[-12.0464, -77.0428]} // Lima, Perú
              zoom={12}
              style={{ height: '600px', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <FitBounds incidents={filteredIncidents} />

              {filteredIncidents.map((incident) => {
                if (!incident.latitude || !incident.longitude) return null;
                
                const intensity = getHeatIntensity(incident.latitude, incident.longitude);
                const color = getColorByIntensity(intensity);
                const radius = getRadiusByIntensity(intensity);

                return (
                  <Circle
                    key={incident.id}
                    center={[incident.latitude, incident.longitude]}
                    radius={radius}
                    pathOptions={{
                      color: color,
                      fillColor: color,
                      fillOpacity: 0.4,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div style={{ minWidth: '200px' }}>
                        <h6 className="mb-2">
                          <i className="fas fa-exclamation-triangle me-2 text-warning"></i>
                          {incident.incidencia?.tipo || 'Sin tipo'}
                        </h6>
                        <hr className="my-2" />
                        <p className="mb-1 small">
                          <strong>ID:</strong> {incident.id}
                        </p>
                        {incident.descripcion && (
                          <p className="mb-1 small">
                            <strong>Descripción:</strong> {incident.descripcion}
                          </p>
                        )}
                        {incident.cruce && (
                          <p className="mb-1 small">
                            <strong>Cruce:</strong> {incident.cruce.nombre || incident.cruce.codigo}
                          </p>
                        )}
                        <p className="mb-1 small">
                          <strong>Fecha:</strong> {new Date(incident.createdAt).toLocaleDateString('es-PE')}
                        </p>
                        <p className="mb-1 small">
                          <strong>Intensidad:</strong> {intensity} incidencias cercanas
                        </p>
                        {incident.incidencia?.prioridad && (
                          <p className="mb-0 small">
                            <strong>Prioridad:</strong>{' '}
                            <span className="badge bg-danger">{incident.incidencia.prioridad.nombre}</span>
                          </p>
                        )}
                      </div>
                    </Popup>
                  </Circle>
                );
              })}
            </MapContainer>
          )}
        </div>
      </div>

      {/* Estadísticas */}
      <div className="row mt-3">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <i className="fas fa-map-marker-alt fa-2x text-primary mb-2"></i>
              <h3 className="mb-0">{filteredIncidents.length}</h3>
              <small className="text-muted">Total Incidencias</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <i className="fas fa-calendar fa-2x text-success mb-2"></i>
              <h3 className="mb-0">{filters.month ? months.find(m => m.value === filters.month)?.label : 'Todo el año'}</h3>
              <small className="text-muted">Período</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <i className="fas fa-layer-group fa-2x text-warning mb-2"></i>
              <h3 className="mb-0">{new Set(filteredIncidents.map(i => i.incidenciaId)).size}</h3>
              <small className="text-muted">Tipos Diferentes</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <i className="fas fa-fire fa-2x text-danger mb-2"></i>
              <h3 className="mb-0">
                {Math.max(...filteredIncidents.map(i => 
                  i.latitude && i.longitude ? getHeatIntensity(i.latitude, i.longitude) : 0
                ))}
              </h3>
              <small className="text-muted">Máxima Densidad</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
