import { useState, useEffect } from 'react';
import Select from 'react-select';
import { tiposService, type Tipo, type CreateTipoDto } from '../../../services/admin.service';
import { customSelectStyles } from '../../../styles/react-select-custom';

interface TipoConNivel extends Tipo {
  nivel: number;
}

export function CatalogosManagement() {
  const [tipos, setTipos] = useState<TipoConNivel[]>([]);
  const [tiposPlanos, setTiposPlanos] = useState<Tipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTipo, setEditingTipo] = useState<Tipo | null>(null);
  const [errors, setErrors] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    parent_id: null as number | null,
    estado: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tree, flat] = await Promise.all([
        tiposService.getTree(),
        tiposService.getAll()
      ]);
      setTipos(tree);
      setTiposPlanos(flat);
    } catch (error: any) {
      setErrors(error.response?.data?.message || 'Error al cargar catalogos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (tipo: Tipo | null = null) => {
    if (tipo) {
      setEditingTipo(tipo);
      setFormData({
        name: tipo.name,
        parent_id: tipo.parent_id,
        estado: tipo.estado,
      });
    } else {
      setEditingTipo(null);
      setFormData({
        name: '',
        parent_id: null,
        estado: true,
      });
    }
    setShowModal(true);
    setErrors('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTipo(null);
    setFormData({ name: '', parent_id: null, estado: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingTipo) {
        await tiposService.update(editingTipo.id, formData);
        setSuccess('Tipo actualizado exitosamente');
      } else {
        await tiposService.create(formData as CreateTipoDto);
        setSuccess('Tipo creado exitosamente');
      }
      
      handleCloseModal();
      loadData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setErrors(error.response?.data?.message || 'Error al guardar el tipo');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Esta seguro de eliminar este tipo? Se marcara como inactivo.')) {
      return;
    }

    try {
      await tiposService.delete(id);
      setSuccess('Tipo eliminado exitosamente');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setErrors(error.response?.data?.message || 'Error al eliminar el tipo');
    }
  };

  // Filtrar solo tipos raiz activos para el selector de padre
  const tiposRaiz = tiposPlanos.filter(t => t.estado && !t.parent_id && t.id !== editingTipo?.id);

  if (loading) {
    return (
      <div className="container-fluid p-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <i className="fas fa-folder-tree me-2"></i>
          Gestion de Catalogos (Tipos)
        </h2>
        <button
          onClick={() => handleOpenModal()}
          className="btn btn-primary"
        >
          <i className="fas fa-plus me-2"></i>
          Nuevo Tipo
        </button>
      </div>

      {errors && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {errors}
          <button type="button" className="btn-close" onClick={() => setErrors('')}></button>
        </div>
      )}

      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {success}
          <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Padre</th>
                  <th className="text-center">Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tipos.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-muted">
                      <i className="fas fa-folder-open fa-2x mb-2 d-block"></i>
                      No hay tipos registrados
                    </td>
                  </tr>
                ) : (
                  tipos.map(tipo => (
                    <tr key={tipo.id}>
                      <td>
                        <span style={{ marginLeft: `${(tipo.nivel || 0) * 20}px` }}>
                          {tipo.nivel && tipo.nivel > 0 ? '|-- ' : ''}
                          <strong>{tipo.name}</strong>
                        </span>
                      </td>
                      <td>
                        {tipo.parent_id ? (
                          <small className="text-muted">
                            {tiposPlanos.find(t => t.id === tipo.parent_id)?.name || '-'}
                          </small>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="text-center">
                        <span className={`badge ${tipo.estado ? 'bg-success' : 'bg-secondary'}`}>
                          {tipo.estado ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="btn-group btn-group-sm" role="group">
                          <button
                            onClick={() => handleOpenModal(tipo)}
                            className="btn btn-outline-warning"
                            title="Editar"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(tipo.id)}
                            className="btn btn-outline-danger"
                            title="Eliminar"
                          >
                            <i className="fas fa-trash"></i>
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
      </div>

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingTipo ? 'Editar Tipo' : 'Nuevo Tipo'}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nombre *</label>
                    <input
                      type="text"
                      className="form-control custom-input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      maxLength={255}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Tipo Padre</label>
                    <Select
                      options={[
                        { value: null, label: 'Sin padre (tipo raiz)' },
                        ...tiposRaiz.map(tipo => ({ value: tipo.id, label: tipo.name }))
                      ]}
                      value={formData.parent_id ? { value: formData.parent_id, label: tiposPlanos.find(t => t.id === formData.parent_id)?.name || 'Sin padre (tipo raiz)' } : { value: null, label: 'Sin padre (tipo raiz)' }}
                      onChange={(option) => setFormData({ ...formData, parent_id: option?.value || null })}
                      isClearable
                      styles={customSelectStyles}
                    />
                    <small className="text-muted">
                      Seleccione un tipo padre si este es un subtipo.
                    </small>
                  </div>

                  <div className="mb-3">
                    <div className="form-check">
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
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <i className="fas fa-save me-2"></i>
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
