import { useState, useEffect } from 'react';
import Select from 'react-select';
import { tiposService, type Tipo, type CreateTipoDto } from '../../../services/admin.service';
import { customSelectStyles } from '../../../styles/react-select-custom';

export function CatalogosManagement() {
  const [tipos, setTipos] = useState<Tipo[]>([]);
  const [tiposRaiz, setTiposRaiz] = useState<Tipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTipo, setEditingTipo] = useState<Tipo | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
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
      const [allTipos, roots] = await Promise.all([
        tiposService.getAll(),
        tiposService.getRoots()
      ]);
      setTipos(allTipos);
      setTiposRaiz(roots);
    } catch (error: any) {
      setErrors(error.response?.data?.message || 'Error al cargar catálogos');
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
    if (!confirm('¿Está seguro de eliminar este tipo? Se marcará como inactivo.')) {
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

  const toggleNode = (id: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  const renderTipoTree = (tipo: Tipo, level: number = 0) => {
    const hasChildren = tipos.some(t => t.parent_id === tipo.id);
    const isExpanded = expandedNodes.has(tipo.id);
    const children = tipos.filter(t => t.parent_id === tipo.id);

    return (
      <div key={tipo.id}>
        <div
          className="d-flex align-items-center justify-content-between p-2 border-bottom"
          style={{
            paddingLeft: `${level * 30 + 10}px`,
            backgroundColor: level % 2 === 0 ? '#f8f9fa' : '#ffffff',
          }}
        >
          <div className="d-flex align-items-center flex-grow-1">
            {hasChildren && (
              <button
                onClick={() => toggleNode(tipo.id)}
                className="btn btn-sm btn-link text-secondary p-0 me-2"
                style={{ width: '20px' }}
              >
                <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'}`}></i>
              </button>
            )}
            {!hasChildren && <span style={{ width: '32px', display: 'inline-block' }}></span>}
            
            <strong>{tipo.name}</strong>
            
            {tipo.estado ? (
              <span className="badge bg-success ms-2">Activo</span>
            ) : (
              <span className="badge bg-secondary ms-2">Inactivo</span>
            )}
          </div>

          <div className="btn-group btn-group-sm">
            <button
              onClick={() => handleOpenModal(tipo)}
              className="btn btn-outline-primary"
              title="Editar"
            >
              <i className="fas fa-edit"></i>
            </button>
            <button
              onClick={() => handleDelete(tipo.id)}
              className="btn btn-outline-danger"
              title="Eliminar"
              disabled={hasChildren}
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div>
            {children.map(child => renderTipoTree(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <i className="fas fa-folder-tree me-2"></i>
          Gestión de Catálogos (Tipos)
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

      <div className="card">
        <div className="card-header bg-light">
          <h5 className="mb-0">Estructura Jerárquica de Tipos</h5>
        </div>
        <div className="card-body p-0">
          {tiposRaiz.length === 0 ? (
            <div className="text-center p-4 text-muted">
              <i className="fas fa-folder-open fa-3x mb-3"></i>
              <p>No hay tipos registrados</p>
            </div>
          ) : (
            tiposRaiz.map(tipo => renderTipoTree(tipo))
          )}
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
                      className="form-control"
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
                        { value: null, label: 'Sin padre (tipo raíz)' },
                        ...tiposRaiz
                          .filter(t => t.id !== editingTipo?.id)
                          .map(tipo => ({ value: tipo.id, label: tipo.name }))
                      ]}
                      value={formData.parent_id ? { value: formData.parent_id, label: tiposRaiz.find(t => t.id === formData.parent_id)?.name || 'Sin padre (tipo raíz)' } : { value: null, label: 'Sin padre (tipo raíz)' }}
                      onChange={(option) => setFormData({ ...formData, parent_id: option?.value || null })}
                      isClearable
                      styles={customSelectStyles}
                    />
                    <small className="text-muted">
                      Seleccione un tipo padre si este es un subtipo. Solo se muestran tipos raíz.
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
