import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import Select from 'react-select';
import { customSelectStylesSmall } from '../../styles/react-select-custom';
import { incidentsService } from '../../services/incidents.service';
import { HeatmapLayer } from '../../components/HeatmapLayer';
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

  // Filtros - Inicializar con mes y año actual
  const [showFilters, setShowFilters] = useState(false);
  const currentDate = new Date();
  const [filters, setFilters] = useState({
    year: currentDate.getFullYear().toString(),
    month: (currentDate.getMonth() + 1).toString(), // Mes actual (1-12)
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

    // Filtro por año - usar string para evitar problemas de zona horaria
    // Las fechas vienen como "2026-01-10T00:27:08.474Z", extraemos YYYY-MM
    if (filters.year) {
      filtered = filtered.filter(incident => {
        const year = incident.createdAt.substring(0, 4); // "2026"
        return year === filters.year;
      });
    }

    // Filtro por mes - usar string para evitar problemas de zona horaria
    if (filters.month) {
      filtered = filtered.filter(incident => {
        const month = parseInt(incident.createdAt.substring(5, 7), 10).toString(); // "01" -> "1"
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
    const currentDate = new Date();
    setFilters({
      year: currentDate.getFullYear().toString(),
      month: (currentDate.getMonth() + 1).toString(), // Restablecer a mes actual
      tipoIncidencia: '',
    });
  };

  // Convertir incidencias a puntos para heatmap
  const heatmapPoints: Array<[number, number, number]> = filteredIncidents.map(incident => {
    // Calcular intensidad local para este punto
    const nearby = filteredIncidents.filter(i => {
      const distance = Math.sqrt(
        Math.pow(i.latitude - incident.latitude, 2) + 
        Math.pow(i.longitude - incident.longitude, 2)
      );
      return distance <= 0.01; // radio ~1km
    });
    const intensity = Math.min(nearby.length / 10, 1); // normalizar 0-1
    return [incident.latitude, incident.longitude, intensity];
  });

  // Stats
  const maxDensity = filteredIncidents.length > 0
    ? Math.max(...heatmapPoints.map(p => p[2]))
    : 0;

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

          {/* Capa de heatmap */}
          <HeatmapLayer 
            points={heatmapPoints}
            options={{
              radius: 30,
              blur: 20,
              maxZoom: 17,
              max: 1.0,
              minOpacity: 0.5,
            }}
          />
        </MapContainer>

        {/* Panel de filtros sobre el mapa */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 900,
          width: '450px'
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
                      <Select
                        options={[
                          { value: '', label: 'Todos' },
                          ...years.map(year => ({ value: year.toString(), label: year.toString() }))
                        ]}
                        value={filters.year ? { value: filters.year, label: filters.year } : { value: '', label: 'Todos' }}
                        onChange={(option) => handleFilterChange('year', option?.value || '')}
                        placeholder="Seleccionar año..."
                        isClearable
                        styles={customSelectStylesSmall}
                      />
                    </div>

                    <div className="mb-2">
                      <label className="form-label small mb-1 fw-bold">
                        <i className="fas fa-calendar me-1"></i>
                        Mes
                      </label>
                      <Select
                        options={[
                          { value: '', label: 'Todos' },
                          ...months.map(month => ({ value: month.value, label: month.label }))
                        ]}
                        value={filters.month ? months.find(m => m.value === filters.month) : { value: '', label: 'Todos' }}
                        onChange={(option) => handleFilterChange('month', option?.value || '')}
                        placeholder="Seleccionar mes..."
                        isClearable
                        styles={customSelectStylesSmall}
                      />
                    </div>

                    <div className="mb-2">
                      <label className="form-label small mb-1 fw-bold">
                        <i className="fas fa-exclamation-triangle me-1"></i>
                        Tipo de Incidencia
                      </label>
                      <Select
                        options={[
                          { value: '', label: 'Todos' },
                          ...tiposIncidencia.map(tipo => ({ value: tipo.id.toString(), label: tipo.tipo }))
                        ]}
                        value={filters.tipoIncidencia ? tiposIncidencia.find(t => t.id.toString() === filters.tipoIncidencia) ? { value: filters.tipoIncidencia, label: tiposIncidencia.find(t => t.id.toString() === filters.tipoIncidencia)?.tipo || '' } : { value: '', label: 'Todos' } : { value: '', label: 'Todos' }}
                        onChange={(option) => handleFilterChange('tipoIncidencia', option?.value || '')}
                        placeholder="Buscar tipo de incidencia..."
                        isClearable
                        styles={customSelectStylesSmall}
                      />
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
                <small className="fw-bold d-block mb-2">Gradiente de calor:</small>
                <div style={{ 
                  height: '20px', 
                  background: 'linear-gradient(to right, #ffff00, #ffd700, #ffa500, #ff6347, #dc143c, #8b0000)',
                  borderRadius: '3px',
                  marginBottom: '8px'
                }}></div>
                <div className="d-flex justify-content-between">
                  <small style={{ fontSize: '10px' }}>Baja</small>
                  <small style={{ fontSize: '10px' }}>Alta</small>
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
                    {(maxDensity * 100).toFixed(0)}%
                  </h5>
                  <small className="text-muted">Max Intensidad</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
