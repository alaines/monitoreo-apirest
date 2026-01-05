import React, { useState, useEffect } from 'react';
import { proyectosService, Proyecto } from '../../../services/admin.service';

const ProyectosManagement: React.FC = () => {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await proyectosService.getAll();
      setProyectos(data);
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
      alert('Error al cargar proyectos');
    } finally {
      setLoading(false);
    }
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
        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Siglas</th>
                    <th>Nombre</th>
                    <th>Etapa</th>
                    <th>Empresa</th>
                    <th>Año</th>
                    <th>Estado</th>
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
          </div>
        </div>
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
                        className="form-control"
                        value={formData.siglas}
                        onChange={(e) => setFormData({ ...formData, siglas: e.target.value })}
                        maxLength={6}
                      />
                    </div>

                    <div className="col-md-8 mb-3">
                      <label className="form-label">Nombre</label>
                      <input
                        type="text"
                        className="form-control"
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
                        className="form-control"
                        value={formData.etapa}
                        onChange={(e) => setFormData({ ...formData, etapa: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Empresa Ejecutora</label>
                      <input
                        type="text"
                        className="form-control"
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
                        className="form-control"
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
                        className="form-control"
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
