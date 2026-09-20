import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../auth/authStore';
import { toast } from 'react-hot-toast';
import { PageHeader } from '../../../components/ui/PageHeader';

interface Menu {
  id: number;
  nombre: string;
  codigo: string;
  ruta: string;
  icono: string;
  orden: number;
  menuPadreId: number | null;
  activo: boolean;
  lft?: number;
  rght?: number;
  nivel?: number;
}

export function MenusManagement() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    ruta: '#',
    icono: '',
    menuPadreId: null as number | null,
    activo: true,
  });
  const { token, refreshUserMenus } = useAuthStore();

  const loadMenus = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/menus/tree`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMenus(response.data);
    } catch (error: any) {
      toast.error('Error al cargar los menús');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenus();
  }, []);

  const handleCreate = () => {
    setEditingMenu(null);
    setFormData({
      nombre: '',
      codigo: '',
      ruta: '#',
      icono: '',
      menuPadreId: null,
      activo: true,
    });
    setShowModal(true);
  };

  const handleEdit = (menu: Menu) => {
    setEditingMenu(menu);
    setFormData({
      nombre: menu.nombre,
      codigo: menu.codigo,
      ruta: menu.ruta,
      icono: menu.icono,
      menuPadreId: menu.menuPadreId,
      activo: menu.activo,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMenu) {
        await axios.patch(
          `${import.meta.env.VITE_API_URL}/menus/${editingMenu.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Menú actualizado exitosamente');
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/menus`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Menú creado exitosamente');
      }
      setShowModal(false);
      await loadMenus();
      // Refrescar menús del sidebar
      await refreshUserMenus();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar el menú');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este menú?')) return;
    
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/menus/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Menú eliminado exitosamente');
      await loadMenus();
      // Refrescar menús del sidebar
      await refreshUserMenus();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar el menú');
    }
  };

  const handleMoveUp = async (id: number) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/menus/${id}/move-up`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Menú movido hacia arriba');
      loadMenus();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al mover el menú');
    }
  };

  const handleMoveDown = async (id: number) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/menus/${id}/move-down`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Menú movido hacia abajo');
      loadMenus();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al mover el menú');
    }
  };

  const handleChangeParent = async (id: number, newParentId: number | null) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/menus/${id}/change-parent`,
        { newParentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Padre cambiado exitosamente');
      loadMenus();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cambiar el padre');
    }
  };

  const getRootMenus = () => menus.filter(m => !m.menuPadreId);

  return (
    <div className="container-fluid p-3">
      <PageHeader
        icon="fas fa-bars"
        title="Gestión de Menús"
        subtitle="Administración del árbol de navegación, rutas, jerarquías y accesos del sistema"
        actions={
          <button onClick={handleCreate} className="btn btn-sm btn-primary">
            <i className="fas fa-plus me-1"></i>
            Nuevo Menú
          </button>
        }
      />

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : (
        <div className="card border shadow-sm">
          <div className="card-header bg-white border-bottom py-2">
            <h6 className="card-title mb-0 fw-semibold text-dark" style={{ fontSize: '14px' }}>
              <i className="fas fa-sitemap me-2 text-primary"></i>
              Estructura Jerárquica de Navegación ({menus.length} nodos)
            </h6>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover table-striped align-middle mb-0" style={{ fontSize: '13px' }}>
                <thead className="table-light text-uppercase" style={{ fontSize: '12px' }}>
                  <tr>
                    <th className="px-3 py-2">Nombre</th>
                    <th className="py-2">Código</th>
                    <th className="py-2">Ruta</th>
                    <th className="py-2 text-center">Icono</th>
                    <th className="py-2">Padre</th>
                    <th className="py-2 text-center">Orden</th>
                    <th className="py-2 text-center">lft/rght</th>
                    <th className="py-2 text-center">Estado</th>
                    <th className="py-2 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {menus.map((menu) => (
                    <tr key={menu.id}>
                      <td className="px-3">
                        <span style={{ marginLeft: `${(menu.nivel || 0) * 20}px` }}>
                          {menu.nivel && menu.nivel > 0 ? <span className="text-muted me-1">└─</span> : ''}
                          <strong className="text-dark">{menu.nombre}</strong>
                        </span>
                      </td>
                      <td><code className="small font-monospace">{menu.codigo}</code></td>
                      <td><small className="text-muted">{menu.ruta}</small></td>
                      <td className="text-center">
                        <i className={`${menu.icono} text-primary`}></i>
                      </td>
                      <td>
                        {menu.menuPadreId ? (
                          <select
                            value={menu.menuPadreId || ''}
                            onChange={(e) => handleChangeParent(menu.id, e.target.value ? +e.target.value : null)}
                            className="form-select form-select-sm"
                            style={{ maxWidth: '180px' }}
                          >
                            <option value="">Sin padre</option>
                            {getRootMenus().map((m) => (
                              <option key={m.id} value={m.id}>{m.nombre}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-muted small">Raíz</span>
                        )}
                      </td>
                      <td className="text-center">
                        <span className="badge bg-secondary font-monospace">{menu.orden}</span>
                      </td>
                      <td className="text-center">
                        <small className="text-muted font-monospace">{menu.lft}/{menu.rght}</small>
                      </td>
                      <td className="text-center">
                        <span className={`badge ${menu.activo ? 'bg-success' : 'bg-danger'}`}>
                          {menu.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="btn-group btn-group-sm" role="group">
                          <button
                            onClick={() => handleMoveUp(menu.id)}
                            className="btn btn-outline-secondary py-1 px-2"
                            title="Subir"
                          >
                            <i className="fa-solid fa-arrow-up"></i>
                          </button>
                          <button
                            onClick={() => handleMoveDown(menu.id)}
                            className="btn btn-outline-secondary py-1 px-2"
                            title="Bajar"
                          >
                            <i className="fa-solid fa-arrow-down"></i>
                          </button>
                          <button
                            onClick={() => handleEdit(menu)}
                            className="btn btn-outline-primary py-1 px-2"
                            title="Editar"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(menu.id)}
                            className="btn btn-outline-danger py-1 px-2"
                            title="Eliminar"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
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

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingMenu ? 'Editar Menú' : 'Nuevo Menú'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nombre *</label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Código *</label>
                    <input
                      type="text"
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Ruta</label>
                    <input
                      type="text"
                      value={formData.ruta}
                      onChange={(e) => setFormData({ ...formData, ruta: e.target.value })}
                      className="form-control"
                      placeholder="/admin/ejemplo"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Icono (FontAwesome)</label>
                    <input
                      type="text"
                      value={formData.icono}
                      onChange={(e) => setFormData({ ...formData, icono: e.target.value })}
                      className="form-control"
                      placeholder="fas fa-home"
                    />
                    {formData.icono && (
                      <div className="mt-2">
                        <small className="text-muted">Vista previa: </small>
                        <i className={formData.icono}></i>
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Menú Padre</label>
                    <select
                      value={formData.menuPadreId || ''}
                      onChange={(e) => setFormData({ ...formData, menuPadreId: e.target.value ? +e.target.value : null })}
                      className="form-select"
                    >
                      <option value="">Sin padre (menú principal)</option>
                      {getRootMenus().map((menu) => (
                        <option key={menu.id} value={menu.id}>{menu.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-check">
                    <input
                      type="checkbox"
                      checked={formData.activo}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                      className="form-check-input"
                      id="checkActivo"
                    />
                    <label className="form-check-label" htmlFor="checkActivo">
                      Activo
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingMenu ? 'Actualizar' : 'Crear'}
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
