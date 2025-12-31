import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentsService, Incident } from '../../services/incidents.service';
import { IncidentDetail } from './IncidentDetail';
import { IncidentForm } from './IncidentForm';

interface Filters {
  incidenciaId?: number;
  cruceId?: number;
  estadoId?: number;
  fechaDesde?: string;
  fechaHasta?: string;
}

type SortField = 'id' | 'tipo' | 'cruce' | 'estado' | 'fecha';
type SortOrder = 'asc' | 'desc';

export function IncidentsList() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
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
  const [cruceSearch, setCruceSearch] = useState('');
  const [filteredCruces, setFilteredCruces] = useState<any[]>([]);
  const [showCruceDropdown, setShowCruceDropdown] = useState(false);

  useEffect(() => {
    loadCatalogs();
    
    // Cerrar dropdown de cruces al hacer clic fuera
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.position-relative')) {
        setShowCruceDropdown(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    // Filtrar cruces basado en búsqueda
    if (cruceSearch.trim() === '') {
      setFilteredCruces(cruces.slice(0, 20)); // Mostrar solo los primeros 20
    } else {
      const filtered = cruces.filter(cruce => 
        cruce.nombre.toLowerCase().includes(cruceSearch.toLowerCase())
      ).slice(0, 20);
      setFilteredCruces(filtered);
    }
  }, [cruceSearch, cruces]);

  useEffect(() => {
    loadIncidents();
  }, [currentPage, pageSize, filters, sortField, sortOrder]);

  const loadCatalogs = async () => {
    try {
      const [tipos, crucesData] = await Promise.all([
        incidentsService.getIncidenciasCatalog(),
        incidentsService.getCrucesCatalog()
      ]);
      setTiposIncidencia(tipos);
      setCruces(crucesData);
      setFilteredCruces(crucesData.slice(0, 20));
    } catch (error) {
      console.error('Error loading catalogs:', error);
    }
  };

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const response = await incidentsService.getIncidents({ 
        page: currentPage, 
        limit: pageSize,
        incidenciaId: filters.incidenciaId,
        cruceId: filters.cruceId,
        estadoId: filters.estadoId
      });
      
      let sortedData = [...response.data];
      
      // Filtrar por rango de fechas en el cliente
      if (filters.fechaDesde || filters.fechaHasta) {
        sortedData = sortedData.filter(incident => {
          const incidentDate = new Date(incident.createdAt);
          
          if (filters.fechaDesde) {
            const [year, month, day] = filters.fechaDesde.split('-').map(Number);
            const desde = new Date(year, month - 1, day, 0, 0, 0, 0);
            if (incidentDate < desde) return false;
          }
          
          if (filters.fechaHasta) {
            const [year, month, day] = filters.fechaHasta.split('-').map(Number);
            const hasta = new Date(year, month - 1, day, 23, 59, 59, 999);
            if (incidentDate > hasta) return false;
          }
          
          return true;
        });
      }
      
      // Ordenamiento en el cliente
      sortedData.sort((a, b) => {
        let compareValue = 0;
        
        switch (sortField) {
          case 'id':
            compareValue = a.id - b.id;
            break;
          case 'tipo':
            compareValue = (a.incidencia?.tipo || '').localeCompare(b.incidencia?.tipo || '');
            break;
          case 'cruce':
            compareValue = (a.cruce?.nombre || '').localeCompare(b.cruce?.nombre || '');
            break;
          case 'estado':
            compareValue = (a.estadoId || 0) - (b.estadoId || 0);
            break;
          case 'fecha':
            compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
        }
        
        return sortOrder === 'asc' ? compareValue : -compareValue;
      });
      
      setIncidents(sortedData);
      setTotalPages(response.meta.totalPages);
      setTotalItems(response.meta.total);
    } catch (error) {
      console.error('Error loading incidents:', error);
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
    if (sortField !== field) return <i className="fas fa-sort ms-1 text-muted"></i>;
    return sortOrder === 'asc' 
      ? <i className="fas fa-sort-up ms-1"></i>
      : <i className="fas fa-sort-down ms-1"></i>;
  };

  const applyFilters = (newFilters: Filters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setCruceSearch('');
    setCurrentPage(1);
  };

  const handleCruceSelect = (cruceId: number, cruceNombre: string) => {
    applyFilters({ ...filters, cruceId });
    setCruceSearch(cruceNombre);
    setShowCruceDropdown(false);
  };

  const handleCruceInputChange = (value: string) => {
    setCruceSearch(value);
    setShowCruceDropdown(true);
    if (value === '') {
      const newFilters = { ...filters };
      delete newFilters.cruceId;
      applyFilters(newFilters);
    }
  };

  const getStatusBadge = (estadoId: number | undefined) => {
    switch (estadoId) {
      case 1:
        return <span className="badge bg-info">Asignado</span>;
      case 2:
        return <span className="badge bg-primary">En Proceso</span>;
      case 3:
        return <span className="badge bg-danger">Cancelado</span>;
      case 4:
        return <span className="badge bg-success">Resuelto - Finalizado</span>;
      case 5:
        return <span className="badge bg-warning">Reasignado</span>;
      default:
        return <span className="badge bg-secondary">Desconocido</span>;
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2><i className="fas fa-ticket-alt me-2"></i>Gestión de Incidencias</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => {
            setSelectedIncidentId(null);
            setFormMode('create');
            setFormModalOpen(true);
          }}
        >
          <i className="fas fa-plus me-2"></i>Nueva Incidencia
        </button>
      </div>

      {/* Filtros */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-header bg-white border-bottom">
          <button 
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <i className={`fas fa-filter me-2`}></i>
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </button>
        </div>
        {showFilters && (
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label small">Tipo de Incidencia</label>
                <select 
                  className="form-select form-select-sm"
                  value={filters.incidenciaId || ''}
                  onChange={(e) => applyFilters({ ...filters, incidenciaId: e.target.value ? parseInt(e.target.value) : undefined })}
                >
                  <option value="">Todos</option>
                  {tiposIncidencia.map(tipo => (
                    <option key={tipo.id} value={tipo.id}>{tipo.tipo}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label small">Estado</label>
                <select 
                  className="form-select form-select-sm"
                  value={filters.estadoId || ''}
                  onChange={(e) => applyFilters({ ...filters, estadoId: e.target.value ? parseInt(e.target.value) : undefined })}
                >
                  <option value="">Todos</option>
                  <option value="1">Pendiente</option>
                  <option value="2">En Proceso</option>
                  <option value="3">Completado</option>
                  <option value="4">Cancelado</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label small">Cruce</label>
                <div className="position-relative">
                  <input 
                    type="text" 
                    className="form-control form-control-sm"
                    placeholder="Buscar cruce..."
                    value={cruceSearch}
                    onChange={(e) => handleCruceInputChange(e.target.value)}
                    onFocus={() => setShowCruceDropdown(true)}
                  />
                  {showCruceDropdown && cruceSearch.length > 0 && (
                    <div 
                      className="position-absolute w-100 bg-white border rounded shadow-sm mt-1" 
                      style={{ maxHeight: '200px', overflowY: 'auto', zIndex: 1000 }}
                    >
                      {filteredCruces.length === 0 ? (
                        <div className="p-2 text-muted small">No se encontraron cruces</div>
                      ) : (
                        filteredCruces.map(cruce => (
                          <div
                            key={cruce.id}
                            className="p-2 hover-bg-light cursor-pointer small"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleCruceSelect(cruce.id, cruce.nombre)}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            {cruce.nombre}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="col-md-2">
                <label className="form-label small">Fecha Desde</label>
                <input 
                  type="date" 
                  className="form-control form-control-sm"
                  value={filters.fechaDesde || ''}
                  onChange={(e) => applyFilters({ ...filters, fechaDesde: e.target.value })}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label small">Fecha Hasta</label>
                <input 
                  type="date" 
                  className="form-control form-control-sm"
                  value={filters.fechaHasta || ''}
                  onChange={(e) => applyFilters({ ...filters, fechaHasta: e.target.value })}
                />
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <button 
                  className="btn btn-sm btn-outline-danger w-100"
                  onClick={clearFilters}
                >
                  <i className="fas fa-times me-1"></i>Limpiar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-bottom">
          <div className="d-flex justify-content-between align-items-center">
            <div className="text-muted small">
              Mostrando {incidents.length} de {totalItems} incidencias
            </div>
            <div className="d-flex align-items-center">
              <label className="me-2 small mb-0">Filas por página:</label>
              <select 
                className="form-select form-select-sm" 
                style={{ width: 'auto' }}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="px-4 py-3" style={{ cursor: 'pointer' }} onClick={() => handleSort('id')}>
                    ID {getSortIcon('id')}
                  </th>
                  <th className="py-3" style={{ cursor: 'pointer' }} onClick={() => handleSort('tipo')}>
                    Tipo {getSortIcon('tipo')}
                  </th>
                  <th className="py-3" style={{ cursor: 'pointer' }} onClick={() => handleSort('cruce')}>
                    Cruce {getSortIcon('cruce')}
                  </th>
                  <th className="py-3" style={{ cursor: 'pointer' }} onClick={() => handleSort('estado')}>
                    Estado {getSortIcon('estado')}
                  </th>
                  <th className="py-3" style={{ cursor: 'pointer' }} onClick={() => handleSort('fecha')}>
                    Fecha {getSortIcon('fecha')}
                  </th>
                  <th className="py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {incidents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-muted">
                      <i className="fas fa-inbox fa-3x mb-3 d-block"></i>
                      No hay incidencias registradas
                    </td>
                  </tr>
                ) : (
                  incidents.map((incident) => (
                    <tr key={incident.id}>
                      <td className="px-4">#{incident.id}</td>
                      <td>{incident.incidencia?.tipo || '-'}</td>
                      <td>
                        {incident.cruce?.nombre ? (
                          <span className="text-primary">
                            <i className="fas fa-map-marker-alt me-1"></i>
                            {incident.cruce.nombre}
                          </span>
                        ) : (
                          <span className="text-muted">Sin cruce</span>
                        )}
                      </td>
                      <td>{getStatusBadge(incident.estadoId)}</td>
                      <td>
                        <small>{new Date(incident.createdAt).toLocaleString('es-PE')}</small>
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => {
                            setSelectedIncidentId(incident.id);
                            setDetailModalOpen(true);
                          }}
                          title="Ver detalle"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => {
                            setSelectedIncidentId(incident.id);
                            setFormMode('edit');
                            setFormModalOpen(true);
                          }}
                          title="Editar"
                        >
                          <i className="fas fa-edit"></i>
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
                      <i className="fas fa-angle-double-left"></i>
                    </button>
                  </li>
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <i className="fas fa-angle-left"></i>
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
                      <i className="fas fa-angle-right"></i>
                    </button>
                  </li>
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <i className="fas fa-angle-double-right"></i>
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
                  <i className="fas fa-eye me-2"></i>
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
                  <i className={`fas ${formMode === 'create' ? 'fa-plus-circle' : 'fa-edit'} me-2`}></i>
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
