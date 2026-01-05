import React, { useState, useEffect } from 'react';
import { responsablesService, equiposService, Responsable, Equipo } from '../../../services/admin.service';

const ResponsablesManagement: React.FC = () => {
  const [responsables, setResponsables] = useState<Responsable[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingResponsable, setEditingResponsable] = useState<Responsable | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    equipoId: null as number | null,
    estado: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [responsablesData, equiposData] = await Promise.all([
        responsablesService.getAll(),
        equiposService.getAll()
      ]);
      setResponsables(responsablesData);
      setEquipos(equiposData.filter((e: Equipo) => e.estado));
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar datos');
    } finally {
      setLoading(false);
    }
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
        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Equipo</th>
                    <th>Estado</th>
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
          </div>
        </div>
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
