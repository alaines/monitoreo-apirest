import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Select from 'react-select';
import { customSelectStylesSmall } from '../../styles/react-select-custom';
import { incidentsService, Incident } from '../../services/incidents.service';
import { IncidentDetail } from './IncidentDetail';
import { IncidentForm } from './IncidentForm';

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
  const [incidenciaSearch, setIncidenciaSearch] = useState('');
  const [filteredIncidencias, setFilteredIncidencias] = useState<any[]>([]);
  const [showIncidenciaDropdown, setShowIncidenciaDropdown] = useState(false);
  const [cruces, setCruces] = useState<any[]>([]);
  const [cruceSearch, setCruceSearch] = useState('');
  const [filteredCruces, setFilteredCruces] = useState<any[]>([]);
  const [showCruceDropdown, setShowCruceDropdown] = useState(false);
  const [estados, setEstados] = useState<any[]>([]);
  const [showEstadoDropdown, setShowEstadoDropdown] = useState(false);
  const [catalogsLoaded, setCatalogsLoaded] = useState(false);

  useEffect(() => {
    const init = async () => {
      await loadCatalogs();
    };
    
    init();
    
    // Cerrar dropdowns al hacer clic fuera
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.incidencia-dropdown')) {
        setShowIncidenciaDropdown(false);
      }
      if (!target.closest('.cruce-dropdown')) {
        setShowCruceDropdown(false);
      }
      if (!target.closest('.estado-dropdown')) {
        setShowEstadoDropdown(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
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
        
        // Buscar el nombre del tipo de incidencia para mostrarlo en el input
        const tipo = tiposIncidencia.find(t => t.id === incidenciaId);
        if (tipo) {
          setIncidenciaSearch(tipo.tipo);
        }
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
    // Filtrar incidencias basado en búsqueda
    if (incidenciaSearch.trim() === '') {
      setFilteredIncidencias(tiposIncidencia.slice(0, 20));
    } else {
      const filtered = tiposIncidencia.filter(inc => 
        inc.tipo.toLowerCase().includes(incidenciaSearch.toLowerCase())
      ).slice(0, 20);
      setFilteredIncidencias(filtered);
    }
  }, [incidenciaSearch, tiposIncidencia]);

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
      const [tipos, crucesData, estadosData] = await Promise.all([
        incidentsService.getIncidenciasCatalog(),
        incidentsService.getCrucesCatalog(),
        incidentsService.getEstadosCatalog()
      ]);
      setTiposIncidencia(tipos);
      setCruces(crucesData);
      setEstados(estadosData);
      setCatalogsLoaded(true);
      setFilteredCruces(crucesData.slice(0, 20));
    } catch (error) {
      console.error('Error loading catalogs:', error);
    }
  };

  const loadIncidents = async () => {
    setLoading(true);
    try {
      let allData: Incident[] = [];
      
      // Si hay múltiples estados, hacer una llamada por cada estado y combinar resultados
      if (filters.estadoId && filters.estadoId.length > 1) {
        const promises = filters.estadoId.map(estadoId => 
          incidentsService.getIncidents({ 
            page: 1,
            limit: 10000, // Necesitamos todos para luego paginar correctamente
            incidenciaId: filters.incidenciaId,
            cruceId: filters.cruceId,
            estadoId: estadoId
          })
        );
        
        const responses = await Promise.all(promises);
        // Combinar todos los resultados y eliminar duplicados por ID
        const allIncidents = responses.flatMap(r => r.data);
        const uniqueIncidents = Array.from(
          new Map(allIncidents.map(item => [item.id, item])).values()
        );
        allData = uniqueIncidents;
      } else {
        // Un solo estado o sin filtro de estado
        const queryEstadoId = filters.estadoId && filters.estadoId.length === 1 
          ? filters.estadoId[0] 
          : undefined;
        
        const response = await incidentsService.getIncidents({ 
          page: currentPage, 
          limit: pageSize,
          incidenciaId: filters.incidenciaId,
          cruceId: filters.cruceId,
          estadoId: queryEstadoId
        });
        
        allData = response.data;
      }
      
      let sortedData = [...allData];
      
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
          case 'tiempo':
            // Ordenar por tiempo transcurrido (más reciente primero cuando desc)
            compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
        }
        
        return sortOrder === 'asc' ? compareValue : -compareValue;
      });
      
      // Si tenemos múltiples estados o filtros de fecha, paginamos en cliente
      if ((filters.estadoId && filters.estadoId.length > 1) || filters.fechaDesde || filters.fechaHasta) {
        const totalFiltered = sortedData.length;
        const totalPagesCalculated = Math.ceil(totalFiltered / pageSize);
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        
        setIncidents(sortedData.slice(startIndex, endIndex));
        setTotalPages(totalPagesCalculated);
        setTotalItems(totalFiltered);
      } else {
        // Paginación desde el backend (ya viene paginado)
        setIncidents(sortedData);
        // Calcular totales basados en los datos que tenemos
        const estimatedTotal = sortedData.length;
        setTotalPages(Math.ceil(estimatedTotal / pageSize));
        setTotalItems(estimatedTotal);
      }
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
    setIncidenciaSearch('');
    setCurrentPage(1);
  };

  const handleIncidenciaSelect = (incidenciaId: number, incidenciaTipo: string) => {
    applyFilters({ ...filters, incidenciaId });
    setIncidenciaSearch(incidenciaTipo);
    setShowIncidenciaDropdown(false);
  };

  const handleIncidenciaInputChange = (value: string) => {
    setIncidenciaSearch(value);
    setShowIncidenciaDropdown(true);
    if (value === '') {
      const newFilters = { ...filters };
      delete newFilters.incidenciaId;
      applyFilters(newFilters);
    }
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

  const handleEstadoToggle = (estadoId: number) => {
    const currentEstados = filters.estadoId || [];
    let newEstados: number[];
    
    if (currentEstados.includes(estadoId)) {
      newEstados = currentEstados.filter(id => id !== estadoId);
    } else {
      newEstados = [...currentEstados, estadoId];
    }
    
    if (newEstados.length === 0) {
      const newFilters = { ...filters };
      delete newFilters.estadoId;
      applyFilters(newFilters);
    } else {
      applyFilters({ ...filters, estadoId: newEstados });
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
    // Estados 3 y 4 no muestran tiempo
    if (estadoId === 3 || estadoId === 4) {
      return null;
    }

    const timeData = getTimeElapsed(createdAt);
    
    // Estados 1, 2, 5: aplicar colores según días transcurridos
    if (estadoId === 1 || estadoId === 2 || estadoId === 5) {
      let badgeClass = 'badge bg-success'; // Por defecto verde (menos de 1 día)
      
      if (timeData.days === 1) {
        badgeClass = 'badge bg-warning text-dark'; // Naranja - exactamente 1 día
      } else if (timeData.days > 1) {
        badgeClass = 'badge bg-danger'; // Rojo - más de 1 día
      }
      
      return <span className={badgeClass}>{timeData.text}</span>;
    }
    
    // Otros estados: mostrar con color secundario
    return <span className="badge bg-secondary">{timeData.text}</span>;
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
            <div className="row g-2">
              <div className="col-md-3">
                <label className="form-label small">Tipo de Incidencia</label>
                <div className="position-relative incidencia-dropdown">
                  <input 
                    type="text" 
                    className="form-control custom-input-sm"
                    placeholder="Buscar tipo de incidencia..."
                    value={incidenciaSearch}
                    onChange={(e) => handleIncidenciaInputChange(e.target.value)}
                    onFocus={() => setShowIncidenciaDropdown(true)}
                  />
                  {showIncidenciaDropdown && (
                    <div 
                      className="position-absolute w-100 bg-white border rounded shadow-sm mt-1" 
                      style={{ maxHeight: '200px', overflowY: 'auto', zIndex: 1000 }}
                    >
                      {filteredIncidencias.length === 0 ? (
                        <div className="p-2 text-muted small">No se encontraron tipos</div>
                      ) : (
                        filteredIncidencias.map(inc => (
                          <div
                            key={inc.id}
                            className="p-2 hover-bg-light cursor-pointer small"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleIncidenciaSelect(inc.id, inc.tipo)}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            {inc.tipo}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="col-md-2">
                <label className="form-label small">Estados</label>
                <div className="position-relative estado-dropdown">
                  <button 
                    type="button"
                    className="form-control form-control-sm text-start d-flex justify-content-between align-items-center"
                    onClick={() => setShowEstadoDropdown(!showEstadoDropdown)}
                  >
                    <span>
                      {(filters.estadoId || []).length === 0 
                        ? 'Seleccionar estados...' 
                        : `${(filters.estadoId || []).length} seleccionado(s)`}
                    </span>
                    <i className={`fas fa-chevron-${showEstadoDropdown ? 'up' : 'down'} ms-2`}></i>
                  </button>
                  {showEstadoDropdown && (
                    <div 
                      className="position-absolute w-100 bg-white border rounded shadow-sm mt-1" 
                      style={{ maxHeight: '200px', overflowY: 'auto', zIndex: 1000 }}
                    >
                      {estados.map(estado => (
                        <div
                          key={estado.id}
                          className="p-2 d-flex align-items-center hover-bg-light"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleEstadoToggle(estado.id)}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <input
                            type="checkbox"
                            className="form-check-input me-2"
                            checked={(filters.estadoId || []).includes(estado.id)}
                            onChange={() => {}}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <label className="small mb-0" style={{ cursor: 'pointer' }}>
                            {estado.nombre}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="col-md-3">
                <label className="form-label small">Cruce</label>
                <div className="position-relative cruce-dropdown">
                  <input 
                    type="text" 
                    className="form-control custom-input-sm"
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
                  className="form-control custom-date-input-sm"
                  value={filters.fechaDesde || ''}
                  onChange={(e) => applyFilters({ ...filters, fechaDesde: e.target.value })}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label small">Fecha Hasta</label>
                <input 
                  type="date" 
                  className="form-control custom-date-input-sm"
                  value={filters.fechaHasta || ''}
                  onChange={(e) => applyFilters({ ...filters, fechaHasta: e.target.value })}
                />
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
                  <th className="py-3" style={{ cursor: 'pointer' }} onClick={() => handleSort('tiempo')}>
                    Tiempo {getSortIcon('tiempo')}
                  </th>
                  <th className="py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {incidents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">
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
                      <td>
                        {getTimeBadge(incident.estadoId, incident.createdAt)}
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
                          className="btn btn-sm btn-outline-warning"
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
