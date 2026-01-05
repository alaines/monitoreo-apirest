import { useState, useEffect } from 'react';
import { gruposService, permisosService, accionesService, menusService, type Grupo, type Accion, type Menu, type Permiso } from '../../../services/admin.service';

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
        menusService.getAll()
      ]);
      setGrupos(gruposData);
      setAcciones(accionesData.filter((a: Accion) => a.estado));
      setMenus(menusData);
      
      if (gruposData.length > 0) {
        setSelectedGrupo(gruposData[0].id);
      }
    } catch (error: any) {
      setErrors(error.response?.data?.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const loadPermisos = async (grupoId: number) => {
    try {
      const permisosData = await permisosService.getByGrupo(grupoId);
      
      // Convertir array de permisos a matriz
      const matrix: Record<string, boolean> = {};
      permisosData.forEach((p: Permiso) => {
        const key = `${p.menuId}-${p.accionId}`;
        matrix[key] = true;
      });
      setPermisosMatrix(matrix);
    } catch (error: any) {
      setErrors(error.response?.data?.message || 'Error al cargar permisos');
    }
  };

  const handleTogglePermiso = (menuId: number, accionId: number) => {
    const key = `${menuId}-${accionId}`;
    setPermisosMatrix({
      ...permisosMatrix,
      [key]: !permisosMatrix[key]
    });
  };

  const handleToggleAllMenu = (menuId: number) => {
    const newMatrix = { ...permisosMatrix };
    const allChecked = acciones.every(a => permisosMatrix[`${menuId}-${a.id}`]);
    
    acciones.forEach(accion => {
      const key = `${menuId}-${accion.id}`;
      newMatrix[key] = !allChecked;
    });
    
    setPermisosMatrix(newMatrix);
  };

  const handleToggleAllAccion = (accionId: number) => {
    const newMatrix = { ...permisosMatrix };
    const allChecked = menus.every(m => permisosMatrix[`${m.id}-${accionId}`]);
    
    menus.forEach(menu => {
      const key = `${menu.id}-${accionId}`;
      newMatrix[key] = !allChecked;
    });
    
    setPermisosMatrix(newMatrix);
  };

  const handleSave = async () => {
    if (!selectedGrupo) return;

    try {
      setSaving(true);
      setErrors('');
      setSuccess('');

      // Convertir matriz a array de permisos
      const permisosToSave = Object.entries(permisosMatrix)
        .filter(([_, value]) => value)
        .map(([key, _]) => {
          const [menuId, accionId] = key.split('-').map(Number);
          return { menuId, accionId };
        });

      await permisosService.bulkCreate({
        grupoId: selectedGrupo,
        permisos: permisosToSave
      });

      setSuccess('Permisos guardados correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setErrors(error.response?.data?.message || 'Error al guardar permisos');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyPermisos = async (grupoOrigenId: number) => {
    if (!selectedGrupo) return;
    if (!confirm(`¿Copiar permisos del grupo seleccionado a ${grupos.find(g => g.id === selectedGrupo)?.nombre}?`)) return;

    try {
      setSaving(true);
      await permisosService.copiarPermisos(grupoOrigenId, selectedGrupo);
      await loadPermisos(selectedGrupo);
      setSuccess('Permisos copiados correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setErrors(error.response?.data?.message || 'Error al copiar permisos');
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
    <div className="container-fluid p-4">
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
          background-color: var(--primary-dark) !important;
          border-color: var(--primary-dark) !important;
        }
        .list-group-item-action.active:hover {
          background-color: var(--primary-light) !important;
          border-color: var(--primary-light) !important;
        }
      `}</style>
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <i className="fas fa-shield-alt me-2"></i>
          Gestión de Grupos y Permisos
        </h2>
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

      <div className="row">
        {/* Selector de Grupo */}
        <div className="col-md-3">
          <div className="card mb-3">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Grupos</h5>
            </div>
            <div className="list-group list-group-flush">
              {grupos.map((grupo) => (
                <button
                  key={grupo.id}
                  className={`list-group-item list-group-item-action ${selectedGrupo === grupo.id ? 'active' : ''}`}
                  onClick={() => setSelectedGrupo(grupo.id)}
                  style={selectedGrupo !== grupo.id ? { color: '#212529' } : undefined}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{grupo.nombre}</strong>
                      <br />
                      <small className={selectedGrupo === grupo.id ? 'text-white-50' : 'text-muted'}>{grupo.descripcion}</small>
                    </div>
                    {grupo.estado ? (
                      <span className="badge bg-success">Activo</span>
                    ) : (
                      <span className="badge bg-secondary">Inactivo</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Copiar permisos */}
          {selectedGrupo && (
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">Copiar Permisos</h6>
              </div>
              <div className="card-body">
                <select
                  className="form-select mb-2"
                  onChange={(e) => handleCopyPermisos(Number(e.target.value))}
                  value=""
                >
                  <option value="">Copiar desde...</option>
                  {grupos.filter(g => g.id !== selectedGrupo).map((grupo) => (
                    <option key={grupo.id} value={grupo.id}>
                      {grupo.nombre}
                    </option>
                  ))}
                </select>
                <small className="text-muted">
                  Los permisos del grupo seleccionado reemplazarán los permisos actuales.
                </small>
              </div>
            </div>
          )}
        </div>

        {/* Matriz de Permisos */}
        <div className="col-md-9">
          {selectedGrupo ? (
            <div className="card">
              <div className="card-header bg-light d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  Permisos de: <strong>{grupoActual?.nombre}</strong>
                </h5>
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save me-2"></i>
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
                        <th style={{ minWidth: '200px' }}>Menú / Módulo</th>
                        {acciones.map((accion) => (
                          <th key={accion.id} className="text-center" style={{ minWidth: '80px' }}>
                            <div>
                              {accion.icono && <i className={`${accion.icono} me-1`}></i>}
                              {accion.nombre}
                            </div>
                            <div className="mt-1">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={menus.every(m => permisosMatrix[`${m.id}-${accion.id}`])}
                                onChange={() => handleToggleAllAccion(accion.id)}
                                title="Seleccionar todo"
                              />
                            </div>
                          </th>
                        ))}
                        <th className="text-center">Todo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {menus.map((menu) => (
                        <tr key={menu.id}>
                          <td>
                            <strong>{menu.nombre}</strong>
                            <br />
                            <small className="text-muted">{menu.modulo}</small>
                          </td>
                          {acciones.map((accion) => {
                            const key = `${menu.id}-${accion.id}`;
                            return (
                              <td key={accion.id} className="text-center">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={permisosMatrix[key] || false}
                                  onChange={() => handleTogglePermiso(menu.id, accion.id)}
                                />
                              </td>
                            );
                          })}
                          <td className="text-center">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={acciones.every(a => permisosMatrix[`${menu.id}-${a.id}`])}
                              onChange={() => handleToggleAllMenu(menu.id)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="alert alert-info">
              <i className="fas fa-info-circle me-2"></i>
              Seleccione un grupo para gestionar sus permisos
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
