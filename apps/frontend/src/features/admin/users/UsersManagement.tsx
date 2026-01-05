import { useState, useEffect } from 'react';
import { usersService, gruposService, type User, type Grupo, type CreateUserDto, type UpdateUserDto } from '../../../services/admin.service';

export function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
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
    estado: true
  });
  const [errors, setErrors] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, gruposData] = await Promise.all([
        usersService.getAll(1, 100),
        gruposService.getAll()
      ]);
      setUsers(usersData.data || usersData);
      setGrupos(gruposData);
    } catch (error: any) {
      setErrors(error.response?.data?.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

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

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Nombre Completo</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Grupo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
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
                    <div className="col-md-6">
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
                    <div className="col-md-6">
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
