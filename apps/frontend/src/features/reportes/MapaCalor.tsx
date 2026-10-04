import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import Select from 'react-select';
import { customSelectStylesSmall } from '../../styles/react-select-custom';
import { incidentsService, IncidenciaCatalog, EstadoCatalog, PrioridadCatalog } from '../../services/incidents.service';
import { administradoresService } from '../../services/administradores.service';
import { HeatmapLayer } from '../../components/HeatmapLayer';
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
      map.invalidateSize({ animate: false });
    });

    resizeObserver.observe(container);

    const t1 = setTimeout(() => map.invalidateSize(), 50);
    const t2 = setTimeout(() => map.invalidateSize(), 200);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map]);

  return null;
}

// Componente para ajustar el mapa a los bounds de los puntos cargados
function FitBounds({ incidents }: { incidents: IncidentMapData[] }) {
  const map = useMap();

  useEffect(() => {
    if (incidents.length > 0) {
      const validPoints = incidents
        .filter(
          (i) =>
            typeof i.latitude === 'number' &&
            typeof i.longitude === 'number' &&
            !isNaN(i.latitude) &&
            !isNaN(i.longitude) &&
            i.latitude >= -13.5 &&
            i.latitude <= -11.0 &&
            i.longitude >= -78.0 &&
            i.longitude <= -76.0,
        )
        .map((i) => [i.latitude, i.longitude] as [number, number]);

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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Filtros - Por defecto cargamos todo el año actual con todas las prioridades para garantizar datos visibles
  const currentDate = new Date();
  const [filters, setFilters] = useState({
    year: currentDate.getFullYear().toString(),
    month: '', // '' = Todo el año (carga datos históricos completos)
    caracteristica: 'I', // 'I' = Incidencias
    prioridadId: '', // '' = Todas las prioridades
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
    { value: '', label: 'Todos los meses' },
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
    { value: 'I', label: 'I - Incidencias' },
    { value: 'T', label: 'T - Trabajos / Tareas' },
  ];

  const mapInstanceRef = useRef<any>(null);

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
          { id: 3, nombre: 'BAJA' },
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

      // Mapear solo los datos con coordenadas válidas dentro de Lima Metropolitana
      const mappedIncidents: IncidentMapData[] = incidentsData
        .filter((i: any) => {
          const lat = Number(i.latitude);
          const lng = Number(i.longitude);
          return (
            !isNaN(lat) &&
            !isNaN(lng) &&
            lat >= -13.5 &&
            lat <= -11.0 &&
            lng >= -78.0 &&
            lng <= -76.0
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
    setFilters((prev) => {
      const updated = {
        ...prev,
        [key]: value,
      };

      if (key === 'caracteristica' || key === 'prioridadId') {
        if (updated.tipoIncidencia) {
          const selectedTipo = tiposIncidencia.find((t) => t.id.toString() === updated.tipoIncidencia);
          if (selectedTipo) {
            const matchesCaract =
              !updated.caracteristica || !selectedTipo.caracteristica || selectedTipo.caracteristica === updated.caracteristica;
            const pId = selectedTipo.prioridadId ?? selectedTipo.prioridadeId;
            const matchesPrioridad =
              !updated.prioridadId || (pId !== undefined && pId !== null && pId.toString() === updated.prioridadId);
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
      month: '',
      caracteristica: 'I',
      prioridadId: '',
      tipoIncidencia: '',
      estadoId: '',
      administradorId: '',
    });
  };

  const hasActiveFilters = Boolean(
    filters.month ||
      filters.prioridadId ||
      filters.caracteristica !== 'I' ||
      filters.tipoIncidencia ||
      filters.estadoId ||
      filters.administradorId,
  );

  // Filtrar catálogo de tipos según la característica y prioridad seleccionadas
  const tiposFiltrados = tiposIncidencia.filter((t) => {
    if (filters.caracteristica && t.caracteristica && t.caracteristica !== filters.caracteristica) {
      return false;
    }
    if (filters.prioridadId) {
      const pId = t.prioridadId ?? t.prioridadeId;
      if (pId !== undefined && pId !== null && pId.toString() !== filters.prioridadId) {
        return false;
      }
    }
    return true;
  });

  // Convertir incidencias a puntos para heatmap con cálculo de densidad suave
  const heatmapPoints: Array<[number, number, number]> = incidents.map((incident) => {
    const nearby = incidents.filter((i) => {
      const distance = Math.sqrt(
        Math.pow(i.latitude - incident.latitude, 2) + Math.pow(i.longitude - incident.longitude, 2),
      );
      return distance <= 0.008; // radio ~800m
    });
    const count = nearby.length;
    const intensity = Math.min(Math.max(count / 14, 0.18), 1.0);
    return [incident.latitude, incident.longitude, intensity];
  });

  // Estadísticas
  const maxDensity = incidents.length > 0 ? Math.max(...heatmapPoints.map((p) => p[2])) : 0;

  const handleResetLima = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(LIMA_CENTER, 12, { animate: true });
    }
  };

  return (
    <div className="container-fluid p-3 h-100 d-flex flex-column overflow-hidden" style={{ minHeight: 0 }}>
      {/* Barra Superior Compacta (Toolbar / Header) */}
      <div className="card border shadow-sm mb-2" style={{ flexShrink: 0 }}>
        <div className="card-body p-2 px-3">
          <div className="row g-2 align-items-center">
            {/* Título y Conteo */}
            <div className="col-12 col-lg-auto d-flex align-items-center gap-2 me-lg-2">
              <div
                className="bg-danger-subtle text-danger rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: '36px', height: '36px' }}
              >
                <i className="fa-solid fa-fire fs-5"></i>
              </div>
              <div>
                <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '14px' }}>
                  Mapa de Calor de Incidencias
                </h6>
                <div className="d-flex align-items-center gap-1">
                  <span className="badge bg-danger px-2 py-0" style={{ fontSize: '11px' }}>
                    {incidents.length}
                  </span>
                  <span className="text-muted" style={{ fontSize: '11px' }}>
                    eventos georreferenciados
                  </span>
                </div>
              </div>
            </div>

            {/* Selector de Año */}
            <div className="col-6 col-sm-3 col-md-2 col-lg-1">
              <Select
                options={availableYears.map((y) => ({ value: y.toString(), label: y.toString() }))}
                value={filters.year ? { value: filters.year, label: filters.year } : null}
                onChange={(opt) => handleFilterChange('year', opt?.value || '')}
                placeholder="Año..."
                styles={customSelectStylesSmall}
              />
            </div>

            {/* Selector de Mes */}
            <div className="col-6 col-sm-3 col-md-2 col-lg-2">
              <Select
                options={months}
                value={filters.month ? months.find((m) => m.value === filters.month) : { value: '', label: 'Todos los meses' }}
                onChange={(opt) => handleFilterChange('month', opt?.value || '')}
                placeholder="Mes..."
                styles={customSelectStylesSmall}
              />
            </div>

            {/* Selector de Prioridad */}
            <div className="col-6 col-sm-3 col-md-2 col-lg-2">
              <Select
                options={[
                  { value: '', label: 'Todas las prioridades' },
                  ...prioridades.map((p) => ({ value: p.id.toString(), label: p.nombre })),
                ]}
                value={
                  filters.prioridadId
                    ? {
                        value: filters.prioridadId,
                        label: prioridades.find((p) => p.id.toString() === filters.prioridadId)?.nombre || '',
                      }
                    : { value: '', label: 'Todas las prioridades' }
                }
                onChange={(opt) => handleFilterChange('prioridadId', opt?.value || '')}
                placeholder="Prioridad..."
                styles={customSelectStylesSmall}
              />
            </div>

            {/* Selector de Característica */}
            <div className="col-6 col-sm-3 col-md-2 col-lg-2">
              <Select
                options={caracteristicasOptions}
                value={
                  filters.caracteristica
                    ? caracteristicasOptions.find((c) => c.value === filters.caracteristica)
                    : { value: '', label: 'Todas' }
                }
                onChange={(opt) => handleFilterChange('caracteristica', opt?.value || '')}
                placeholder="Caract..."
                styles={customSelectStylesSmall}
              />
            </div>

            {/* Botones de Control */}
            <div className="col-12 col-lg d-flex justify-content-end align-items-center gap-1 mt-2 mt-lg-0">
              <button
                type="button"
                className={`btn btn-sm ${showAdvancedFilters ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                title="Filtros por Tipo de Incidencia, Administrador y Estado"
                style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
              >
                <i className="fa-solid fa-sliders me-1"></i>
                Filtros
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={clearFilters}
                  title="Restablecer todos los filtros"
                  style={{ fontSize: '12px' }}
                >
                  <i className="fa-solid fa-rotate-left me-1"></i>
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Panel Desplegable de Filtros Avanzados */}
          {showAdvancedFilters && (
            <div className="row g-2 pt-2 mt-2 border-top">
              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold text-muted mb-1" style={{ fontSize: '11px' }}>
                  Tipo de Incidencia
                </label>
                <Select
                  options={[
                    { value: '', label: 'Todos los tipos de incidencia' },
                    ...tiposFiltrados.map((t) => ({ value: t.id.toString(), label: t.tipo })),
                  ]}
                  value={
                    filters.tipoIncidencia
                      ? {
                          value: filters.tipoIncidencia,
                          label: tiposFiltrados.find((t) => t.id.toString() === filters.tipoIncidencia)?.tipo || '',
                        }
                      : { value: '', label: 'Todos los tipos' }
                  }
                  onChange={(opt) => handleFilterChange('tipoIncidencia', opt?.value || '')}
                  placeholder="Seleccionar tipo..."
                  isClearable
                  styles={customSelectStylesSmall}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold text-muted mb-1" style={{ fontSize: '11px' }}>
                  Administrador
                </label>
                <Select
                  options={[
                    { value: '', label: 'Todos los administradores' },
                    ...administradores.map((a) => ({ value: a.id.toString(), label: a.nombre })),
                  ]}
                  value={
                    filters.administradorId
                      ? {
                          value: filters.administradorId,
                          label: administradores.find((a) => a.id.toString() === filters.administradorId)?.nombre || '',
                        }
                      : { value: '', label: 'Todos los administradores' }
                  }
                  onChange={(opt) => handleFilterChange('administradorId', opt?.value || '')}
                  placeholder="Seleccionar administrador..."
                  isClearable
                  styles={customSelectStylesSmall}
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label small fw-semibold text-muted mb-1" style={{ fontSize: '11px' }}>
                  Estado
                </label>
                <Select
                  options={[
                    { value: '', label: 'Todos los estados' },
                    ...estados.map((e) => ({ value: e.id.toString(), label: e.nombre })),
                  ]}
                  value={
                    filters.estadoId
                      ? {
                          value: filters.estadoId,
                          label: estados.find((e) => e.id.toString() === filters.estadoId)?.nombre || '',
                        }
                      : { value: '', label: 'Todos los estados' }
                  }
                  onChange={(opt) => handleFilterChange('estadoId', opt?.value || '')}
                  placeholder="Seleccionar estado..."
                  isClearable
                  styles={customSelectStylesSmall}
                />
              </div>

              <div className="col-12 col-md-1 d-flex align-items-end">
                <button
                  type="button"
                  className="btn btn-sm btn-light border w-100"
                  onClick={() => setShowAdvancedFilters(false)}
                  style={{ fontSize: '12px' }}
                >
                  <i className="fa-solid fa-chevron-up"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {errors && (
        <div className="alert alert-danger alert-dismissible fade show py-1 px-3 mb-2" role="alert" style={{ flexShrink: 0, fontSize: '12.5px' }}>
          <i className="fa-solid fa-triangle-exclamation me-2"></i>
          {errors}
          <button type="button" className="btn-close btn-sm p-2" onClick={() => setErrors('')}></button>
        </div>
      )}

      {/* Contenedor del Mapa (Flex-grow, 100% alto restante) */}
      <div
        className="card border shadow-sm flex-grow-1 position-relative overflow-hidden"
        style={{ minHeight: 0, height: '100%' }}
      >
        {/* Botón de Control Flotante para Centrar Lima */}
        <div className="position-absolute" style={{ top: '80px', left: '10px', zIndex: 1000 }}>
          <button
            type="button"
            className="btn btn-sm bg-white border shadow-sm px-2 py-1 text-dark"
            onClick={handleResetLima}
            title="Centrar vista en Lima Metropolitana"
            style={{ fontSize: '13px', width: '34px', height: '34px' }}
          >
            <i className="fa-solid fa-location-crosshairs text-danger"></i>
          </button>
        </div>

        {/* Leyenda de Gradiente Flotante Compacta */}
        <div
          className="card position-absolute border shadow-sm"
          style={{
            bottom: '16px',
            right: '16px',
            zIndex: 1000,
            maxWidth: '240px',
            backgroundColor: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(6px)',
            borderRadius: '6px',
          }}
        >
          <div className="card-body p-2 px-3">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="fw-bold text-dark" style={{ fontSize: '11px' }}>
                <i className="fa-solid fa-fire text-danger me-1"></i>
                Densidad Térmica
              </span>
              <span className="badge bg-secondary-subtle text-dark border px-1" style={{ fontSize: '10px' }}>
                {(maxDensity * 100).toFixed(0)}% máx
              </span>
            </div>
            <div
              style={{
                height: '8px',
                background: 'linear-gradient(to right, #3b82f6, #06b6d4, #10b981, #f59e0b, #ef4444)',
                borderRadius: '3px',
                marginBottom: '3px',
              }}
            ></div>
            <div className="d-flex justify-content-between text-muted" style={{ fontSize: '9.5px' }}>
              <span>Baja</span>
              <span>Media</span>
              <span>Alta concentración</span>
            </div>
          </div>
        </div>

        {/* Tarjeta de Estado Vacío (Cuando no hay eventos para el período) */}
        {!loadingData && incidents.length === 0 && (
          <div
            className="position-absolute top-50 start-50 translate-middle"
            style={{ zIndex: 1001, maxWidth: '380px', width: 'calc(100% - 30px)' }}
          >
            <div className="card border shadow-lg text-center p-4 bg-white rounded-3">
              <div
                className="bg-light rounded-circle mx-auto d-flex align-items-center justify-content-center mb-3"
                style={{ width: '56px', height: '56px' }}
              >
                <i className="fa-solid fa-magnifying-glass-location text-muted fs-4"></i>
              </div>
              <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '14px' }}>
                No se encontraron eventos
              </h6>
              <p className="text-muted small mb-3" style={{ fontSize: '12px' }}>
                No hay incidencias georreferenciadas registradas para{' '}
                <strong>
                  {filters.month ? months.find((m) => m.value === filters.month)?.label : 'Todo el año'} /{' '}
                  {filters.year || 'Todos'}
                </strong>{' '}
                con los filtros seleccionados.
              </p>
              <div className="d-flex justify-content-center gap-2">
                {filters.month && (
                  <button
                    type="button"
                    className="btn btn-sm btn-primary fw-semibold"
                    onClick={() => handleFilterChange('month', '')}
                    style={{ fontSize: '12px' }}
                  >
                    <i className="fa-solid fa-calendar-days me-1"></i>
                    Ver todo el año {filters.year}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={clearFilters}
                  style={{ fontSize: '12px' }}
                >
                  <i className="fa-solid fa-rotate-left me-1"></i>
                  Restablecer filtros
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loadingData && (
          <div className="position-absolute top-50 start-50 translate-middle" style={{ zIndex: 1001 }}>
            <div className="card border-0 shadow-lg p-3 text-center bg-white rounded-3">
              <div className="spinner-border text-danger mb-2 mx-auto" role="status">
                <span className="visually-hidden">Generando mapa térmico...</span>
              </div>
              <div className="fw-semibold text-dark" style={{ fontSize: '13px' }}>
                Procesando eventos térmicos de Lima...
              </div>
            </div>
          </div>
        )}

        {/* Mapa Leaflet */}
        <div className="card-body p-0" style={{ height: '100%', width: '100%' }}>
          <div
            style={{
              height: '100%',
              width: '100%',
              opacity: loadingData ? 0.5 : 1,
              transition: 'opacity 0.3s',
            }}
          >
            <MapContainer
              center={LIMA_CENTER}
              zoom={12}
              minZoom={10}
              maxZoom={18}
              maxBounds={LIMA_BOUNDS}
              style={{ height: '100%', width: '100%' }}
              ref={mapInstanceRef}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapResizer />
              <FitBounds incidents={incidents} />

              {heatmapPoints.length > 0 && (
                <HeatmapLayer
                  points={heatmapPoints}
                  options={{
                    radius: 24,
                    blur: 18,
                    maxZoom: 16,
                    max: 1.0,
                    minOpacity: 0.28,
                    gradient: {
                      0.2: '#3b82f6', // azul suave
                      0.4: '#06b6d4', // cian
                      0.6: '#10b981', // verde
                      0.8: '#f59e0b', // ámbar
                      1.0: '#ef4444', // rojo
                    },
                  }}
                />
              )}
            </MapContainer>
          </div>
        </div>
      </div>

      {/* Métricas Inferiores Compactas */}
      <div className="row g-2 mt-2" style={{ flexShrink: 0 }}>
        <div className="col-6 col-md-3">
          <div className="card card-widget mb-0 h-100 border shadow-sm">
            <div className="card-body p-2 px-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <div className="widget-subheading text-uppercase text-muted fw-bold" style={{ fontSize: '10px' }}>
                  INCIDENCIAS GEORREFERENCIADAS
                </div>
                <div className="widget-icon-box text-danger" style={{ width: '28px', height: '28px' }}>
                  <i className="fa-solid fa-location-dot"></i>
                </div>
              </div>
              <div className="widget-numbers text-danger fw-bold" style={{ fontSize: '18px' }}>
                {incidents.length}
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card card-widget mb-0 h-100 border shadow-sm">
            <div className="card-body p-2 px-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <div className="widget-subheading text-uppercase text-muted fw-bold" style={{ fontSize: '10px' }}>
                  PERÍODO ACTIVO
                </div>
                <div className="widget-icon-box text-success" style={{ width: '28px', height: '28px' }}>
                  <i className="fa-solid fa-calendar"></i>
                </div>
              </div>
              <div className="widget-numbers text-success fw-bold" style={{ fontSize: '15px' }}>
                {filters.month ? months.find((m) => m.value === filters.month)?.label : 'Todo el año'} / {filters.year || 'Todos'}
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card card-widget mb-0 h-100 border shadow-sm">
            <div className="card-body p-2 px-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <div className="widget-subheading text-uppercase text-muted fw-bold" style={{ fontSize: '10px' }}>
                  TIPOS DIFERENTES
                </div>
                <div className="widget-icon-box text-warning" style={{ width: '28px', height: '28px' }}>
                  <i className="fa-solid fa-layer-group"></i>
                </div>
              </div>
              <div className="widget-numbers text-warning fw-bold" style={{ fontSize: '18px' }}>
                {new Set(incidents.map((i) => i.incidenciaId)).size}
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card card-widget mb-0 h-100 border shadow-sm">
            <div className="card-body p-2 px-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <div className="widget-subheading text-uppercase text-muted fw-bold" style={{ fontSize: '10px' }}>
                  DENSIDAD MÁXIMA
                </div>
                <div className="widget-icon-box text-primary" style={{ width: '28px', height: '28px' }}>
                  <i className="fa-solid fa-fire"></i>
                </div>
              </div>
              <div className="widget-numbers text-primary fw-bold" style={{ fontSize: '18px' }}>
                {(maxDensity * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MapaCalor;
