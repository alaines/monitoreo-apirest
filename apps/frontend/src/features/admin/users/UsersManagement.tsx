import { useState, useEffect } from 'react';
import { usersService, gruposService, areasService, type User, type Grupo, type Area, type CreateUserDto, type UpdateUserDto } from '../../../services/admin.service';

type SortField = 'usuario' | 'nombreCompleto' | 'email' | 'grupo' | 'estado';
type SortOrder = 'asc' | 'desc';

export function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<CreateUserDto>({
    usuario: '',
    clave: '',
    nombreCompleto: '',
    email: '',
    telefono: '',
    grupoId: 0,
    areaId: undefined,
    estado: true
  });
  const [errors, setErrors] = useState<string>('');

  // Paginación
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Ordenamiento
  const [sortField, setSortField] = useState<SortField>('usuario');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Filtros
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    grupoId: '' as string,
    estado: '' as '' | 'true' | 'false',
  });

  useEffect(() => {
    loadGrupos();
    loadAreas();
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, [page, limit, filters]);

  const loadGrupos = async () => {
    try {
      const gruposData = await gruposService.getAll();
      // Eliminar duplicados por ID
      const uniqueGrupos = gruposData.filter((grupo: Grupo, index: number, self: Grupo[]) =>
        index === self.findIndex((g) => g.id === grupo.id)
      );
      setGrupos(uniqueGrupos);
    } catch (error: any) {
      console.error('Error loading grupos:', error);
    }
  };

  const loadAreas = async () => {
    try {
      const areasData = await areasService.getAll();
      setAreas(areasData.filter((area: Area) => area.estado));
    } catch (error: any) {
      console.error('Error loading areas:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      // Cargar todos los usuarios para filtrar/paginar en el cliente
      const usersResponse = await usersService.getAll(1, 1000);
      
      let filteredUsers = usersResponse.data || usersResponse;
      
      // Aplicar filtros en el cliente
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredUsers = filteredUsers.filter((user: User) =>
          user.usuario.toLowerCase().includes(searchLower) ||
          user.nombreCompleto.toLowerCase().includes(searchLower) ||
          (user.email && user.email.toLowerCase().includes(searchLower))
        );
      }
      
      if (filters.grupoId) {
        filteredUsers = filteredUsers.filter((user: User) => user.grupoId === parseInt(filters.grupoId));
      }
      
      if (filters.estado !== '') {
        const estadoBool = filters.estado === 'true';
        filteredUsers = filteredUsers.filter((user: User) => user.estado === estadoBool);
      }
      
      // Calcular paginación
      setTotal(filteredUsers.length);
      setTotalPages(Math.ceil(filteredUsers.length / limit));
      
      // Aplicar paginación en el cliente
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
      
      setUsers(paginatedUsers);
    } catch (error: any) {
      setErrors(error.response?.data?.message || 'Error al cargar datos');
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

  const sortedUsers = [...users].sort((a, b) => {
    let aVal: any, bVal: any;

    switch (sortField) {
      case 'usuario':
        aVal = a.usuario || '';
        bVal = b.usuario || '';
        break;
      case 'nombreCompleto':
        aVal = a.nombreCompleto || '';
        bVal = b.nombreCompleto || '';
        break;
      case 'email':
        aVal = a.email || '';
        bVal = b.email || '';
        break;
      case 'grupo':
        aVal = a.grupo?.nombre || '';
        bVal = b.grupo?.nombre || '';
        break;
      case 'estado':
        aVal = a.estado ? 1 : 0;
        bVal = b.estado ? 1 : 0;
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

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        usuario: user.usuario,
        clave: '',
        nombreCompleto: user.nombreCompleto,
        email: user.email || '',
        telefono: user.telefono || '',
        grupoId: user.grupoId,
        areaId: (user as any).areaId || undefined,
        estado: user.estado
      });
    } else {
      setEditingUser(null);
      setFormData({
        usuario: '',
        clave: '',
        nombreCompleto: '',
        email: '',
        telefono: '',
        grupoId: grupos[0]?.id || 0,
        areaId: undefined,
        estado: true
      });
    }
    setErrors('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setErrors('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors('');

    try {
      if (editingUser) {
        const updateData: UpdateUserDto = {
          nombreCompleto: formData.nombreCompleto,
          email: formData.email || undefined,
          telefono: formData.telefono || undefined,
          grupoId: formData.grupoId,
          areaId: formData.areaId,
          estado: formData.estado
        };
        if (formData.clave) {
          updateData.clave = formData.clave;
        }
        await usersService.update(editingUser.id, updateData);
      } else {
        await usersService.create(formData);
      }
      await loadData();
      handleCloseModal();
    } catch (error: any) {
      setErrors(error.response?.data?.message || 'Error al guardar usuario');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este usuario?')) return;

    try {
      await usersService.delete(id);
      await loadData();
    } catch (error: any) {
      setErrors(error.response?.data?.message || 'Error al eliminar usuario');
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

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <i className="fas fa-users me-2"></i>
          Gestión de Usuarios
        </h2>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <i className="fas fa-plus me-2"></i>
          Nuevo Usuario
        </button>
      </div>

      {errors && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {errors}
          <button type="button" className="btn-close" onClick={() => setErrors('')}></button>
        </div>
      )}

      {/* Filtros */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-header bg-white border-bottom">
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <i className="fas fa-filter me-2"></i>
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </button>
        </div>
        {showFilters && (
          <div className="card-body">
            <div className="row g-2">
              <div className="col-md-4">
                <label className="form-label small">Buscar</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Usuario, nombre o email..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small">Grupo</label>
                <select
                  className="form-select form-select-sm"
                  value={filters.grupoId}
                  onChange={(e) => handleFilterChange('grupoId', e.target.value)}
                >
                  <option value="">Todos</option>
                  {grupos.map(grupo => (
                    <option key={grupo.id} value={grupo.id}>{grupo.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label small">Estado</label>
                <select
                  className="form-select form-select-sm"
                  value={filters.estado}
                  onChange={(e) => handleFilterChange('estado', e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="true">Activos</option>
                  <option value="false">Inactivos</option>
                </select>
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <button
                  className="btn btn-outline-secondary btn-sm w-100"
                  onClick={() => {
                    setFilters({ search: '', grupoId: '', estado: '' });
                    setPage(1);
                  }}
                  title="Limpiar filtros"
                >
                  <i className="fas fa-eraser me-1"></i>
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th onClick={() => handleSort('usuario')} style={{ cursor: 'pointer' }}>
                    Usuario {getSortIcon('usuario')}
                  </th>
                  <th onClick={() => handleSort('nombreCompleto')} style={{ cursor: 'pointer' }}>
                    Nombre Completo {getSortIcon('nombreCompleto')}
                  </th>
                  <th onClick={() => handleSort('email')} style={{ cursor: 'pointer' }}>
                    Email {getSortIcon('email')}
                  </th>
                  <th>Teléfono</th>
                  <th onClick={() => handleSort('grupo')} style={{ cursor: 'pointer' }}>
                    Grupo {getSortIcon('grupo')}
                  </th>
                  <th onClick={() => handleSort('estado')} style={{ cursor: 'pointer' }}>
                    Estado {getSortIcon('estado')}
                  </th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((user) => (
                  <tr key={user.id}>
                    <td><strong>{user.usuario}</strong></td>
                    <td>{user.nombreCompleto}</td>
                    <td>{user.email || '-'}</td>
                    <td>{user.telefono || '-'}</td>
                    <td>
                      <span className="badge bg-info">
                        {user.grupo?.nombre || 'Sin grupo'}
                      </span>
                    </td>
                    <td>
                      {user.estado ? (
                        <span className="badge bg-success">Activo</span>
                      ) : (
                        <span className="badge bg-secondary">Inactivo</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => handleOpenModal(user)}
                        title="Editar"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(user.id)}
                        title="Eliminar"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div>
                <span className="text-muted">
                  Mostrando {(page - 1) * limit + 1} - {Math.min(page * limit, total)} de {total} usuarios
                </span>
              </div>
              <div className="d-flex gap-2 align-items-center">
                <select
                  className="form-select form-select-sm"
                  style={{ width: 'auto' }}
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  <option value={10}>10 por página</option>
                  <option value={25}>25 por página</option>
                  <option value={50}>50 por página</option>
                  <option value={100}>100 por página</option>
                </select>
                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                      >
                        Anterior
                      </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <li key={pageNum} className={`page-item ${page === pageNum ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => setPage(pageNum)}>
                          {pageNum}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                      >
                        Siguiente
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Usuario *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.usuario}
                        onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                        required
                        disabled={!!editingUser}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">
                        Contraseña {editingUser ? '(dejar vacío para no cambiar)' : '*'}
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        value={formData.clave}
                        onChange={(e) => setFormData({ ...formData, clave: e.target.value })}
                        required={!editingUser}
                        minLength={6}
                      />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label">Nombre Completo *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.nombreCompleto}
                        onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Teléfono</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Grupo *</label>
                      <select
                        className="form-select"
                        value={formData.grupoId}
                        onChange={(e) => setFormData({ ...formData, grupoId: Number(e.target.value) })}
                        required
                      >
                        <option value="">Seleccione un grupo</option>
                        {grupos.map((grupo) => (
                          <option key={grupo.id} value={grupo.id}>
                            {grupo.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Área</label>
                      <select
                        className="form-select"
                        value={formData.areaId || ''}
                        onChange={(e) => setFormData({ ...formData, areaId: e.target.value ? Number(e.target.value) : undefined })}
                      >
                        <option value="">Sin área</option>
                        {areas.map((area) => (
                          <option key={area.id} value={area.id}>
                            {area.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Estado</label>
                      <select
                        className="form-select"
                        value={formData.estado ? 'true' : 'false'}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.value === 'true' })}
                      >
                        <option value="true">Activo</option>
                        <option value="false">Inactivo</option>
                      </select>
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
