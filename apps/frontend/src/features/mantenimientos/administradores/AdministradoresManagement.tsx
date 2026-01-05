import React, { useState, useEffect } from 'react';
import { administradoresService, Administrador } from '../../../services/admin.service';

const AdministradoresManagement: React.FC = () => {
  const [administradores, setAdministradores] = useState<Administrador[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingAdministrador, setEditingAdministrador] = useState<Administrador | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    responsable: '',
    telefono: null as number | null,
    email: '',
    estado: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await administradoresService.getAll();
      setAdministradores(data);
    } catch (error) {
      console.error('Error al cargar administradores:', error);
      alert('Error al cargar administradores');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAdministrador) {
        await administradoresService.update(editingAdministrador.id, formData);
      } else {
        await administradoresService.create(formData);
      }
      
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error al guardar administrador:', error);
      alert('Error al guardar administrador');
    }
  };

  const handleEdit = (admin: Administrador) => {
    setEditingAdministrador(admin);
    setFormData({
      nombre: admin.nombre || '',
      responsable: admin.responsable || '',
      telefono: admin.telefono,
      email: admin.email || '',
      estado: admin.estado ?? true
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de desactivar este administrador?')) return;
    
    try {
      await administradoresService.delete(id);
      loadData();
    } catch (error) {
      console.error('Error al eliminar administrador:', error);
      alert('Error al eliminar administrador');
    }
  };

  const resetForm = () => {
    setFormData({ nombre: '', responsable: '', telefono: null, email: '', estado: true });
    setEditingAdministrador(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-user-shield me-2"></i>
          Gestión de Administradores
        </h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          <i className="fas fa-plus me-2"></i>
          Nuevo Administrador
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
                    <th>Responsable</th>
                    <th>Teléfono</th>
                    <th>Email</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {administradores.map(admin => (
                    <tr key={admin.id}>
                      <td>{admin.id}</td>
                      <td>{admin.nombre}</td>
                      <td>{admin.responsable || '-'}</td>
                      <td>{admin.telefono || '-'}</td>
                      <td>{admin.email || '-'}</td>
                      <td>
                        <span className={`badge ${admin.estado ? 'bg-success' : 'bg-secondary'}`}>
                          {admin.estado ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => handleEdit(admin)}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        {admin.estado && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(admin.id)}
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
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingAdministrador ? 'Editar Administrador' : 'Nuevo Administrador'}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
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

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Responsable</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.responsable}
                        onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                        maxLength={255}
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Teléfono</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.telefono || ''}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value ? Number(e.target.value) : null })}
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                    {editingAdministrador ? 'Actualizar' : 'Crear'}
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

export default AdministradoresManagement;
