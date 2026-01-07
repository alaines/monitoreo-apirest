import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { crucesService, Cruce } from '../../services/cruces.service';
import { tiposService, Tipo } from '../../services/tipos.service';
import { administradoresService, Administrador } from '../../services/administradores.service';
import { CruceDetail } from './CruceDetail';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix para iconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Función para obtener icono personalizado por administrador con escalado por zoom
const getTrafficLightIcon = (administradorId?: number | null, zoom: number = 13) => {
  // Colores diferenciados por administrador
  const colors: { [key: number]: string } = {
    1: '#dc3545',  // Rojo
    2: '#0d6efd',  // Azul
    3: '#198754',  // Verde
    4: '#ffc107',  // Amarillo
    5: '#6f42c1',  // Púrpura
    6: '#fd7e14',  // Naranja
    7: '#20c997',  // Teal
    8: '#d63384',  // Rosa
  };
  
  const color = administradorId ? (colors[administradorId] || '#6c757d') : '#6c757d'; // Gris por defecto
  
  // Escalar el tamaño del icono basado en el zoom
  // zoom < 10: iconos pequeños, zoom > 15: iconos grandes
  const scale = Math.max(0.4, Math.min(1.2, (zoom - 8) / 8));
  const size = Math.round(32 * scale);
  const fontSize = Math.round(14 * scale);
  const borderWidth = Math.max(2, Math.round(3 * scale));
  
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
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
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
          <i class="fas fa-traffic-light"></i>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size]
  });
};

// Componente para rastrear cambios de zoom
function ZoomTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMap();
  
  useEffect(() => {
    const handleZoom = () => {
      onZoomChange(map.getZoom());
    };
    
    map.on('zoomend', handleZoom);
    handleZoom(); // Establecer zoom inicial
    
    return () => {
      map.off('zoomend', handleZoom);
    };
  }, [map, onZoomChange]);

  return null;
}

