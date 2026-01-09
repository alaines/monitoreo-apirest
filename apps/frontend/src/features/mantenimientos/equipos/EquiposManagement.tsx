import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { equiposService, Equipo } from '../../../services/admin.service';
import { customSelectStylesSmall } from '../../../styles/react-select-custom';

type SortField = 'id' | 'nombre' | 'estado';
type SortOrder = 'asc' | 'desc';

const EquiposManagement: React.FC = () => {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [allEquipos, setAllEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingEquipo, setEditingEquipo] = useState<Equipo | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    estado: true
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortField, setSortField] = useState<SortField>('nombre');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
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
  }, [page, limit, filters, sortField, sortOrder, allEquipos]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await equiposService.getAll();
      setAllEquipos(data);
    } catch (error) {
      console.error('Error al cargar equipos:', error);
      alert('Error al cargar equipos');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndPagination = () => {
    let filtered = [...allEquipos];
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(eq => eq.nombre?.toLowerCase().includes(searchLower));
    }
    if (filters.estado !== '') {
      const estadoBool = filters.estado === 'true';
      filtered = filtered.filter(eq => eq.estado === estadoBool);
    }
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case 'id': aVal = a.id; bVal = b.id; break;
        case 'nombre': aVal = a.nombre || ''; bVal = b.nombre || ''; break;
        case 'estado': aVal = a.estado ? 1 : 0; bVal = b.estado ? 1 : 0; break;
        default: return 0;
      }
      if (typeof aVal === 'string') return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
    setTotal(filtered.length);
    setTotalPages(Math.ceil(filtered.length / limit));
    setEquipos(filtered.slice((page - 1) * limit, page * limit));
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
    return sortOrder === 'asc' ? <i className="fas fa-sort-up ms-1"></i> : <i className="fas fa-sort-down ms-1"></i>;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingEquipo) {
        await equiposService.update(editingEquipo.id, formData);
      } else {
        await equiposService.create(formData);
      }
      
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error al guardar equipo:', error);
      alert('Error al guardar equipo');
    }
  };

  const handleEdit = (equipo: Equipo) => {
    setEditingEquipo(equipo);
    setFormData({
      nombre: equipo.nombre || '',
      estado: equipo.estado ?? true
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de desactivar este equipo?')) return;
    
    try {
      await equiposService.delete(id);
      loadData();
    } catch (error) {
      console.error('Error al eliminar equipo:', error);
      alert('Error al eliminar equipo');
    }
  };

  const resetForm = () => {
    setFormData({ nombre: '', estado: true });
    setEditingEquipo(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-users-cog me-2"></i>
          Gestión de Equipos
        </h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          <i className="fas fa-plus me-2"></i>
          Nuevo Equipo
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
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-header bg-white border-bottom">
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowFilters(!showFilters)}>
                <i className="fas fa-filter me-2"></i>
                {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
              </button>
            </div>
            {showFilters && (
              <div className="card-body">
                <div className="row g-2">
                  <div className="col-md-8">
                    <label className="form-label small">Buscar</label>
                    <input type="text" className="form-control form-control-sm" placeholder="Nombre..." value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} />
                  </div>
                  <div className="col-md-2">
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
                    <button className="btn btn-outline-secondary btn-sm w-100" onClick={() => { setFilters({ search: '', estado: '' }); setPage(1); }}>
                      <i className="fas fa-eraser me-1"></i> Limpiar
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
                      <th onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>ID {getSortIcon('id')}</th>
                      <th onClick={() => handleSort('nombre')} style={{ cursor: 'pointer' }}>Nombre {getSortIcon('nombre')}</th>
                      <th onClick={() => handleSort('estado')} style={{ cursor: 'pointer' }}>Estado {getSortIcon('estado')}</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipos.map(equipo => (
                    <tr key={equipo.id}>
                      <td>{equipo.id}</td>
                      <td>{equipo.nombre}</td>
                      <td>
                        <span className={`badge ${equipo.estado ? 'bg-success' : 'bg-secondary'}`}>
                          {equipo.estado ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => handleEdit(equipo)}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        {equipo.estado && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(equipo.id)}
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
            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-3">
                <span className="text-muted">Mostrando {(page - 1) * limit + 1} - {Math.min(page * limit, total)} de {total}</span>
                <div className="d-flex gap-2 align-items-center">
                  <Select
                    options={[
                      { value: 10, label: '10 por página' },
                      { value: 25, label: '25 por página' },
                      { value: 50, label: '50 por página' }
                    ]}
                    value={{ value: limit, label: `${limit} por página` }}
                    onChange={(option) => { setLimit(Number(option?.value || 10)); setPage(1); }}
                    styles={customSelectStylesSmall}
                  />
                  <nav>
                    <ul className="pagination pagination-sm mb-0">
                      <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => setPage(page - 1)} disabled={page === 1}>Anterior</button>
                      </li>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                        return <li key={pageNum} className={`page-item ${page === pageNum ? 'active' : ''}`}><button className="page-link" onClick={() => setPage(pageNum)}>{pageNum}</button></li>;
                      })}
                      <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => setPage(page + 1)} disabled={page === totalPages}>Siguiente</button>
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

      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingEquipo ? 'Editar Equipo' : 'Nuevo Equipo'}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nombre *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      required
                      maxLength={25}
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
                    {editingEquipo ? 'Actualizar' : 'Crear'}
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

export default EquiposManagement;
