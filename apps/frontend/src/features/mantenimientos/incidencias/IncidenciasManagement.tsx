import { useState, useEffect } from 'react';
import Select from 'react-select';
import { incidenciasService, Incidencia } from '../../../services/admin.service';
import { incidentsService, PrioridadCatalog } from '../../../services/incidents.service';
import { customSelectStyles } from '../../../styles/react-select-custom';

interface IncidenciaConNivel extends Incidencia {
  nivel: number;
}

const IncidenciasManagement = () => {
  const [incidencias, setIncidencias] = useState<IncidenciaConNivel[]>([]);
  const [incidenciasPlanas, setIncidenciasPlanas] = useState<Incidencia[]>([]);
  const [prioridades, setPrioridades] = useState<PrioridadCatalog[]>([]);
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
      const [tree, flat, prioridadesList] = await Promise.all([
        incidenciasService.getTree(),
        incidenciasService.getAll(),
        incidentsService.getPrioridadesCatalog()
      ]);
      setIncidencias(tree);
      setIncidenciasPlanas(flat);
      setPrioridades(prioridadesList);
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
    if (!confirm('Esta seguro de desactivar este tipo de incidencia?')) return;
    
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

  // Filtrar solo incidencias raiz activas para el selector de padre
  const incidenciasRaiz = incidenciasPlanas.filter(i => i.estado && !i.parentId && i.id !== editingIncidencia?.id);

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Gestion de Tipos de Incidencias
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
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th className="text-center">Caracteristica</th>
                    <th>Padre</th>
                    <th className="text-center">Prioridad</th>
                    <th className="text-center">Estado</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {incidencias.map(incidencia => (
                    <tr key={incidencia.id}>
                      <td>
                        <span style={{ marginLeft: `${(incidencia.nivel || 0) * 20}px` }}>
                          {incidencia.nivel && incidencia.nivel > 0 ? '|-- ' : ''}
                          <strong>{incidencia.tipo || '-'}</strong>
                        </span>
                      </td>
                      <td className="text-center">
                        {incidencia.caracteristica ? (
                          <code className="small">{incidencia.caracteristica}</code>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        {incidencia.parentId ? (
                          <small className="text-muted">
                            {incidenciasPlanas.find(i => i.id === incidencia.parentId)?.tipo || '-'}
                          </small>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="text-center">
                        {incidencia.prioridadId ? (
                          <span className="badge bg-info">
                            {prioridades.find(p => p.id === incidencia.prioridadId)?.nombre || '-'}
                          </span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="text-center">
                        <span className={`badge ${incidencia.estado ? 'bg-success' : 'bg-secondary'}`}>
                          {incidencia.estado ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="btn-group btn-group-sm" role="group">
                          <button
                            className="btn btn-outline-warning"
                            onClick={() => handleEdit(incidencia)}
                            title="Editar"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          {incidencia.estado && (
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleDelete(incidencia.id)}
                              title="Eliminar"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          )}
                        </div>
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
                      className="form-control custom-input"
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                      required
                      maxLength={255}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Caracteristica</label>
                    <input
                      type="text"
                      className="form-control custom-input"
                      value={formData.caracteristica}
                      onChange={(e) => setFormData({ ...formData, caracteristica: e.target.value })}
                      maxLength={2}
                    />
                    <small className="form-text text-muted">Maximo 2 caracteres</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Tipo Padre</label>
                    <Select
                      options={[
                        { value: null, label: 'Sin padre (tipo raiz)' },
                        ...incidenciasRaiz.map(inc => ({ value: inc.id, label: inc.tipo || '' }))
                      ]}
                      value={formData.parentId ? { value: formData.parentId, label: incidenciasPlanas.find(i => i.id === formData.parentId)?.tipo || '' } : { value: null, label: 'Sin padre (tipo raiz)' }}
                      onChange={(option) => setFormData({ ...formData, parentId: option?.value || null })}
                      isClearable
                      styles={customSelectStyles}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Prioridad</label>
                    <Select
                      options={[
                        { value: null, label: 'Sin prioridad' },
                        ...prioridades.map(p => ({ value: p.id, label: p.nombre }))
                      ]}
                      value={formData.prioridadId ? { value: formData.prioridadId, label: prioridades.find(p => p.id === formData.prioridadId)?.nombre || '' } : { value: null, label: 'Sin prioridad' }}
                      onChange={(option) => setFormData({ ...formData, prioridadId: option?.value || null })}
                      isClearable
                      styles={customSelectStyles}
                      placeholder="Seleccionar prioridad..."
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
