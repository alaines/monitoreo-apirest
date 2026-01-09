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

type SortField = 'nombre' | 'ruta' | 'orden' | 'menuPadre' | 'activo';
type SortOrder = 'asc' | 'desc';

export function MenusManagement() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [allMenus, setAllMenus] = useState<Menu[]>([]);
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

  // Paginación
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Ordenamiento
  const [sortField, setSortField] = useState<SortField>('orden');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Filtros
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    menuPadreId: '' as string,
    activo: '' as '' | 'true' | 'false',
  });

  useEffect(() => {
    loadMenus();
  }, []);

  useEffect(() => {
    loadMenus();
  }, [page, limit, filters]);

  const loadMenus = async () => {
    try {
      setLoading(true);
      const data = await adminService.getMenus();
      setAllMenus(data);
      
      let filteredMenus = [...data];
      
      // Aplicar filtros
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredMenus = filteredMenus.filter(menu =>
          menu.nombre.toLowerCase().includes(searchLower) ||
          menu.ruta.toLowerCase().includes(searchLower) ||
          (menu.menuPadre?.nombre && menu.menuPadre.nombre.toLowerCase().includes(searchLower))
        );
      }
      
      if (filters.menuPadreId) {
        if (filters.menuPadreId === '0') {
          filteredMenus = filteredMenus.filter(menu => menu.menuPadreId === null);
        } else {
          filteredMenus = filteredMenus.filter(menu => 
            menu.menuPadreId === parseInt(filters.menuPadreId)
          );
        }
      }
      
      if (filters.activo !== '') {
        const activoBool = filters.activo === 'true';
        filteredMenus = filteredMenus.filter(menu => menu.activo === activoBool);
      }
      
      // Calcular paginación
      setTotal(filteredMenus.length);
      setTotalPages(Math.ceil(filteredMenus.length / limit));
      
      // Aplicar paginación
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedMenus = filteredMenus.slice(startIndex, endIndex);
      
      setMenus(paginatedMenus);
    } catch (error) {
      console.error('Error al cargar menús:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <i className="fas fa-sort text-muted ms-1"></i>;
    return sortOrder === 'asc'
      ? <i className="fas fa-sort-up ms-1"></i>
      : <i className="fas fa-sort-down ms-1"></i>;
  };

  const sortedMenus = [...menus].sort((a, b) => {
    let aVal: any, bVal: any;

    switch (sortField) {
      case 'nombre':
        aVal = a.nombre || '';
        bVal = b.nombre || '';
        break;
      case 'ruta':
        aVal = a.ruta || '';
        bVal = b.ruta || '';
        break;
      case 'orden':
        aVal = a.orden;
        bVal = b.orden;
        break;
      case 'menuPadre':
        aVal = a.menuPadre?.nombre || '';
        bVal = b.menuPadre?.nombre || '';
        break;
      case 'activo':
        aVal = a.activo ? 1 : 0;
        bVal = b.activo ? 1 : 0;
        break;
      default:
        return 0;
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });

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

  const parentMenus = allMenus.filter(m => m.menuPadreId === null);

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
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <i className="fas fa-filter me-2"></i>
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <i className="fas fa-plus me-2"></i>
            Nuevo Menú
          </button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Buscar</label>
                <input
                  type="text"
                  className="form-control form-control-custom"
                  placeholder="Nombre, ruta..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Menú Padre</label>
                <select
                  className="form-select form-select-custom"
                  value={filters.menuPadreId}
                  onChange={(e) => handleFilterChange('menuPadreId', e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="0">Sin menú padre</option>
                  {allMenus.filter(m => m.menuPadreId === null).map(menu => (
                    <option key={menu.id} value={menu.id}>{menu.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label">Estado</label>
                <select
                  className="form-select form-select-custom"
                  value={filters.activo}
                  onChange={(e) => handleFilterChange('activo', e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th onClick={() => handleSort('nombre')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Nombre {getSortIcon('nombre')}
                  </th>
                  <th>Icono</th>
                  <th onClick={() => handleSort('ruta')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Ruta {getSortIcon('ruta')}
                  </th>
                  <th onClick={() => handleSort('orden')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Orden {getSortIcon('orden')}
                  </th>
                  <th onClick={() => handleSort('menuPadre')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Menú Padre {getSortIcon('menuPadre')}
                  </th>
                  <th onClick={() => handleSort('activo')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Estado {getSortIcon('activo')}
                  </th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedMenus.map(menu => (
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

          {/* Paginación */}
          <div className="d-flex justify-content-between align-items-center mt-3">
            <div className="text-muted">
              Mostrando {((page - 1) * limit) + 1} a {Math.min(page * limit, total)} de {total} registros
            </div>
            <div className="d-flex gap-2 align-items-center">
              <select
                className="form-select form-select-sm"
                style={{ width: 'auto' }}
                value={limit}
                onChange={(e) => {
                  setLimit(parseInt(e.target.value));
                  setPage(1);
                }}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setPage(page - 1)}>
                      Anterior
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, i) => (
                    <li key={i + 1} className={`page-item ${page === i + 1 ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => setPage(i + 1)}>
                        {i + 1}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setPage(page + 1)}>
                      Siguiente
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
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
