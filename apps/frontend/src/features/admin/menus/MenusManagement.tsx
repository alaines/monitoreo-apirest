import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../auth/authStore';
import { toast } from 'react-hot-toast';

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
  const { token } = useAuthStore();

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
        toast.success('Menú actualizado');
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/menus`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Menú creado');
      }
      setShowModal(false);
      loadMenus();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este menú?')) return;
    
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/menus/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Menú eliminado');
      loadMenus();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar');
    }
  };

  const handleMoveUp = async (id: number) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/menus/${id}/move-up`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Menú movido');
      loadMenus();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al mover');
    }
  };

  const handleMoveDown = async (id: number) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/menus/${id}/move-down`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Menú movido');
      loadMenus();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al mover');
    }
  };

  const handleChangeParent = async (id: number, newParentId: number | null) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/menus/${id}/change-parent`,
        { newParentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Padre cambiado');
      loadMenus();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cambiar padre');
    }
  };

  const getRootMenus = () => menus.filter(m => !m.menuPadreId);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Menús</h1>
        <button
          onClick={handleCreate}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          <i className="fas fa-plus mr-2"></i>
          Nuevo Menú
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ruta</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Icono</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Padre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orden</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">lft/rght</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {menus.map((menu) => (
                <tr key={menu.id} style={{ paddingLeft: `${(menu.nivel || 0) * 20}px` }}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span style={{ marginLeft: `${(menu.nivel || 0) * 20}px` }}>
                      {menu.nivel && menu.nivel > 0 ? '└─ ' : ''}
                      {menu.nombre}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{menu.codigo}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{menu.ruta}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <i className={menu.icono}></i>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {menu.menuPadreId ? (
                      <select
                        value={menu.menuPadreId || ''}
                        onChange={(e) => handleChangeParent(menu.id, e.target.value ? +e.target.value : null)}
                        className="border rounded px-2 py-1 text-xs"
                      >
                        <option value="">Sin padre</option>
                        {getRootMenus().map((m) => (
                          <option key={m.id} value={m.id}>{m.nombre}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">{menu.orden}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                    {menu.lft}/{menu.rght}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded ${menu.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {menu.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleMoveUp(menu.id)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Subir"
                      >
                        <i className="fas fa-arrow-up"></i>
                      </button>
                      <button
                        onClick={() => handleMoveDown(menu.id)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Bajar"
                      >
                        <i className="fas fa-arrow-down"></i>
                      </button>
                      <button
                        onClick={() => handleEdit(menu)}
                        className="text-yellow-600 hover:text-yellow-800 p-1"
                        title="Editar"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={() => handleDelete(menu.id)}
                        className="text-red-600 hover:text-red-800 p-1"
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
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingMenu ? 'Editar Menú' : 'Nuevo Menú'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Código</label>
                <input
                  type="text"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Ruta</label>
                <input
                  type="text"
                  value={formData.ruta}
                  onChange={(e) => setFormData({ ...formData, ruta: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Icono (FontAwesome)</label>
                <input
                  type="text"
                  value={formData.icono}
                  onChange={(e) => setFormData({ ...formData, icono: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="fas fa-home"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Menú Padre</label>
                <select
                  value={formData.menuPadreId || ''}
                  onChange={(e) => setFormData({ ...formData, menuPadreId: e.target.value ? +e.target.value : null })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Sin padre (menú principal)</option>
                  {getRootMenus().map((menu) => (
                    <option key={menu.id} value={menu.id}>{menu.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">Activo</span>
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {editingMenu ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
