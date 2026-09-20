import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuthStore } from '../features/auth/authStore';
import { incidentsService, Incident } from '../services/incidents.service';
import { administradoresService, Administrador } from '../services/administradores.service';
import { IncidentDetail } from '../features/incidents/IncidentDetail';
import { PageHeader } from '../components/ui/PageHeader';
import { IncidentClusterLayer } from '../components/IncidentClusterLayer';

const LIMA_CENTER: [number, number] = [-12.0464, -77.0428];

const MESES = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];

// Componente para forzar redimensionamiento del mapa
function MapResizer() {
  const map = useMap();
  
  useEffect(() => {
    const container = map.getContainer().parentElement;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      const times = [0, 50, 100, 150, 200, 250, 300, 350];
      times.forEach(delay => {
        setTimeout(() => {
          map.invalidateSize({ animate: true, duration: 0.1 });
        }, delay);
      });
    });

    resizeObserver.observe(container);
    
    // Invalidate immediately on mount
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      resizeObserver.disconnect();
    };
  }, [map]);

  return null;
}

interface InicioStats {
  totalIncidents: number;
  activeIncidents: number;
  openTickets: number;
  inProgressTickets: number;
  closedTickets: number;
  avgResolutionTime: number;
  todayActiveIncidents: number;
  todayOpenTickets: number;
  todayInProgressTickets: number;
  todayClosedTickets: number;
  crucesApagadosCount: number;
}

