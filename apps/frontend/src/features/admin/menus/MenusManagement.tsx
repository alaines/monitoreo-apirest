import { useState, useEffect } from 'react';
import { adminService } from '../../../services/admin.service';

interface Menu {
  id: number;
  nombre: string;
  icono: string;
  ruta: string;
  orden: number;
  menuPadreId: number | null;
  activo: boolean;
  menuPadre?: {
    nombre: string;
  };
  submenus?: Menu[];
}

export function MenusManagement() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    icono: '',
    ruta: '',
    orden: 0,
    menuPadreId: null as number | null,
    activo: true
  });

  useEffect(() => {
    loadMenus();
  }, []);

  const loadMenus = async () => {
    try {
      setLoading(true);
      const data = await adminService.getMenus();
      setMenus(data);
    } catch (error) {
      console.error('Error al cargar menús:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMenu) {
        await adminService.updateMenu(editingMenu.id, formData);
      } else {
        await adminService.createMenu(formData);
      }
      setShowModal(false);
      resetForm();
      loadMenus();
    } catch (error) {
      console.error('Error al guardar menú:', error);
      alert('Error al guardar el menú');
    }
  };

  const handleEdit = (menu: Menu) => {
    setEditingMenu(menu);
    setFormData({
      nombre: menu.nombre,
      icono: menu.icono,
      ruta: menu.ruta,
      orden: menu.orden,
      menuPadreId: menu.menuPadreId,
      activo: menu.activo
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este menú?')) return;
    try {
      await adminService.deleteMenu(id);
      loadMenus();
    } catch (error) {
      console.error('Error al eliminar menú:', error);
      alert('Error al eliminar el menú');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      icono: '',
      ruta: '',
      orden: 0,
      menuPadreId: null,
      activo: true
    });
    setEditingMenu(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const parentMenus = menus.filter(m => m.menuPadreId === null);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <i className="fas fa-bars me-2"></i>
          Gestión de Menús
        </h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          <i className="fas fa-plus me-2"></i>
          Nuevo Menú
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Icono</th>
                  <th>Ruta</th>
                  <th>Orden</th>
                  <th>Menú Padre</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {menus.map(menu => (
                  <tr key={menu.id}>
                    <td>{menu.id}</td>
                    <td>{menu.nombre}</td>
                    <td>
                      <i className={menu.icono} style={{ fontSize: '18px' }}></i>
                    </td>
                    <td>
                      <code>{menu.ruta}</code>
                    </td>
                    <td>{menu.orden}</td>
                    <td>
                      {menu.menuPadre ? (
                        <span className="badge bg-secondary">{menu.menuPadre.nombre}</span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      {menu.activo ? (
                        <span className="badge bg-success">Activo</span>
                      ) : (
                        <span className="badge bg-danger">Inactivo</span>
                      )}
                    </td>
                    <td>
                      <div className="btn-group" role="group">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleEdit(menu)}
                          title="Editar"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(menu.id)}
                          title="Eliminar"
                        >
                          <i className="fas fa-trash"></i>
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

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingMenu ? 'Editar Menú' : 'Nuevo Menú'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Nombre</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Icono (FontAwesome)</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className={formData.icono || 'fas fa-question'}></i>
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="fas fa-home"
                          value={formData.icono}
                          onChange={(e) => setFormData({ ...formData, icono: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Ruta</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="/ruta"
                        value={formData.ruta}
                        onChange={(e) => setFormData({ ...formData, ruta: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Orden</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.orden}
                        onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Menú Padre (opcional)</label>
                      <select
                        className="form-select"
                        value={formData.menuPadreId || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          menuPadreId: e.target.value ? parseInt(e.target.value) : null
                        })}
                      >
                        <option value="">Sin menú padre</option>
                        {parentMenus.map(menu => (
                          <option key={menu.id} value={menu.id}>
                            {menu.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Estado</label>
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={formData.activo}
                          onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                        />
                        <label className="form-check-label">
                          {formData.activo ? 'Activo' : 'Inactivo'}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCloseModal}
                  >
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
