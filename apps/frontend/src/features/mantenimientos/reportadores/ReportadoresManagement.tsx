import React, { useState, useEffect } from 'react';
import { reportadoresService, Reportador } from '../../../services/admin.service';

const ReportadoresManagement: React.FC = () => {
  const [reportadores, setReportadores] = useState<Reportador[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingReportador, setEditingReportador] = useState<Reportador | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    estado: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await reportadoresService.getAll();
      setReportadores(data);
    } catch (error) {
      console.error('Error al cargar reportadores:', error);
      alert('Error al cargar reportadores');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingReportador) {
        await reportadoresService.update(editingReportador.id, formData);
      } else {
        await reportadoresService.create(formData);
      }
      
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error al guardar reportador:', error);
      alert('Error al guardar reportador');
    }
  };

  const handleEdit = (reportador: Reportador) => {
    setEditingReportador(reportador);
    setFormData({
      nombre: reportador.nombre || '',
      estado: reportador.estado ?? true
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de desactivar este reportador?')) return;
    
    try {
      await reportadoresService.delete(id);
      loadData();
    } catch (error) {
      console.error('Error al eliminar reportador:', error);
      alert('Error al eliminar reportador');
    }
  };

  const resetForm = () => {
    setFormData({ nombre: '', estado: true });
    setEditingReportador(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-user-tie me-2"></i>
          Gestión de Reportadores
        </h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          <i className="fas fa-plus me-2"></i>
          Nuevo Reportador
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
                    <th>Nombre</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {reportadores.map(reportador => (
                    <tr key={reportador.id}>
                      <td>{reportador.id}</td>
                      <td>{reportador.nombre}</td>
                      <td>
                        <span className={`badge ${reportador.estado ? 'bg-success' : 'bg-secondary'}`}>
                          {reportador.estado ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => handleEdit(reportador)}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        {reportador.estado && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(reportador.id)}
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
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingReportador ? 'Editar Reportador' : 'Nuevo Reportador'}
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
                      maxLength={255}
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
                    {editingReportador ? 'Actualizar' : 'Crear'}
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

export default ReportadoresManagement;
