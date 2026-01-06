import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, useMap } from 'react-leaflet';
import { incidentsService } from '../../services/incidents.service';
import 'leaflet/dist/leaflet.css';

// Interface simplificada para data del mapa
interface IncidentMapData {
  id: number;
  latitude: number;
  longitude: number;
  createdAt: string;
  incidenciaId: number;
}

// Componente para ajustar el mapa a los bounds
function FitBounds({ incidents }: { incidents: IncidentMapData[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (incidents.length > 0) {
      const bounds = incidents.map(i => [i.latitude, i.longitude] as [number, number]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [incidents, map]);
  
  return null;
}

export function MapaCalor() {
  const [incidents, setIncidents] = useState<IncidentMapData[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<IncidentMapData[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<string>('');

  // Filtros
  const [showFilters, setShowFilters] = useState(false);
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

  const mapCenter: [number, number] = [-12.0464, -77.0428]; // Lima, Perú

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, incidents]);

  const loadData = async () => {
    try {
      const [incidentsResponse, tipos] = await Promise.all([
        incidentsService.getIncidents({ limit: 10000 }),
        incidentsService.getIncidenciasCatalog()
      ]);
      
      const incidentsData = incidentsResponse.data || [];
      // Filtrar y mapear solo los datos necesarios
      const mappedIncidents: IncidentMapData[] = incidentsData
        .filter((i: any) => i.latitude && i.longitude)
        .map((i: any) => ({
          id: i.id,
          latitude: i.latitude,
          longitude: i.longitude,
          createdAt: i.createdAt,
          incidenciaId: i.incidenciaId
        }));
      
      setIncidents(mappedIncidents);
      setTiposIncidencia(tipos);
    } catch (error: any) {
      setErrors(error.response?.data?.message || 'Error al cargar incidencias');
      console.error('Error loading data:', error);
    } finally {
      setLoadingData(false);
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

  return (
    <div className="container-fluid" style={{ padding: '20px', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="row mb-3" style={{ flexShrink: 0 }}>
        <div className="col">
          <h2 className="mb-0">
            <i className="fas fa-map-marked-alt me-2"></i>
            Mapa de Calor de Incidencias
          </h2>
          {loadingData ? (
            <div className="placeholder-glow">
              <span className="placeholder col-4"></span>
            </div>
          ) : (
            <p className="text-muted mb-0">
              Visualización de {filteredIncidents.length} incidencia{filteredIncidents.length !== 1 ? 's' : ''} con coordenadas
            </p>
          )}
        </div>
      </div>

      {errors && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert" style={{ flexShrink: 0 }}>
          {errors}
          <button type="button" className="btn-close" onClick={() => setErrors('')}></button>
        </div>
      )}

      {/* Mapa con filtros overlay */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <MapContainer
          center={mapCenter}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {filteredIncidents.length > 0 && <FitBounds incidents={filteredIncidents} />}

          {filteredIncidents.map((incident) => {
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
              />
            );
          })}
        </MapContainer>

        {/* Panel de filtros sobre el mapa */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000,
          maxWidth: '400px'
        }}>
          <div className="card shadow-sm">
            <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-2">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setShowFilters(!showFilters)}
              >
                <i className="fas fa-filter me-2"></i>
                {showFilters ? 'Ocultar' : 'Filtros'}
              </button>
              {!showFilters && (
                <span className="badge bg-primary">{filteredIncidents.length}</span>
              )}
            </div>
            {showFilters && (
              <div className="card-body p-3">
                {loadingData ? (
                  <div className="placeholder-glow">
                    <div className="mb-2">
                      <span className="placeholder col-12"></span>
                    </div>
                    <div className="mb-2">
                      <span className="placeholder col-12"></span>
                    </div>
                    <div className="mb-2">
                      <span className="placeholder col-12"></span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-2">
                      <label className="form-label small mb-1 fw-bold">
                        <i className="fas fa-calendar-alt me-1"></i>
                        Año
                      </label>
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

                    <div className="mb-2">
                      <label className="form-label small mb-1 fw-bold">
                        <i className="fas fa-calendar me-1"></i>
                        Mes
                      </label>
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

                    <div className="mb-2">
                      <label className="form-label small mb-1 fw-bold">
                        <i className="fas fa-exclamation-triangle me-1"></i>
                        Tipo de Incidencia
                      </label>
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

                    <div className="d-flex gap-2 mt-3">
                      <button
                        className="btn btn-outline-secondary btn-sm flex-fill"
                        onClick={clearFilters}
                      >
                        <i className="fas fa-eraser me-1"></i>
                        Limpiar
                      </button>
                      <span className="badge bg-primary align-self-center px-3 py-2">
                        {filteredIncidents.length}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Leyenda de intensidad */}
          {showFilters && (
            <div className="card shadow-sm mt-2">
              <div className="card-body p-2">
                <small className="fw-bold d-block mb-1">Intensidad:</small>
                <div className="d-flex flex-column gap-1">
                  <div className="d-flex align-items-center gap-1">
                    <div style={{ width: '15px', height: '15px', borderRadius: '50%', backgroundColor: '#ffff00', flexShrink: 0 }}></div>
                    <small style={{ fontSize: '11px' }}>Baja (1-2)</small>
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <div style={{ width: '15px', height: '15px', borderRadius: '50%', backgroundColor: '#ffd700', flexShrink: 0 }}></div>
                    <small style={{ fontSize: '11px' }}>Media-Baja (2-3)</small>
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <div style={{ width: '15px', height: '15px', borderRadius: '50%', backgroundColor: '#ffa500', flexShrink: 0 }}></div>
                    <small style={{ fontSize: '11px' }}>Media (3-5)</small>
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <div style={{ width: '15px', height: '15px', borderRadius: '50%', backgroundColor: '#ff6347', flexShrink: 0 }}></div>
                    <small style={{ fontSize: '11px' }}>Media-Alta (5-7)</small>
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <div style={{ width: '15px', height: '15px', borderRadius: '50%', backgroundColor: '#dc143c', flexShrink: 0 }}></div>
                    <small style={{ fontSize: '11px' }}>Alta (7-10)</small>
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <div style={{ width: '15px', height: '15px', borderRadius: '50%', backgroundColor: '#8b0000', flexShrink: 0 }}></div>
                    <small style={{ fontSize: '11px' }}>Muy Alta (10+)</small>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Estadísticas debajo del mapa */}
      <div className="row mt-3" style={{ flexShrink: 0 }}>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-2">
              <div className="d-flex align-items-center justify-content-center gap-2">
                <i className="fas fa-map-marker-alt text-primary"></i>
                <div>
                  <h5 className="mb-0">{filteredIncidents.length}</h5>
                  <small className="text-muted">Incidencias</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-2">
              <div className="d-flex align-items-center justify-content-center gap-2">
                <i className="fas fa-calendar text-success"></i>
                <div>
                  <h5 className="mb-0" style={{ fontSize: '14px' }}>
                    {filters.month ? months.find(m => m.value === filters.month)?.label : 'Todo el año'}
                  </h5>
                  <small className="text-muted">Período</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-2">
              <div className="d-flex align-items-center justify-content-center gap-2">
                <i className="fas fa-layer-group text-warning"></i>
                <div>
                  <h5 className="mb-0">{new Set(filteredIncidents.map(i => i.incidenciaId)).size}</h5>
                  <small className="text-muted">Tipos</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-2">
              <div className="d-flex align-items-center justify-content-center gap-2">
                <i className="fas fa-fire text-danger"></i>
                <div>
                  <h5 className="mb-0">
                    {filteredIncidents.length > 0
                      ? Math.max(...filteredIncidents.map(i => getHeatIntensity(i.latitude, i.longitude)))
                      : 0}
                  </h5>
                  <small className="text-muted">Max Densidad</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
