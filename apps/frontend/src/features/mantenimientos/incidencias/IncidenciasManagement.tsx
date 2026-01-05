import React, { useState, useEffect } from 'react';
import { incidenciasService, Incidencia } from '../../../services/admin.service';

const IncidenciasManagement: React.FC = () => {
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingIncidencia, setEditingIncidencia] = useState<Incidencia | null>(null);
  const [formData, setFormData] = useState({
    tipo: '',
    parentId: null as number | null,
    prioridadId: null as number | null,
    caracteristica: '',
    estado: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await incidenciasService.getAll();
      setIncidencias(data);
    } catch (error) {
      console.error('Error al cargar incidencias:', error);
      alert('Error al cargar incidencias');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingIncidencia) {
        await incidenciasService.update(editingIncidencia.id, formData);
      } else {
        await incidenciasService.create(formData);
      }
      
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error al guardar incidencia:', error);
      alert('Error al guardar incidencia');
    }
  };

  const handleEdit = (incidencia: Incidencia) => {
    setEditingIncidencia(incidencia);
    setFormData({
      tipo: incidencia.tipo || '',
      parentId: incidencia.parentId,
      prioridadId: incidencia.prioridadId,
      caracteristica: incidencia.caracteristica || '',
      estado: incidencia.estado ?? true
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de desactivar este tipo de incidencia?')) return;
    
    try {
      await incidenciasService.delete(id);
      loadData();
    } catch (error) {
      console.error('Error al eliminar incidencia:', error);
      alert('Error al eliminar incidencia');
    }
  };

  const resetForm = () => {
    setFormData({ tipo: '', parentId: null, prioridadId: null, caracteristica: '', estado: true });
    setEditingIncidencia(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  // Filtrar solo incidencias activas para el selector de padre
  const incidenciasActivas = incidencias.filter(i => i.estado && i.id !== editingIncidencia?.id);

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-exclamation-triangle me-2"></i>
          Gestión de Tipos de Incidencias
        </h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          <i className="fas fa-plus me-2"></i>
          Nuevo Tipo
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
                    <th>Tipo</th>
                    <th>Característica</th>
                    <th>Prioridad</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {incidencias.map(incidencia => (
                    <tr key={incidencia.id}>
                      <td>{incidencia.id}</td>
                      <td>{incidencia.tipo || '-'}</td>
                      <td>{incidencia.caracteristica || '-'}</td>
                      <td>{incidencia.prioridad?.nombre || '-'}</td>
                      <td>
                        <span className={`badge ${incidencia.estado ? 'bg-success' : 'bg-secondary'}`}>
                          {incidencia.estado ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => handleEdit(incidencia)}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        {incidencia.estado && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(incidencia.id)}
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
                  {editingIncidencia ? 'Editar Tipo de Incidencia' : 'Nuevo Tipo de Incidencia'}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Tipo *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                      required
                      maxLength={255}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Característica</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.caracteristica}
                      onChange={(e) => setFormData({ ...formData, caracteristica: e.target.value })}
                      maxLength={2}
                    />
                    <small className="form-text text-muted">Máximo 2 caracteres</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Tipo Padre</label>
                    <select
                      className="form-select"
                      value={formData.parentId || ''}
                      onChange={(e) => setFormData({ ...formData, parentId: e.target.value ? Number(e.target.value) : null })}
                    >
                      <option value="">Sin padre (tipo raíz)</option>
                      {incidenciasActivas.map(inc => (
                        <option key={inc.id} value={inc.id}>
                          {inc.tipo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">ID Prioridad</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.prioridadId || ''}
                      onChange={(e) => setFormData({ ...formData, prioridadId: e.target.value ? Number(e.target.value) : null })}
                    />
                    <small className="form-text text-muted">Debe existir en la tabla de prioridades</small>
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
                    {editingIncidencia ? 'Actualizar' : 'Crear'}
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

export default IncidenciasManagement;
