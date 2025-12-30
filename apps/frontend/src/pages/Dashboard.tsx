import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuthStore } from '../features/auth/authStore';
import { incidentsService, Incident } from '../services/incidents.service';
import { IncidentDetail } from '../features/incidents/IncidentDetail';

const LIMA_CENTER: [number, number] = [-12.0464, -77.0428];

// Componente para forzar redimensionamiento del mapa
function MapResizer() {
  const map = useMap();
  
  useEffect(() => {
    // Obtener el contenedor del mapa
    const container = map.getContainer().parentElement;
    
    if (!container) return;

    // Usar ResizeObserver para detectar cambios de tamaño
    const resizeObserver = new ResizeObserver(() => {
      // Múltiples invalidaciones durante la transición para que sea fluido
      const times = [0, 50, 100, 150, 200, 250, 300, 350];
      times.forEach(delay => {
        setTimeout(() => {
          map.invalidateSize({ animate: true, duration: 0.1 });
        }, delay);
      });
    });

    resizeObserver.observe(container);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [map]);

  return null;
}

// Función para obtener el icono del marcador según la prioridad
const getMarkerIcon = (prioridadId?: number) => {
  let color = '#FFA500'; // Naranja por defecto (MEDIA o sin prioridad)
  
  if (prioridadId === 1) {
    color = '#DC3545'; // Rojo para ALTA
  } else if (prioridadId === 2) {
    color = '#FFA500'; // Naranja para MEDIA
  } else if (prioridadId === 3) {
    color = '#28A745'; // Verde para BAJA
  }

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
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
          font-weight: bold;
          font-size: 14px;
        ">!</div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
  });
};