export function CrucesMap() {
  const [cruces, setCruces] = useState<Cruce[]>([]);
  const [filteredCruces, setFilteredCruces] = useState<Cruce[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [tipos, setTipos] = useState<Tipo[]>([]);
  const [administradores, setAdministradores] = useState<Administrador[]>([]);
  const [currentZoom, setCurrentZoom] = useState(13);
  
  // Estado para el modal de detalle
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCruceId, setSelectedCruceId] = useState<number | null>(null);
  
  // Mostrar/ocultar filtros
  const [showFilters, setShowFilters] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTipoGestion, setSelectedTipoGestion] = useState<number | null>(null);
  const [selectedTipoComunicacion, setSelectedTipoComunicacion] = useState<number | null>(null);
  const [selectedAdministrador, setSelectedAdministrador] = useState<number | null>(null);
  
  // Centro del mapa (Lima, Perú)
  const [mapCenter] = useState<[number, number]>([-12.0464, -77.0428]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedTipoGestion, selectedTipoComunicacion, selectedAdministrador, cruces]);

  const loadData = async () => {
    try {
      const [crucesData, tiposData, adminsData] = await Promise.all([
        crucesService.getCruces({ limit: 10000 }),
        tiposService.getTipos(),
        administradoresService.getAdministradores()
      ]);
      
      console.log('Datos cargados:', {
        cruces: crucesData,
        tipos: tiposData,
        administradores: adminsData
      });
      
      // Filtrar solo cruces con coordenadas
      const crucesConCoordenadas = crucesData.data.filter(
        (cruce: Cruce) => cruce.latitud !== null && cruce.longitud !== null
      );
      
      setCruces(crucesConCoordenadas);
      setFilteredCruces(crucesConCoordenadas);
      setTipos(tiposData);
      setAdministradores(adminsData);
      
      console.log('Estados actualizados:', {
        cruces: crucesConCoordenadas.length,
        tipos: tiposData.length,
        administradores: adminsData.length
      });
    } catch (error) {
      console.error('Error loading data:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
      }
    } finally {
      setLoadingData(false);
    }
  };

  const applyFilters = () => {
    let filtered = cruces;

    // Filtro por búsqueda de texto
    if (searchTerm) {
      filtered = filtered.filter(cruce =>
        cruce.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cruce.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cruce.ubigeo?.distrito?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por tipo de gestión
    if (selectedTipoGestion) {
      filtered = filtered.filter(cruce => cruce.tipoGestion === selectedTipoGestion);
    }

    // Filtro por tipo de comunicación
    if (selectedTipoComunicacion) {
      filtered = filtered.filter(cruce => cruce.tipoComunicacion === selectedTipoComunicacion);
    }

    // Filtro por administrador
    if (selectedAdministrador) {
      filtered = filtered.filter(cruce => cruce.administradorId === selectedAdministrador);
    }

    setFilteredCruces(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTipoGestion(null);
    setSelectedTipoComunicacion(null);
    setSelectedAdministrador(null);
  };

  const getTipoNombre = (id: number | undefined | null) => {
    if (!id) return 'N/A';
    const tipo = tipos.find(t => t.id === id);
    return tipo?.name || 'N/A';
  };

  // Filtrar tipos por parent_id (categorías)
  const tiposGestion = tipos.filter(t => t.parent_id === 4); // GESTION
  const tiposComunicacion = tipos.filter(t => t.parent_id === 9); // COMUNICACION
  
  console.log('Tipos filtrados:', {
    todosLosTipos: tipos.length,
    tiposGestion: tiposGestion.length,
    tiposComunicacion: tiposComunicacion.length,
    administradores: administradores.length
  });

  return (
    <div className="container-fluid" style={{ padding: '20px', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="row mb-3" style={{ flexShrink: 0 }}>
        <div className="col">
          <h2 className="mb-0">
            <i className="fas fa-map-marked-alt me-2"></i>
            Mapa de Cruces
          </h2>
          {loadingData ? (
            <div className="placeholder-glow">
              <span className="placeholder col-4"></span>
            </div>
          ) : (
            <p className="text-muted mb-0">
              Visualización geográfica de {filteredCruces.length} cruce{filteredCruces.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Panel de Filtros */}
      <div className="card shadow-sm mb-3" style={{ flexShrink: 0 }}>
        <div className="card-header bg-white border-bottom">
          <button 
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <i className="fas fa-filter me-2"></i>
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </button>
        </div>
        {showFilters && (
          <div className="card-body">
            {loadingData ? (
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label fw-bold">
                    <i className="fas fa-search me-2"></i>
                    Búsqueda
                  </label>
                  <div className="placeholder-glow">
                    <span className="placeholder col-12 form-control"></span>
                  </div>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">
                    <i className="fas fa-cogs me-2"></i>
                    Tipo de Gestión
                  </label>
                  <div className="placeholder-glow">
                    <span className="placeholder col-12 form-control"></span>
                  </div>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">
                    <i className="fas fa-wifi me-2"></i>
                    Tipo de Comunicación
                  </label>
                  <div className="placeholder-glow">
                    <span className="placeholder col-12 form-control"></span>
                  </div>
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-bold">
                    <i className="fas fa-user-tie me-2"></i>
                    Administrador
                  </label>
                  <div className="placeholder-glow">
                    <span className="placeholder col-12 form-control"></span>
                  </div>
                </div>
                <div className="col-md-1 d-flex align-items-end">
                  <div className="placeholder-glow w-100">
                    <span className="placeholder col-12 btn"></span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label fw-bold">
                    <i className="fas fa-search me-2"></i>
                    Búsqueda
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Código, nombre o distrito..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-bold">
                    <i className="fas fa-cogs me-2"></i>
                    Tipo de Gestión
                  </label>
                  <select
                    className="form-select"
                    value={selectedTipoGestion || ''}
                    onChange={(e) => setSelectedTipoGestion(e.target.value ? parseInt(e.target.value) : null)}
                  >
                    <option value="">Todos</option>
                    {tiposGestion.map(tipo => (
                      <option key={tipo.id} value={tipo.id}>{tipo.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-bold">
                    <i className="fas fa-wifi me-2"></i>
                    Tipo de Comunicación
                  </label>
                  <select
                    className="form-select"
                    value={selectedTipoComunicacion || ''}
                    onChange={(e) => setSelectedTipoComunicacion(e.target.value ? parseInt(e.target.value) : null)}
                  >
                    <option value="">Todos</option>
                    {tiposComunicacion.map(tipo => (
                      <option key={tipo.id} value={tipo.id}>{tipo.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-2">
                  <label className="form-label fw-bold">
                    <i className="fas fa-user-tie me-2"></i>
                    Administrador
                  </label>
                  <select
                    className="form-select"
                    value={selectedAdministrador || ''}
                    onChange={(e) => setSelectedAdministrador(e.target.value ? parseInt(e.target.value) : null)}
                  >
                    <option value="">Todos</option>
                    {administradores.map(admin => (
                      <option key={admin.id} value={admin.id}>{admin.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-1 d-flex align-items-end">
                  <button
                    className="btn btn-outline-secondary w-100"
                    onClick={clearFilters}
                    title="Limpiar filtros"
                  >
                    <i className="fas fa-eraser"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mapa */}
      <div className="card shadow-sm" style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {/* Leyenda */}
        <div 
          className="card position-absolute" 
          style={{ 
            top: '20px', 
            right: '20px', 
            zIndex: 1000,
            minWidth: '220px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          <div className="card-header bg-primary text-white py-2">
            <h6 className="mb-0" style={{ fontSize: '14px' }}>
              <i className="fas fa-palette me-2"></i>
              Administradores
            </h6>
          </div>
          <div className="card-body p-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {loadingData ? (
              <div className="placeholder-glow">
                <span className="placeholder col-12 mb-2"></span>
                <span className="placeholder col-10 mb-2"></span>
                <span className="placeholder col-11 mb-2"></span>
                <span className="placeholder col-9"></span>
              </div>
            ) : administradores.length > 0 ? (
              <div style={{ fontSize: '13px' }}>
                {administradores.map((admin) => {
                  const colors: { [key: number]: string } = {
                    1: '#dc3545',
                    2: '#0d6efd',
                    3: '#198754',
                    4: '#ffc107',
                    5: '#6f42c1',
                    6: '#fd7e14',
                    7: '#20c997',
                    8: '#d63384',
                  };
                  const color = colors[admin.id] || '#6c757d';
                  
                  return (
                    <div 
                      key={admin.id} 
                      className="d-flex align-items-center mb-2"
                    >
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          backgroundColor: color,
                          borderRadius: '50%',
                          border: '2px solid white',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                          flexShrink: 0,
                          marginRight: '8px'
                        }}
                      ></div>
                      <span style={{ fontSize: '12px' }}>{admin.nombre}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted mb-0" style={{ fontSize: '12px' }}>
                No hay administradores
              </p>
            )}
          </div>
        </div>

        <div className="card-body p-0" style={{ height: '100%', position: 'relative' }}>
          {loadingData && (
            <div 
              className="position-absolute top-50 start-50 translate-middle" 
              style={{ zIndex: 1001 }}
            >
              <div className="text-center">
                <div className="spinner-border text-primary mb-2" role="status">
                  <span className="visually-hidden">Cargando cruces...</span>
                </div>
                <p className="text-muted">Cargando cruces...</p>
              </div>
            </div>
          )}
          <div style={{ height: '100%', width: '100%', opacity: loadingData ? 0.5 : 1, transition: 'opacity 0.3s' }}>
            <MapContainer
              center={mapCenter}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <ZoomTracker onZoomChange={setCurrentZoom} />
              
              {!loadingData && filteredCruces.map((cruce) => (
                <Marker
                  key={cruce.id}
                  position={[cruce.latitud!, cruce.longitud!]}
                  icon={getTrafficLightIcon(cruce.administradorId, currentZoom)}
                >
                  <Popup maxWidth={300}>
                    <div style={{ minWidth: '250px', fontSize: '13px' }}>
                      <h6 className="mb-2 fw-bold" style={{ fontSize: '15px', color: '#0056b3' }}>
                        <i className="fas fa-traffic-light me-2"></i>
                        {cruce.nombre || 'Sin nombre'}
                      </h6>
                      <table className="table table-sm table-borderless mb-2">
                        <tbody>
                          <tr>
                            <td className="text-muted" style={{ width: '45%' }}>
                              <strong>Código:</strong>
                            </td>
                            <td>{cruce.codigo || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td className="text-muted">
                              <strong>Distrito:</strong>
                            </td>
                            <td>{cruce.ubigeo?.distrito || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td className="text-muted">
                              <strong>Gestión:</strong>
                            </td>
                            <td>{getTipoNombre(cruce.tipoGestion)}</td>
                          </tr>
                          <tr>
                            <td className="text-muted">
                              <strong>Comunicación:</strong>
                            </td>
                            <td>{getTipoNombre(cruce.tipoComunicacion)}</td>
                          </tr>
                          <tr>
                            <td className="text-muted">
                              <strong>Administrador:</strong>
                            </td>
                            <td>{cruce.administrador?.nombre || 'N/A'}</td>
                          </tr>
                        </tbody>
                      </table>
                      <button
                        className="btn btn-sm btn-primary w-100"
                        onClick={() => {
                          setSelectedCruceId(cruce.id);
                          setDetailModalOpen(true);
                        }}
                        style={{ fontSize: '12px' }}
                      >
                        <i className="fas fa-eye me-1"></i>
                        Ver Detalle
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>

      {/* Modal para visualizar detalle */}
      {detailModalOpen && selectedCruceId && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="fas fa-eye me-2"></i>
                  Ver Cruce
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setDetailModalOpen(false)}></button>
              </div>
              <div className="modal-body">
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
