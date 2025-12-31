import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuthStore } from '../features/auth/authStore';
import { incidentsService, Incident } from '../services/incidents.service';
import { administradoresService, Administrador } from '../services/administradores.service';
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

interface InicioStats {
  // Totales
  totalIncidents: number;
  activeIncidents: number;
  openTickets: number;
  inProgressTickets: number;
  closedTickets: number;
  avgResolutionTime: number;
  // Hoy
  todayActiveIncidents: number;
  todayOpenTickets: number;
  todayInProgressTickets: number;
  todayClosedTickets: number;
}

export function Inicio() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<InicioStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIncidents, setActiveIncidents] = useState<Incident[]>([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null);
  const [selectedAdministrador, setSelectedAdministrador] = useState<number | null>(null);
  const [administradores, setAdministradores] = useState<Administrador[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadInicioData();
  }, [user, navigate]);

  const loadInicioData = async () => {
    setLoading(true);
    try {
      const incidentsData = await incidentsService.getIncidents({ page: 1, limit: 5000 });

      // Sin filtro de período, usar todas las incidencias
      const allIncidents = incidentsData.data;

      // Filtrar incidencias de hoy
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIncidents = allIncidents.filter((i: Incident) => 
        new Date(i.createdAt) >= today
      );

      // Estadísticas totales
      const openTickets = allIncidents.filter((t: Incident) => t.estadoId === 1).length;
      const inProgressTickets = allIncidents.filter((t: Incident) => t.estadoId === 2).length;
      const closedTickets = allIncidents.filter((t: Incident) => t.estadoId === 3).length;

      // Estadísticas de hoy
      const todayOpenTickets = todayIncidents.filter((t: Incident) => t.estadoId === 1).length;
      const todayInProgressTickets = todayIncidents.filter((t: Incident) => t.estadoId === 2).length;
      const todayClosedTickets = todayIncidents.filter((t: Incident) => t.estadoId === 3).length;

      const resolvedIncidents = allIncidents.filter((t: Incident) => t.estadoId === 3);
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
        totalIncidents: allIncidents.length,
        activeIncidents: allIncidents.filter((i: Incident) => i.estadoId === 1 || i.estadoId === 2).length,
        openTickets,
        inProgressTickets,
        closedTickets,
        avgResolutionTime,
        todayActiveIncidents: todayIncidents.filter((i: Incident) => i.estadoId === 1 || i.estadoId === 2).length,
        todayOpenTickets,
        todayInProgressTickets,
        todayClosedTickets,
      };

      setStats(statsData);

      // Todas las incidencias activas con coordenadas para el mapa
      const activeForMap = allIncidents.filter((i: Incident) => 
        (i.estadoId === 1 || i.estadoId === 2) && i.latitude && i.longitude
      );
      
      setActiveIncidents(activeForMap);

      // Cargar administradores desde el servicio
      const adminsData = await administradoresService.getAdministradores();
      setAdministradores(adminsData);
    } catch (error) {
      console.error('❌ Error cargando datos de inicio:', error);
    } finally {
      setLoading(false);
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
    <div className="container-fluid" style={{ padding: '20px', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
        <div className="row g-3 mb-3" style={{ flexShrink: 0 }}>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h6 className="text-muted mb-0">Incidencias Activas</h6>
                  <i className="fas fa-exclamation-circle" style={{ fontSize: '24px', color: '#dc3545' }}></i>
                </div>
                <h2 className="mb-0" style={{ fontSize: '1.5rem' }}>
                  Hoy {stats?.todayActiveIncidents} / Total {stats?.activeIncidents}
                </h2>
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
                <h2 className="mb-0" style={{ fontSize: '1.5rem' }}>
                  Hoy {stats?.todayOpenTickets} / Total {stats?.openTickets}
                </h2>
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
                <h2 className="mb-0" style={{ fontSize: '1.5rem' }}>
                  Hoy {stats?.todayInProgressTickets} / Total {stats?.inProgressTickets}
                </h2>
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

        <div className="row g-3" style={{ flex: 1, minHeight: 0 }}>
          <div className="col-12" style={{ height: '100%' }}>
            <div className="card border-0 shadow-sm" style={{ height: '100%' }}>
              <div className="card-body p-0" style={{ position: 'relative', height: '100%' }}>
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
                {/* Filtro de administrador */}
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  zIndex: 1000,
                  backgroundColor: 'white',
                  padding: '12px 15px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  fontSize: '13px',
                  minWidth: '220px'
                }}>
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ fontSize: '12px', color: '#333', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Administrado por:</label>
                    <select 
                      className="form-select form-select-sm"
                      value={selectedAdministrador || ''}
                      onChange={(e) => setSelectedAdministrador(e.target.value ? parseInt(e.target.value) : null)}
                      style={{ fontSize: '12px' }}
                    >
                      <option value="">Todos</option>
                      {administradores.map(admin => (
                        <option key={admin.id} value={admin.id}>{admin.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ fontSize: '11px', color: '#666', paddingTop: '8px', borderTop: '1px solid #eee' }}>
                    {activeIncidents.filter(inc => !selectedAdministrador || inc.cruce?.administrador?.id === selectedAdministrador).length} incidencias
                  </div>
                </div>
                <div style={{ height: '100%', width: '100%' }}>
                  <MapContainer 
                    {...({ center: LIMA_CENTER, zoom: 12, scrollWheelZoom: true } as any)}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <MapResizer />
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {activeIncidents
                      .filter(inc => !selectedAdministrador || inc.cruce?.administrador?.id === selectedAdministrador)
                      .map((incident) => {
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