interface DashboardStats {
  totalIncidents: number;
  activeIncidents: number;
  openTickets: number;
  inProgressTickets: number;
  closedTickets: number;
  avgResolutionTime: number;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('today');
  const [activeIncidents, setActiveIncidents] = useState<Incident[]>([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadDashboardData();
  }, [user, navigate, selectedPeriod]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      console.log('🔍 Cargando datos del dashboard (límite: 5000)...');
      const incidentsData = await incidentsService.getIncidents({ page: 1, limit: 5000 });
      console.log('📊 Total de incidencias recibidas:', incidentsData.data.length);

      const now = new Date();
      const periodStart = new Date();
      if (selectedPeriod === 'today') {
        periodStart.setHours(0, 0, 0, 0);
      } else if (selectedPeriod === 'week') {
        periodStart.setDate(now.getDate() - 7);
      } else if (selectedPeriod === 'month') {
        periodStart.setMonth(now.getMonth() - 1);
      } else if (selectedPeriod === 'year') {
        periodStart.setFullYear(now.getFullYear() - 1);
      } else {
        // 'all' - no filtrar por fecha, usar una fecha muy antigua
        periodStart.setFullYear(2000, 0, 1);
      }

      const filteredIncidents = incidentsData.data.filter((i: Incident) => 
        new Date(i.createdAt) >= periodStart
      );

      console.log(`📈 Filtro "${selectedPeriod}": ${filteredIncidents.length} incidencias (desde ${periodStart.toISOString()})`);

      const openTickets = filteredIncidents.filter((t: Incident) => t.estadoId === 1).length;
      const inProgressTickets = filteredIncidents.filter((t: Incident) => t.estadoId === 2).length;
      const closedTickets = filteredIncidents.filter((t: Incident) => t.estadoId === 3).length;

      const resolvedIncidents = filteredIncidents.filter((t: Incident) => t.estadoId === 3);
      const totalResolutionTime = resolvedIncidents.reduce((acc: number, inc: Incident) => {
        if (inc.updatedAt) {
          const created = new Date(inc.createdAt).getTime();
          const updated = new Date(inc.updatedAt).getTime();
          return acc + (updated - created);
        }
        return acc;
      }, 0);
      const avgResolutionTime = resolvedIncidents.length > 0 
        ? totalResolutionTime / resolvedIncidents.length / (1000 * 60 * 60)
        : 0;

      const statsData = {
        totalIncidents: filteredIncidents.length,
        activeIncidents: filteredIncidents.filter((i: Incident) => i.estadoId === 1 || i.estadoId === 2).length,
        openTickets,
        inProgressTickets,
        closedTickets,
        avgResolutionTime,
      };

      console.log('📊 Estadísticas calculadas:', statsData);
      setStats(statsData);

      // Filtrar incidencias activas para el mapa aplicando también el filtro de período
      // Las incidencias deben estar en estado Pendiente (1) o En Proceso (2) y tener coordenadas
      const activeForMap = filteredIncidents.filter((i: Incident) => 
        (i.estadoId === 1 || i.estadoId === 2) && i.latitude && i.longitude
      );
      
      console.log(`🗺️ Mapa: ${activeForMap.length} de ${statsData.activeIncidents} activas (${activeForMap.filter(i => i.cruce).length} con cruce, ${activeForMap.filter(i => !i.cruce).length} con coords propias)`);
      
      setActiveIncidents(activeForMap);
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'today': return 'Hoy';
      case 'week': return 'Última Semana';
      case 'month': return 'Último Mes';
      case 'year': return 'Último Año';
      case 'all': return 'Todas';
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid" style={{ padding: '20px' }}>
        <div className="mb-4 d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-0">Estadísticas - {getPeriodLabel()}</h4>
            {stats && (
              <small className="text-muted">
                Mostrando {activeIncidents.length} de {stats.activeIncidents} incidencias activas en el mapa
              </small>
            )}
          </div>
          <div className="btn-group">
            <button className={`btn btn-sm ${selectedPeriod === 'today' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setSelectedPeriod('today')}>Hoy</button>
            <button className={`btn btn-sm ${selectedPeriod === 'week' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setSelectedPeriod('week')}>Semana</button>
            <button className={`btn btn-sm ${selectedPeriod === 'month' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setSelectedPeriod('month')}>Mes</button>
            <button className={`btn btn-sm ${selectedPeriod === 'year' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setSelectedPeriod('year')}>Año</button>
            <button className={`btn btn-sm ${selectedPeriod === 'all' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setSelectedPeriod('all')}>Todas</button>
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h6 className="text-muted mb-0">Incidencias Activas</h6>
                  <i className="fas fa-exclamation-circle" style={{ fontSize: '24px', color: '#dc3545' }}></i>
                </div>
                <h2 className="mb-0">{stats?.activeIncidents}</h2>
                <small className="text-muted">Tiempo real</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h6 className="text-muted mb-0">Pendientes</h6>
                  <i className="fas fa-ticket-alt" style={{ fontSize: '24px', color: '#ffc107' }}></i>
                </div>
                <h2 className="mb-0">{stats?.openTickets}</h2>
                <small className="text-muted">Sin atender</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h6 className="text-muted mb-0">En Progreso</h6>
                  <i className="fas fa-spinner" style={{ fontSize: '24px', color: '#0056b3' }}></i>
                </div>
                <h2 className="mb-0">{stats?.inProgressTickets}</h2>
                <small className="text-muted">En atención</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h6 className="text-muted mb-0">Tiempo Promedio</h6>
                  <i className="fas fa-clock" style={{ fontSize: '24px', color: '#28a745' }}></i>
                </div>
                <h2 className="mb-0">{stats?.avgResolutionTime.toFixed(1)}h</h2>
                <small className="text-muted">Resolución</small>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-0" style={{ position: 'relative' }}>
                {activeIncidents.length === 0 && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)', 
                    zIndex: 1000,
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    textAlign: 'center'
                  }}>
                    <i className="fas fa-map-marked-alt fa-3x text-muted mb-3"></i>
                    <h5 className="text-muted">No hay incidencias para mostrar</h5>
                    <p className="text-muted mb-0">Las incidencias deben tener ubicación geográfica para mostrarse en el mapa</p>
                  </div>
                )}
                {/* Leyenda de prioridades */}
                <div style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: '20px',
                  zIndex: 1000,
                  backgroundColor: 'white',
                  padding: '12px 15px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  fontSize: '13px'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>⚡ Prioridades</div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                    <div style={{ 
                      width: '16px', 
                      height: '16px', 
                      backgroundColor: '#DC3545', 
                      borderRadius: '50%',
                      marginRight: '8px',
                      border: '2px solid white',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }}></div>
                    <span>Alta</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                    <div style={{ 
                      width: '16px', 
                      height: '16px', 
                      backgroundColor: '#FFA500', 
                      borderRadius: '50%',
                      marginRight: '8px',
                      border: '2px solid white',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }}></div>
                    <span>Media</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ 
                      width: '16px', 
                      height: '16px', 
                      backgroundColor: '#28A745', 
                      borderRadius: '50%',
                      marginRight: '8px',
                      border: '2px solid white',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }}></div>
                    <span>Baja</span>
                  </div>
                </div>
                <div style={{ height: '600px', width: '100%' }}>
                  <MapContainer 
                    {...({ center: LIMA_CENTER, zoom: 12, scrollWheelZoom: true } as any)}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <MapResizer />
                    <LayersControl {...({ position: 'topright' } as any)}>
                      <LayersControl.BaseLayer checked name="OpenStreetMap">
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      </LayersControl.BaseLayer>
                      <LayersControl.BaseLayer name="Satélite">
                        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                      </LayersControl.BaseLayer>
                      <LayersControl.BaseLayer name="Topográfico">
                        <TileLayer url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" />
                      </LayersControl.BaseLayer>
                    </LayersControl>
                    {activeIncidents.map((incident) => {
                      if (!incident.latitude || !incident.longitude) return null;
                      const markerIcon = getMarkerIcon(incident.incidencia?.prioridad?.id);
                      return (
                        <Marker 
                          key={incident.id} 
                          {...({ position: [incident.latitude, incident.longitude], icon: markerIcon } as any)}
                        >
                          <Popup>
                            <div style={{ minWidth: '200px', fontSize: '13px' }}>
                              <div style={{ marginBottom: '10px' }}>
                                <strong style={{ fontSize: '15px', color: '#0056b3', display: 'block', marginBottom: '6px' }}>
                                  {incident.incidencia?.tipo || 'Incidencia'}
                                </strong>
                                {incident.cruce?.nombre && (
                                  <div style={{ marginBottom: '4px' }}>
                                    <strong>📍</strong> {incident.cruce.nombre}
                                  </div>
                                )}
                                <div style={{ marginBottom: '4px' }}>
                                  <strong>Ticket:</strong> #{incident.id}
                                </div>
                                <div style={{ marginBottom: '8px', color: '#dc3545', fontWeight: '500' }}>
                                  ⏱️ {(() => {
                                    const days = Math.floor((new Date().getTime() - new Date(incident.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                                    return days === 0 ? 'Hoy' : `${days} día${days > 1 ? 's' : ''} sin atención`;
                                  })()}
                                </div>
                              </div>
                              <button
                                className="btn btn-sm btn-primary w-100"
                                onClick={() => {
                                  setSelectedIncidentId(incident.id);
                                  setDetailModalOpen(true);
                                }}
                                style={{ fontSize: '12px' }}
                              >
                                Ver Detalle / Seguimiento
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
          </div>
        </div>

      {detailModalOpen && selectedIncidentId && (
        <IncidentDetail
          incidentId={selectedIncidentId}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedIncidentId(null);
          }}
        />
      )}
    </div>
  );
}
