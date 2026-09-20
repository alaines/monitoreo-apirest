import { useState, useEffect } from 'react';
import { useAuthStore } from '../auth/authStore';
import { PageHeader } from '../../components/ui/PageHeader';
import toast from 'react-hot-toast';

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
      toast.success('Perfil actualizado correctamente');
      setIsEditing(false);
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      toast.error('Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      // Aquí iría la llamada al API para cambiar contraseña
      // await authService.changePassword(passwordData);
      toast.success('Contraseña actualizada correctamente');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      toast.error('Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-3">
      <PageHeader
        icon="fa-solid fa-user-gear"
        title="Mi Perfil de Usuario"
        subtitle="Información de cuenta, credenciales de acceso y preferencias personales"
      />

      <div className="row g-3">
        {/* Columna Izquierda: Tarjeta Resumen */}
        <div className="col-lg-4">
          <div className="card border shadow-sm mb-3">
            <div className="card-body text-center p-4">
              <div 
                className="bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow-sm"
                style={{ width: '84px', height: '84px', fontSize: '32px' }}
              >
                <i className="fa-solid fa-user-tie"></i>
              </div>
              <h5 className="fw-bold mb-1 text-dark">
                {formData.nombreCompleto || user?.nombre || user?.usuario || 'Usuario del Sistema'}
              </h5>
              <p className="text-muted small mb-2">@{user?.usuario || 'usuario'}</p>
              
              <div className="d-flex justify-content-center gap-2 mb-3">
                <span className="badge bg-primary px-3 py-2">
                  <i className="fa-solid fa-shield-halved me-1"></i>
                  {user?.grupo?.nombre || 'Rol no asignado'}
                </span>
                <span className="badge bg-success px-3 py-2">
                  <i className="fa-solid fa-circle-check me-1"></i> Activo
                </span>
              </div>

              <hr className="my-3 opacity-25" />

              <div className="text-start small">
                <div className="d-flex justify-content-between py-1 border-bottom">
                  <span className="text-muted"><i className="fa-solid fa-id-badge me-2 text-secondary"></i>ID de Usuario:</span>
                  <span className="fw-bold text-secondary">#{user?.id || '1'}</span>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom">
                  <span className="text-muted"><i className="fa-solid fa-envelope me-2 text-secondary"></i>Email:</span>
                  <span className="fw-semibold text-dark">{formData.email || user?.email || '-'}</span>
                </div>
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted"><i className="fa-solid fa-phone me-2 text-secondary"></i>Teléfono:</span>
                  <span className="fw-semibold text-dark">{formData.telefono || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card border shadow-sm">
            <div className="card-header bg-white border-bottom py-2">
              <span className="small fw-bold text-secondary text-uppercase">
                <i className="fa-solid fa-shield-halved me-1 text-primary"></i> Seguridad de la Cuenta
              </span>
            </div>
            <div className="card-body p-3">
              <p className="small text-muted mb-3">
                Mantenga su cuenta protegida actualizando su contraseña de acceso periódicamente.
              </p>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm w-100"
                onClick={() => setShowPasswordModal(true)}
              >
                <i className="fa-solid fa-key me-2 text-primary"></i>
                Cambiar Contraseña
              </button>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Formulario de Información Personal */}
        <div className="col-lg-8">
          <div className="card border shadow-sm">
            <div className="card-header bg-white border-bottom py-2 d-flex justify-content-between align-items-center">
              <span className="small fw-bold text-secondary text-uppercase">
                <i className="fa-solid fa-address-card me-1 text-primary"></i> Datos Personales y Contacto
              </span>
              {!isEditing && (
                <button 
                  className="btn btn-primary btn-sm py-1 px-3"
                  onClick={() => setIsEditing(true)}
                >
                  <i className="fa-solid fa-pen-to-square me-1"></i>
                  Editar Datos
                </button>
              )}
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-secondary">Nombre de Usuario (Login)</label>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-light text-muted">@</span>
                      <input 
                        type="text" 
                        className="form-control form-control-sm bg-light text-muted" 
                        value={user?.usuario || ''} 
                        readOnly 
                        disabled 
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-secondary">Grupo / Rol de Acceso</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm bg-light text-muted" 
                      value={user?.grupo?.nombre || 'Sin rol'} 
                      readOnly 
                      disabled 
                    />
                  </div>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-12">
                    <label className="form-label small fw-bold text-secondary">Nombre Completo *</label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.nombreCompleto}
                        onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
                        required
                        placeholder="Ej: Juan Alberto Pérez García"
                      />
                    ) : (
                      <div className="p-2 bg-light rounded border text-dark fw-medium small">
                        {formData.nombreCompleto || <span className="text-muted">No registrado</span>}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-secondary">Correo Electrónico</label>
                    {isEditing ? (
                      <input
                        type="email"
                        className="form-control form-control-sm"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="ejemplo@monitoreo.gob.pe"
                      />
                    ) : (
                      <div className="p-2 bg-light rounded border text-dark fw-medium small">
                        {formData.email || <span className="text-muted">No registrado</span>}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-secondary">Teléfono de Contacto</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        className="form-control form-control-sm"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        placeholder="+51 987 654 321"
                      />
                    ) : (
                      <div className="p-2 bg-light rounded border text-dark fw-medium small">
                        {formData.telefono || <span className="text-muted">No registrado</span>}
                      </div>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="d-flex gap-2 pt-3 border-top">
                    <button 
                      type="submit" 
                      className="btn btn-primary btn-sm"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-floppy-disk me-1"></i>
                          Guardar Cambios
                        </>
                      )}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm"
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
                      <i className="fa-solid fa-xmark me-1"></i>
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
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-light border-bottom py-2">
                <h5 className="modal-title fs-6 fw-bold text-dark">
                  <i className="fa-solid fa-key me-2 text-primary"></i>
                  Cambiar Contraseña de Acceso
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
                <div className="modal-body p-3">
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">Contraseña Actual *</label>
                    <input
                      type="password"
                      className="form-control form-control-sm"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      required
                      placeholder="Ingrese su contraseña actual"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">Nueva Contraseña *</label>
                    <input
                      type="password"
                      className="form-control form-control-sm"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                      minLength={6}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small fw-bold text-secondary">Confirmar Nueva Contraseña *</label>
                    <input
                      type="password"
                      className="form-control form-control-sm"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      required
                      placeholder="Repita la nueva contraseña"
                    />
                  </div>
                </div>
                <div className="modal-footer bg-light border-top py-2">
                  <button 
                    type="button" 
                    className="btn btn-sm btn-secondary"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                  >
                    <i className="fa-solid fa-xmark me-1"></i> Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-sm btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Actualizando...' : (
                      <>
                        <i className="fa-solid fa-check me-1"></i> Actualizar Contraseña
                      </>
                    )}
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

