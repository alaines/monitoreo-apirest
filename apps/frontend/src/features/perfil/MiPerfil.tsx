import { useState, useEffect } from 'react';
import { useAuthStore } from '../auth/authStore';

export function MiPerfil() {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    email: '',
    telefono: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    // Por ahora, los datos adicionales pueden estar en localStorage o venir del backend
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      setFormData(JSON.parse(savedProfile));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Guardar en localStorage por ahora
      localStorage.setItem('userProfile', JSON.stringify(formData));
      
      // Aquí iría la llamada al API para actualizar el perfil
      // await userService.updateProfile(formData);
      alert('Perfil actualizado correctamente');
      setIsEditing(false);
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      alert('Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      // Aquí iría la llamada al API para cambiar contraseña
      // await authService.changePassword(passwordData);
      alert('Contraseña actualizada correctamente');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      alert('Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-lg-8 mx-auto">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
              <h4 className="mb-0">
                <i className="fas fa-user me-2"></i>
                Mi Perfil
              </h4>
              {!isEditing && (
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsEditing(true)}
                >
                  <i className="fas fa-edit me-2"></i>
                  Editar
                </button>
              )}
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                {/* Información de Usuario */}
                <div className="row mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Usuario</label>
                    <p className="form-control-plaintext">{user?.usuario}</p>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Rol</label>
                    <p className="form-control-plaintext">
                      <span className="badge bg-primary">
                        {user?.grupo?.nombre || 'Sin rol'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Información Personal */}
                <h5 className="mb-3 mt-4">Información Personal</h5>
                <div className="row mb-3">
                  <div className="col-md-12">
                    <label className="form-label">Nombre Completo</label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="form-control"
                        value={formData.nombreCompleto}
                        onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
                        required
                      />
                    ) : (
                      <p className="form-control-plaintext">{formData.nombreCompleto || '-'}</p>
                    )}
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    {isEditing ? (
                      <input
                        type="email"
                        className="form-control"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    ) : (
                      <p className="form-control-plaintext">{formData.email || '-'}</p>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Teléfono</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        className="form-control"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      />
                    ) : (
                      <p className="form-control-plaintext">{formData.telefono || '-'}</p>
                    )}
                  </div>
                </div>

                {/* Seguridad */}
                <h5 className="mb-3 mt-4">Seguridad</h5>
                <div className="row mb-3">
                  <div className="col-md-12">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPasswordModal(true)}
                    >
                      <i className="fas fa-key me-2"></i>
                      Cambiar Contraseña
                    </button>
                  </div>
                </div>

                {/* Botones de Acción */}
                {isEditing && (
                  <div className="d-flex gap-2 mt-4">
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save me-2"></i>
                          Guardar Cambios
                        </>
                      )}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => {
                        setIsEditing(false);
                        const savedProfile = localStorage.getItem('userProfile');
                        if (savedProfile) {
                          setFormData(JSON.parse(savedProfile));
                        } else {
                          setFormData({ nombreCompleto: '', email: '', telefono: '' });
                        }
                      }}
                    >
                      <i className="fas fa-times me-2"></i>
                      Cancelar
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Cambiar Contraseña */}
      {showPasswordModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-key me-2"></i>
                  Cambiar Contraseña
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                ></button>
              </div>
              <form onSubmit={handlePasswordChange}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Contraseña Actual</label>
                    <input
                      type="password"
                      className="form-control"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Nueva Contraseña</label>
                    <input
                      type="password"
                      className="form-control"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                      minLength={6}
                    />
                    <small className="text-muted">Mínimo 6 caracteres</small>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Confirmar Nueva Contraseña</label>
                    <input
                      type="password"
                      className="form-control"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
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
