import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { ejesService, Eje } from '../../../services/admin.service';
import { customSelectStylesSmall } from '../../../styles/react-select-custom';

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
      alert('Error al cargar ejes');
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
    if (sortField !== field) return <i className="fas fa-sort text-muted ms-1"></i>;
    return sortOrder === 'asc' ? <i className="fas fa-sort-up ms-1"></i> : <i className="fas fa-sort-down ms-1"></i>;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingEje) {
        await ejesService.update(editingEje.id, formData);
      } else {
        await ejesService.create(formData);
      }
      
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error al guardar eje:', error);
      alert('Error al guardar eje');
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
    if (!confirm('¿Está seguro de eliminar este eje?')) return;
    
    try {
      await ejesService.delete(id);
      loadData();
    } catch (error) {
      console.error('Error al eliminar eje:', error);
      alert('Error al eliminar eje');
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
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-road me-2"></i>
          Gestión de Ejes
        </h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          <i className="fas fa-plus me-2"></i>
          Nuevo Eje
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
                    <input type="text" className="form-control form-control-sm" placeholder="Nombre de vía..." value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small">Ciclovía</label>
                    <Select
                      options={[
                        { value: '', label: 'Todos' },
                        { value: 'true', label: 'Sí' },
                        { value: 'false', label: 'No' }
                      ]}
                      value={filters.ciclovia === 'true' ? { value: 'true', label: 'Sí' } : filters.ciclovia === 'false' ? { value: 'false', label: 'No' } : { value: '', label: 'Todos' }}
                      onChange={(option) => handleFilterChange('ciclovia', option?.value || '')}
                      isClearable
                      styles={customSelectStylesSmall}
                    />
                  </div>
                  <div className="col-md-2 d-flex align-items-end">
                    <button className="btn btn-outline-secondary btn-sm w-100" onClick={() => { setFilters({ search: '', ciclovia: '' }); setPage(1); }}>
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
                  Mostrando {ejes.length} de {total} registros
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
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('nombreVia')}>
                        Nombre de Vía {getSortIcon('nombreVia')}
                      </th>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('tipoVia')}>
                        Tipo Vía {getSortIcon('tipoVia')}
                      </th>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('nroCarriles')}>
                        Nro Carriles {getSortIcon('nroCarriles')}
                      </th>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('ciclovia')}>
                        Ciclovía {getSortIcon('ciclovia')}
                      </th>
                      <th>Observaciones</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ejes.map(eje => (
                      <tr key={eje.id}>
                        <td>{eje.id}</td>
                        <td>{eje.nombreVia || '-'}</td>
                        <td>{eje.tipoVia || '-'}</td>
                        <td>{eje.nroCarriles || '-'}</td>
                        <td>
                          <span className={`badge ${eje.ciclovia ? 'bg-success' : 'bg-secondary'}`}>
                            {eje.ciclovia ? 'Sí' : 'No'}
                          </span>
                        </td>
                        <td>{eje.observaciones ? eje.observaciones.substring(0, 50) + (eje.observaciones.length > 50 ? '...' : '') : '-'}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => handleEdit(eje)}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(eje.id)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
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
                  {editingEje ? 'Editar Eje' : 'Nuevo Eje'}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nombre de Vía *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.nombreVia}
                      onChange={(e) => setFormData({ ...formData, nombreVia: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Tipo de Vía</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.tipoVia || ''}
                        onChange={(e) => setFormData({ ...formData, tipoVia: e.target.value ? Number(e.target.value) : null })}
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Número de Carriles</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.nroCarriles || ''}
                        onChange={(e) => setFormData({ ...formData, nroCarriles: e.target.value ? Number(e.target.value) : null })}
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="mb-3 form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="cicloviaCheck"
                      checked={formData.ciclovia}
                      onChange={(e) => setFormData({ ...formData, ciclovia: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="cicloviaCheck">
                      Tiene Ciclovía
                    </label>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Observaciones</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={formData.observaciones}
                      onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingEje ? 'Actualizar' : 'Crear'}
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
