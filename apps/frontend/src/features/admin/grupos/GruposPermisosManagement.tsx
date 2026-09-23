import { useState, useEffect } from 'react';
import Select from 'react-select';
import toast from 'react-hot-toast';
import { gruposService, permisosService, accionesService, menusService, type Grupo, type Accion, type Menu, type Permiso, type CreateGrupoDto } from '../../../services/admin.service';
import { customSelectStyles } from '../../../styles/react-select-custom';
import { PageHeader } from '../../../components/ui/PageHeader';

export function GruposPermisosManagement() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [acciones, setAcciones] = useState<Accion[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedGrupo, setSelectedGrupo] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Estado local de permisos (matriz menuId x accionId)
  const [permisosMatrix, setPermisosMatrix] = useState<Record<string, boolean>>({});

  // Modal para crear/editar grupo
  const [showModal, setShowModal] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<Grupo | null>(null);
  const [formData, setFormData] = useState<CreateGrupoDto>({
    nombre: '',
    descripcion: '',
    estado: true
  });
  const [formErrors, setFormErrors] = useState<string>('');
  const [savingGrupo, setSavingGrupo] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedGrupo) {
      loadPermisos(selectedGrupo);
    }
  }, [selectedGrupo]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [gruposData, accionesData, menusData] = await Promise.all([
        gruposService.getAll(),
        accionesService.getAll(),
        menusService.getTree() // Usar getTree para obtener menús con jerarquía
      ]);
      
      console.log('📋 Menús cargados desde la BD:', menusData);
      console.log('📋 Acciones disponibles:', accionesData);
      
      setGrupos(gruposData);
      setAcciones(accionesData);
      setMenus(menusData);

      // Seleccionar el primer grupo por defecto si hay grupos
      if (gruposData.length > 0 && !selectedGrupo) {
        setSelectedGrupo(gruposData[0].id);
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al cargar datos';
      setErrors(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const loadPermisos = async (grupoId: number) => {
    try {
      const permisos = await permisosService.getByGrupo(grupoId);
      
      // Convertir array de permisos a mapa para acceso rápido
      const matrix: Record<string, boolean> = {};
      permisos.forEach((permiso: Permiso) => {
        matrix[`${permiso.menuId}-${permiso.accionId}`] = true;
      });
      
      setPermisosMatrix(matrix);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al cargar permisos del grupo';
      setErrors(msg);
      toast.error(msg);
    }
  };

  const handleTogglePermiso = (menuId: number, accionId: number) => {
    const key = `${menuId}-${accionId}`;
    setPermisosMatrix(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleToggleAllMenu = (menuId: number) => {
    const allChecked = acciones.every(a => permisosMatrix[`${menuId}-${a.id}`]);
    const updated: Record<string, boolean> = { ...permisosMatrix };
    
    acciones.forEach(accion => {
      updated[`${menuId}-${accion.id}`] = !allChecked;
    });
    
    setPermisosMatrix(updated);
  };

  const handleToggleAllAccion = (accionId: number) => {
    const allChecked = menus.every(m => permisosMatrix[`${m.id}-${accionId}`]);
    const updated: Record<string, boolean> = { ...permisosMatrix };
    
    menus.forEach(menu => {
      updated[`${menu.id}-${accionId}`] = !allChecked;
    });
    
    setPermisosMatrix(updated);
  };

  const handleSelectAll = (select: boolean) => {
    const updated: Record<string, boolean> = {};
    if (select) {
      menus.forEach(menu => {
        acciones.forEach(accion => {
          updated[`${menu.id}-${accion.id}`] = true;
        });
      });
    }
    setPermisosMatrix(updated);
  };

  const handleSave = async () => {
    if (!selectedGrupo) return;

    try {
      setSaving(true);
      setErrors('');
      setSuccess('');

      // Extraer los permisos seleccionados
      const permisos: Array<{ menuId: number; accionId: number }> = [];
      
      Object.entries(permisosMatrix).forEach(([key, value]) => {
        if (value) {
          const [menuId, accionId] = key.split('-').map(Number);
          permisos.push({ menuId, accionId });
        }
      });

      console.log('📤 Guardando permisos para grupo', selectedGrupo, ':', permisos);

      await permisosService.assignToGrupo(selectedGrupo, permisos);
      
      toast.success('Permisos actualizados correctamente');
      setSuccess('Permisos actualizados correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('❌ Error al guardar permisos:', error);
      const msg = error.response?.data?.message || error.message || 'Error al guardar permisos';
      setErrors(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyPermisos = async (fromGrupoId: number) => {
    if (!selectedGrupo) return;

    try {
      const permisos = await permisosService.getByGrupo(fromGrupoId);
      const matrix: Record<string, boolean> = {};
      permisos.forEach((permiso: Permiso) => {
        matrix[`${permiso.menuId}-${permiso.accionId}`] = true;
      });
      setPermisosMatrix(matrix);
      toast.success('Permisos copiados. Recuerde hacer clic en "Guardar Cambios" para confirmar.');
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Error al copiar permisos';
      setErrors(msg);
      toast.error(msg);
    }
  };

  // --- Modal de Grupo ---
  const openCreateModal = () => {
    setEditingGrupo(null);
    setFormData({
      nombre: '',
      descripcion: '',
      estado: true
    });
    setFormErrors('');
    setShowModal(true);
  };

  const openEditModal = (grupo: Grupo) => {
    setEditingGrupo(grupo);
    setFormData({
      nombre: grupo.nombre,
      descripcion: grupo.descripcion || '',
      estado: grupo.estado
    });
    setFormErrors('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingGrupo(null);
    setFormErrors('');
  };

  const handleFormChange = (field: keyof CreateGrupoDto, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitGrupo = async () => {
    if (!formData.nombre.trim()) {
      setFormErrors('El nombre del grupo es obligatorio');
      return;
    }

    try {
      setSavingGrupo(true);
      setFormErrors('');

      if (editingGrupo) {
        await gruposService.update(editingGrupo.id, formData);
        toast.success('Grupo actualizado correctamente');
        setSuccess('Grupo actualizado correctamente');
      } else {
        await gruposService.create(formData);
        toast.success('Grupo creado correctamente');
        setSuccess('Grupo creado correctamente');
      }

      closeModal();
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al guardar grupo';
      setFormErrors(msg);
      toast.error(msg);
    } finally {
      setSavingGrupo(false);
    }
  };

  const handleDeleteGrupo = async (grupo: Grupo) => {
    if (!confirm(`¿Está seguro de eliminar el grupo "${grupo.nombre}"? Los usuarios asignados a este grupo perderán sus permisos.`)) {
      return;
    }

    try {
      setSaving(true);
      await gruposService.delete(grupo.id);
      
      // Si el grupo eliminado era el seleccionado, limpiar selección
      if (selectedGrupo === grupo.id) {
        setSelectedGrupo(null);
        setPermisosMatrix({});
      }
      
      await loadData();
      toast.success('Grupo eliminado correctamente');
      setSuccess('Grupo eliminado correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al eliminar grupo';
      setErrors(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  const grupoActual = grupos.find(g => g.id === selectedGrupo);

  return (
    <div className="container-fluid p-3">
      <style>{`
        .list-group-item-action:not(.active):hover {
          background-color: #f8f9fa !important;
          color: #212529 !important;
        }
        .list-group-item-action:not(.active):hover strong,
        .list-group-item-action:not(.active):hover small {
          color: #212529 !important;
        }
        .list-group-item-action.active {
          background-color: #0d6efd !important;
          border-color: #0d6efd !important;
        }
        
        /* Estilos para la tabla de permisos */
        .table-bordered thead th {
          background-color: #f8f9fa;
          font-weight: 600;
          vertical-align: middle;
        }
        
        .table-active {
          background-color: rgba(13, 110, 253, 0.05) !important;
        }
        
        .table tbody tr:hover {
          background-color: rgba(0, 0, 0, 0.02);
        }
        
        .table-bordered td {
          vertical-align: middle;
        }
        
        .sticky-top {
          position: sticky;
          top: 0;
          z-index: 10;
        }
      `}</style>
      
      <PageHeader
        icon="fa-solid fa-shield-halved"
        title="Gestión de Grupos y Permisos"
        subtitle="Configuración de perfiles de seguridad y matriz de privilegios sobre menús y acciones"
        actions={
          <button
            className="btn btn-sm btn-primary"
            onClick={openCreateModal}
          >
            <i className="fa-solid fa-plus me-1"></i>
            Nuevo Grupo
          </button>
        }
      />

      {errors && (
        <div className="alert alert-danger alert-dismissible fade show py-2" role="alert">
          <i className="fa-solid fa-triangle-exclamation me-2"></i>
          {errors}
          <button type="button" className="btn-close btn-sm" onClick={() => setErrors('')}></button>
        </div>
      )}

      {success && (
        <div className="alert alert-success alert-dismissible fade show py-2" role="alert">
          <i className="fa-solid fa-circle-check me-2"></i>
          {success}
          <button type="button" className="btn-close btn-sm" onClick={() => setSuccess('')}></button>
        </div>
      )}

      <div className="row g-3">
        {/* Selector de Grupo */}
        <div className="col-md-3">
          <div className="card border shadow-sm mb-3">
            <div className="card-header bg-white border-bottom py-2 d-flex justify-content-between align-items-center">
              <h6 className="card-title mb-0 fw-semibold text-dark" style={{ fontSize: '14px' }}>
                <i className="fa-solid fa-user-shield me-2 text-primary"></i>
                Grupos
              </h6>
              <button
                className="btn btn-sm btn-outline-primary py-0 px-2"
                onClick={openCreateModal}
                title="Crear nuevo grupo"
              >
                <i className="fa-solid fa-plus"></i>
              </button>
            </div>
            <div className="list-group list-group-flush">
              {grupos.length === 0 ? (
                <div className="list-group-item text-center text-muted py-4">
                  <i className="fa-solid fa-users-slash fa-2x mb-2 d-block text-secondary"></i>
                  <p className="mb-0">No hay grupos</p>
                  <small>Cree un nuevo grupo para comenzar</small>
                </div>
              ) : (
                grupos.map((grupo) => (
                  <div
                    key={grupo.id}
                    className={`list-group-item list-group-item-action ${selectedGrupo === grupo.id ? 'active' : ''}`}
                    onClick={() => setSelectedGrupo(grupo.id)}
                    style={{ cursor: 'pointer', ...(selectedGrupo !== grupo.id ? { color: '#212529' } : {}) }}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <strong>{grupo.nombre}</strong>
                        <br />
                        <small className={selectedGrupo === grupo.id ? 'text-white-50' : 'text-muted'}>
                          {grupo.descripcion || 'Sin descripción'}
                        </small>
                      </div>
                      <div className="d-flex flex-column align-items-end gap-1">
                        {grupo.estado ? (
                          <span className="badge bg-success">Activo</span>
                        ) : (
                          <span className="badge bg-secondary">Inactivo</span>
                        )}
                        <div className="btn-group btn-group-sm" onClick={(e) => e.stopPropagation()}>
                          <button
                            className={`btn ${selectedGrupo === grupo.id ? 'btn-light' : 'btn-outline-primary'} btn-sm py-1 px-2`}
                            onClick={() => openEditModal(grupo)}
                            title="Editar grupo"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            className={`btn ${selectedGrupo === grupo.id ? 'btn-light' : 'btn-outline-danger'} btn-sm py-1 px-2`}
                            onClick={() => handleDeleteGrupo(grupo)}
                            title="Eliminar grupo"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Copiar Permisos */}
          {selectedGrupo && grupos.length > 1 && (
            <div className="card border shadow-sm">
              <div className="card-header bg-white border-bottom py-2">
                <h6 className="card-title mb-0 fw-semibold text-dark" style={{ fontSize: '13px' }}>
                  <i className="fa-solid fa-copy me-1 text-primary"></i> Copiar Permisos
                </h6>
              </div>
              <div className="card-body p-2">
                <Select
                  options={[
                    { value: null, label: 'Copiar desde...' },
                    ...grupos.filter(g => g.id !== selectedGrupo).map(grupo => ({ value: grupo.id, label: grupo.nombre }))
                  ]}
                  value={{ value: null, label: 'Copiar desde...' }}
                  onChange={(option) => option?.value && handleCopyPermisos(Number(option.value))}
                  styles={customSelectStyles}
                />
                <small className="text-muted d-block mt-1" style={{ fontSize: '11px' }}>
                  Reemplazará los permisos del grupo actual.
                </small>
              </div>
            </div>
          )}
        </div>

        {/* Matriz de Permisos */}
        <div className="col-md-9">
          {selectedGrupo ? (
            <div className="card border shadow-sm">
              <div className="card-header bg-white border-bottom py-2 d-flex justify-content-between align-items-center">
                <h6 className="card-title mb-0 fw-semibold text-dark" style={{ fontSize: '14px' }}>
                  <i className="fa-solid fa-table-cells me-2 text-primary"></i>
                  Permisos de: <strong>{grupoActual?.nombre}</strong>
                </h6>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-floppy-disk me-1"></i>
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-bordered table-hover mb-0">
                    <thead className="table-light sticky-top">
                      <tr>
                        <th style={{ minWidth: '250px' }}>
                          <div className="d-flex align-items-center">
                            <i className="fa-solid fa-sitemap me-2 text-primary"></i>
                            Menú / Módulo
                          </div>
                        </th>
                        {acciones.map((accion) => (
                          <th key={accion.id} className="text-center" style={{ minWidth: '100px' }}>
                            <div>
                              {accion.icono && <i className={`${accion.icono} me-1`}></i>}
                              <div className="fw-bold">{accion.nombre}</div>
                            </div>
                            <div className="mt-2">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={menus.every(m => permisosMatrix[`${m.id}-${accion.id}`])}
                                onChange={() => handleToggleAllAccion(accion.id)}
                                title="Seleccionar todo"
                              />
                              <small className="ms-1 text-muted">Todo</small>
                            </div>
                          </th>
                        ))}
                        <th className="text-center" style={{ minWidth: '80px' }}>
                          <i className="fa-solid fa-check-double me-1 text-primary"></i>
                          Todas
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {menus.length === 0 ? (
                        <tr>
                          <td colSpan={acciones.length + 2} className="text-center py-5">
                            <i className="fa-solid fa-inbox fa-3x text-secondary mb-3 d-block"></i>
                            <p className="text-muted mb-0">No hay menús disponibles</p>
                            <small className="text-muted">Verifique la configuración del sistema</small>
                          </td>
                        </tr>
                      ) : (
                        menus.map((menu) => {
                          const nivel = menu.nivel || 0;
                          const esMenuPadre = !menu.menuPadreId;
                          
                          return (
                            <tr key={menu.id} className={esMenuPadre ? 'table-active' : ''}>
                              <td>
                                <div style={{ marginLeft: `${nivel * 20}px` }} className="d-flex align-items-center">
                                  {nivel > 0 && (
                                    <span className="text-muted me-2">└─</span>
                                  )}
                                  {menu.icono && (
                                    <i className={`${menu.icono} me-2 ${esMenuPadre ? 'text-primary' : 'text-muted'}`}></i>
                                  )}
                                  <div>
                                    <strong className={esMenuPadre ? 'text-primary' : ''}>
                                      {menu.nombre}
                                    </strong>
                                    {menu.modulo && (
                                      <>
                                        <br />
                                        <small className="text-muted">
                                          <i className="fa-solid fa-folder me-1"></i>
                                          {menu.modulo}
                                        </small>
                                      </>
                                    )}
                                    {menu.ruta && menu.ruta !== '#' && (
                                      <>
                                        <br />
                                        <small className="text-muted">
                                          <i className="fa-solid fa-link me-1"></i>
                                          {menu.ruta}
                                        </small>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </td>
                              {acciones.map((accion) => {
                                const key = `${menu.id}-${accion.id}`;
                                return (
                                  <td key={accion.id} className="text-center align-middle">
                                    <input
                                      type="checkbox"
                                      className="form-check-input"
                                      checked={permisosMatrix[key] || false}
                                      onChange={() => handleTogglePermiso(menu.id, accion.id)}
                                    />
                                  </td>
                                );
                              })}
                              <td className="text-center align-middle">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={acciones.every(a => permisosMatrix[`${menu.id}-${a.id}`])}
                                  onChange={() => handleToggleAllMenu(menu.id)}
                                  title="Seleccionar todas las acciones para este menú"
                                />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="alert alert-info">
              <i className="fa-solid fa-circle-info me-2"></i>
              Seleccione un grupo para gestionar sus permisos
            </div>
          )}
        </div>
      </div>

      {/* Modal para Crear/Editar Grupo */}
      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className={`fa-solid ${editingGrupo ? 'fa-pen-to-square' : 'fa-circle-plus'} me-2 text-primary`}></i>
                  {editingGrupo ? 'Editar Grupo' : 'Nuevo Grupo'}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                {formErrors && (
                  <div className="alert alert-danger py-2">{formErrors}</div>
                )}
                
                <div className="mb-3">
                  <label className="form-label fw-semibold">Nombre <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.nombre}
                    onChange={(e) => handleFormChange('nombre', e.target.value)}
                    placeholder="Ej: Administradores"
                    autoFocus
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-semibold">Descripción</label>
                  <textarea
                    className="form-control"
                    value={formData.descripcion || ''}
                    onChange={(e) => handleFormChange('descripcion', e.target.value)}
                    placeholder="Descripción del grupo"
                    rows={3}
                  />
                </div>
                
                <div className="form-check form-switch">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="grupoEstado"
                    checked={formData.estado}
                    onChange={(e) => handleFormChange('estado', e.target.checked)}
                  />
                  <label className="form-check-label fw-medium" htmlFor="grupoEstado">
                    Grupo activo
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSubmitGrupo}
                  disabled={savingGrupo}
                >
                  {savingGrupo ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-floppy-disk me-2"></i>
                      {editingGrupo ? 'Actualizar' : 'Crear'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
