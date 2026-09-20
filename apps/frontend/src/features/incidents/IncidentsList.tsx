import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Select from 'react-select';
import { customSelectStylesSmall } from '../../styles/react-select-custom';
import { incidentsService, Incident } from '../../services/incidents.service';
import { IncidentDetail } from './IncidentDetail';
import { IncidentForm } from './IncidentForm';
import { PageHeader } from '../../components/ui/PageHeader';

interface Filters {
  incidenciaId?: number;
  cruceId?: number;
  estadoId?: number[];
  fechaDesde?: string;
  fechaHasta?: string;
}

type SortField = 'id' | 'tipo' | 'cruce' | 'estado' | 'fecha' | 'tiempo';
type SortOrder = 'asc' | 'desc';

export function IncidentsList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  
  // Filtros
  const [filters, setFilters] = useState<Filters>({});
  const [showFilters, setShowFilters] = useState(false);
  
  // Ordenamiento
  const [sortField, setSortField] = useState<SortField>('fecha');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Catálogos para filtros
  const [tiposIncidencia, setTiposIncidencia] = useState<any[]>([]);
  const [cruces, setCruces] = useState<any[]>([]);
  const [estados, setEstados] = useState<any[]>([]);
  const [catalogsLoaded, setCatalogsLoaded] = useState(false);

  useEffect(() => {
    const init = async () => {
      await loadCatalogs();
    };
    
    init();
  }, []);

  // Aplicar filtro desde URL después de que los catálogos estén cargados
  useEffect(() => {
    if (!catalogsLoaded) return;
    
    const incidenciaIdParam = searchParams.get('incidenciaId');
    const estadoIdParam = searchParams.get('estadoId');
    
    if (incidenciaIdParam || estadoIdParam) {
      const newFilters: Filters = {};
      
      // Procesar incidenciaId
      if (incidenciaIdParam) {
        const incidenciaId = parseInt(incidenciaIdParam);
        newFilters.incidenciaId = incidenciaId;
      }
      
      // Procesar estadoId (puede ser una lista separada por comas)
      if (estadoIdParam) {
        const estadoIds = estadoIdParam.split(',').map(id => parseInt(id.trim()));
        newFilters.estadoId = estadoIds;
      }
      
      setFilters(newFilters);
      setShowFilters(true);
    }
  }, [catalogsLoaded, searchParams, tiposIncidencia]);

  useEffect(() => {
    loadIncidents();
  }, [currentPage, pageSize, filters, sortField, sortOrder]);

  // Listen for real-time incident updates
  useEffect(() => {
    const handleIncidentCreated = () => {
      loadIncidents();
    };

    const handleIncidentUpdated = () => {
      loadIncidents();
    };

    window.addEventListener('incidentCreated', handleIncidentCreated);
    window.addEventListener('incidentUpdated', handleIncidentUpdated);

    return () => {
      window.removeEventListener('incidentCreated', handleIncidentCreated);
      window.removeEventListener('incidentUpdated', handleIncidentUpdated);
    };
  }, [currentPage, pageSize, filters, sortField, sortOrder]);

  const loadCatalogs = async () => {
    try {
      const [tiposData, crucesData, estadosData] = await Promise.all([
        incidentsService.getIncidenciasCatalog(),
        incidentsService.getCrucesCatalog(),
        incidentsService.getEstadosCatalog()
      ]);
      setTiposIncidencia(tiposData || []);
      setCruces(crucesData || []);
      setEstados(estadosData || []);
      setCatalogsLoaded(true);
    } catch (error) {
      console.error('Error loading catalogs:', error);
    }
  };

  const loadIncidents = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: pageSize,
      };

      if (filters.incidenciaId) params.incidenciaId = filters.incidenciaId;
      if (filters.cruceId) params.cruceId = filters.cruceId;
      if (filters.estadoId && filters.estadoId.length > 0) {
        params.estadoId = filters.estadoId.join(',');
      }
      if (filters.fechaDesde) params.fechaDesde = filters.fechaDesde;
      if (filters.fechaHasta) params.fechaHasta = filters.fechaHasta;

      const response = await incidentsService.getIncidents(params);
      
      // Ordenamiento en cliente si es necesario
      let sortedData = [...(response?.data || [])];
      if (sortField) {
        sortedData.sort((a, b) => {
          let aVal: any = '';
          let bVal: any = '';

          switch (sortField) {
            case 'id':
              aVal = a.id;
              bVal = b.id;
              break;
            case 'tipo':
              aVal = a.incidencia?.tipo || '';
              bVal = b.incidencia?.tipo || '';
              break;
            case 'cruce':
              aVal = a.cruce?.nombre || '';
              bVal = b.cruce?.nombre || '';
              break;
            case 'estado':
              aVal = a.estado?.nombre || a.estadoId || 0;
              bVal = b.estado?.nombre || b.estadoId || 0;
              break;
            case 'fecha':
              aVal = new Date(a.createdAt).getTime();
              bVal = new Date(b.createdAt).getTime();
              break;
            case 'tiempo':
              aVal = new Date(a.createdAt).getTime();
              bVal = new Date(b.createdAt).getTime();
              break;
          }

          if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
          if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
          return 0;
        });
      }

      setIncidents(sortedData);
      setTotalPages(response?.meta?.totalPages || 1);
      setTotalItems(response?.meta?.total || 0);
    } catch (error) {
      console.error('Error loading incidents:', error);
      setIncidents([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <i className="fa-solid fa-sort text-muted ms-1" style={{ fontSize: '11px' }}></i>;
    }
    return sortOrder === 'asc' 
      ? <i className="fa-solid fa-sort-up text-primary ms-1" style={{ fontSize: '11px' }}></i>
      : <i className="fa-solid fa-sort-down text-primary ms-1" style={{ fontSize: '11px' }}></i>;
  };

  const applyFilters = (newFilters: Filters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  const getStatusBadge = (estadoId: number | undefined, estadoNombre?: string) => {
    switch (estadoId) {
      case 1:
        return <span className="badge bg-warning text-dark">{estadoNombre || 'ASIGNADO'}</span>;
      case 2:
        return <span className="badge bg-primary">{estadoNombre || 'EN PROCESO'}</span>;
      case 3:
        return <span className="badge bg-secondary">{estadoNombre || 'CANCELADO'}</span>;
      case 4:
        return <span className="badge bg-success">{estadoNombre || 'RESUELTO'}</span>;
      case 5:
        return <span className="badge bg-info text-dark">{estadoNombre || 'REASIGNADO'}</span>;
      default:
        return <span className="badge bg-secondary">{estadoNombre || 'DESCONOCIDO'}</span>;
    }
  };

  const getTimeElapsed = (createdAt: string | Date) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMinutes < 60) {
      return { text: `${diffMinutes}m`, days: 0 };
    } else if (diffHours < 24) {
      return { text: `${diffHours}h`, days: 0 };
    } else {
      return { text: `${diffDays}d`, days: diffDays };
    }
  };

  const getTimeBadge = (estadoId: number | undefined, createdAt: string | Date) => {
    if (estadoId === 3 || estadoId === 4) {
      return null;
    }

    const timeData = getTimeElapsed(createdAt);
    
    if (estadoId === 1 || estadoId === 2 || estadoId === 5) {
      let badgeClass = 'badge bg-success';
      
      if (timeData.days === 1) {
        badgeClass = 'badge bg-warning text-dark';
      } else if (timeData.days > 1) {
        badgeClass = 'badge bg-danger';
      }
      
      return <span className={badgeClass}>{timeData.text}</span>;
    }
    
    return <span className="badge bg-secondary">{timeData.text}</span>;
  };

  if (loading && incidents.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-3">
      {/* Cabecera estándar de página */}
      <PageHeader 
        icon="fa-solid fa-clipboard-list"
        title="Gestión de Incidencias"
        subtitle="Registro, seguimiento y atención de averías y fallas en la red semafórica"
        actions={
          <div className="d-flex gap-2">
            <button 
              className={`btn btn-sm ${showFilters ? 'btn-secondary' : 'btn-outline-secondary'}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <i className="fa-solid fa-filter me-1"></i>
              {showFilters ? 'Ocultar Filtros' : 'Filtros'}
            </button>
            <button 
              className="btn btn-sm btn-outline-primary"
              onClick={loadIncidents}
              title="Recargar listado"
            >
              <i className="fa-solid fa-arrows-rotate me-1"></i> Actualizar
            </button>
            <button 
              className="btn btn-sm btn-primary" 
              onClick={() => {
                setSelectedIncidentId(null);
                setFormMode('create');
                setFormModalOpen(true);
              }}
            >
              <i className="fa-solid fa-plus me-1"></i> Nueva Incidencia
            </button>
          </div>
        }
      />

      {/* Filtros */}
      {showFilters && (
        <div className="card mb-3 border shadow-sm">
          <div className="card-header bg-white border-bottom py-2 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <i className="fa-solid fa-sliders text-primary me-2"></i>
              <span className="fw-bold text-dark" style={{ fontSize: '13px' }}>Filtros de Búsqueda</span>
            </div>
            <button 
              className="btn btn-sm btn-link text-decoration-none text-muted p-0"
              onClick={clearFilters}
              style={{ fontSize: '12px' }}
            >
              <i className="fa-solid fa-eraser me-1"></i> Limpiar Filtros
            </button>
          </div>
          <div className="card-body p-3">
            <div className="row g-2">
              <div className="col-md-3">
                <label className="form-label mb-1">Tipo de Incidencia</label>
                <Select
                  options={tiposIncidencia.map(inc => ({ value: inc.id, label: inc.tipo }))}
                  value={filters.incidenciaId ? (tiposIncidencia.find(i => i.id === filters.incidenciaId) ? { value: filters.incidenciaId, label: tiposIncidencia.find(i => i.id === filters.incidenciaId)?.tipo || '' } : null) : null}
                  onChange={(option: any) => {
                    if (option) {
                      applyFilters({ ...filters, incidenciaId: option.value });
                    } else {
                      const newFilters = { ...filters };
                      delete newFilters.incidenciaId;
                      applyFilters(newFilters);
                    }
                  }}
                  isClearable
                  isSearchable
                  placeholder="Todos los tipos..."
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                  menuPosition="fixed"
                  styles={customSelectStylesSmall}
                  noOptionsMessage={() => "No hay opciones"}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label mb-1">Estados</label>
                <Select
                  options={estados.map(estado => ({ value: estado.id, label: estado.nombre }))}
                  value={(filters.estadoId || []).map(id => {
                    const estado = estados.find(e => e.id === id);
                    return estado ? { value: estado.id, label: estado.nombre } : null;
                  }).filter(Boolean) as any}
                  onChange={(selected: any) => {
                    const estadoIds = selected ? (selected as any[]).map((s: any) => s.value) : [];
                    applyFilters({ ...filters, estadoId: estadoIds.length > 0 ? estadoIds : undefined });
                  }}
                  isMulti
                  isClearable
                  isSearchable
                  placeholder="Estados..."
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                  menuPosition="fixed"
                  styles={customSelectStylesSmall}
                  noOptionsMessage={() => "No hay opciones"}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label mb-1">Intersección</label>
                <Select
                  options={cruces.map(cruce => ({ 
                    value: cruce.id, 
                    label: cruce.codigo ? `[${cruce.codigo}] ${cruce.nombre}` : cruce.nombre 
                  }))}
                  value={filters.cruceId ? (cruces.find(c => c.id === filters.cruceId) ? { 
                    value: filters.cruceId, 
                    label: cruces.find(c => c.id === filters.cruceId)?.codigo 
                      ? `[${cruces.find(c => c.id === filters.cruceId)?.codigo}] ${cruces.find(c => c.id === filters.cruceId)?.nombre}`
                      : (cruces.find(c => c.id === filters.cruceId)?.nombre || '')
                  } : null) : null}
                  onChange={(option: any) => {
                    if (option) {
                      applyFilters({ ...filters, cruceId: option.value });
                    } else {
                      const newFilters = { ...filters };
                      delete newFilters.cruceId;
                      applyFilters(newFilters);
                    }
                  }}
                  isClearable
                  isSearchable
                  placeholder="Buscar intersección..."
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                  menuPosition="fixed"
                  styles={customSelectStylesSmall}
                  noOptionsMessage={() => "No hay opciones"}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label mb-1">Fecha Desde</label>
                <input 
                  type="date" 
                  className="form-control form-control-sm"
                  value={filters.fechaDesde || ''}
                  onChange={(e) => applyFilters({ ...filters, fechaDesde: e.target.value })}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label mb-1">Fecha Hasta</label>
                <input 
                  type="date" 
                  className="form-control form-control-sm"
                  value={filters.fechaHasta || ''}
                  onChange={(e) => applyFilters({ ...filters, fechaHasta: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card mb-3 border shadow-sm">
        <div className="card-header bg-white border-bottom py-2">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <i className="fa-solid fa-list text-primary me-2"></i>
              <span className="fw-bold text-dark" style={{ fontSize: '13px' }}>
                Listado de Incidencias Registradas
              </span>
              <span className="badge bg-light text-muted border ms-2" style={{ fontSize: '11px' }}>
                {totalItems} total
              </span>
            </div>
            <div className="d-flex align-items-center">
              <label className="me-2 text-muted small mb-0">Filas por página:</label>
              <div style={{ width: '80px' }}>
                <Select
                  options={[
                    { value: 10, label: '10' },
                    { value: 20, label: '20' },
                    { value: 50, label: '50' }
                  ]}
                  value={{ value: pageSize, label: pageSize.toString() }}
                  onChange={(option) => {
                    setPageSize(option?.value || 10);
                    setCurrentPage(1);
                  }}
                  styles={customSelectStylesSmall}
                  isSearchable={false}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-striped align-middle mb-0" style={{ fontSize: '13px' }}>
              <thead className="table-light text-uppercase" style={{ fontSize: '12px' }}>
                <tr>
                  <th className="ps-3 py-2" style={{ cursor: 'pointer', width: '90px' }} onClick={() => handleSort('id')}>
                    ID {getSortIcon('id')}
                  </th>
                  <th className="py-2" style={{ cursor: 'pointer' }} onClick={() => handleSort('tipo')}>
                    Tipo {getSortIcon('tipo')}
                  </th>
                  <th className="py-2" style={{ cursor: 'pointer' }} onClick={() => handleSort('cruce')}>
                    Intersección {getSortIcon('cruce')}
                  </th>
                  <th className="py-2" style={{ cursor: 'pointer', width: '130px' }} onClick={() => handleSort('estado')}>
                    Estado {getSortIcon('estado')}
                  </th>
                  <th className="py-2" style={{ cursor: 'pointer', width: '160px' }} onClick={() => handleSort('fecha')}>
                    Fecha {getSortIcon('fecha')}
                  </th>
                  <th className="py-2" style={{ cursor: 'pointer', width: '100px' }} onClick={() => handleSort('tiempo')}>
                    Tiempo {getSortIcon('tiempo')}
                  </th>
                  <th className="py-2 text-center pe-3" style={{ width: '110px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {incidents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">
                      <i className="fa-solid fa-inbox fa-3x mb-3 d-block"></i>
                      No hay incidencias registradas
                    </td>
                  </tr>
                ) : (
                  incidents.map((incident) => (
                    <tr key={incident.id}>
                      <td className="ps-3 fw-medium text-muted">#{incident.id}</td>
                      <td>{incident.incidencia?.tipo || '-'}</td>
                      <td>
                        {incident.cruce?.nombre ? (
                          <span className="text-primary">
                            <i className="fa-solid fa-location-dot me-1"></i>
                            {incident.cruce.nombre}
                          </span>
                        ) : (
                          <span className="text-muted">Sin intersección</span>
                        )}
                      </td>
                      <td>{getStatusBadge(incident.estadoId, incident.estado?.nombre)}</td>
                      <td>
                        <small>{new Date(incident.createdAt).toLocaleString('es-PE')}</small>
                      </td>
                      <td>
                        {getTimeBadge(incident.estadoId, incident.createdAt)}
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-outline-primary btn-sm py-1 px-2 me-1"
                          onClick={() => {
                            setSelectedIncidentId(incident.id);
                            setDetailModalOpen(true);
                          }}
                          title="Ver detalle"
                        >
                          <i className="fa-solid fa-eye"></i>
                        </button>
                        <button
                          className="btn btn-outline-warning btn-sm py-1 px-2"
                          onClick={() => {
                            setSelectedIncidentId(incident.id);
                            setFormMode('edit');
                            setFormModalOpen(true);
                          }}
                          title="Editar"
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {totalPages > 1 && (
          <div className="card-footer bg-white border-top">
            <div className="d-flex justify-content-between align-items-center">
              <div className="text-muted small">
                Página {currentPage} de {totalPages}
              </div>
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      <i className="fa-solid fa-angles-left"></i>
                    </button>
                  </li>
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <i className="fa-solid fa-angle-left"></i>
                    </button>
                  </li>
                  <li className="page-item active">
                    <span className="page-link">{currentPage}</span>
                  </li>
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <i className="fa-solid fa-angle-right"></i>
                    </button>
                  </li>
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <i className="fa-solid fa-angles-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        )}
      </div>

      {/* Modal para visualizar detalle */}
      {detailModalOpen && selectedIncidentId && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="fa-solid fa-eye me-2"></i>
                  Ver Incidencia
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setDetailModalOpen(false)}></button>
              </div>
              <div className="modal-body">
                <IncidentDetail
                  incidentId={selectedIncidentId}
                  onClose={() => setDetailModalOpen(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear/editar */}
      {formModalOpen && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className={`fa-solid ${formMode === 'create' ? 'fa-circle-plus' : 'fa-pen-to-square'} me-2`}></i>
                  {formMode === 'create' ? 'Nueva Incidencia' : 'Editar Incidencia'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setFormModalOpen(false)}></button>
              </div>
              <div className="modal-body">
                <IncidentForm
                  incidentId={selectedIncidentId}
                  onClose={() => setFormModalOpen(false)}
                  onSave={() => {
                    setFormModalOpen(false);
                    loadIncidents();
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
