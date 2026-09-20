import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { toast } from 'react-hot-toast';
import { areasService, Area } from '../../../services/admin.service';
import { customSelectStylesSmall } from '../../../styles/react-select-custom';
import { PageHeader } from '../../../components/ui/PageHeader';

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
      toast.error('Error al cargar áreas');
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
    if (sortField !== field) return <i className="fa-solid fa-sort text-muted ms-1"></i>;
    return sortOrder === 'asc'
      ? <i className="fa-solid fa-sort-up text-primary ms-1"></i>
      : <i className="fa-solid fa-sort-down text-primary ms-1"></i>;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingArea) {
        await areasService.update(editingArea.id, formData);
        toast.success('Área actualizada exitosamente');
      } else {
        await areasService.create(formData);
        toast.success('Área registrada exitosamente');
      }
      
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Error al guardar área:', error);
      toast.error(error.response?.data?.message || 'Error al guardar área');
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
    if (!window.confirm('¿Está seguro de desactivar esta área?')) return;
    
    try {
      await areasService.delete(id);
      toast.success('Área desactivada exitosamente');
      loadData();
    } catch (error: any) {
      console.error('Error al eliminar área:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar área');
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
    <div className="container-fluid p-3">
      <PageHeader
        icon="fa-solid fa-building"
        title="Gestión de Áreas"
        subtitle="Administración de unidades organizativas y dependencias del sistema"
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
              onClick={() => setShowModal(true)}
            >
              <i className="fa-solid fa-plus me-1"></i>
              Nueva Área
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="card border shadow-sm p-5 text-center">
          <div className="spinner-border text-primary mx-auto mb-2" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <small className="text-muted">Cargando áreas...</small>
        </div>
      ) : (
        <>
          {/* Filtros */}
          {showFilters && (
            <div className="card border shadow-sm mb-3">
              <div className="card-header bg-white border-bottom py-2">
                <h6 className="card-title mb-0 fw-semibold text-dark" style={{ fontSize: '14px' }}>
                  <i className="fa-solid fa-sliders me-2 text-primary"></i>
                  Filtros de Áreas
                </h6>
              </div>
              <div className="card-body py-3">
                <div className="row g-2">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-muted mb-1">Buscar</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Nombre o código de área..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-bold text-muted mb-1">Estado</label>
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
                      <i className="fa-solid fa-eraser me-1"></i>
                      Limpiar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card border shadow-sm">
            <div className="card-header bg-white border-bottom py-2 d-flex justify-content-between align-items-center">
              <h6 className="card-title mb-0 fw-semibold text-dark" style={{ fontSize: '14px' }}>
                <i className="fa-solid fa-list me-2 text-primary"></i>
                Listado de Áreas ({total} registros)
              </h6>
              <div className="d-flex align-items-center gap-2">
                <span className="small text-muted">Mostrar:</span>
                <div style={{ width: '80px' }}>
                  <Select
                    options={[
                      { value: 10, label: '10' },
                      { value: 25, label: '25' },
                      { value: 50, label: '50' },
                      { value: 100, label: '100' }
                    ]}
                    value={{ value: limit, label: String(limit) }}
                    onChange={(option) => { setLimit(Number(option?.value || 10)); setPage(1); }}
                    styles={customSelectStylesSmall}
                    isSearchable={false}
                  />
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover table-striped align-middle mb-0">
                  <thead className="table-light text-uppercase" style={{ fontSize: '12px' }}>
                    <tr>
                      <th style={{ width: '80px', cursor: 'pointer' }} onClick={() => handleSort('id')}>
                        ID {getSortIcon('id')}
                      </th>
                      <th style={{ width: '120px', cursor: 'pointer' }} onClick={() => handleSort('codigo')}>
                        Código {getSortIcon('codigo')}
                      </th>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('nombre')}>
                        Nombre {getSortIcon('nombre')}
                      </th>
                      <th style={{ width: '120px', cursor: 'pointer' }} className="text-center" onClick={() => handleSort('estado')}>
                        Estado {getSortIcon('estado')}
                      </th>
                      <th style={{ width: '100px' }} className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: '13px' }}>
                    {areas.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-4 text-muted">
                          <i className="fa-solid fa-inbox fa-2x mb-2 d-block text-secondary"></i>
                          No se encontraron registros
                        </td>
                      </tr>
                    ) : (
                      areas.map(area => (
                        <tr key={area.id}>
                          <td className="fw-semibold text-secondary">#{area.id}</td>
                          <td><code className="small fw-semibold">{area.codigo || '—'}</code></td>
                          <td className="fw-medium text-dark">{area.nombre}</td>
                          <td className="text-center">
                            <span className={`badge ${area.estado ? 'bg-success' : 'bg-secondary'}`}>
                              {area.estado ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-primary btn-sm py-1 px-2"
                                onClick={() => handleEdit(area)}
                                title="Editar"
                              >
                                <i className="fa-solid fa-pen-to-square"></i>
                              </button>
                              {area.estado && (
                                <button
                                  className="btn btn-outline-danger btn-sm py-1 px-2"
                                  onClick={() => handleDelete(area.id)}
                                  title="Desactivar"
                                >
                                  <i className="fa-solid fa-trash-can"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="card-footer bg-white border-top py-2 d-flex justify-content-between align-items-center">
                <span className="small text-muted">
                  Página {page} de {totalPages} ({total} registros totales)
                </span>
                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setPage(page - 1)}>
                        <i className="fa-solid fa-chevron-left"></i>
                      </button>
                    </li>
                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= page - 1 && pageNum <= page + 1)
                      ) {
                        return (
                          <li key={pageNum} className={`page-item ${page === pageNum ? 'active' : ''}`}>
                            <button className="page-link" onClick={() => setPage(pageNum)}>
                              {pageNum}
                            </button>
                          </li>
                        );
                      } else if (pageNum === page - 2 || pageNum === page + 2) {
                        return <li key={pageNum} className="page-item disabled"><span className="page-link">...</span></li>;
                      }
                      return null;
                    })}
                    <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setPage(page + 1)}>
                        <i className="fa-solid fa-chevron-right"></i>
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
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
