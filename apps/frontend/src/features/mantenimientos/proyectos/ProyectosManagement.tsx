import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { toast } from 'react-hot-toast';
import { proyectosService, Proyecto } from '../../../services/admin.service';
import { customSelectStylesSmall } from '../../../styles/react-select-custom';
import { PageHeader } from '../../../components/ui/PageHeader';

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
      toast.error('Error al cargar proyectos');
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
    if (sortField !== field) return <i className="fa-solid fa-sort text-muted ms-1"></i>;
    return sortOrder === 'asc' ? <i className="fa-solid fa-sort-up text-primary ms-1"></i> : <i className="fa-solid fa-sort-down text-primary ms-1"></i>;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingProyecto) {
        await proyectosService.update(editingProyecto.id, formData);
        toast.success('Proyecto actualizado exitosamente');
      } else {
        await proyectosService.create(formData);
        toast.success('Proyecto registrado exitosamente');
      }
      
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Error al guardar proyecto:', error);
      toast.error(error.response?.data?.message || 'Error al guardar proyecto');
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
    if (!window.confirm('¿Está seguro de desactivar este proyecto?')) return;
    
    try {
      await proyectosService.delete(id);
      toast.success('Proyecto desactivado exitosamente');
      loadData();
    } catch (error: any) {
      console.error('Error al eliminar proyecto:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar proyecto');
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
    <div className="container-fluid p-3">
      <PageHeader
        icon="fa-solid fa-diagram-project"
        title="Gestión de Proyectos"
        subtitle="Seguimiento de proyectos viales, etapas de ejecución y redes asociadas"
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
              Nuevo Proyecto
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="card border shadow-sm p-5 text-center">
          <div className="spinner-border text-primary mx-auto mb-2" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <small className="text-muted">Cargando proyectos...</small>
        </div>
      ) : (
        <>
          {showFilters && (
            <div className="card border shadow-sm mb-3">
              <div className="card-header bg-white border-bottom py-2">
                <h6 className="card-title mb-0 fw-semibold text-dark" style={{ fontSize: '14px' }}>
                  <i className="fa-solid fa-sliders me-2 text-primary"></i>
                  Filtros de Proyectos
                </h6>
              </div>
              <div className="card-body py-3">
                <div className="row g-2">
                  <div className="col-md-7">
                    <label className="form-label small fw-bold text-muted mb-1">Buscar por Siglas o Nombre</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm" 
                      placeholder="Escriba siglas o nombre del proyecto..." 
                      value={filters.search} 
                      onChange={(e) => handleFilterChange('search', e.target.value)} 
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-bold text-muted mb-1">Estado</label>
                    <Select
                      options={[
                        { value: '', label: 'Todos los estados' },
                        { value: 'true', label: 'Activos' },
                        { value: 'false', label: 'Inactivos' }
                      ]}
                      value={filters.estado === 'true' ? { value: 'true', label: 'Activos' } : filters.estado === 'false' ? { value: 'false', label: 'Inactivos' } : { value: '', label: 'Todos los estados' }}
                      onChange={(option) => handleFilterChange('estado', option?.value || '')}
                      isClearable
                      styles={customSelectStylesSmall}
                      placeholder="Seleccione..."
                    />
                  </div>
                  <div className="col-md-2 d-flex align-items-end">
                    <button 
                      className="btn btn-outline-secondary btn-sm w-100" 
                      onClick={() => { setFilters({ search: '', estado: '' }); setPage(1); }}
                    >
                      <i className="fa-solid fa-eraser me-1"></i> Limpiar
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
                Listado de Proyectos ({total} registros)
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
                      <th style={{ width: '100px', cursor: 'pointer' }} onClick={() => handleSort('siglas')}>
                        Siglas {getSortIcon('siglas')}
                      </th>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('nombre')}>
                        Nombre del Proyecto {getSortIcon('nombre')}
                      </th>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('etapa')}>
                        Etapa {getSortIcon('etapa')}
                      </th>
                      <th>Empresa</th>
                      <th style={{ width: '100px', cursor: 'pointer' }} onClick={() => handleSort('ano_proyecto')}>
                        Año {getSortIcon('ano_proyecto')}
                      </th>
                      <th style={{ width: '120px', cursor: 'pointer' }} className="text-center" onClick={() => handleSort('estado')}>
                        Estado {getSortIcon('estado')}
                      </th>
                      <th style={{ width: '100px' }} className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: '13px' }}>
                    {proyectos.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-4 text-muted">
                          <i className="fa-solid fa-inbox fa-2x mb-2 d-block text-secondary"></i>
                          No se encontraron registros
                        </td>
                      </tr>
                    ) : (
                      proyectos.map(proyecto => (
                        <tr key={proyecto.id}>
                          <td className="fw-semibold text-secondary">#{proyecto.id}</td>
                          <td>
                            {proyecto.siglas ? (
                              <span className="badge bg-light text-primary border fw-bold">
                                {proyecto.siglas}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="fw-medium text-dark">{proyecto.nombre || '-'}</td>
                          <td>
                            {proyecto.etapa ? (
                              <span className="badge bg-light text-dark border">
                                {proyecto.etapa}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="text-secondary small">{proyecto.ejecutado_x_empresa || '-'}</td>
                          <td className="fw-semibold text-secondary">{proyecto.ano_proyecto || '-'}</td>
                          <td className="text-center">
                            <span className={`badge ${proyecto.estado ? 'bg-success' : 'bg-secondary'}`}>
                              {proyecto.estado ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-primary btn-sm py-1 px-2"
                                onClick={() => handleEdit(proyecto)}
                                title="Editar"
                              >
                                <i className="fa-solid fa-pen-to-square"></i>
                              </button>
                              {proyecto.estado && (
                                <button
                                  className="btn btn-outline-danger btn-sm py-1 px-2"
                                  onClick={() => handleDelete(proyecto.id)}
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

      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-light border-bottom py-2">
                <h5 className="modal-title fs-6 fw-bold text-dark">
                  <i className="fa-solid fa-diagram-project me-2 text-primary"></i>
                  {editingProyecto ? 'Editar Proyecto' : 'Nuevo Proyecto'}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-3">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-secondary">Siglas</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.siglas}
                        onChange={(e) => setFormData({ ...formData, siglas: e.target.value })}
                        maxLength={6}
                        placeholder="Ej: PRJ-01"
                      />
                    </div>

                    <div className="col-md-8">
                      <label className="form-label small fw-bold text-secondary">Nombre del Proyecto *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        required
                        placeholder="Ej: Ampliación de Corredor Central"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">Etapa</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.etapa}
                        onChange={(e) => setFormData({ ...formData, etapa: e.target.value })}
                        placeholder="Ej: Fase 2"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">Empresa Ejecutora</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.ejecutado_x_empresa}
                        onChange={(e) => setFormData({ ...formData, ejecutado_x_empresa: e.target.value })}
                        maxLength={255}
                        placeholder="Ej: Consorcio Vial Lima"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">Año del Proyecto</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={formData.ano_proyecto || ''}
                        onChange={(e) => setFormData({ ...formData, ano_proyecto: e.target.value ? Number(e.target.value) : null })}
                        min="1900"
                        max="2100"
                        placeholder="Ej: 2026"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">Red Asignada</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.red}
                        onChange={(e) => setFormData({ ...formData, red: e.target.value })}
                        maxLength={255}
                        placeholder="Ej: Red Troncal Norte"
                      />
                    </div>

                    <div className="col-12">
                      <div className="form-check form-switch">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="estadoCheck"
                          checked={formData.estado}
                          onChange={(e) => setFormData({ ...formData, estado: e.target.checked })}
                        />
                        <label className="form-check-label small fw-bold text-secondary" htmlFor="estadoCheck">
                          Estado Activo
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light border-top py-2">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={handleCloseModal}>
                    <i className="fa-solid fa-xmark me-1"></i> Cancelar
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary">
                    <i className="fa-solid fa-floppy-disk me-1"></i>
                    {editingProyecto ? 'Actualizar' : 'Guardar'}
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

