import { useState, useEffect } from 'react';
import Select from 'react-select';
import toast from 'react-hot-toast';
import { usersService, gruposService, areasService, catalogosPersonasService, type User, type Grupo, type Area, type CreateUserDto, type UpdateUserDto, type TipoDoc, type EstadoCivil } from '../../../services/admin.service';
import { customSelectStyles, customSelectStylesSmall } from '../../../styles/react-select-custom';
import { useAuthStore } from '../../auth/authStore';
import { PageHeader } from '../../../components/ui/PageHeader';

type SortField = 'usuario' | 'nombreCompleto' | 'email' | 'grupo' | 'estado';
type SortOrder = 'asc' | 'desc';

export function UsersManagement() {
  const { user: currentUser } = useAuthStore();
  const isSuperAdmin = currentUser?.grupo?.nombre === 'SUPER_ADMIN';
  
  const [users, setUsers] = useState<User[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [tiposDoc, setTiposDoc] = useState<TipoDoc[]>([]);
  const [estadosCiviles, setEstadosCiviles] = useState<EstadoCivil[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<CreateUserDto>({
    usuario: '',
    password: '',
    tipoDocId: 0,
    nroDoc: '',
    nombres: '',
    apellidoP: '',
    apellidoM: '',
    fechaNacimiento: '',
    genero: 'M',
    estadoCivilId: undefined,
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
  
  // Debounce para el campo de búsqueda
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Efecto para debouncing del campo de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500); // Esperar 500ms después de que el usuario deje de escribir

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Actualizar filters.search cuando cambie debouncedSearch
  useEffect(() => {
    setFilters(prev => ({ ...prev, search: debouncedSearch }));
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    loadGrupos();
    loadAreas();
    loadCatalogos();
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

  const loadCatalogos = async () => {
    try {
      const [tiposDocData, estadosCivilesData] = await Promise.all([
        catalogosPersonasService.getTiposDocumento(),
        catalogosPersonasService.getEstadosCiviles()
      ]);
      setTiposDoc(tiposDocData);
      setEstadosCiviles(estadosCivilesData);
    } catch (error: any) {
      console.error('Error loading catálogos:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      // Cargar todos los usuarios para filtrar/paginar en el cliente
      const usersResponse = await usersService.getAll(1, 1000);
      
      let filteredUsers = (usersResponse.data || usersResponse).map((user: User) => {
        // Usar nomcomp de la tabla personas
        const nombreCompleto = user.persona?.nomcomp || '';
        
        return {
          ...user,
          nombreCompleto,
          email: user.persona?.email || user.email,
          telefono: user.persona?.movil1 || user.telefono
        };
      });
      
      // Aplicar filtros en el cliente
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredUsers = filteredUsers.filter((user: User) =>
          user.usuario.toLowerCase().includes(searchLower) ||
          (user.nombreCompleto && user.nombreCompleto.toLowerCase().includes(searchLower)) ||
          (user.email && user.email.toLowerCase().includes(searchLower)) ||
          (user.persona?.num_doc && user.persona.num_doc.includes(filters.search))
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
    if (sortField !== field) return <i className="fa-solid fa-sort text-muted ms-1"></i>;
    return sortOrder === 'asc'
      ? <i className="fa-solid fa-sort-up text-primary ms-1"></i>
      : <i className="fa-solid fa-sort-down text-primary ms-1"></i>;
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
      const persona = user.persona;
      setFormData({
        usuario: user.usuario,
        password: '',
        tipoDocId: persona?.tipoDocId || 0,
        nroDoc: persona?.num_doc || '',
        nombres: persona?.nombres || '',
        apellidoP: persona?.ape_pat || '',
        apellidoM: persona?.ape_mat || '',
        fechaNacimiento: persona?.fecnac ? persona.fecnac.toString().split('T')[0] : '',
        genero: persona?.genero || 'M',
        estadoCivilId: persona?.estadoCivilId,
        email: persona?.email || '',
        telefono: persona?.movil1 || '',
        grupoId: user.grupoId,
        areaId: user.areaId,
        estado: user.estado
      });
    } else {
      setEditingUser(null);
      setFormData({
        usuario: '',
        password: '',
        tipoDocId: tiposDoc[0]?.id || 0,
        nroDoc: '',
        nombres: '',
        apellidoP: '',
        apellidoM: '',
        fechaNacimiento: '',
        genero: 'M',
        estadoCivilId: undefined,
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
          usuario: formData.usuario,
          tipoDocId: formData.tipoDocId,
          nroDoc: formData.nroDoc,
          nombres: formData.nombres,
          apellidoP: formData.apellidoP,
          apellidoM: formData.apellidoM,
          fechaNacimiento: formData.fechaNacimiento || undefined,
          genero: formData.genero,
          estadoCivilId: formData.estadoCivilId,
          email: formData.email || undefined,
          telefono: formData.telefono || undefined,
          grupoId: formData.grupoId,
          areaId: formData.areaId,
          estado: formData.estado
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await usersService.update(editingUser.id, updateData);
        toast.success('Usuario actualizado exitosamente');
      } else {
        await usersService.create(formData);
        toast.success('Usuario creado exitosamente');
      }
      await loadData();
      handleCloseModal();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al guardar usuario';
      setErrors(msg);
      toast.error(msg);
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`⚠️ ATENCIÓN: Esta acción eliminará PERMANENTEMENTE al usuario "${user.usuario}" y todos sus datos asociados. Esta acción NO se puede deshacer.\n\n¿Está seguro de continuar?`)) return;

    try {
      await usersService.delete(user.id);
      toast.success('Usuario eliminado exitosamente');
      await loadData();
    } catch (error: any) {
      console.error('Error eliminando usuario:', error);
      const msg = error.response?.data?.message || 'Error al eliminar usuario';
      setErrors(msg);
      toast.error(msg);
    }
  };

  const handleToggleEstado = async (user: User) => {
    const action = user.estado ? 'desactivar' : 'activar';
    if (!confirm(`¿Está seguro de ${action} al usuario "${user.usuario}"?`)) return;

    try {
      await usersService.toggleEstado(user.id);
      toast.success(user.estado ? 'Usuario desactivado exitosamente' : 'Usuario activado exitosamente');
      await loadData();
    } catch (error: any) {
      const msg = error.response?.data?.message || `Error al ${action} usuario`;
      setErrors(msg);
      toast.error(msg);
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
    <div className="container-fluid p-3">
      <PageHeader
        icon="fa-solid fa-users-gear"
        title="Gestión de Usuarios"
        subtitle="Control de acceso, administración de cuentas, perfiles y permisos del sistema"
        actions={
          <div className="d-flex gap-2">
            <button
              className={`btn btn-sm ${showFilters ? 'btn-secondary' : 'btn-outline-secondary'}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <i className="fa-solid fa-filter me-1"></i>
              {showFilters ? 'Ocultar Filtros' : 'Filtros'}
            </button>
            <button className="btn btn-sm btn-primary" onClick={() => handleOpenModal()}>
              <i className="fa-solid fa-plus me-1"></i>
              Nuevo Usuario
            </button>
          </div>
        }
      />

      {errors && (
        <div className="alert alert-danger alert-dismissible fade show py-2" role="alert">
          <i className="fa-solid fa-triangle-exclamation me-2"></i>
          {errors}
          <button type="button" className="btn-close btn-sm" onClick={() => setErrors('')}></button>
        </div>
      )}

      {/* Filtros */}
      {showFilters && (
        <div className="card border shadow-sm mb-3">
          <div className="card-header bg-white border-bottom py-2">
            <h6 className="card-title mb-0 fw-semibold text-dark" style={{ fontSize: '14px' }}>
              <i className="fa-solid fa-sliders me-2 text-primary"></i>
              Filtros de Usuarios
            </h6>
          </div>
          <div className="card-body py-3">
            <div className="row g-2">
              <div className="col-md-4">
                <label className="form-label small fw-bold text-muted mb-1">Buscar</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Usuario, nombre o email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold text-muted mb-1">Grupo</label>
                <Select
                  options={[
                    { value: '', label: 'Todos' },
                    ...grupos.map(grupo => ({ value: String(grupo.id), label: grupo.nombre }))
                  ]}
                  value={filters.grupoId ? { value: filters.grupoId, label: grupos.find(g => g.id === parseInt(filters.grupoId))?.nombre || filters.grupoId } : { value: '', label: 'Todos' }}
                  onChange={(option) => handleFilterChange('grupoId', option?.value || '')}
                  isClearable
                  styles={customSelectStylesSmall}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold text-muted mb-1">Estado</label>
                <Select
                  options={[
                    { value: '', label: 'Todos' },
                    { value: 'true', label: 'Activos' },
                    { value: 'false', label: 'Inactivos' }
                  ]}
                  value={filters.estado === 'true' ? { value: 'true', label: 'Activos' } : filters.estado === 'false' ? { value: 'false', label: 'Inactivos' } : { value: '', label: 'Todos' }}
                  onChange={(option) => handleFilterChange('estado', option?.value || '')}
                  isClearable
                  styles={customSelectStylesSmall}
                />
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <button
                  className="btn btn-outline-secondary btn-sm w-100"
                  onClick={() => {
                    setSearchInput('');
                    setFilters({ search: '', grupoId: '', estado: '' });
                    setPage(1);
                  }}
                  title="Limpiar filtros"
                >
                  <i className="fa-solid fa-eraser me-1"></i>
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card border shadow-sm">
        <div className="card-header bg-white border-bottom py-2 d-flex justify-content-between align-items-center">
          <h6 className="card-title mb-0 fw-semibold text-dark" style={{ fontSize: '14px' }}>
            <i className="fa-solid fa-list me-2 text-primary"></i>
            Listado de Usuarios ({total} registros)
          </h6>
          <div className="d-flex align-items-center gap-2">
            <span className="small text-muted">Mostrar:</span>
            <div style={{ width: '80px' }}>
              <Select
                options={[
                  { value: 10, label: '10' },
                  { value: 25, label: '25' },
                  { value: 50, label: '50' },
                  { value: 100, label: '100' }
                ]}
                value={{ value: limit, label: String(limit) }}
                onChange={(option) => { setLimit(Number(option?.value || 10)); setPage(1); }}
                styles={customSelectStylesSmall}
                isSearchable={false}
              />
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-striped align-middle mb-0">
              <thead className="table-light text-uppercase" style={{ fontSize: '12px' }}>
                <tr>
                  <th style={{ width: '130px', cursor: 'pointer' }} onClick={() => handleSort('usuario')}>
                    Usuario {getSortIcon('usuario')}
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('nombreCompleto')}>
                    Nombre Completo {getSortIcon('nombreCompleto')}
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('email')}>
                    Email {getSortIcon('email')}
                  </th>
                  <th style={{ width: '120px' }}>Teléfono</th>
                  <th style={{ width: '160px', cursor: 'pointer' }} onClick={() => handleSort('grupo')}>
                    Grupo {getSortIcon('grupo')}
                  </th>
                  <th style={{ width: '110px', cursor: 'pointer' }} className="text-center" onClick={() => handleSort('estado')}>
                    Estado {getSortIcon('estado')}
                  </th>
                  <th style={{ width: '110px' }} className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '13px' }}>
                {sortedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-muted">
                      <i className="fa-solid fa-inbox fa-2x mb-2 d-block text-secondary"></i>
                      No se encontraron registros
                    </td>
                  </tr>
                ) : (
                  sortedUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="fw-semibold text-dark">
                        <i className="fa-solid fa-user me-1 text-secondary small"></i>
                        {user.usuario}
                      </td>
                      <td className="fw-medium text-dark">{user.nombreCompleto || '—'}</td>
                      <td>
                        {user.email ? (
                          <span className="text-secondary">
                            <i className="fa-solid fa-envelope me-1 text-secondary small"></i>
                            {user.email}
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        {user.telefono ? (
                          <span>
                            <i className="fa-solid fa-phone me-1 text-secondary small"></i>
                            {user.telefono}
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          <i className="fa-solid fa-shield-halved me-1 text-primary"></i>
                          {user.grupo?.nombre || 'Sin grupo'}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`badge ${user.estado ? 'bg-success' : 'bg-secondary'}`}>
                          {user.estado ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary btn-sm py-1 px-2"
                            onClick={() => handleOpenModal(user)}
                            title="Editar"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            className={`btn ${user.estado ? 'btn-outline-danger' : 'btn-outline-success'} btn-sm py-1 px-2`}
                            onClick={() => handleToggleEstado(user)}
                            title={user.estado ? 'Desactivar' : 'Activar'}
                          >
                            <i className={`fa-solid ${user.estado ? 'fa-user-slash' : 'fa-user-check'}`}></i>
                          </button>
                          {isSuperAdmin && (
                            <button
                              className="btn btn-outline-danger btn-sm py-1 px-2"
                              onClick={() => handleDelete(user)}
                              title="Eliminar permanentemente"
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

        {totalPages > 1 && (
          <div className="card-footer bg-white border-top py-2 d-flex justify-content-between align-items-center">
            <span className="small text-muted">
              Página {page} de {totalPages} ({total} registros totales)
            </span>
            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage(page - 1)}>
                    <i className="fa-solid fa-chevron-left"></i>
                  </button>
                </li>
                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= page - 1 && pageNum <= page + 1)
                  ) {
                    return (
                      <li key={pageNum} className={`page-item ${page === pageNum ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => setPage(pageNum)}>
                          {pageNum}
                        </button>
                      </li>
                    );
                  } else if (pageNum === page - 2 || pageNum === page + 2) {
                    return <li key={pageNum} className="page-item disabled"><span className="page-link">...</span></li>;
                  }
                  return null;
                })}
                <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage(page + 1)}>
                    <i className="fa-solid fa-chevron-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
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
                    {/* Datos del Usuario */}
                    <div className="col-12">
                      <h6 className="border-bottom pb-2 mb-3">
                        <i className="fas fa-user me-2"></i>
                        Datos de Usuario
                      </h6>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Usuario *</label>
                      <input
                        type="text"
                        className="form-control custom-input"
                        value={formData.usuario}
                        onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                        required
                        disabled={!!editingUser}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">
                        Contraseña {editingUser ? '(dejar vacío para no cambiar)' : '*'}
                      </label>
                      <input
                        type="password"
                        className="form-control custom-input"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required={!editingUser}
                        minLength={6}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Grupo / Perfil *</label>
                      <Select
                        options={[
                          { value: 0, label: 'Seleccione un grupo' },
                          ...grupos.map(grupo => ({ value: grupo.id, label: grupo.nombre }))
                        ]}
                        value={formData.grupoId ? { value: formData.grupoId, label: grupos.find(g => g.id === formData.grupoId)?.nombre || 'Seleccione un grupo' } : { value: 0, label: 'Seleccione un grupo' }}
                        onChange={(option) => setFormData({ ...formData, grupoId: Number(option?.value || 0) })}
                        styles={customSelectStyles}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Área</label>
                      <Select
                        options={[
                          { value: null, label: 'Sin área' },
                          ...areas.map(area => ({ value: area.id, label: area.nombre }))
                        ]}
                        value={formData.areaId ? { value: formData.areaId, label: areas.find(a => a.id === formData.areaId)?.nombre || 'Sin área' } : { value: null, label: 'Sin área' }}
                        onChange={(option) => setFormData({ ...formData, areaId: option?.value || undefined })}
                        isClearable
                        styles={customSelectStyles}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Estado</label>
                      <Select
                        options={[
                          { value: 'true', label: 'Activo' },
                          { value: 'false', label: 'Inactivo' }
                        ]}
                        value={{ value: formData.estado ? 'true' : 'false', label: formData.estado ? 'Activo' : 'Inactivo' }}
                        onChange={(option) => setFormData({ ...formData, estado: option?.value === 'true' })}
                        styles={customSelectStyles}
                      />
                    </div>

                    {/* Datos Personales */}
                    <div className="col-12 mt-4">
                      <h6 className="border-bottom pb-2 mb-3">
                        <i className="fas fa-id-card me-2"></i>
                        Datos Personales
                      </h6>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Tipo de Documento *</label>
                      <Select
                        options={[
                          { value: 0, label: 'Seleccione tipo' },
                          ...tiposDoc.map(tipo => ({ value: tipo.id, label: tipo.nombre }))
                        ]}
                        value={formData.tipoDocId ? { value: formData.tipoDocId, label: tiposDoc.find(t => t.id === formData.tipoDocId)?.nombre || 'Seleccione tipo' } : { value: 0, label: 'Seleccione tipo' }}
                        onChange={(option) => setFormData({ ...formData, tipoDocId: Number(option?.value || 0) })}
                        styles={customSelectStyles}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Número de Documento *</label>
                      <input
                        type="text"
                        className="form-control custom-input"
                        value={formData.nroDoc}
                        onChange={(e) => setFormData({ ...formData, nroDoc: e.target.value })}
                        required
                        maxLength={15}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Género</label>
                      <Select
                        options={[
                          { value: 'M', label: 'Masculino' },
                          { value: 'F', label: 'Femenino' }
                        ]}
                        value={{ value: formData.genero, label: formData.genero === 'M' ? 'Masculino' : 'Femenino' }}
                        onChange={(option) => setFormData({ ...formData, genero: option?.value || 'M' })}
                        styles={customSelectStyles}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Nombres *</label>
                      <input
                        type="text"
                        className="form-control custom-input"
                        value={formData.nombres}
                        onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Apellido Paterno *</label>
                      <input
                        type="text"
                        className="form-control custom-input"
                        value={formData.apellidoP}
                        onChange={(e) => setFormData({ ...formData, apellidoP: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Apellido Materno *</label>
                      <input
                        type="text"
                        className="form-control custom-input"
                        value={formData.apellidoM}
                        onChange={(e) => setFormData({ ...formData, apellidoM: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Fecha de Nacimiento</label>
                      <input
                        type="date"
                        className="form-control custom-date-input"
                        value={formData.fechaNacimiento}
                        onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Estado Civil</label>
                      <Select
                        options={[
                          { value: null, label: 'Sin especificar' },
                          ...estadosCiviles.map(estado => ({ value: estado.id, label: estado.nombre }))
                        ]}
                        value={formData.estadoCivilId ? { value: formData.estadoCivilId, label: estadosCiviles.find(e => e.id === formData.estadoCivilId)?.nombre || 'Sin especificar' } : { value: null, label: 'Sin especificar' }}
                        onChange={(option) => setFormData({ ...formData, estadoCivilId: option?.value || undefined })}
                        isClearable
                        styles={customSelectStyles}
                      />
                    </div>

                    {/* Datos de Contacto */}
                    <div className="col-12 mt-4">
                      <h6 className="border-bottom pb-2 mb-3">
                        <i className="fas fa-phone me-2"></i>
                        Datos de Contacto
                      </h6>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control custom-input"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Teléfono / Celular</label>
                      <input
                        type="tel"
                        className="form-control custom-input"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        maxLength={15}
                      />
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
