import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import Select from 'react-select';
import { customSelectStylesSmall } from '../../styles/react-select-custom';
import { incidentsService, IncidenciaCatalog, EstadoCatalog, PrioridadCatalog } from '../../services/incidents.service';
import { administradoresService } from '../../services/administradores.service';
import { HeatmapLayer } from '../../components/HeatmapLayer';
import { PageHeader } from '../../components/ui/PageHeader';
import 'leaflet/dist/leaflet.css';

const LIMA_CENTER: [number, number] = [-12.0464, -77.0428];
const LIMA_BOUNDS: [[number, number], [number, number]] = [
  [-13.2, -77.6],
  [-11.4, -76.4],
];

// Interface simplificada para data del mapa
interface IncidentMapData {
  id: number;
  latitude: number;
  longitude: number;
  createdAt: string;
  incidenciaId: number;
  prioridadId?: number;
  estadoId?: number;
}

// Componente para forzar el ajuste y renderizado de Leaflet
function MapResizer() {
  const map = useMap();
  
  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });

    resizeObserver.observe(container);

    const t1 = setTimeout(() => map.invalidateSize(), 50);
    const t2 = setTimeout(() => map.invalidateSize(), 200);
    const t3 = setTimeout(() => map.invalidateSize(), 500);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [map]);

  return null;
}

// Componente para ajustar el mapa a los bounds de los puntos cargados
function FitBounds({ incidents }: { incidents: IncidentMapData[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (incidents.length > 0) {
      // Filtrar estrictamente coordenadas dentro del rango válido de Lima y alrededores
      const validPoints = incidents
        .filter(i => 
          typeof i.latitude === 'number' && 
          typeof i.longitude === 'number' && 
          !isNaN(i.latitude) && 
          !isNaN(i.longitude) &&
          i.latitude >= -13.5 && i.latitude <= -11.0 &&
          i.longitude >= -78.0 && i.longitude <= -76.0
        )
        .map(i => [i.latitude, i.longitude] as [number, number]);

      if (validPoints.length > 0) {
        map.fitBounds(validPoints, { padding: [30, 30], maxZoom: 14 });
      } else {
        map.setView(LIMA_CENTER, 12);
      }
    } else {
      map.setView(LIMA_CENTER, 12);
    }
  }, [incidents, map]);
  
  return null;
}

