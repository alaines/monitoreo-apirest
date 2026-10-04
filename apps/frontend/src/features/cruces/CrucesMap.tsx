import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import Select from 'react-select';
import { customSelectStylesSmall } from '../../styles/react-select-custom';
import { crucesService, Cruce } from '../../services/cruces.service';
import { tiposService, Tipo } from '../../services/tipos.service';
import { administradoresService, Administrador } from '../../services/administradores.service';
import { CruceDetail } from './CruceDetail';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import L from 'leaflet';
import { setupLeafletIcons } from '../../utils/leaflet-setup';

setupLeafletIcons();

// Asegurar compatibilidad de window.L para Leaflet MarkerCluster
if (typeof window !== 'undefined') {
  (window as any).L = L;
}

// Colores institucionales por administrador
const ADMIN_COLORS: { [key: number]: string } = {
  1: '#dc3545', // ATU - Rojo
  2: '#0d6efd', // DISTRITAL - Azul
  3: '#198754', // EMAPE - Verde
  4: '#ffc107', // GMU - CENTRALIZADO - Amarillo
  5: '#6f42c1', // GMU - NO CENTRALIZADO - Púrpura
  6: '#fd7e14', // LINEA AMARILLA - LAMSAC - Naranja
  7: '#20c997', // Teal
  8: '#d63384', // Rosa
};

const DEFAULT_ADMIN_COLOR = '#6c757d';

// Crear icono para marcador individual de intersección
const getTrafficLightIcon = (administradorId?: number | null, zoom: number = 13) => {
  const color = administradorId ? (ADMIN_COLORS[administradorId] || DEFAULT_ADMIN_COLOR) : DEFAULT_ADMIN_COLOR;
  const scale = Math.max(0.5, Math.min(1.1, (zoom - 8) / 8));
  const size = Math.round(28 * scale);
  const fontSize = Math.round(12 * scale);
  const borderWidth = Math.max(2, Math.round(2.5 * scale));

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: ${borderWidth}px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.35);
        cursor: pointer;
      ">
        <div style="
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(45deg);
          color: white;
          font-size: ${fontSize}px;
        ">
          <i class="fa-solid fa-traffic-light"></i>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

// Componente para forzar redimensionamiento del mapa
function MapResizer() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer().parentElement;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize({ animate: false });
    });

    resizeObserver.observe(container);
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      resizeObserver.disconnect();
    };
  }, [map]);

  return null;
}

// Componente para rastrear cambios de zoom
function ZoomTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMap();

  useEffect(() => {
    const handleZoom = () => {
      onZoomChange(map.getZoom());
    };

    map.on('zoomend', handleZoom);
    handleZoom();

    return () => {
      map.off('zoomend', handleZoom);
    };
  }, [map, onZoomChange]);

  return null;
}

// Botón de control flotante para centrar el mapa en Lima
function MapControls({ onResetView, useClustering, onToggleClustering }: {
  onResetView: () => void;
  useClustering: boolean;
  onToggleClustering: () => void;
}) {
  return (
    <div
      className="position-absolute d-flex flex-column gap-1"
      style={{ top: '80px', left: '10px', zIndex: 1000 }}
    >
      <button
        type="button"
        className="btn btn-sm btn-white bg-white border shadow-sm px-2 py-1 text-dark"
        onClick={onResetView}
        title="Centrar vista en Lima Metropolitana"
        style={{ fontSize: '13px', width: '34px', height: '34px' }}
      >
        <i className="fa-solid fa-location-crosshairs text-primary"></i>
      </button>
      <button
        type="button"
        className={`btn btn-sm border shadow-sm px-2 py-1 ${useClustering ? 'btn-primary text-white' : 'btn-white bg-white text-muted'}`}
        onClick={onToggleClustering}
        title={useClustering ? 'Desactivar agrupación (Ver todos los pines)' : 'Activar agrupación inteligente (Recomendado)'}
        style={{ fontSize: '13px', width: '34px', height: '34px' }}
      >
        <i className="fa-solid fa-circle-nodes"></i>
      </button>
    </div>
  );
}

// Capa de Clustering usando Leaflet.markercluster
interface CrucesClusterLayerProps {
  cruces: Cruce[];
  currentZoom: number;
  getTipoNombre: (id: number | undefined | null) => string;
  onSelectCruce: (cruce: Cruce) => void;
  onOpenDetailModal: (id: number) => void;
}