export function Inicio() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<InicioStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMarkers, setLoadingMarkers] = useState(false);
  const [activeIncidents, setActiveIncidents] = useState<Incident[]>([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null);
  const [selectedAdministrador, setSelectedAdministrador] = useState<number | null>(null);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedAnho, setSelectedAnho] = useState<number>(currentYear);
  const [selectedMes, setSelectedMes] = useState<number | null>(currentMonth);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [administradores, setAdministradores] = useState<Administrador[]>([]);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadInicioData();
    }
  }, [user]);

  // Recargar markers cuando cambian los filtros
  useEffect(() => {
    if (hasLoadedRef.current) {
      loadActiveIncidents(selectedAnho, selectedMes, selectedAdministrador);
    }
  }, [selectedAnho, selectedMes, selectedAdministrador]);

  // Listen for real-time incident updates
  useEffect(() => {
    const handleIncidentCreated = () => {
      if (hasLoadedRef.current) {
        loadInicioData();
        loadActiveIncidents(selectedAnho, selectedMes, selectedAdministrador);
      }
    };

    const handleIncidentUpdated = () => {
      if (hasLoadedRef.current) {
        loadInicioData();
        loadActiveIncidents(selectedAnho, selectedMes, selectedAdministrador);
      }
    };

    window.addEventListener('incidentCreated', handleIncidentCreated);
    window.addEventListener('incidentUpdated', handleIncidentUpdated);

    return () => {
      window.removeEventListener('incidentCreated', handleIncidentCreated);
      window.removeEventListener('incidentUpdated', handleIncidentUpdated);
    };
  }, [selectedAnho, selectedMes, selectedAdministrador]);

  const loadInicioData = async () => {
    try {
      const [backendStats, yearsData, adminsData, crucesApagados] = await Promise.all([
        incidentsService.getStatistics(),
        incidentsService.getAvailableYears(),
        administradoresService.getAdministradores(),
        incidentsService.getCrucesApagadosCount()
      ]);
      
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      const todayIncidentsData = await incidentsService.getIncidents({ 
        page: 1, 
        limit: 1000,
      });

      const allIncidents = todayIncidentsData.data || [];
      const todayIncidents = allIncidents.filter((i: Incident) => {
        const createdDateStr = i.createdAt ? i.createdAt.split('T')[0] : '';
        return createdDateStr === todayStr;
      });

      const todayOpenTickets = todayIncidents.filter((t: Incident) => t.estadoId === 1).length;
      const todayInProgressTickets = todayIncidents.filter((t: Incident) => t.estadoId === 2).length;
      const todayClosedTickets = todayIncidents.filter((t: Incident) => t.estadoId === 3 || t.estadoId === 4).length;

      const resolvedIncidents = allIncidents.filter((t: Incident) => t.estadoId === 3 || t.estadoId === 4);
      const totalResolutionTime = resolvedIncidents.reduce((acc: number, inc: Incident) => {
        if (inc.updatedAt && inc.createdAt) {
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
        totalIncidents: backendStats.total,
        activeIncidents: backendStats.pendientes + backendStats.enProceso,
        openTickets: backendStats.pendientes,
        inProgressTickets: backendStats.enProceso,
        closedTickets: backendStats.resueltas,
        avgResolutionTime,
        todayActiveIncidents: todayIncidents.filter((i: Incident) => i.estadoId === 1 || i.estadoId === 2).length,
        todayOpenTickets,
        todayInProgressTickets,
        todayClosedTickets,
        crucesApagadosCount: crucesApagados.count,
      };

      setStats(statsData);
      setAvailableYears(yearsData || []);
      setAdministradores(adminsData || []);
      
      let initialYear = currentYear;
      if (yearsData && yearsData.length > 0 && !yearsData.includes(currentYear)) {
        initialYear = yearsData[0];
        setSelectedAnho(initialYear);
      }
      loadActiveIncidents(initialYear, currentMonth, selectedAdministrador);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveIncidents = async (targetYear?: number, targetMes?: number | null, targetAdmin?: number | null) => {
    try {
      setLoadingMarkers(true);
      const yearToUse = targetYear !== undefined ? targetYear : selectedAnho;
      const mesToUse = targetMes !== undefined ? targetMes : selectedMes;
      const adminToUse = targetAdmin !== undefined ? targetAdmin : selectedAdministrador;
      
      const params: any = {
        page: 1,
        limit: 10000,
      };

      if (yearToUse) {
        params.anho = yearToUse;
      }

      if (mesToUse) {
        params.mes = mesToUse;
      }
      
      if (adminToUse) {
        params.administradorId = adminToUse;
      }
      
      const activeIncidentsData = await incidentsService.getMapMarkers(params);
      const activeForMap = (activeIncidentsData.data || []).filter((i: Incident) => 
        i.latitude !== null && i.latitude !== undefined &&
        i.longitude !== null && i.longitude !== undefined &&
        !isNaN(Number(i.latitude)) && !isNaN(Number(i.longitude)) &&
        (i.estadoId === 1 || i.estadoId === 2 || i.estadoId === 5 || !i.estadoId) &&
        i.estadoId !== 3 && i.estadoId !== 4 &&
        (!yearToUse || i.anho === yearToUse || (i.createdAt && new Date(i.createdAt).getFullYear() === yearToUse)) &&
        (!mesToUse || i.mes === mesToUse || (i.createdAt && new Date(i.createdAt).getMonth() + 1 === mesToUse))
      );

      setActiveIncidents(activeForMap);
    } catch (error) {
      console.error('Error cargando incidentes activos:', error);
      setActiveIncidents([]);
    } finally {
      setLoadingMarkers(false);
    }
  };

  return (
    <div className="container-fluid px-3 py-2" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Cabecera compacta */}
      <div style={{ flexShrink: 0, marginBottom: '6px' }}>
        <PageHeader 
          icon="fa-solid fa-desktop"
          title="Centro de Control y Monitoreo"
          subtitle="Supervisión en tiempo real de semáforos, intersecciones e incidencias técnicas en Lima Metropolitana"
          actions={
            <>
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  loadInicioData();
                  loadActiveIncidents(selectedAnho, selectedMes, selectedAdministrador);
                }}
                title="Actualizar datos"
              >
                <i className="fa-solid fa-arrows-rotate me-1"></i> Actualizar
              </button>
              <button 
                className="btn btn-sm btn-primary"
                onClick={() => navigate('/incidents')}
              >
                <i className="fa-solid fa-list me-1"></i> Ver Incidencias
              </button>
            </>
          }
        />
      </div>

      {/* Cuadrícula de KPIs / Widgets Técnicos Compactos */}
      <div className="row g-2 mb-2" style={{ flexShrink: 0 }}>
        {/* KPI 1: Pendientes Hoy */}
        <div className="col">
          <div className="card card-widget mb-0 h-100 border">
            <div className="card-body py-2 px-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <div className="widget-subheading text-uppercase text-muted fw-bold" style={{ fontSize: '11px' }}>Pendientes Hoy</div>
                <div className="widget-icon-box text-warning" style={{ width: '28px', height: '28px' }}>
                  <i className="fa-solid fa-clock" style={{ fontSize: '13px' }}></i>
                </div>
              </div>
              <div className="widget-numbers text-dark mb-0" style={{ fontSize: '20px' }}>
                {loading ? <span className="placeholder col-6"></span> : (stats?.todayOpenTickets || 0)}
              </div>
              <small className="text-muted d-block" style={{ fontSize: '10px' }}>Tickets sin atender del día</small>
            </div>
          </div>
        </div>

        {/* KPI 2: Cerrados Hoy */}
        <div className="col">
          <div className="card card-widget mb-0 h-100 border">
            <div className="card-body py-2 px-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <div className="widget-subheading text-uppercase text-muted fw-bold" style={{ fontSize: '11px' }}>Cerrados Hoy</div>
                <div className="widget-icon-box text-success" style={{ width: '28px', height: '28px' }}>
                  <i className="fa-solid fa-circle-check" style={{ fontSize: '13px' }}></i>
                </div>
              </div>
              <div className="widget-numbers text-success mb-0" style={{ fontSize: '20px' }}>
                {loading ? <span className="placeholder col-6"></span> : (stats?.todayClosedTickets || 0)}
              </div>
              <small className="text-muted d-block" style={{ fontSize: '10px' }}>Tickets resueltos del día</small>
            </div>
          </div>
        </div>

        {/* KPI 3: Total Activos */}
        <div className="col">
          <div className="card card-widget mb-0 h-100 border">
            <div className="card-body py-2 px-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <div className="widget-subheading text-uppercase text-muted fw-bold" style={{ fontSize: '11px' }}>Total Activos</div>
                <div className="widget-icon-box text-primary" style={{ width: '28px', height: '28px' }}>
                  <i className="fa-solid fa-list-check" style={{ fontSize: '13px' }}></i>
                </div>
              </div>
              <div className="widget-numbers text-primary mb-0" style={{ fontSize: '20px' }}>
                {loading ? <span className="placeholder col-6"></span> : (stats?.activeIncidents || 0)}
              </div>
              <small className="text-muted d-block" style={{ fontSize: '10px' }}>Todos los tickets abiertos</small>
            </div>
          </div>
        </div>

        {/* KPI 4: Total Resueltos */}
        <div className="col">
          <div className="card card-widget mb-0 h-100 border">
            <div className="card-body py-2 px-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <div className="widget-subheading text-uppercase text-muted fw-bold" style={{ fontSize: '11px' }}>Total Resueltos</div>
                <div className="widget-icon-box text-secondary" style={{ width: '28px', height: '28px' }}>
                  <i className="fa-solid fa-check-double" style={{ fontSize: '13px' }}></i>
                </div>
              </div>
              <div className="widget-numbers text-dark mb-0" style={{ fontSize: '20px' }}>
                {loading ? <span className="placeholder col-6"></span> : (stats?.closedTickets || 0)}
              </div>
              <small className="text-muted d-block" style={{ fontSize: '10px' }}>Histórico acumulado</small>
            </div>
          </div>
        </div>

        {/* KPI 5: Intersecciones Apagadas (Crítico) */}
        <div className="col">
          <div 
            className="card card-widget mb-0 h-100 border border-danger-subtle" 
            style={{ cursor: 'pointer', backgroundColor: '#fffcfc' }}
            onClick={() => navigate('/incidents?incidenciaId=66&estadoId=1,2,5')}
            title="Ver tickets de intersecciones apagadas"
          >
            <div className="card-body py-2 px-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <div className="widget-subheading text-uppercase text-danger fw-bold" style={{ fontSize: '11px' }}>Intersecciones Apagadas</div>
                <div className="widget-icon-box text-danger" style={{ width: '28px', height: '28px', backgroundColor: 'rgba(192, 57, 43, 0.1)' }}>
                  <i className="fa-solid fa-traffic-light" style={{ fontSize: '13px' }}></i>
                </div>
              </div>
              <div className="widget-numbers text-danger mb-0" style={{ fontSize: '20px' }}>
                {loading ? <span className="placeholder col-6"></span> : (stats?.crucesApagadosCount || 0)}
              </div>
              <div className="d-flex justify-content-between align-items-center mt-1">
                <small className="text-muted" style={{ fontSize: '10px' }}>Atención urgente</small>
                <small className="text-danger fw-bold" style={{ fontSize: '10px' }}>
                  Ver detalles <i className="fa-solid fa-arrow-right ms-1"></i>
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenedor del Mapa en Card Formal que llena el espacio restante */}
      <div className="card mb-0 border shadow-sm" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div className="card-header bg-white border-bottom py-1 px-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <i className="fa-solid fa-map-location-dot text-primary me-2"></i>
            <span className="fw-bold text-dark" style={{ fontSize: '12px' }}>
              Mapa de Incidencias Georreferenciadas
            </span>
          </div>
          <span className="badge bg-light text-dark border" style={{ fontSize: '11px' }}>
            <i className="fa-solid fa-map-pin text-danger me-1"></i>
            {activeIncidents.length} ubicaciones
          </span>
        </div>

        <div className="card-body p-0" style={{ position: 'relative', flex: 1, minHeight: 0 }}>
          {activeIncidents.length === 0 && !loadingMarkers && (
            <div style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)', 
              zIndex: 1000,
              backgroundColor: 'white',
              padding: '20px 24px',
              borderRadius: 'var(--border-radius)',
              border: '1px solid var(--enterprise-border)',
              boxShadow: 'var(--shadow)',
              textAlign: 'center'
            }}>
              <i className="fa-solid fa-map-location-dot fa-2x text-muted mb-2"></i>
              <h6 className="text-dark fw-bold mb-1">No hay incidencias georreferenciadas</h6>
              <small className="text-muted">Las incidencias deben contar con coordenadas para mostrarse en el mapa.</small>
            </div>
          )}
          
          {/* Panel Flotante de Filtro */}
          <div 
            className="card border shadow-sm"
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 1000,
              width: '220px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div className="card-body p-2 px-3">
              <div className="mb-2">
                <label className="form-label mb-1 fw-bold text-muted" style={{ fontSize: '10.5px' }}>
                  <i className="fa-solid fa-calendar-days text-secondary me-1"></i> Año:
                </label>
                <select 
                  className="form-select form-select-sm py-1"
                  style={{ fontSize: '12px' }}
                  value={selectedAnho}
                  onChange={(e) => setSelectedAnho(parseInt(e.target.value))}
                  disabled={loadingMarkers}
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div className="mb-2">
                <label className="form-label mb-1 fw-bold text-muted" style={{ fontSize: '10.5px' }}>
                  <i className="fa-solid fa-calendar text-secondary me-1"></i> Mes:
                </label>
                <select 
                  className="form-select form-select-sm py-1"
                  style={{ fontSize: '12px' }}
                  value={selectedMes || ''}
                  onChange={(e) => setSelectedMes(e.target.value ? parseInt(e.target.value) : null)}
                  disabled={loadingMarkers}
                >
                  <option value="">Todos</option>
                  {MESES.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="mb-2">
                <label className="form-label mb-1 fw-bold text-muted" style={{ fontSize: '10.5px' }}>
                  <i className="fa-solid fa-user-shield text-secondary me-1"></i> Administrado por:
                </label>
                <select 
                  className="form-select form-select-sm py-1"
                  style={{ fontSize: '12px' }}
                  value={selectedAdministrador || ''}
                  onChange={(e) => setSelectedAdministrador(e.target.value ? parseInt(e.target.value) : null)}
                  disabled={loadingMarkers}
                >
                  <option value="">Todos</option>
                  {administradores.map(admin => (
                    <option key={admin.id} value={admin.id}>{admin.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-top d-flex justify-content-between align-items-center" style={{ fontSize: '11px', color: 'var(--gray-600)' }}>
                <span className="fw-semibold">{activeIncidents.length} ubicaciones</span>
                {loadingMarkers && (
                  <div className="spinner-border spinner-border-sm text-primary" role="status" style={{ width: '13px', height: '13px' }}>
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ height: '100%', width: '100%' }}>
            <MapContainer 
              {...({ center: LIMA_CENTER, zoom: 12, scrollWheelZoom: true } as any)}
              style={{ height: '100%', width: '100%' }}
            >
              <MapResizer />
              <TileLayer 
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <IncidentClusterLayer 
                incidents={activeIncidents} 
                onSelectIncident={(incidentId) => {
                  setSelectedIncidentId(incidentId);
                  setDetailModalOpen(true);
                }} 
              />
            </MapContainer>
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
