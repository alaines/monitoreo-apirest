import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../authStore';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const savedUsername = localStorage.getItem('rememberedUsername');
    const savedPassword = localStorage.getItem('rememberedPassword');
    if (savedUsername && savedPassword) {
      setUsuario(savedUsername);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login({ usuario, password });
      
      if (rememberMe) {
        localStorage.setItem('rememberedUsername', usuario);
        localStorage.setItem('rememberedPassword', password);
      } else {
        localStorage.removeItem('rememberedUsername');
        localStorage.removeItem('rememberedPassword');
      }
      
      // Redirigir a la p\u00e1gina guardada o a inicio
      const redirectTo = localStorage.getItem('redirectAfterLogin') || '/';
      localStorage.removeItem('redirectAfterLogin');
      navigate(redirectTo);
    } catch (err) {
      // Error is handled in the store
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: 'url(/images/login/background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
      }}
    >
      {/* Overlay oscuro */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1,
        }}
      />

      {/* Formulario con efecto glassmorphism */}
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '420px',
          borderRadius: '16px',
          zIndex: 2,
          margin: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        }}
      >
        <div className="card-body p-4 p-sm-5">
          {/* Logo y Título */}
          <div className="text-center mb-4">
            <div
              style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 20px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '3px solid rgba(255, 255, 255, 0.5)',
              }}
            >
              <i className="fas fa-map-marker-alt" style={{ fontSize: '40px', color: '#0056b3' }}></i>
            </div>
            <h1
              className="h4 fw-bold text-white mb-2"
              style={{
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              }}
            >
              Sistema de Monitoreo
            </h1>
            <p
              className="text-white"
              style={{
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              }}
            >
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div className="alert alert-danger py-2 mb-3" role="alert">
                {error}
              </div>
            )}

            {/* Username */}
            <div className="mb-3">
              <label
                className="form-label fw-semibold text-white"
                style={{
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                }}
              >
                <i className="fas fa-user me-1"></i>
                Usuario
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="admin"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
                autoFocus
                autoComplete="username"
                style={{
                  borderRadius: '8px',
                }}
              />
            </div>

            {/* Contraseña */}
            <div className="mb-3">
              <label
                className="form-label fw-semibold text-white"
                style={{
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                }}
              >
                <i className="fas fa-lock me-1"></i>
                Contraseña
              </label>
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{
                    borderRadius: '8px 0 0 8px',
                  }}
                />
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    borderRadius: '0 8px 8px 0',
                    backgroundColor: 'white',
                  }}
                >
                  <i className={`fas fa-eye${showPassword ? '-slash' : ''}`}></i>
                </button>
              </div>
            </div>

            {/* Recordar contraseña y Olvidaste */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label
                  className="form-check-label text-white"
                  htmlFor="rememberMe"
                  style={{
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  }}
                >
                  Recordar contraseña
                </label>
              </div>
              <a
                href="#"
                className="text-white text-decoration-none fw-medium"
                onClick={(e) => {
                  e.preventDefault();
                }}
                style={{
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                }}
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {/* Botón Ingresar */}
            <button
              type="submit"
              className="btn btn-primary w-100 py-2 fw-semibold"
              disabled={isLoading}
              style={{
                borderRadius: '8px',
                fontSize: '16px',
              }}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Ingresando...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt me-2"></i>
                  Ingresar
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center mt-4 pt-3" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.3)' }}>
            <p
              className="small text-white mb-0"
              style={{
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              }}
            >
              © {new Date().getFullYear()} Sistema de Monitoreo
              <br />
              Todos los derechos reservados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
