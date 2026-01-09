import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { areasService, Area } from '../../../services/admin.service';
import { customSelectStylesSmall } from '../../../styles/react-select-custom';

type SortField = 'id' | 'codigo' | 'nombre' | 'estado';
type SortOrder = 'asc' | 'desc';

const AreasManagement: React.FC = () => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [allAreas, setAllAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    estado: true
  });

  // Paginación
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Ordenamiento
  const [sortField, setSortField] = useState<SortField>('nombre');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Filtros
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    estado: '' as '' | 'true' | 'false',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFiltersAndPagination();
  }, [page, limit, filters, sortField, sortOrder, allAreas]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await areasService.getAll();
      setAllAreas(data);
    } catch (error) {
      console.error('Error al cargar áreas:', error);
      alert('Error al cargar áreas');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndPagination = () => {
    let filtered = [...allAreas];

    // Aplicar filtros
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(area =>
        (area.nombre?.toLowerCase().includes(searchLower)) ||
        (area.codigo?.toLowerCase().includes(searchLower))
      );
    }

    if (filters.estado !== '') {
      const estadoBool = filters.estado === 'true';
      filtered = filtered.filter(area => area.estado === estadoBool);
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortField) {
        case 'id':
          aVal = a.id;
          bVal = b.id;
          break;
        case 'codigo':
          aVal = a.codigo || '';
          bVal = b.codigo || '';
          break;
        case 'nombre':
          aVal = a.nombre || '';
          bVal = b.nombre || '';
          break;
        case 'estado':
          aVal = a.estado ? 1 : 0;
          bVal = b.estado ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    // Calcular paginación
    setTotal(filtered.length);
    setTotalPages(Math.ceil(filtered.length / limit));

    // Aplicar paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    setAreas(filtered.slice(startIndex, endIndex));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingArea) {
        await areasService.update(editingArea.id, formData);
      } else {
        await areasService.create(formData);
      }
      
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error al guardar área:', error);
      alert('Error al guardar área');
    }
  };

  const handleEdit = (area: Area) => {
    setEditingArea(area);
    setFormData({
      nombre: area.nombre || '',
      codigo: area.codigo || '',
      estado: area.estado ?? true
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de desactivar esta área?')) return;
    
    try {
      await areasService.delete(id);
      loadData();
    } catch (error) {
      console.error('Error al eliminar área:', error);
      alert('Error al eliminar área');
    }
  };

  const resetForm = () => {
    setFormData({ nombre: '', codigo: '', estado: true });
    setEditingArea(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-building me-2"></i>
          Gestión de Áreas
        </h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          <i className="fas fa-plus me-2"></i>
          Nueva Área
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Filtros */}
          <div className="card border-0 shadow-sm mb-3">
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
                <div className="row g-2">
                  <div className="col-md-6">
                    <label className="form-label small">Buscar</label>
                    <input
                      type="text"
                      className="form-control custom-input-sm"
                      placeholder="Nombre o código..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small">Estado</label>
                    <Select
                      options={[
                        { value: '', label: 'Todos' },
                        { value: 'true', label: 'Activos' },
                        { value: 'false', label: 'Inactivos' }
                      ]}
                      value={filters.estado === 'true' ? { value: 'true', label: 'Activos' } : filters.estado === 'false' ? { value: 'false', label: 'Inactivos' } : { value: '', label: 'Todos' }}
                      onChange={(option) => handleFilterChange('estado', option?.value || '')}
                      isClearable
                      styles={customSelectStylesSmall}
                    />
                  </div>
                  <div className="col-md-2 d-flex align-items-end">
                    <button
                      className="btn btn-outline-secondary btn-sm w-100"
                      onClick={() => {
                        setFilters({ search: '', estado: '' });
                        setPage(1);
                      }}
                      title="Limpiar filtros"
                    >
                      <i className="fas fa-eraser me-1"></i>
                      Limpiar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>
                        ID {getSortIcon('id')}
                      </th>
                      <th onClick={() => handleSort('codigo')} style={{ cursor: 'pointer' }}>
                        Código {getSortIcon('codigo')}
                      </th>
                      <th onClick={() => handleSort('nombre')} style={{ cursor: 'pointer' }}>
                        Nombre {getSortIcon('nombre')}
                      </th>
                      <th onClick={() => handleSort('estado')} style={{ cursor: 'pointer' }}>
                        Estado {getSortIcon('estado')}
                      </th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {areas.map(area => (
                    <tr key={area.id}>
                      <td>{area.id}</td>
                      <td>{area.codigo || '-'}</td>
                      <td>{area.nombre}</td>
                      <td>
                        <span className={`badge ${area.estado ? 'bg-success' : 'bg-secondary'}`}>
                          {area.estado ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => handleEdit(area)}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        {area.estado && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(area.id)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    <span className="text-muted">
                      Mostrando {(page - 1) * limit + 1} - {Math.min(page * limit, total)} de {total} áreas
                    </span>
                  </div>
                  <div className="d-flex gap-2 align-items-center">
                    <Select
                      options={[
                        { value: 10, label: '10 por página' },
                        { value: 25, label: '25 por página' },
                        { value: 50, label: '50 por página' },
                        { value: 100, label: '100 por página' }
                      ]}
                      value={{ value: limit, label: `${limit} por página` }}
                      onChange={(option) => { setLimit(Number(option?.value || 10)); setPage(1); }}
                      styles={customSelectStylesSmall}
                    />
                    <nav>
                      <ul className="pagination pagination-sm mb-0">
                        <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                          >
                            Anterior
                          </button>
                        </li>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }
                          return (
                            <li key={pageNum} className={`page-item ${page === pageNum ? 'active' : ''}`}>
                              <button className="page-link" onClick={() => setPage(pageNum)}>
                                {pageNum}
                              </button>
                            </li>
                          );
                        })}
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
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingArea ? 'Editar Área' : 'Nueva Área'}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nombre *</label>
                    <input
                      type="text"
                      className="form-control custom-input"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Código</label>
                    <input
                      type="text"
                      className="form-control custom-input"
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                      maxLength={10}
                    />
                  </div>

                  <div className="mb-3 form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="estadoCheck"
                      checked={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="estadoCheck">
                      Activo
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingArea ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AreasManagement;
