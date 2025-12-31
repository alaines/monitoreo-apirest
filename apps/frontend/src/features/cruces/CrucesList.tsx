import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { crucesService, Cruce } from '../../services/cruces.service';

export function CrucesList() {
  const navigate = useNavigate();
  const [cruces, setCruces] = useState<Cruce[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
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
    <div className="container-fluid py-4">
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
      <div className="card mb-4">
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
      <div className="card">
        <div className="card-body">
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
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Código</th>
                      <th>Nombre</th>
                      <th>Ubicación</th>
                      <th>Estado</th>
                      <th>Periféricos</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cruces.map((cruce) => (
                      <tr key={cruce.id}>
                        <td>
                          <span className="badge bg-secondary">{cruce.codigo || 'N/A'}</span>
                        </td>
                        <td>
                          <strong>{cruce.nombre}</strong>
                        </td>
                        <td>
                          <small className="text-muted">
                            <i className="fas fa-map-marker-alt me-1"></i>
                            {cruce.latitud?.toFixed(6)}, {cruce.longitud?.toFixed(6)}
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
                        <td className="text-end">
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
              <div className="d-flex justify-content-between align-items-center mt-3">
                <div className="text-muted">
                  Mostrando {((page - 1) * limit) + 1} - {Math.min(page * limit, total)} de {total} cruces
                </div>
                <nav>
                  <ul className="pagination mb-0">
                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                      >
                        Anterior
                      </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <li key={p} className={`page-item ${page === p ? 'active' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                      >
                        Siguiente
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