function CrucesClusterLayer({
  cruces,
  currentZoom,
  getTipoNombre,
  onSelectCruce,
  onOpenDetailModal,
}: CrucesClusterLayerProps) {
  const map = useMap();
  const clusterGroupRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;

    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
    }

    const clusterGroup = (L as any).markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 45,
      spiderfyOnMaxZoom: true,
      zoomToBoundsOnClick: true,
      chunkedLoading: true,
      chunkInterval: 50,
      chunkDelay: 20,
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        let sizeClass = 'cluster-cruces-small';
        let size = 36;

        if (count >= 100) {
          sizeClass = 'cluster-cruces-large';
          size = 46;
        } else if (count >= 25) {
          sizeClass = 'cluster-cruces-medium';
          size = 40;
        }

        return L.divIcon({
          html: `
            <div class="cluster-bubble ${sizeClass}">
              <div class="cluster-center">
                ${count}
              </div>
            </div>
          `,
          className: 'leaflet-cluster-custom',
          iconSize: L.point(size, size),
        });
      },
    });

    cruces.forEach((cruce) => {
      const lat = Number(cruce.latitud);
      const lng = Number(cruce.longitud);
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

      const marker = L.marker([lat, lng], {
        icon: getTrafficLightIcon(cruce.administradorId, currentZoom),
      });

      // Crear Popup DOM para evitar pérdida de eventos
      const popupDiv = document.createElement('div');
      popupDiv.style.minWidth = '240px';
      popupDiv.style.fontSize = '12.5px';

      const adminColor = cruce.administradorId ? (ADMIN_COLORS[cruce.administradorId] || DEFAULT_ADMIN_COLOR) : DEFAULT_ADMIN_COLOR;
      const adminNombre = cruce.administrador?.nombre || 'N/A';

      popupDiv.innerHTML = `
        <div class="p-1">
          <div class="d-flex align-items-center justify-content-between mb-1 pb-1 border-bottom">
            <span class="badge bg-secondary-subtle text-dark border fw-bold" style="font-size: 11px;">
              ${cruce.codigo || 'SIN CÓDIGO'}
            </span>
            <span class="badge" style="background-color: ${adminColor}; font-size: 10px; color: white;">
              ${adminNombre}
            </span>
          </div>
          <h6 class="fw-bold text-dark mb-2" style="font-size: 13.5px; line-height: 1.3;">
            ${cruce.nombre || 'Intersección sin nombre'}
          </h6>
          <div class="text-muted small mb-2">
            <div><i class="fa-solid fa-location-dot text-danger me-1"></i><strong>Distrito:</strong> ${cruce.ubigeo?.distrito || 'N/A'}</div>
            <div><i class="fa-solid fa-network-wired text-primary me-1"></i><strong>Gestión:</strong> ${getTipoNombre(cruce.tipoGestion)}</div>
            <div><i class="fa-solid fa-satellite-dish text-info me-1"></i><strong>Comunicación:</strong> ${getTipoNombre(cruce.tipoComunicacion)}</div>
          </div>
          <button type="button" class="btn btn-sm btn-primary w-100 fw-semibold py-1 btn-ver-detalle" style="font-size: 12px;">
            <i class="fa-solid fa-eye me-1"></i> Ver Ficha Completa
          </button>
        </div>
      `;

      const btnDetalle = popupDiv.querySelector('.btn-ver-detalle');
      if (btnDetalle) {
        btnDetalle.addEventListener('click', (e) => {
          e.stopPropagation();
          onOpenDetailModal(cruce.id);
        });
      }

      marker.bindPopup(popupDiv, {
        maxWidth: 320,
        className: 'leaflet-bootstrap-popup',
      });

      marker.on('click', () => {
        onSelectCruce(cruce);
      });

      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;

    return () => {
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
      }
    };
  }, [map, cruces, currentZoom, getTipoNombre, onSelectCruce, onOpenDetailModal]);

  return null;
}

