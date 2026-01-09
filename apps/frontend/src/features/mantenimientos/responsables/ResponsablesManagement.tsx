import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { responsablesService, equiposService, Responsable, Equipo } from '../../../services/admin.service';
import { customSelectStylesSmall } from '../../../styles/react-select-custom';

type SortField = 'id' | 'nombre' | 'equipo' | 'estado';
type SortOrder = 'asc' | 'desc';

const ResponsablesManagement: React.FC = () => {
  const [responsables, setResponsables] = useState<Responsable[]>([]);
  const [allResponsables, setAllResponsables] = useState<Responsable[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingResponsable, setEditingResponsable] = useState<Responsable | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    equipoId: null as number | null,
    estado: true
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortField, setSortField] = useState<SortField>('nombre');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ search: '', equipoId: '', estado: '' as '' | 'true' | 'false' });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFiltersAndPagination();
  }, [page, limit, filters, sortField, sortOrder, allResponsables]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [responsablesData, equiposData] = await Promise.all([
        responsablesService.getAll(),
        equiposService.getAll()
      ]);
      setAllResponsables(responsablesData);
      setEquipos(equiposData.filter((e: Equipo) => e.estado));
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndPagination = () => {
    let filtered = [...allResponsables];
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(r => r.nombre?.toLowerCase().includes(searchLower));
    }
    if (filters.equipoId) {
      filtered = filtered.filter(r => r.equipoId === Number(filters.equipoId));
    }
    if (filters.estado !== '') {
      const estadoBool = filters.estado === 'true';
      filtered = filtered.filter(r => r.estado === estadoBool);
    }
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case 'id': aVal = a.id; bVal = b.id; break;
        case 'nombre': aVal = a.nombre || ''; bVal = b.nombre || ''; break;
        case 'equipo':
          const aEquipo = equipos.find(e => e.id === a.equipoId);
          const bEquipo = equipos.find(e => e.id === b.equipoId);
          aVal = aEquipo?.nombre || '';
          bVal = bEquipo?.nombre || '';
          break;
        case 'estado': aVal = a.estado ? 1 : 0; bVal = b.estado ? 1 : 0; break;
        default: return 0;
      }
      if (typeof aVal === 'string') return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
    setTotal(filtered.length);
    setTotalPages(Math.ceil(filtered.length / limit));
    setResponsables(filtered.slice((page - 1) * limit, page * limit));
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
      if (editingResponsable) {
        await responsablesService.update(editingResponsable.id, formData);
      } else {
        await responsablesService.create(formData);
      }
      
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error al guardar responsable:', error);
      alert('Error al guardar responsable');
    }
  };

  const handleEdit = (responsable: Responsable) => {
    setEditingResponsable(responsable);
    setFormData({
      nombre: responsable.nombre || '',
      equipoId: responsable.equipoId,
      estado: responsable.estado ?? true
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de desactivar este responsable?')) return;
    
    try {
      await responsablesService.delete(id);
      loadData();
    } catch (error) {
      console.error('Error al eliminar responsable:', error);
      alert('Error al eliminar responsable');
    }
  };

  const resetForm = () => {
    setFormData({ nombre: '', equipoId: null, estado: true });
    setEditingResponsable(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-user-check me-2"></i>
          Gestión de Responsables
        </h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          <i className="fas fa-plus me-2"></i>
          Nuevo Responsable
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
                  <div className="col-md-4">
                    <label className="form-label small">Buscar</label>
                    <input type="text" className="form-control form-control-sm" placeholder="Nombre..." value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small">Equipo</label>
                    <Select
                      options={[
                        { value: '', label: 'Todos' },
                        ...equipos.map(equipo => ({ value: String(equipo.id), label: equipo.nombre }))
                      ]}
                      value={filters.equipoId ? { value: filters.equipoId, label: equipos.find(e => e.id === Number(filters.equipoId))?.nombre || filters.equipoId } : { value: '', label: 'Todos' }}
                      onChange={(option) => handleFilterChange('equipoId', option?.value || '')}
                      isClearable
                      styles={customSelectStylesSmall}
                    />
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
                  <div className="col-md-3 d-flex align-items-end">
                    <button className="btn btn-outline-secondary btn-sm w-100" onClick={() => { setFilters({ search: '', equipoId: '', estado: '' }); setPage(1); }}>
                      <i className="fas fa-eraser me-1"></i> Limpiar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  Mostrando {responsables.length} de {total} registros
                </div>
                <div>
                  <label className="me-2">Mostrar:</label>
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
                  />
                </div>
              </div>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('id')}>
                        ID {getSortIcon('id')}
                      </th>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('nombre')}>
                        Nombre {getSortIcon('nombre')}
                      </th>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('equipo')}>
                        Equipo {getSortIcon('equipo')}
                      </th>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('estado')}>
                        Estado {getSortIcon('estado')}
                      </th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responsables.map(responsable => (
                      <tr key={responsable.id}>
                        <td>{responsable.id}</td>
                        <td>{responsable.nombre}</td>
                        <td>{responsable.equipo?.nombre || '-'}</td>
                        <td>
                          <span className={`badge ${responsable.estado ? 'bg-success' : 'bg-secondary'}`}>
                            {responsable.estado ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => handleEdit(responsable)}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          {responsable.estado && (
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(responsable.id)}
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
                <nav>
                  <ul className="pagination justify-content-center mb-0">
                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setPage(page - 1)}>
                        <i className="fas fa-chevron-left"></i>
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
                        <i className="fas fa-chevron-right"></i>
                      </button>
                    </li>
                  </ul>
                </nav>
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
                  {editingResponsable ? 'Editar Responsable' : 'Nuevo Responsable'}
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
                      maxLength={30}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Equipo</label>
                    <select
                      className="form-select"
                      value={formData.equipoId || ''}
                      onChange={(e) => setFormData({ ...formData, equipoId: e.target.value ? Number(e.target.value) : null })}
                    >
                      <option value="">Sin equipo asignado</option>
                      {equipos.map(equipo => (
                        <option key={equipo.id} value={equipo.id}>
                          {equipo.nombre}
                        </option>
                      ))}
                    </select>
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
                    {editingResponsable ? 'Actualizar' : 'Crear'}
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

export default ResponsablesManagement;
