import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { toast } from 'react-hot-toast';
import { ejesService, Eje } from '../../../services/admin.service';
import { customSelectStylesSmall } from '../../../styles/react-select-custom';
import { PageHeader } from '../../../components/ui/PageHeader';

type SortField = 'id' | 'nombreVia' | 'tipoVia' | 'nroCarriles' | 'ciclovia';
type SortOrder = 'asc' | 'desc';

const EjesManagement: React.FC = () => {
  const [ejes, setEjes] = useState<Eje[]>([]);
  const [allEjes, setAllEjes] = useState<Eje[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingEje, setEditingEje] = useState<Eje | null>(null);
  const [formData, setFormData] = useState({
    nombreVia: '',
    tipoVia: '',
    nroCarriles: null as number | null,
    ciclovia: false,
    observaciones: ''
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortField, setSortField] = useState<SortField>('nombreVia');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ search: '', ciclovia: '' as '' | 'true' | 'false' });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFiltersAndPagination();
  }, [page, limit, filters, sortField, sortOrder, allEjes]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await ejesService.getAll();
      setAllEjes(data);
    } catch (error) {
      console.error('Error al cargar ejes:', error);
      toast.error('Error al cargar ejes');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndPagination = () => {
    let filtered = [...allEjes];
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(e => e.nombreVia?.toLowerCase().includes(searchLower));
    }
    if (filters.ciclovia !== '') {
      const cicloviaBool = filters.ciclovia === 'true';
      filtered = filtered.filter(e => e.ciclovia === cicloviaBool);
    }
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case 'id': aVal = a.id; bVal = b.id; break;
        case 'nombreVia': aVal = a.nombreVia || ''; bVal = b.nombreVia || ''; break;
        case 'tipoVia': aVal = a.tipoVia || ''; bVal = b.tipoVia || ''; break;
        case 'nroCarriles': aVal = a.nroCarriles || 0; bVal = b.nroCarriles || 0; break;
        case 'ciclovia': aVal = a.ciclovia ? 1 : 0; bVal = b.ciclovia ? 1 : 0; break;
        default: return 0;
      }
      if (typeof aVal === 'string') return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
    setTotal(filtered.length);
    setTotalPages(Math.ceil(filtered.length / limit));
    setEjes(filtered.slice((page - 1) * limit, page * limit));
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
      if (editingEje) {
        await ejesService.update(editingEje.id, formData);
        toast.success('Eje vial actualizado exitosamente');
      } else {
        await ejesService.create(formData);
        toast.success('Eje vial registrado exitosamente');
      }
      
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Error al guardar eje:', error);
      toast.error(error.response?.data?.message || 'Error al guardar eje');
    }
  };

  const handleEdit = (eje: Eje) => {
    setEditingEje(eje);
    setFormData({
      nombreVia: eje.nombreVia || '',
      tipoVia: eje.tipoVia,
      nroCarriles: eje.nroCarriles,
      ciclovia: eje.ciclovia ?? false,
      observaciones: eje.observaciones || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este eje?')) return;
    
    try {
      await ejesService.delete(id);
      toast.success('Eje vial eliminado exitosamente');
      loadData();
    } catch (error: any) {
      console.error('Error al eliminar eje:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar eje');
    }
  };

  const resetForm = () => {
    setFormData({ nombreVia: '', tipoVia: null, nroCarriles: null, ciclovia: false, observaciones: '' });
    setEditingEje(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  return (
    <div className="container-fluid p-3">
      <PageHeader
        icon="fa-solid fa-road"
        title="Gestión de Ejes Viales"
        subtitle="Catálogo y administración de vías, carriles y ciclovías del sistema"
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
              Nuevo Eje
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="card border shadow-sm p-5 text-center">
          <div className="spinner-border text-primary mx-auto mb-2" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <small className="text-muted">Cargando ejes viales...</small>
        </div>
      ) : (
        <>
          {showFilters && (
            <div className="card border shadow-sm mb-3">
              <div className="card-header bg-white border-bottom py-2">
                <h6 className="card-title mb-0 fw-semibold text-dark" style={{ fontSize: '14px' }}>
                  <i className="fa-solid fa-sliders me-2 text-primary"></i>
                  Filtros de Ejes Viales
                </h6>
              </div>
              <div className="card-body py-3">
                <div className="row g-2">
                  <div className="col-md-7">
                    <label className="form-label small fw-bold text-muted mb-1">Buscar por Nombre de Vía</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm" 
                      placeholder="Escriba nombre de la vía..." 
                      value={filters.search} 
                      onChange={(e) => handleFilterChange('search', e.target.value)} 
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-bold text-muted mb-1">Ciclovía</label>
                    <Select
                      options={[
                        { value: '', label: 'Todos' },
                        { value: 'true', label: 'Con Ciclovía' },
                        { value: 'false', label: 'Sin Ciclovía' }
                      ]}
                      value={filters.ciclovia === 'true' ? { value: 'true', label: 'Con Ciclovía' } : filters.ciclovia === 'false' ? { value: 'false', label: 'Sin Ciclovía' } : { value: '', label: 'Todos' }}
                      onChange={(option) => handleFilterChange('ciclovia', option?.value || '')}
                      isClearable
                      styles={customSelectStylesSmall}
                      placeholder="Seleccione..."
                    />
                  </div>
                  <div className="col-md-2 d-flex align-items-end">
                    <button 
                      className="btn btn-outline-secondary btn-sm w-100" 
                      onClick={() => { setFilters({ search: '', ciclovia: '' }); setPage(1); }}
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
                Listado de Ejes Viales ({total} registros)
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
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('nombreVia')}>
                        Nombre de Vía {getSortIcon('nombreVia')}
                      </th>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('tipoVia')}>
                        Tipo Vía {getSortIcon('tipoVia')}
                      </th>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('nroCarriles')}>
                        Carriles {getSortIcon('nroCarriles')}
                      </th>
                      <th style={{ width: '120px', cursor: 'pointer' }} className="text-center" onClick={() => handleSort('ciclovia')}>
                        Ciclovía {getSortIcon('ciclovia')}
                      </th>
                      <th>Observaciones</th>
                      <th style={{ width: '100px' }} className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: '13px' }}>
                    {ejes.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4 text-muted">
                          <i className="fa-solid fa-inbox fa-2x mb-2 d-block text-secondary"></i>
                          No se encontraron registros
                        </td>
                      </tr>
                    ) : (
                      ejes.map(eje => (
                        <tr key={eje.id}>
                          <td className="fw-semibold text-secondary">#{eje.id}</td>
                          <td className="fw-medium text-dark">{eje.nombreVia || '-'}</td>
                          <td>
                            {eje.tipoVia ? (
                              <span className="badge bg-light text-dark border">
                                Tipo {eje.tipoVia}
                              </span>
                            ) : '-'}
                          </td>
                          <td>
                            {eje.nroCarriles ? (
                              <span>
                                <i className="fa-solid fa-arrows-split-up-and-left me-1 text-secondary small"></i>
                                {eje.nroCarriles}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="text-center">
                            <span className={`badge ${eje.ciclovia ? 'bg-success' : 'bg-secondary'}`}>
                              <i className={`fa-solid ${eje.ciclovia ? 'fa-bicycle me-1' : ''}`}></i>
                              {eje.ciclovia ? 'Sí' : 'No'}
                            </span>
                          </td>
                          <td className="text-muted small">
                            {eje.observaciones ? eje.observaciones.substring(0, 50) + (eje.observaciones.length > 50 ? '...' : '') : '-'}
                          </td>
                          <td className="text-center">
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-primary btn-sm py-1 px-2"
                                onClick={() => handleEdit(eje)}
                                title="Editar"
                              >
                                <i className="fa-solid fa-pen-to-square"></i>
                              </button>
                              <button
                                className="btn btn-outline-danger btn-sm py-1 px-2"
                                onClick={() => handleDelete(eje.id)}
                                title="Eliminar"
                              >
                                <i className="fa-solid fa-trash-can"></i>
                              </button>
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
                  <i className="fa-solid fa-road me-2 text-primary"></i>
                  {editingEje ? 'Editar Eje Vial' : 'Nuevo Eje Vial'}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-3">
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">Nombre de Vía *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={formData.nombreVia}
                      onChange={(e) => setFormData({ ...formData, nombreVia: e.target.value })}
                      required
                      placeholder="Ej: Av. Javier Prado Este"
                    />
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">Tipo de Vía</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={formData.tipoVia || ''}
                        onChange={(e) => setFormData({ ...formData, tipoVia: e.target.value ? Number(e.target.value) : null })}
                        placeholder="Código de tipo"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">Número de Carriles</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={formData.nroCarriles || ''}
                        onChange={(e) => setFormData({ ...formData, nroCarriles: e.target.value ? Number(e.target.value) : null })}
                        min="1"
                        placeholder="Ej: 3"
                      />
                    </div>
                  </div>

                  <div className="form-check form-switch my-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="cicloviaCheck"
                      checked={formData.ciclovia}
                      onChange={(e) => setFormData({ ...formData, ciclovia: e.target.checked })}
                    />
                    <label className="form-check-label small fw-bold text-secondary" htmlFor="cicloviaCheck">
                      Cuenta con Ciclovía
                    </label>
                  </div>

                  <div className="mb-2">
                    <label className="form-label small fw-bold text-secondary">Observaciones Adicionales</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={3}
                      value={formData.observaciones}
                      onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                      placeholder="Detalles sobre el estado o características del eje vial..."
                    />
                  </div>
                </div>
                <div className="modal-footer bg-light border-top py-2">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={handleCloseModal}>
                    <i className="fa-solid fa-xmark me-1"></i> Cancelar
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary">
                    <i className="fa-solid fa-floppy-disk me-1"></i>
                    {editingEje ? 'Actualizar' : 'Guardar'}
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

export default EjesManagement;