export function CrucesMap() {
  const [cruces, setCruces] = useState<Cruce[]>([]);
  const [filteredCruces, setFilteredCruces] = useState<Cruce[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [tipos, setTipos] = useState<Tipo[]>([]);
  const [administradores, setAdministradores] = useState<Administrador[]>([]);
  const [currentZoom, setCurrentZoom] = useState(12);

  // Estados visuales y de interacción
  const [useClustering, setUseClustering] = useState(true);
  const [legendOpen, setLegendOpen] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedCruceCard, setSelectedCruceCard] = useState<Cruce | null>(null);

  // Estado para el modal de detalle
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCruceId, setSelectedCruceId] = useState<number | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrito, setSelectedDistrito] = useState<string | null>(null);
  const [selectedAdministrador, setSelectedAdministrador] = useState<number | null>(null);
  const [selectedTipoGestion, setSelectedTipoGestion] = useState<number | null>(null);
  const [selectedTipoComunicacion, setSelectedTipoComunicacion] = useState<number | null>(null);

  // Centro del mapa (Lima, Perú)
  const mapCenter: [number, number] = [-12.0464, -77.0428];
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [crucesData, tiposData, adminsData] = await Promise.all([
        crucesService.getCrucesMapa(),
        tiposService.getTipos(),
        administradoresService.getAdministradores(),
      ]);

      const rawList = Array.isArray(crucesData) ? crucesData : crucesData.data || [];

      // Filtrar solo cruces con coordenadas válidas
      const crucesConCoordenadas = rawList.filter(
        (cruce: Cruce) => cruce.latitud !== null && cruce.longitud !== null && !isNaN(Number(cruce.latitud)) && !isNaN(Number(cruce.longitud)),
      );

      setCruces(crucesConCoordenadas);
      setFilteredCruces(crucesConCoordenadas);
      setTipos(tiposData);
      setAdministradores(adminsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  // Lista única de distritos disponibles
  const distritosList = useMemo(() => {
    const set = new Set<string>();
    cruces.forEach((c) => {
      if (c.ubigeo?.distrito) {
        set.add(c.ubigeo.distrito.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [cruces]);

  // Conteo de intersecciones por administrador en el dataset filtrado
  const adminCounts = useMemo(() => {
    const counts: { [key: number]: number } = {};
    filteredCruces.forEach((c) => {
      if (c.administradorId) {
        counts[c.administradorId] = (counts[c.administradorId] || 0) + 1;
      }
    });
    return counts;
  }, [filteredCruces]);

  // Filtrado reactivo
  useEffect(() => {
    let filtered = cruces;

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.codigo?.toLowerCase().includes(query) ||
          c.nombre?.toLowerCase().includes(query) ||
          c.ubigeo?.distrito?.toLowerCase().includes(query),
      );
    }

    if (selectedDistrito) {
      filtered = filtered.filter((c) => c.ubigeo?.distrito?.trim() === selectedDistrito);
    }

    if (selectedAdministrador) {
      filtered = filtered.filter((c) => c.administradorId === selectedAdministrador);
    }

    if (selectedTipoGestion) {
      filtered = filtered.filter((c) => c.tipoGestion === selectedTipoGestion);
    }

    if (selectedTipoComunicacion) {
      filtered = filtered.filter((c) => c.tipoComunicacion === selectedTipoComunicacion);
    }

    setFilteredCruces(filtered);
  }, [searchTerm, selectedDistrito, selectedAdministrador, selectedTipoGestion, selectedTipoComunicacion, cruces]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDistrito(null);
    setSelectedAdministrador(null);
    setSelectedTipoGestion(null);
    setSelectedTipoComunicacion(null);
  };

  const hasActiveFilters = Boolean(
    searchTerm || selectedDistrito || selectedAdministrador || selectedTipoGestion || selectedTipoComunicacion,
  );

  const getTipoNombre = useCallback((id: number | undefined | null) => {
    if (!id) return 'N/A';
    const tipo = tipos.find((t) => t.id === id);
    return tipo?.name || 'N/A';
  }, [tipos]);

  // Tipos para filtros avanzados
  const tiposGestion = tipos.filter((t) => t.parent_id === 4);
  const tiposComunicacion = tipos.filter((t) => t.parent_id === 9);

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(mapCenter, 12, { animate: true });
    }
  };

  const handleOpenDetail = (id: number) => {
    setSelectedCruceId(id);
    setDetailModalOpen(true);
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
                className="bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: '36px', height: '36px' }}
              >
                <i className="fa-solid fa-map-location-dot fs-5"></i>
              </div>
              <div>
                <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '14px' }}>
                  Mapa de Intersecciones
                </h6>
                <div className="d-flex align-items-center gap-1">
                  <span className="badge bg-primary px-2 py-0" style={{ fontSize: '11px' }}>
                    {filteredCruces.length}
                  </span>
                  <span className="text-muted" style={{ fontSize: '11px' }}>
                    de {cruces.length} en red
                  </span>
                </div>
              </div>
            </div>

            {/* Buscador Rápido */}
            <div className="col-12 col-sm-6 col-md-4 col-lg-3">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0">
                  <i className="fa-solid fa-magnifying-glass text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control form-control-sm border-start-0 ps-0"
                  placeholder="Código, avenida o distrito..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ fontSize: '12.5px' }}
                />
                {searchTerm && (
                  <button
                    className="btn btn-sm btn-outline-secondary border"
                    type="button"
                    onClick={() => setSearchTerm('')}
                    title="Limpiar búsqueda"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>
            </div>

            {/* Selector de Distrito */}
            <div className="col-6 col-sm-3 col-md-3 col-lg-2">
              <Select
                options={[
                  { value: null, label: 'Todos los distritos' },
                  ...distritosList.map((d) => ({ value: d, label: d })),
                ]}
                value={selectedDistrito ? { value: selectedDistrito, label: selectedDistrito } : null}
                onChange={(opt) => setSelectedDistrito(opt?.value || null)}
                placeholder="Distrito..."
                isClearable
                styles={customSelectStylesSmall}
              />
            </div>

            {/* Selector de Administrador */}
            <div className="col-6 col-sm-3 col-md-3 col-lg-2">
              <Select
                options={[
                  { value: null, label: 'Todos los administradores' },
                  ...administradores.map((a) => ({ value: a.id, label: a.nombre })),
                ]}
                value={
                  selectedAdministrador
                    ? {
                        value: selectedAdministrador,
                        label: administradores.find((a) => a.id === selectedAdministrador)?.nombre || '',
                      }
                    : null
                }
                onChange={(opt) => setSelectedAdministrador(opt?.value || null)}
                placeholder="Administrador..."
                isClearable
                styles={customSelectStylesSmall}
              />
            </div>

            {/* Botones de Control y Filtros Avanzados */}
            <div className="col-12 col-lg d-flex justify-content-end align-items-center gap-1 mt-2 mt-lg-0">
              <button
                type="button"
                className={`btn btn-sm ${showAdvancedFilters ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                title="Filtros avanzados de gestión y comunicación"
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
              <div className="col-12 col-md-5">
                <label className="form-label small fw-semibold text-muted mb-1" style={{ fontSize: '11px' }}>
                  Tipo de Gestión
                </label>
                <Select
                  options={[
                    { value: null, label: 'Todos los tipos de gestión' },
                    ...tiposGestion.map((t) => ({ value: t.id, label: t.name })),
                  ]}
                  value={
                    selectedTipoGestion
                      ? {
                          value: selectedTipoGestion,
                          label: tiposGestion.find((t) => t.id === selectedTipoGestion)?.name || '',
                        }
                      : null
                  }
                  onChange={(opt) => setSelectedTipoGestion(opt?.value || null)}
                  placeholder="Seleccionar tipo de gestión..."
                  isClearable
                  styles={customSelectStylesSmall}
                />
              </div>

              <div className="col-12 col-md-5">
                <label className="form-label small fw-semibold text-muted mb-1" style={{ fontSize: '11px' }}>
                  Tipo de Comunicación
                </label>
                <Select
                  options={[
                    { value: null, label: 'Todos los tipos de comunicación' },
                    ...tiposComunicacion.map((t) => ({ value: t.id, label: t.name })),
                  ]}
                  value={
                    selectedTipoComunicacion
                      ? {
                          value: selectedTipoComunicacion,
                          label: tiposComunicacion.find((t) => t.id === selectedTipoComunicacion)?.name || '',
                        }
                      : null
                  }
                  onChange={(opt) => setSelectedTipoComunicacion(opt?.value || null)}
                  placeholder="Seleccionar comunicación..."
                  isClearable
                  styles={customSelectStylesSmall}
                />
              </div>

              <div className="col-12 col-md-2 d-flex align-items-end">
                <button
                  type="button"
                  className="btn btn-sm btn-light border w-100"
                  onClick={() => setShowAdvancedFilters(false)}
                  style={{ fontSize: '12px' }}
                >
                  <i className="fa-solid fa-chevron-up me-1"></i>
                  Ocultar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contenedor del Mapa (Flex-grow, 100% alto disponible) */}
      <div
        className="card border shadow-sm flex-grow-1 position-relative overflow-hidden"
        style={{ minHeight: 0, height: '100%' }}
      >
        {/* Controles de Mapa Flotantes */}
        <MapControls
          onResetView={handleResetView}
          useClustering={useClustering}
          onToggleClustering={() => setUseClustering(!useClustering)}
        />

        {/* Leyenda de Administradores Flotante y Colapsable */}
        <div
          className="card position-absolute border shadow-sm"
          style={{
            top: '12px',
            right: '12px',
            zIndex: 1000,
            width: legendOpen ? '230px' : 'auto',
            backgroundColor: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(6px)',
            transition: 'width 0.2s ease',
          }}
        >
          <div
            className="card-header bg-primary text-white py-1 px-2 d-flex justify-content-between align-items-center"
            style={{ cursor: 'pointer' }}
            onClick={() => setLegendOpen(!legendOpen)}
            title={legendOpen ? 'Minimizar leyenda' : 'Expandir leyenda de administradores'}
          >
            <div className="d-flex align-items-center gap-1">
              <i className="fa-solid fa-palette" style={{ fontSize: '11px' }}></i>
              <span className="fw-semibold" style={{ fontSize: '12px' }}>
                {legendOpen ? 'Administradores' : ''}
              </span>
            </div>
            <button
              type="button"
              className="btn btn-link text-white p-0 shadow-none text-decoration-none"
              style={{ fontSize: '11px' }}
            >
              <i className={`fa-solid ${legendOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
            </button>
          </div>

          {legendOpen && (
            <div className="card-body p-2" style={{ maxHeight: '230px', overflowY: 'auto' }}>
              {loadingData ? (
                <div className="placeholder-glow">
                  <span className="placeholder col-12 mb-1"></span>
                  <span className="placeholder col-10 mb-1"></span>
                  <span className="placeholder col-11"></span>
                </div>
              ) : (
                <div className="d-flex flex-column gap-1">
                  {administradores.map((admin) => {
                    const color = ADMIN_COLORS[admin.id] || DEFAULT_ADMIN_COLOR;
                    const count = adminCounts[admin.id] || 0;
                    const isSelected = selectedAdministrador === admin.id;

                    return (
                      <div
                        key={admin.id}
                        className={`d-flex align-items-center justify-content-between px-2 py-1 rounded ${isSelected ? 'bg-primary-subtle border border-primary' : 'hover-bg-light'}`}
                        style={{ cursor: 'pointer', fontSize: '11.5px', transition: 'background-color 0.15s' }}
                        onClick={() => {
                          setSelectedAdministrador(isSelected ? null : admin.id);
                        }}
                        title={isSelected ? 'Quitar filtro de este administrador' : `Filtrar solo ${admin.nombre}`}
                      >
                        <div className="d-flex align-items-center gap-2 text-truncate me-1">
                          <span
                            style={{
                              width: '12px',
                              height: '12px',
                              backgroundColor: color,
                              borderRadius: '50%',
                              flexShrink: 0,
                              border: '1.5px solid white',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                            }}
                          ></span>
                          <span className="text-truncate fw-medium text-dark">{admin.nombre}</span>
                        </div>
                        <span className="badge bg-secondary-subtle text-dark border px-1" style={{ fontSize: '10px' }}>
                          {count}
                        </span>
                      </div>
                    );
                  })}
                  {selectedAdministrador && (
                    <button
                      type="button"
                      className="btn btn-xs btn-link text-danger p-0 mt-1 text-decoration-none text-start"
                      onClick={() => setSelectedAdministrador(null)}
                      style={{ fontSize: '11px' }}
                    >
                      <i className="fa-solid fa-xmark me-1"></i>
                      Ver todos
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tarjeta Flotante de Detalle Rápido (Quick Info Card) */}
        {selectedCruceCard && (
          <div
            className="card position-absolute border shadow"
            style={{
              bottom: '24px',
              left: '12px',
              zIndex: 1000,
              maxWidth: '340px',
              width: 'calc(100% - 24px)',
              backgroundColor: 'rgba(255, 255, 255, 0.97)',
              backdropFilter: 'blur(6px)',
              borderRadius: '8px',
            }}
          >
            <div className="card-header bg-white border-bottom py-1 px-3 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-1">
                <span className="badge bg-primary fw-bold" style={{ fontSize: '11px' }}>
                  {selectedCruceCard.codigo || 'SIN CÓDIGO'}
                </span>
                <span
                  className="badge text-white"
                  style={{
                    backgroundColor: selectedCruceCard.administradorId
                      ? ADMIN_COLORS[selectedCruceCard.administradorId] || DEFAULT_ADMIN_COLOR
                      : DEFAULT_ADMIN_COLOR,
                    fontSize: '10px',
                  }}
                >
                  {selectedCruceCard.administrador?.nombre || 'N/A'}
                </span>
              </div>
              <button
                type="button"
                className="btn-close"
                style={{ fontSize: '10px' }}
                onClick={() => setSelectedCruceCard(null)}
                aria-label="Cerrar detalle"
              ></button>
            </div>
            <div className="card-body p-3">
              <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '13.5px' }}>
                {selectedCruceCard.nombre || 'Intersección sin nombre'}
              </h6>
              <div className="text-muted small mb-2" style={{ fontSize: '12px' }}>
                <div>
                  <i className="fa-solid fa-location-dot text-danger me-1"></i>
                  <strong>Distrito:</strong> {selectedCruceCard.ubigeo?.distrito || 'N/A'}
                </div>
                <div>
                  <i className="fa-solid fa-network-wired text-primary me-1"></i>
                  <strong>Gestión:</strong> {getTipoNombre(selectedCruceCard.tipoGestion)}
                </div>
                <div>
                  <i className="fa-solid fa-satellite-dish text-info me-1"></i>
                  <strong>Comunicación:</strong> {getTipoNombre(selectedCruceCard.tipoComunicacion)}
                </div>
              </div>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-primary w-100 fw-semibold"
                  onClick={() => handleOpenDetail(selectedCruceCard.id)}
                  style={{ fontSize: '12px' }}
                >
                  <i className="fa-solid fa-eye me-1"></i>
                  Ficha Completa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contenedor del Mapa Leaflet */}
        <div className="card-body p-0 position-relative" style={{ height: '100%', width: '100%' }}>
          {loadingData && (
            <div className="position-absolute top-50 start-50 translate-middle" style={{ zIndex: 1001 }}>
              <div className="card border-0 shadow-lg p-3 text-center bg-white rounded-3">
                <div className="spinner-border text-primary mb-2 mx-auto" role="status">
                  <span className="visually-hidden">Cargando intersecciones...</span>
                </div>
                <div className="fw-semibold text-dark" style={{ fontSize: '13px' }}>
                  Cargando red de intersecciones...
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              height: '100%',
              width: '100%',
              opacity: loadingData ? 0.5 : 1,
              transition: 'opacity 0.3s',
            }}
          >
            <MapContainer
              center={mapCenter}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
              ref={mapInstanceRef}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <MapResizer />
              <ZoomTracker onZoomChange={setCurrentZoom} />

              {!loadingData && useClustering && (
                <CrucesClusterLayer
                  cruces={filteredCruces}
                  currentZoom={currentZoom}
                  getTipoNombre={getTipoNombre}
                  onSelectCruce={setSelectedCruceCard}
                  onOpenDetailModal={handleOpenDetail}
                />
              )}

              {!loadingData && !useClustering &&
                filteredCruces.map((cruce) => {
                  const lat = Number(cruce.latitud);
                  const lng = Number(cruce.longitud);
                  if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;

                  return (
                    <Marker
                      key={cruce.id}
                      position={[lat, lng]}
                      icon={getTrafficLightIcon(cruce.administradorId, currentZoom)}
                      eventHandlers={{
                        click: () => setSelectedCruceCard(cruce),
                      }}
                    >
                      <Popup maxWidth={300} className="leaflet-bootstrap-popup">
                        <div style={{ minWidth: '220px', fontSize: '12.5px', padding: '4px' }}>
                          <h6 className="mb-2 fw-bold text-primary" style={{ fontSize: '13.5px' }}>
                            <i className="fa-solid fa-traffic-light me-1"></i>
                            {cruce.nombre || 'Sin nombre'}
                          </h6>
                          <div className="text-muted small mb-2">
                            <div><strong>Código:</strong> {cruce.codigo || 'N/A'}</div>
                            <div><strong>Distrito:</strong> {cruce.ubigeo?.distrito || 'N/A'}</div>
                            <div><strong>Administrador:</strong> {cruce.administrador?.nombre || 'N/A'}</div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-primary w-100"
                            onClick={() => handleOpenDetail(cruce.id)}
                            style={{ fontSize: '11.5px' }}
                          >
                            <i className="fa-solid fa-eye me-1"></i> Ver Ficha
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
            </MapContainer>
          </div>
        </div>
      </div>

      {/* Modal para visualizar detalle completo */}
      {detailModalOpen && selectedCruceId && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white py-2 px-3">
                <h5 className="modal-title fs-6 fw-bold">
                  <i className="fa-solid fa-eye me-2"></i>
                  Ficha Técnica de la Intersección
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setDetailModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body p-3">
                <CruceDetail
                  cruceId={selectedCruceId}
                  onClose={() => setDetailModalOpen(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default CrucesMap;
