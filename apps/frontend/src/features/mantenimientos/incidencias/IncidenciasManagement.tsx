import { useState, useEffect } from 'react';
import Select from 'react-select';
import { toast } from 'react-hot-toast';
import { incidenciasService, Incidencia } from '../../../services/admin.service';
import { incidentsService, PrioridadCatalog } from '../../../services/incidents.service';
import { customSelectStylesSmall } from '../../../styles/react-select-custom';
import { PageHeader } from '../../../components/ui/PageHeader';

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
      toast.error('Error al cargar incidencias');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingIncidencia) {
        await incidenciasService.update(editingIncidencia.id, formData);
        toast.success('Incidencia actualizada exitosamente');
      } else {
        await incidenciasService.create(formData);
        toast.success('Incidencia registrada exitosamente');
      }
      
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Error al guardar incidencia:', error);
      toast.error(error.response?.data?.message || 'Error al guardar incidencia');
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
    if (!window.confirm('¿Está seguro de desactivar este tipo de incidencia?')) return;
    
    try {
      await incidenciasService.delete(id);
      toast.success('Incidencia desactivada exitosamente');
      loadData();
    } catch (error: any) {
      console.error('Error al eliminar incidencia:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar incidencia');
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
    <div className="container-fluid p-3">
      <PageHeader
        icon="fa-solid fa-triangle-exclamation"
        title="Tipos de Incidencias"
        subtitle="Estructura jerárquica de tipos de incidencias, características y niveles de prioridad"
        actions={
          <button 
            className="btn btn-sm btn-primary"
            onClick={() => setShowModal(true)}
          >
            <i className="fa-solid fa-plus me-1"></i>
            Nuevo Tipo
          </button>
        }
      />

      {loading ? (
        <div className="card border shadow-sm p-5 text-center">
          <div className="spinner-border text-primary mx-auto mb-2" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <small className="text-muted">Cargando catálogo de incidencias...</small>
        </div>
      ) : (
        <div className="card border shadow-sm">
          <div className="card-header bg-white border-bottom py-2 d-flex justify-content-between align-items-center">
            <h6 className="card-title mb-0 fw-semibold text-dark" style={{ fontSize: '14px' }}>
              <i className="fa-solid fa-sitemap me-2 text-primary"></i>
              Jerarquía de Incidencias ({incidencias.length})
            </h6>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover table-striped align-middle mb-0">
                <thead className="table-light text-uppercase" style={{ fontSize: '12px' }}>
                  <tr>
                    <th>Tipo de Incidencia</th>
                    <th className="text-center" style={{ width: '130px' }}>Característica</th>
                    <th>Tipo Padre</th>
                    <th className="text-center" style={{ width: '130px' }}>Prioridad</th>
                    <th className="text-center" style={{ width: '110px' }}>Estado</th>
                    <th className="text-center" style={{ width: '100px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '13px' }}>
                  {incidencias.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-muted">
                        <i className="fa-solid fa-inbox fa-2x mb-2 d-block text-secondary"></i>
                        No se encontraron registros
                      </td>
                    </tr>
                  ) : (
                    incidencias.map(incidencia => (
                      <tr key={incidencia.id}>
                        <td>
                          <div style={{ paddingLeft: `${(incidencia.nivel || 0) * 24}px` }} className="d-flex align-items-center">
                            {incidencia.nivel && incidencia.nivel > 0 ? (
                              <i className="fa-solid fa-turn-up fa-rotate-90 text-muted me-2 small"></i>
                            ) : (
                              <i className="fa-solid fa-folder text-warning me-2 small"></i>
                            )}
                            <span className={incidencia.nivel === 0 ? 'fw-bold text-dark' : 'text-dark'}>
                              {incidencia.tipo || '-'}
                            </span>
                          </div>
                        </td>
                        <td className="text-center">
                          {incidencia.caracteristica ? (
                            <span className="badge bg-light text-dark border font-monospace">
                              {incidencia.caracteristica}
                            </span>
                          ) : (
                            <span className="text-muted small">-</span>
                          )}
                        </td>
                        <td>
                          {incidencia.parentId ? (
                            <span className="badge bg-light text-secondary border">
                              {incidenciasPlanas.find(i => i.id === incidencia.parentId)?.tipo || '-'}
                            </span>
                          ) : (
                            <span className="text-muted small">Raíz</span>
                          )}
                        </td>
                        <td className="text-center">
                          {incidencia.prioridadId ? (
                            <span className="badge bg-info text-white">
                              {prioridades.find(p => p.id === incidencia.prioridadId)?.nombre || '-'}
                            </span>
                          ) : (
                            <span className="text-muted small">-</span>
                          )}
                        </td>
                        <td className="text-center">
                          <span className={`badge ${incidencia.estado ? 'bg-success' : 'bg-secondary'}`}>
                            {incidencia.estado ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-primary btn-sm py-1 px-2"
                              onClick={() => handleEdit(incidencia)}
                              title="Editar"
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                            {incidencia.estado && (
                              <button
                                className="btn btn-outline-danger btn-sm py-1 px-2"
                                onClick={() => handleDelete(incidencia.id)}
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
        </div>
      )}

      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-light border-bottom py-2">
                <h5 className="modal-title fs-6 fw-bold text-dark">
                  <i className="fa-solid fa-triangle-exclamation me-2 text-primary"></i>
                  {editingIncidencia ? 'Editar Tipo de Incidencia' : 'Nuevo Tipo de Incidencia'}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-3">
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">Nombre del Tipo *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                      required
                      maxLength={255}
                      placeholder="Ej: Falla Semafórica"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">Código Característica</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={formData.caracteristica}
                      onChange={(e) => setFormData({ ...formData, caracteristica: e.target.value })}
                      maxLength={2}
                      placeholder="Ej: FS"
                    />
                    <small className="form-text text-muted" style={{ fontSize: '11px' }}>Máximo 2 caracteres alfanuméricos</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">Tipo Padre (Jerarquía)</label>
                    <Select
                      options={[
                        { value: null, label: 'Sin padre (Tipo raíz)' },
                        ...incidenciasRaiz.map(inc => ({ value: inc.id, label: inc.tipo || '' }))
                      ]}
                      value={formData.parentId ? { value: formData.parentId, label: incidenciasPlanas.find(i => i.id === formData.parentId)?.tipo || '' } : { value: null, label: 'Sin padre (Tipo raíz)' }}
                      onChange={(option) => setFormData({ ...formData, parentId: option?.value || null })}
                      isClearable
                      styles={customSelectStylesSmall}
                      placeholder="Seleccione tipo superior..."
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">Prioridad Predeterminada</label>
                    <Select
                      options={[
                        { value: null, label: 'Sin prioridad específica' },
                        ...prioridades.map(p => ({ value: p.id, label: p.nombre }))
                      ]}
                      value={formData.prioridadId ? { value: formData.prioridadId, label: prioridades.find(p => p.id === formData.prioridadId)?.nombre || '' } : { value: null, label: 'Sin prioridad específica' }}
                      onChange={(option) => setFormData({ ...formData, prioridadId: option?.value || null })}
                      isClearable
                      styles={customSelectStylesSmall}
                      placeholder="Seleccionar prioridad..."
                    />
                  </div>

                  <div className="form-check form-switch mb-2">
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
                <div className="modal-footer bg-light border-top py-2">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={handleCloseModal}>
                    <i className="fa-solid fa-xmark me-1"></i> Cancelar
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary">
                    <i className="fa-solid fa-floppy-disk me-1"></i>
                    {editingIncidencia ? 'Actualizar' : 'Guardar'}
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

