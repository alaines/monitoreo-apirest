import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { crucesService, Cruce } from '../../services/cruces.service';

type SortField = 'codigo' | 'nombre' | 'distrito' | 'estado';
type SortOrder = 'asc' | 'desc';

export function CrucesList() {
  const navigate = useNavigate();
  const [cruces, setCruces] = useState<Cruce[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortField, setSortField] = useState<SortField>('codigo');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filters, setFilters] = useState({
    search: '',
    codigo: '',
    estado: '' as '' | 'true' | 'false',
  });

  useEffect(() => {
    loadCruces();
  }, [page, filters]);

  const loadCruces = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit };
      
      if (filters.search) params.search = filters.search;
      if (filters.codigo) params.codigo = filters.codigo;
      if (filters.estado !== '') params.estado = filters.estado === 'true';

      const response = await crucesService.getCruces(params);
      setCruces(response.data);
      setTotal(response.meta.total);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      console.error('Error loading cruces:', error);
      alert('Error al cargar los cruces');
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
    if (sortField !== field) return <i className="fas fa-sort text-muted ms-1"></i>;
    return sortOrder === 'asc' 
      ? <i className="fas fa-sort-up ms-1"></i>
      : <i className="fas fa-sort-down ms-1"></i>;
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

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de desactivar este cruce?')) return;

    try {
      await crucesService.deleteCruce(id);
      alert('Cruce desactivado exitosamente');
      loadCruces();
    } catch (error) {
      console.error('Error deleting cruce:', error);
      alert('Error al desactivar el cruce');
    }
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-traffic-light me-2"></i>
          Gestión de Cruces
        </h2>
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/cruces/new')}
        >
          <i className="fas fa-plus me-2"></i>
          Nuevo Cruce
        </button>
      </div>

      {/* Filtros */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Buscar por nombre</label>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Código</label>
              <input
                type="text"
                className="form-control"
                placeholder="Código..."
                value={filters.codigo}
                onChange={(e) => handleFilterChange('codigo', e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Estado</label>
              <select
                className="form-select"
                value={filters.estado}
                onChange={(e) => handleFilterChange('estado', e.target.value)}
              >
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button 
                className="btn btn-secondary w-100"
                onClick={() => {
                  setFilters({ search: '', codigo: '', estado: '' });
                  setPage(1);
                }}
              >
                <i className="fas fa-times me-2"></i>
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-bottom">
          <div className="d-flex justify-content-between align-items-center">
            <div className="text-muted small">
              Mostrando {cruces.length} de {total} cruces
            </div>
            <div className="d-flex align-items-center">
              <label className="me-2 small mb-0">Filas por página:</label>
              <select 
                className="form-select form-select-sm" 
                style={{ width: 'auto' }}
                value={limit}
                onChange={(e) => {
                  setLimit(parseInt(e.target.value));
                  setPage(1);
                }}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
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
              <i className="fas fa-inbox fa-3x mb-3"></i>
              <p>No se encontraron cruces</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="px-4 py-3" style={{ cursor: 'pointer' }} onClick={() => handleSort('codigo')}>
                        Código {getSortIcon('codigo')}
                      </th>
                      <th className="py-3" style={{ cursor: 'pointer' }} onClick={() => handleSort('nombre')}>
                        Nombre {getSortIcon('nombre')}
                      </th>
                      <th className="py-3" style={{ cursor: 'pointer' }} onClick={() => handleSort('distrito')}>
                        Distrito {getSortIcon('distrito')}
                      </th>
                      <th className="py-3" style={{ cursor: 'pointer' }} onClick={() => handleSort('estado')}>
                        Estado {getSortIcon('estado')}
                      </th>
                      <th className="py-3">Periféricos</th>
                      <th className="py-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCruces.map((cruce) => (
                      <tr key={cruce.id}>
                        <td className="px-4">
                          <span className="badge bg-secondary">{cruce.codigo || 'N/A'}</span>
                        </td>
                        <td>
                          {cruce.nombre}
                        </td>
                        <td>
                          <small className="text-muted">
                            <i className="fas fa-map-pin me-1"></i>
                            {cruce.ubigeo?.distrito || 'N/A'}
                          </small>
                        </td>
                        <td>
                          <span className={`badge ${cruce.estado ? 'bg-success' : 'bg-danger'}`}>
                            {cruce.estado ? 'ACTIVO' : 'INACTIVO'}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-info">
                            {cruce.crucesPerifericos?.length || 0} dispositivos
                          </span>
                        </td>
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => navigate(`/cruces/${cruce.id}`)}
                            title="Ver detalle"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-warning me-2"
                            onClick={() => navigate(`/cruces/${cruce.id}/edit`)}
                            title="Editar"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(cruce.id)}
                            title="Desactivar"
                            disabled={!cruce.estado}
                          >
                            <i className="fas fa-trash"></i>
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
                          <i className="fas fa-angle-double-left"></i>
                        </button>
                      </li>
                      <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => setPage(page - 1)}
                          disabled={page === 1}
                        >
                          <i className="fas fa-angle-left"></i>
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
                          <i className="fas fa-angle-right"></i>
                        </button>
                      </li>
                      <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => setPage(totalPages)}
                          disabled={page === totalPages}
                        >
                          <i className="fas fa-angle-double-right"></i>
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
    </div>
  );
}
