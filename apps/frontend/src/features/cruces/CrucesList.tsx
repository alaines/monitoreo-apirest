import { useState, useEffect } from 'react';
import Select from 'react-select';
import { toast } from 'react-hot-toast';
import { customSelectStylesSmall } from '../../styles/react-select-custom';
import { crucesService, Cruce } from '../../services/cruces.service';
import { CruceDetail } from './CruceDetail';
import { CruceForm } from './CruceForm';
import { PageHeader } from '../../components/ui/PageHeader';

type SortField = 'codigo' | 'nombre' | 'distrito' | 'estado';
type SortOrder = 'asc' | 'desc';

export function CrucesList() {
  const [cruces, setCruces] = useState<Cruce[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortField, setSortField] = useState<SortField>('codigo');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedCruceId, setSelectedCruceId] = useState<number | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [planoModalOpen, setPlanoModalOpen] = useState(false);
  const [selectedPlano, setSelectedPlano] = useState<{ url: string; nombre: string; type: 'pdf' | 'dwg' } | null>(null);

  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    codigo: '',
    distrito: '',
    estado: '',
  });

  useEffect(() => {
    loadCruces();
  }, [page, limit, sortField, sortOrder, filters]);

  const loadCruces = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit,
        sortBy: sortField,
        sortOrder,
      };
      
      if (filters.search) params.search = filters.search;
      if (filters.codigo) params.codigo = filters.codigo;
      if (filters.distrito) params.ubigeoId = filters.distrito;
      if (filters.estado !== '') params.estado = filters.estado === 'true';

      const response = await crucesService.getCruces(params);
      setCruces(response.data);
      setTotal(response.meta.total);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      console.error('Error loading cruces:', error);
      toast.error('Error al cargar las intersecciones');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
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
    if (sortField !== field) return <i className="fa-solid fa-sort text-muted ms-1"></i>;
    return sortOrder === 'asc' 
      ? <i className="fa-solid fa-sort-up ms-1"></i>
      : <i className="fa-solid fa-sort-down ms-1"></i>;
  };

  const sortedCruces = [...cruces].sort((a, b) => {
    let aVal: any, bVal: any;
    
    switch (sortField) {
      case 'codigo':
        aVal = a.codigo || '';
        bVal = b.codigo || '';
        break;
      case 'nombre':
        aVal = a.nombre || '';
        bVal = b.nombre || '';
        break;
      case 'distrito':
        aVal = a.ubigeo?.distrito || '';
        bVal = b.ubigeo?.distrito || '';
        break;
      case 'estado':
        aVal = a.estado ? 1 : 0;
        bVal = b.estado ? 1 : 0;
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleOpenPlano = (planoPath: string, type: 'pdf' | 'dwg', codigo: string) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const baseUrl = apiUrl.replace('/api', '');
    const planoUrl = `${baseUrl}/uploads/planos/${planoPath}`;
    
    if (type === 'dwg') {
      // Descargar DWG directamente
      const link = document.createElement('a');
      link.href = planoUrl;
      link.download = planoPath;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Abrir PDF en modal
      setSelectedPlano({ url: planoUrl, type, nombre: `${codigo} - ${type.toUpperCase()}` });
      setPlanoModalOpen(true);
    }
  };

  return (
    <div className="container-fluid p-3">
      <PageHeader
        icon="fa-solid fa-traffic-light"
        title="Gestión de Intersecciones"
        subtitle="Administración de intersecciones semafóricas, planos técnicos y periféricos"
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
              className="btn btn-sm btn-primary"
              onClick={() => {
                setSelectedCruceId(null);
                setFormMode('create');
                setFormModalOpen(true);
              }}
            >
              <i className="fa-solid fa-plus me-1"></i>
              Nueva Intersección
            </button>
          </div>
        }
      />

      {/* Filtros */}
      {showFilters && (
        <div className="card mb-3 border shadow-sm">
          <div className="card-header bg-white border-bottom py-2">
            <h6 className="card-title mb-0 fw-semibold text-dark" style={{ fontSize: '14px' }}>
              <i className="fa-solid fa-sliders me-2 text-primary"></i>
              Filtros de Búsqueda
            </h6>
          </div>
          <div className="card-body py-3">
            <div className="row g-2">
              <div className="col-md-4">
                <label className="form-label small fw-bold text-muted mb-1">Buscar por nombre</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Nombre de la vía o intersección..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold text-muted mb-1">Código</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Código de intersección..."
                  value={filters.codigo}
                  onChange={(e) => handleFilterChange('codigo', e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold text-muted mb-1">Estado</label>
                <Select
                  options={[
                    { value: '', label: 'Todos' },
                    { value: 'true', label: 'Activos' },
                    { value: 'false', label: 'Inactivos' }
                  ]}
                  value={filters.estado ? { value: filters.estado, label: filters.estado === 'true' ? 'Activos' : 'Inactivos' } : { value: '', label: 'Todos' }}
                  onChange={(option) => handleFilterChange('estado', option?.value || '')}
                  isClearable={false}
                  styles={customSelectStylesSmall}
                />
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <button 
                  className="btn btn-sm btn-outline-secondary w-100"
                  onClick={() => {
                    setFilters({ search: '', codigo: '', estado: '', distrito: '' });
                    setPage(1);
                  }}
                  title="Limpiar filtros"
                >
                  <i className="fa-solid fa-eraser me-1"></i> Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="card border shadow-sm">
        <div className="card-header bg-white border-bottom py-2">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="card-title mb-0 fw-semibold text-dark" style={{ fontSize: '14px' }}>
              <i className="fa-solid fa-list me-2 text-primary"></i>
              Listado de Intersecciones ({total} registros)
            </h6>
            <div className="d-flex align-items-center">
              <label className="me-2 small fw-bold text-muted mb-0">Filas:</label>
              <div style={{ width: '80px' }}>
                <Select
                  options={[
                    { value: 10, label: '10' },
                    { value: 20, label: '20' },
                    { value: 50, label: '50' }
                  ]}
                  value={{ value: limit, label: limit.toString() }}
                  onChange={(option) => {
                    if (option) {
                      setLimit(option.value);
                      setPage(1);
                    }
                  }}
                  isClearable={false}
                  styles={customSelectStylesSmall}
                  isSearchable={false}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : cruces.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="fa-solid fa-inbox fa-3x mb-3 text-secondary opacity-50"></i>
              <p className="mb-0">No se encontraron intersecciones con los filtros seleccionados</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover table-striped align-middle mb-0" style={{ fontSize: '13px' }}>
                  <thead className="table-light text-uppercase" style={{ fontSize: '12px' }}>
                    <tr>
                      <th className="px-3 py-2" style={{ cursor: 'pointer' }} onClick={() => handleSort('codigo')}>
                        Código {getSortIcon('codigo')}
                      </th>
                      <th className="py-2" style={{ cursor: 'pointer' }} onClick={() => handleSort('nombre')}>
                        Nombre {getSortIcon('nombre')}
                      </th>
                      <th className="py-2" style={{ cursor: 'pointer' }} onClick={() => handleSort('distrito')}>
                        Distrito {getSortIcon('distrito')}
                      </th>
                      <th className="py-2" style={{ cursor: 'pointer' }} onClick={() => handleSort('estado')}>
                        Estado {getSortIcon('estado')}
                      </th>
                      <th className="py-2">Planos</th>
                      <th className="py-2">Periféricos</th>
                      <th className="py-2 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCruces.map((cruce) => (
                      <tr key={cruce.id}>
                        <td className="px-3">
                          <span className="badge bg-secondary font-monospace">{cruce.codigo || 'N/A'}</span>
                        </td>
                        <td className="fw-semibold text-dark">
                          {cruce.nombre}
                        </td>
                        <td>
                          <small className="text-muted">
                            <i className="fa-solid fa-location-dot me-1 text-danger"></i>
                            {cruce.ubigeo?.distrito || 'N/A'}
                          </small>
                        </td>
                        <td>
                          <span className={`badge ${cruce.estado ? 'bg-success' : 'bg-danger'}`}>
                            {cruce.estado ? 'ACTIVO' : 'INACTIVO'}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            {cruce.planoPdf && (
                              <button
                                className="btn btn-sm btn-outline-danger py-0 px-2"
                                onClick={() => handleOpenPlano(cruce.planoPdf!, 'pdf', cruce.codigo || '')}
                                title="Visualizar PDF"
                              >
                                <i className="fa-solid fa-file-pdf"></i>
                              </button>
                            )}
                            {cruce.planoDwg && (
                              <button
                                className="btn btn-sm btn-outline-primary py-0 px-2"
                                onClick={() => handleOpenPlano(cruce.planoDwg!, 'dwg', cruce.codigo || '')}
                                title="Descargar DWG"
                              >
                                <i className="fa-solid fa-file-lines"></i>
                              </button>
                            )}
                            {!cruce.planoPdf && !cruce.planoDwg && (
                              <span className="text-muted small">—</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-info text-dark">
                            <i className="fa-solid fa-microchip me-1"></i>
                            {cruce.crucesPerifericos?.length || 0}
                          </span>
                        </td>
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-outline-primary me-1 py-0 px-2"
                            onClick={() => {
                              setSelectedCruceId(cruce.id);
                              setDetailModalOpen(true);
                            }}
                            title="Ver detalle"
                          >
                            <i className="fa-solid fa-eye"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-warning py-0 px-2"
                            onClick={() => {
                              setSelectedCruceId(cruce.id);
                              setFormMode('edit');
                              setFormModalOpen(true);
                            }}
                            title="Editar"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              <div className="card-footer bg-white border-top">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="text-muted small">
                    Página {page} de {totalPages}
                  </div>
                  <nav>
                    <ul className="pagination pagination-sm mb-0">
                      <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => setPage(1)}
                          disabled={page === 1}
                        >
                          <i className="fa-solid fa-angles-left"></i>
                        </button>
                      </li>
                      <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => setPage(page - 1)}
                          disabled={page === 1}
                        >
                          <i className="fa-solid fa-angle-left"></i>
                        </button>
                      </li>
                      <li className="page-item active">
                        <span className="page-link">{page}</span>
                      </li>
                      <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => setPage(page + 1)}
                          disabled={page === totalPages}
                        >
                          <i className="fa-solid fa-angle-right"></i>
                        </button>
                      </li>
                      <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => setPage(totalPages)}
                          disabled={page === totalPages}
                        >
                          <i className="fa-solid fa-angles-right"></i>
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal para visualizar detalle */}
      {detailModalOpen && selectedCruceId && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="fa-solid fa-eye me-2"></i>
                  Ver Intersección
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

      {/* Modal para crear/editar */}
      {formModalOpen && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className={`fa-solid ${formMode === 'create' ? 'fa-circle-plus' : 'fa-pen-to-square'} me-2`}></i>
                  {formMode === 'create' ? 'Nueva Intersección' : 'Editar Intersección'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setFormModalOpen(false)}></button>
              </div>
              <div className="modal-body">
                <CruceForm
                  cruceId={selectedCruceId}
                  onClose={() => setFormModalOpen(false)}
                  onSave={() => {
                    setFormModalOpen(false);
                    loadCruces();
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para visualizar planos */}
      {planoModalOpen && selectedPlano && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title">
                  <i className={`fa-solid ${selectedPlano.type === 'pdf' ? 'fa-file-pdf' : 'fa-file-lines'} me-2`}></i>
                  {selectedPlano.nombre}
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => {
                    setPlanoModalOpen(false);
                    setSelectedPlano(null);
                  }}
                ></button>
              </div>
              <div className="modal-body p-0" style={{ height: '80vh' }}>
                {selectedPlano.type === 'pdf' ? (
                  <iframe
                    src={selectedPlano.url}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title={selectedPlano.nombre}
                  />
                ) : (
                  <div className="d-flex flex-column align-items-center justify-content-center h-100 p-4">
                    <i className="fa-solid fa-file-lines fa-5x text-primary mb-4"></i>
                    <h5 className="mb-3">Archivo DWG</h5>
                    <p className="text-muted mb-3 text-center">
                      Los archivos DWG requieren software especializado como AutoCAD para visualizarse.
                    </p>
                    <div className="alert alert-info mb-4">
                      <strong><i className="fa-solid fa-circle-info me-2"></i>Opciones disponibles:</strong>
                      <ul className="mb-0 mt-2">
                        <li>Descargar el archivo y abrirlo con AutoCAD/DraftSight</li>
                        <li>Usar visores en línea como ShareCAD.org o Autodesk Viewer</li>
                        <li>Convertir manualmente a DXF para otros software</li>
                      </ul>
                    </div>
                    <a 
                      href={selectedPlano.url} 
                      download 
                      className="btn btn-primary btn-lg"
                    >
                      <i className="fa-solid fa-download me-2"></i>
                      Descargar Archivo DWG
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
