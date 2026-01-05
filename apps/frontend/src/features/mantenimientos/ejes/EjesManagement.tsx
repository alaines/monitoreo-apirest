import React, { useState, useEffect } from 'react';
import { ejesService, Eje } from '../../../services/admin.service';

const EjesManagement: React.FC = () => {
  const [ejes, setEjes] = useState<Eje[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingEje, setEditingEje] = useState<Eje | null>(null);
  const [formData, setFormData] = useState({
    nombreVia: '',
    tipoVia: null as number | null,
    nroCarriles: null as number | null,
    ciclovia: false,
    observaciones: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await ejesService.getAll();
      setEjes(data);
    } catch (error) {
      console.error('Error al cargar ejes:', error);
      alert('Error al cargar ejes');
    } finally {
      setLoading(false);
    }
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
        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre de Vía</th>
                    <th>Tipo Vía</th>
                    <th>Nro Carriles</th>
                    <th>Ciclovía</th>
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
          </div>
        </div>
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
