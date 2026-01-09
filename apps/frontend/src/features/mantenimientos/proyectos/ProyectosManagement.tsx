import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { proyectosService, Proyecto } from '../../../services/admin.service';
import { customSelectStylesSmall } from '../../../styles/react-select-custom';

type SortField = 'id' | 'siglas' | 'nombre' | 'etapa' | 'ano_proyecto' | 'estado';
type SortOrder = 'asc' | 'desc';

const ProyectosManagement: React.FC = () => {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [allProyectos, setAllProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProyecto, setEditingProyecto] = useState<Proyecto | null>(null);
  const [formData, setFormData] = useState({
    siglas: '',
    nombre: '',
    etapa: '',
    ejecutado_x_empresa: '',
    ano_proyecto: null as number | null,
    red: '',
    estado: true
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortField, setSortField] = useState<SortField>('nombre');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ search: '', estado: '' as '' | 'true' | 'false' });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFiltersAndPagination();
  }, [page, limit, filters, sortField, sortOrder, allProyectos]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await proyectosService.getAll();
      setAllProyectos(data);
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
      alert('Error al cargar proyectos');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndPagination = () => {
    let filtered = [...allProyectos];
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.siglas?.toLowerCase().includes(searchLower) ||
        p.nombre?.toLowerCase().includes(searchLower)
      );
    }
    if (filters.estado !== '') {
      const estadoBool = filters.estado === 'true';
      filtered = filtered.filter(p => p.estado === estadoBool);
    }
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case 'id': aVal = a.id; bVal = b.id; break;
        case 'siglas': aVal = a.siglas || ''; bVal = b.siglas || ''; break;
        case 'nombre': aVal = a.nombre || ''; bVal = b.nombre || ''; break;
        case 'etapa': aVal = a.etapa || ''; bVal = b.etapa || ''; break;
        case 'ano_proyecto': aVal = a.ano_proyecto || 0; bVal = b.ano_proyecto || 0; break;
        case 'estado': aVal = a.estado ? 1 : 0; bVal = b.estado ? 1 : 0; break;
        default: return 0;
      }
      if (typeof aVal === 'string') return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
    setTotal(filtered.length);
    setTotalPages(Math.ceil(filtered.length / limit));
    setProyectos(filtered.slice((page - 1) * limit, page * limit));
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
      if (editingProyecto) {
        await proyectosService.update(editingProyecto.id, formData);
      } else {
        await proyectosService.create(formData);
      }
      
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error al guardar proyecto:', error);
      alert('Error al guardar proyecto');
    }
  };

  const handleEdit = (proyecto: Proyecto) => {
    setEditingProyecto(proyecto);
    setFormData({
      siglas: proyecto.siglas || '',
      nombre: proyecto.nombre || '',
      etapa: proyecto.etapa || '',
      ejecutado_x_empresa: proyecto.ejecutado_x_empresa || '',
      ano_proyecto: proyecto.ano_proyecto,
      red: proyecto.red || '',
      estado: proyecto.estado ?? true
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de desactivar este proyecto?')) return;
    
    try {
      await proyectosService.delete(id);
      loadData();
    } catch (error) {
      console.error('Error al eliminar proyecto:', error);
      alert('Error al eliminar proyecto');
    }
  };

  const resetForm = () => {
    setFormData({ siglas: '', nombre: '', etapa: '', ejecutado_x_empresa: '', ano_proyecto: null, red: '', estado: true });
    setEditingProyecto(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-project-diagram me-2"></i>
          Gestión de Proyectos
        </h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          <i className="fas fa-plus me-2"></i>
          Nuevo Proyecto
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
                    <input type="text" className="form-control custom-input-sm" placeholder="Siglas o nombre..." value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} />
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
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  Mostrando {proyectos.length} de {total} registros
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
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('siglas')}>
                        Siglas {getSortIcon('siglas')}
                      </th>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('nombre')}>
                        Nombre {getSortIcon('nombre')}
                      </th>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('etapa')}>
                        Etapa {getSortIcon('etapa')}
                      </th>
                      <th>Empresa</th>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('ano_proyecto')}>
                        Año {getSortIcon('ano_proyecto')}
                      </th>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('estado')}>
                        Estado {getSortIcon('estado')}
                      </th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proyectos.map(proyecto => (
                      <tr key={proyecto.id}>
                        <td>{proyecto.id}</td>
                        <td>{proyecto.siglas || '-'}</td>
                        <td>{proyecto.nombre || '-'}</td>
                        <td>{proyecto.etapa || '-'}</td>
                        <td>{proyecto.ejecutado_x_empresa || '-'}</td>
                        <td>{proyecto.ano_proyecto || '-'}</td>
                        <td>
                          <span className={`badge ${proyecto.estado ? 'bg-success' : 'bg-secondary'}`}>
                            {proyecto.estado ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => handleEdit(proyecto)}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        {proyecto.estado && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(proyecto.id)}
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
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingProyecto ? 'Editar Proyecto' : 'Nuevo Proyecto'}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Siglas</label>
                      <input
                        type="text"
                        className="form-control custom-input"
                        value={formData.siglas}
                        onChange={(e) => setFormData({ ...formData, siglas: e.target.value })}
                        maxLength={6}
                      />
                    </div>

                    <div className="col-md-8 mb-3">
                      <label className="form-label">Nombre</label>
                      <input
                        type="text"
                        className="form-control custom-input"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Etapa</label>
                      <input
                        type="text"
                        className="form-control custom-input"
                        value={formData.etapa}
                        onChange={(e) => setFormData({ ...formData, etapa: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Empresa Ejecutora</label>
                      <input
                        type="text"
                        className="form-control custom-input"
                        value={formData.ejecutado_x_empresa}
                        onChange={(e) => setFormData({ ...formData, ejecutado_x_empresa: e.target.value })}
                        maxLength={255}
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Año del Proyecto</label>
                      <input
                        type="number"
                        className="form-control custom-input"
                        value={formData.ano_proyecto || ''}
                        onChange={(e) => setFormData({ ...formData, ano_proyecto: e.target.value ? Number(e.target.value) : null })}
                        min="1900"
                        max="2100"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Red</label>
                      <input
                        type="text"
                        className="form-control custom-input"
                        value={formData.red}
                        onChange={(e) => setFormData({ ...formData, red: e.target.value })}
                        maxLength={255}
                      />
                    </div>
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
                    {editingProyecto ? 'Actualizar' : 'Crear'}
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

export default ProyectosManagement;