export function MapaCalor() {
  const [incidents, setIncidents] = useState<IncidentMapData[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<string>('');

  // Filtros - Por defecto característica "I" y prioridad "ALTA" (ID: 1)
  const [showFilters, setShowFilters] = useState(false);
  const currentDate = new Date();
  const [filters, setFilters] = useState({
    year: currentDate.getFullYear().toString(),
    month: (currentDate.getMonth() + 1).toString(), // Mes actual (1-12)
    caracteristica: 'I', // 'I' = Incidencia por defecto
    prioridadId: '1',    // '1' = ALTA por defecto
    tipoIncidencia: '',
    estadoId: '',
    administradorId: '',
  });

  // Catálogos
  const [tiposIncidencia, setTiposIncidencia] = useState<IncidenciaCatalog[]>([]);
  const [prioridades, setPrioridades] = useState<PrioridadCatalog[]>([]);
  const [estados, setEstados] = useState<EstadoCatalog[]>([]);
  const [administradores, setAdministradores] = useState<Array<{ id: number; nombre: string }>>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([
    new Date().getFullYear(),
    new Date().getFullYear() - 1,
    new Date().getFullYear() - 2,
    new Date().getFullYear() - 3,
    new Date().getFullYear() - 4,
    new Date().getFullYear() - 5,
  ]);
  
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

  const caracteristicasOptions = [
    { value: '', label: 'Todas las características' },
    { value: 'I', label: 'I - Incidencia' },
    { value: 'T', label: 'T - Trabajos / Tareas' },
  ];

  // Cargar catálogos una vez al montar
  useEffect(() => {
    loadCatalogs();
  }, []);

  const loadCatalogs = async () => {
    try {
      const [tiposRes, prioridadesRes, estadosRes, adminRes, yearsRes] = await Promise.allSettled([
        incidentsService.getIncidenciasCatalog(),
        incidentsService.getPrioridadesCatalog(),
        incidentsService.getEstadosCatalog(),
        administradoresService.getAdministradores(),
        incidentsService.getAvailableYears(),
      ]);

      if (tiposRes.status === 'fulfilled') setTiposIncidencia(tiposRes.value || []);
      if (prioridadesRes.status === 'fulfilled' && prioridadesRes.value?.length > 0) {
        setPrioridades(prioridadesRes.value);
      } else {
        setPrioridades([
          { id: 1, nombre: 'ALTA' },
          { id: 2, nombre: 'MEDIA' },
          { id: 3, nombre: 'BAJA' }
        ]);
      }
      if (estadosRes.status === 'fulfilled') setEstados(estadosRes.value || []);
      if (adminRes.status === 'fulfilled') setAdministradores(adminRes.value || []);
      if (yearsRes.status === 'fulfilled' && yearsRes.value?.length > 0) {
        setAvailableYears(yearsRes.value);
      }
    } catch (err) {
      console.error('Error cargando catálogos del mapa de calor:', err);
    }
  };

  // Cargar datos cuando cambian los filtros
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadData = async () => {
    setLoadingData(true);
    setErrors('');
    try {
      const queryParams: any = {
        allStates: true,
      };

      if (filters.year) {
        queryParams.year = parseInt(filters.year, 10);
      }
      if (filters.month) {
        queryParams.month = parseInt(filters.month, 10);
      }
      if (filters.caracteristica) {
        queryParams.caracteristica = filters.caracteristica;
      }
      if (filters.prioridadId) {
        queryParams.prioridadId = parseInt(filters.prioridadId, 10);
      }
      if (filters.tipoIncidencia) {
        queryParams.incidenciaId = parseInt(filters.tipoIncidencia, 10);
      }
      if (filters.estadoId) {
        queryParams.estadoId = parseInt(filters.estadoId, 10);
      }
      if (filters.administradorId) {
        queryParams.administradorId = parseInt(filters.administradorId, 10);
      }

      const incidentsResponse = await incidentsService.getMapMarkers(queryParams);
      const incidentsData = incidentsResponse.data || [];

      // Mapear solo los datos con coordenadas válidas dentro del ámbito metropolitano
      const mappedIncidents: IncidentMapData[] = incidentsData
        .filter((i: any) => {
          const lat = Number(i.latitude);
          const lng = Number(i.longitude);
          return (
            !isNaN(lat) &&
            !isNaN(lng) &&
            lat >= -13.5 && lat <= -11.0 &&
            lng >= -78.0 && lng <= -76.0
          );
        })
        .map((i: any) => ({
          id: i.id,
          latitude: Number(i.latitude),
          longitude: Number(i.longitude),
          createdAt: i.createdAt,
          incidenciaId: i.incidenciaId,
          prioridadId: i.prioridadId,
          estadoId: i.estadoId,
        }));
      
      setIncidents(mappedIncidents);
    } catch (error: any) {
      setErrors(error.response?.data?.message || 'Error al cargar los datos del mapa de calor');
      console.error('Error loading heatmap data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => {
      const updated = {
        ...prev,
        [key]: value,
      };

      // Si cambia la característica o la prioridad, validar si el tipo actualmente seleccionado aún es válido
      if (key === 'caracteristica' || key === 'prioridadId') {
        if (updated.tipoIncidencia) {
          const selectedTipo = tiposIncidencia.find(t => t.id.toString() === updated.tipoIncidencia);
          if (selectedTipo) {
            const matchesCaract = !updated.caracteristica || !selectedTipo.caracteristica || selectedTipo.caracteristica === updated.caracteristica;
            const pId = selectedTipo.prioridadId ?? selectedTipo.prioridadeId;
            const matchesPrioridad = !updated.prioridadId || (pId !== undefined && pId !== null && pId.toString() === updated.prioridadId);
            if (!matchesCaract || !matchesPrioridad) {
              updated.tipoIncidencia = '';
            }
          }
        }
      }

      return updated;
    });
  };

  const clearFilters = () => {
    const curDate = new Date();
    setFilters({
      year: curDate.getFullYear().toString(),
      month: (curDate.getMonth() + 1).toString(),
      caracteristica: 'I',
      prioridadId: '1',
      tipoIncidencia: '',
      estadoId: '',
      administradorId: '',
    });
  };

  // Filtrar catálogo de tipos según la característica y prioridad seleccionadas
  const tiposFiltrados = tiposIncidencia.filter(t => {
    // Filtro por característica
    if (filters.caracteristica && t.caracteristica && t.caracteristica !== filters.caracteristica) {
      return false;
    }
    // Filtro por prioridad
    if (filters.prioridadId) {
      const pId = t.prioridadId ?? t.prioridadeId;
      if (pId !== undefined && pId !== null && pId.toString() !== filters.prioridadId) {
        return false;
      }
    }
    return true;
  });

  // Convertir incidencias a puntos para heatmap con cálculo de densidad relativa suave
  const heatmapPoints: Array<[number, number, number]> = incidents.map(incident => {
    const nearby = incidents.filter(i => {
      const distance = Math.sqrt(
        Math.pow(i.latitude - incident.latitude, 2) + 
        Math.pow(i.longitude - incident.longitude, 2)
      );
      return distance <= 0.008; // radio ~800m
    });
    // Escala suave: puntos aislados en ~0.18, concentración moderada ~0.5, alta ~0.9
    const count = nearby.length;
    const intensity = Math.min(Math.max(count / 14, 0.18), 1.0);
    return [incident.latitude, incident.longitude, intensity];
  });

  // Estadísticas
  const maxDensity = incidents.length > 0
    ? Math.max(...heatmapPoints.map(p => p[2]))
    : 0;

  // Subtítulo descriptivo según filtros
  const getSubtitulo = () => {
    const filtrosActivos = [];
    if (filters.caracteristica) filtrosActivos.push(`Caract. "${filters.caracteristica}"`);
    if (filters.prioridadId) {
      const pNom = prioridades.find(p => p.id.toString() === filters.prioridadId)?.nombre;
      if (pNom) filtrosActivos.push(`Prioridad ${pNom}`);
    }
    const extra = filtrosActivos.length > 0 ? ` (${filtrosActivos.join(' - ')})` : '';
    return `Concentración espacial y densidad de ${incidents.length} evento${incidents.length !== 1 ? 's' : ''} georreferenciados${extra}`;
  };

  return (
    <div 
      className="container-fluid p-3" 
      style={{ 
        height: 'calc(100vh - 105px)', 
        maxHeight: 'calc(100vh - 105px)',
        display: 'flex', 
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      {/* Cabecera */}
      <div style={{ flexShrink: 0, marginBottom: '6px' }}>
        <PageHeader
          icon="fa-solid fa-fire"
          title="Mapa de Calor de Incidencias"
          subtitle={getSubtitulo()}
          actions={
            <div className="d-flex gap-2">
              <button
                className={`btn btn-sm ${showFilters ? 'btn-secondary' : 'btn-outline-secondary'}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <i className="fa-solid fa-filter me-1"></i>
                {showFilters ? 'Ocultar Filtros' : 'Filtros'}
              </button>
            </div>
          }
        />
      </div>

      {errors && (
        <div className="alert alert-danger alert-dismissible fade show py-2 mb-2" role="alert" style={{ flexShrink: 0 }}>
          <i className="fa-solid fa-triangle-exclamation me-2"></i>
          {errors}
          <button type="button" className="btn-close btn-sm" onClick={() => setErrors('')}></button>
        </div>
      )}

      {/* Mapa con filtros overlay */}
      <div className="card border shadow-sm" style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
        <MapContainer
          center={LIMA_CENTER}
          zoom={12}
          minZoom={10}
          maxZoom={18}
          maxBounds={LIMA_BOUNDS}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapResizer />
          <FitBounds incidents={incidents} />

          {/* Capa de heatmap */}
          {heatmapPoints.length > 0 && (
            <HeatmapLayer 
              points={heatmapPoints}
              options={{
                radius: 22,
                blur: 16,
                maxZoom: 16,
                max: 1.0,
                minOpacity: 0.25,
                gradient: {
                  0.2: '#3b82f6', // azul suave (baja densidad)
                  0.4: '#06b6d4', // cian / turquesa
                  0.6: '#10b981', // verde esmeralda
                  0.8: '#f59e0b', // ámbar / naranja cálido
                  1.0: '#ef4444', // rojo suave (alta concentración)
                },
              }}
            />
          )}
        </MapContainer>

        {/* Panel de filtros sobre el mapa */}
        {showFilters && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 900,
            width: '330px',
            maxHeight: 'calc(100% - 20px)',
            overflowY: 'auto'
          }}>
            <div className="card border shadow" style={{ backgroundColor: 'rgba(255, 255, 255, 0.97)', backdropFilter: 'blur(4px)' }}>
              <div className="card-header bg-primary text-white py-2 px-3 d-flex justify-content-between align-items-center">
                <h6 className="card-title mb-0 fw-semibold" style={{ fontSize: '13px' }}>
                  <i className="fa-solid fa-sliders me-2"></i>
                  Filtros del Mapa
                </h6>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  style={{ fontSize: '10px' }}
                  onClick={() => setShowFilters(false)}
                ></button>
              </div>
              <div className="card-body p-2">
                {loadingData ? (
                  <div className="placeholder-glow">
                    <div className="mb-2"><span className="placeholder col-12 form-control-sm"></span></div>
                    <div className="mb-2"><span className="placeholder col-12 form-control-sm"></span></div>
                    <div className="mb-2"><span className="placeholder col-12 form-control-sm"></span></div>
                  </div>
                ) : (
                  <>
                    <div className="row g-2 mb-2">
                      <div className="col-6">
                        <label className="form-label small mb-1 fw-bold text-muted">Año</label>
                        <Select
                          options={[
                            { value: '', label: 'Todos' },
                            ...availableYears.map(year => ({ value: year.toString(), label: year.toString() }))
                          ]}
                          value={filters.year ? { value: filters.year, label: filters.year } : { value: '', label: 'Todos' }}
                          onChange={(option) => handleFilterChange('year', option?.value || '')}
                          placeholder="Año..."
                          isClearable
                          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                          menuPosition="fixed"
                          styles={customSelectStylesSmall}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label small mb-1 fw-bold text-muted">Mes</label>
                        <Select
                          options={[
                            { value: '', label: 'Todos' },
                            ...months.map(month => ({ value: month.value, label: month.label }))
                          ]}
                          value={filters.month ? months.find(m => m.value === filters.month) : { value: '', label: 'Todos' }}
                          onChange={(option) => handleFilterChange('month', option?.value || '')}
                          placeholder="Mes..."
                          isClearable
                          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                          menuPosition="fixed"
                          styles={customSelectStylesSmall}
                        />
                      </div>
                    </div>

                    <div className="row g-2 mb-2">
                      <div className="col-6">
                        <label className="form-label small mb-1 fw-bold text-muted">Característica</label>
                        <Select
                          options={caracteristicasOptions}
                          value={filters.caracteristica ? (caracteristicasOptions.find(c => c.value === filters.caracteristica) || { value: filters.caracteristica, label: filters.caracteristica }) : { value: '', label: 'Todas' }}
                          onChange={(option) => handleFilterChange('caracteristica', option?.value || '')}
                          placeholder="Caract..."
                          isClearable
                          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                          menuPosition="fixed"
                          styles={customSelectStylesSmall}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label small mb-1 fw-bold text-muted">Prioridad</label>
                        <Select
                          options={[
                            { value: '', label: 'Todas' },
                            ...prioridades.map(p => ({ value: p.id.toString(), label: p.nombre }))
                          ]}
                          value={filters.prioridadId ? (prioridades.find(p => p.id.toString() === filters.prioridadId) ? { value: filters.prioridadId, label: prioridades.find(p => p.id.toString() === filters.prioridadId)?.nombre || '' } : { value: '', label: 'Todas' }) : { value: '', label: 'Todas' }}
                          onChange={(option) => handleFilterChange('prioridadId', option?.value || '')}
                          placeholder="Prioridad..."
                          isClearable
                          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                          menuPosition="fixed"
                          styles={customSelectStylesSmall}
                        />
                      </div>
                    </div>

                    <div className="mb-2">
                      <label className="form-label small mb-1 fw-bold text-muted">Tipo de Incidencia</label>
                      <Select
                        options={[
                          { value: '', label: 'Todos los tipos' },
                          ...tiposFiltrados.map(tipo => ({ value: tipo.id.toString(), label: tipo.tipo }))
                        ]}
                        value={filters.tipoIncidencia ? (tiposFiltrados.find(t => t.id.toString() === filters.tipoIncidencia) ? { value: filters.tipoIncidencia, label: tiposFiltrados.find(t => t.id.toString() === filters.tipoIncidencia)?.tipo || '' } : { value: '', label: 'Todos los tipos' }) : { value: '', label: 'Todos los tipos' }}
                        onChange={(option) => handleFilterChange('tipoIncidencia', option?.value || '')}
                        placeholder="Buscar tipo..."
                        isClearable
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                        menuPosition="fixed"
                        styles={customSelectStylesSmall}
                      />
                    </div>

                    <div className="mb-2">
                      <label className="form-label small mb-1 fw-bold text-muted">Administrador</label>
                      <Select
                        options={[
                          { value: '', label: 'Todos los administradores' },
                          ...administradores.map(adm => ({ value: adm.id.toString(), label: adm.nombre }))
                        ]}
                        value={filters.administradorId ? (administradores.find(a => a.id.toString() === filters.administradorId) ? { value: filters.administradorId, label: administradores.find(a => a.id.toString() === filters.administradorId)?.nombre || '' } : { value: '', label: 'Todos los administradores' }) : { value: '', label: 'Todos los administradores' }}
                        onChange={(option) => handleFilterChange('administradorId', option?.value || '')}
                        placeholder="Buscar administrador..."
                        isClearable
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                        menuPosition="fixed"
                        styles={customSelectStylesSmall}
                      />
                    </div>

                    <div className="mb-2">
                      <label className="form-label small mb-1 fw-bold text-muted">Estado</label>
                      <Select
                        options={[
                          { value: '', label: 'Todos los estados' },
                          ...estados.map(est => ({ value: est.id.toString(), label: est.nombre }))
                        ]}
                        value={filters.estadoId ? (estados.find(e => e.id.toString() === filters.estadoId) ? { value: filters.estadoId, label: estados.find(e => e.id.toString() === filters.estadoId)?.nombre || '' } : { value: '', label: 'Todos los estados' }) : { value: '', label: 'Todos los estados' }}
                        onChange={(option) => handleFilterChange('estadoId', option?.value || '')}
                        placeholder="Buscar estado..."
                        isClearable
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                        menuPosition="fixed"
                        styles={customSelectStylesSmall}
                      />
                    </div>

                    <div className="d-flex gap-2 mt-2">
                      <button
                        className="btn btn-outline-secondary btn-sm flex-fill py-1"
                        onClick={clearFilters}
                      >
                        <i className="fa-solid fa-broom me-1"></i>
                        Restablecer Filtros
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Leyenda de intensidad */}
            <div className="card border shadow mt-2" style={{ backgroundColor: 'rgba(255, 255, 255, 0.97)', backdropFilter: 'blur(4px)' }}>
              <div className="card-body p-2">
                <small className="fw-bold text-muted d-block mb-1" style={{ fontSize: '11px' }}>Gradiente de calor:</small>
                <div style={{ 
                  height: '10px', 
                  background: 'linear-gradient(to right, #3b82f6, #06b6d4, #10b981, #f59e0b, #ef4444)',
                  borderRadius: '3px',
                  marginBottom: '4px'
                }}></div>
                <div className="d-flex justify-content-between text-muted" style={{ fontSize: '10px' }}>
                  <span>Baja densidad</span>
                  <span>Alta concentración</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Métricas debajo del mapa */}
      <div className="row g-2 mt-2" style={{ flexShrink: 0 }}>
        <div className="col-md-3">
          <div className="card card-widget mb-0 h-100 border shadow-sm">
            <div className="card-body p-2 px-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <div className="widget-subheading text-uppercase text-muted fw-bold" style={{ fontSize: '10px' }}>INCIDENCIAS GEORREFERENCIADAS</div>
                <div className="widget-icon-box text-primary" style={{ width: '32px', height: '32px' }}>
                  <i className="fa-solid fa-location-dot"></i>
                </div>
              </div>
              <div className="widget-numbers text-primary" style={{ fontSize: '20px' }}>{incidents.length}</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card card-widget mb-0 h-100 border shadow-sm">
            <div className="card-body p-2 px-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <div className="widget-subheading text-uppercase text-muted fw-bold" style={{ fontSize: '10px' }}>PERÍODO ACTIVO</div>
                <div className="widget-icon-box text-success" style={{ width: '32px', height: '32px' }}>
                  <i className="fa-solid fa-calendar"></i>
                </div>
              </div>
              <div className="widget-numbers text-success" style={{ fontSize: '16px' }}>
                {filters.month ? months.find(m => m.value === filters.month)?.label : 'Todo el año'} / {filters.year || 'Todos'}
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card card-widget mb-0 h-100 border shadow-sm">
            <div className="card-body p-2 px-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <div className="widget-subheading text-uppercase text-muted fw-bold" style={{ fontSize: '10px' }}>TIPOS DIFERENTES</div>
                <div className="widget-icon-box text-warning" style={{ width: '32px', height: '32px' }}>
                  <i className="fa-solid fa-layer-group"></i>
                </div>
              </div>
              <div className="widget-numbers text-warning" style={{ fontSize: '20px' }}>
                {new Set(incidents.map(i => i.incidenciaId)).size}
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card card-widget mb-0 h-100 border shadow-sm">
            <div className="card-body p-2 px-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <div className="widget-subheading text-uppercase text-muted fw-bold" style={{ fontSize: '10px' }}>DENSIDAD MÁXIMA</div>
                <div className="widget-icon-box text-danger" style={{ width: '32px', height: '32px' }}>
                  <i className="fa-solid fa-fire"></i>
                </div>
              </div>
              <div className="widget-numbers text-danger" style={{ fontSize: '20px' }}>
                {(maxDensity * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
