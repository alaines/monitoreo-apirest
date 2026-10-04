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

  // Cargar credenciales si el usuario marcó "Recuérdame" previamente
  useEffect(() => {
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true';
    const savedUsername = localStorage.getItem('rememberedUsername') || '';
    const savedPassword = localStorage.getItem('rememberedPassword') || '';

    if (savedRememberMe && savedUsername) {
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

      // Guardar o eliminar credenciales según el estado del checkbox "Recuérdame"
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('rememberedUsername', usuario);
        localStorage.setItem('rememberedPassword', password);
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('rememberedUsername');
        localStorage.removeItem('rememberedPassword');
      }

      // Redirigir a la página previa o al dashboard principal
      const redirectTo = localStorage.getItem('redirectAfterLogin') || '/';
      localStorage.removeItem('redirectAfterLogin');
      navigate(redirectTo);
    } catch (err) {
      // El error se gestiona directamente en useAuthStore
    }
  };

  const handleRememberMeChange = (checked: boolean) => {
    setRememberMe(checked);
    if (!checked) {
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('rememberedUsername');
      localStorage.removeItem('rememberedPassword');
    }
  };

  return (
    <div className="container-fluid p-0 min-vh-100 bg-white">
      <div className="row g-0 min-vh-100">
        {/* Columna Izquierda: Formulario de Login */}
        <div className="col-12 col-md-6 col-lg-5 col-xl-4 d-flex flex-column justify-content-between p-4 p-sm-5 min-vh-100 bg-white z-1">
          {/* Cabecera superior sin icono de semáforo */}
          <div className="mb-4">
            <span className="fw-bold text-dark fs-6 text-uppercase tracking-wider">
              Sistema de Monitoreo
            </span>
          </div>

          {/* Contenedor central del formulario */}
          <div className="w-100 my-auto" style={{ maxWidth: '380px', margin: '0 auto' }}>
            <div className="mb-4">
              <h1 className="h3 fw-bold text-dark mb-2">Iniciar Sesión</h1>
              <p className="text-secondary small mb-0">
                Ingresa tus credenciales para acceder a la plataforma.
              </p>
            </div>

            {/* Mensaje de error si la autenticación falla */}
            {error && (
              <div
                className="alert alert-danger d-flex align-items-center py-2 px-3 mb-3 border-0 rounded-3 shadow-sm"
                role="alert"
              >
                <i className="fa-solid fa-circle-exclamation me-2 fs-5 flex-shrink-0"></i>
                <div className="small">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Grupo unificado de Inputs (Usuario y Contraseña) */}
              <div className="border rounded-3 overflow-hidden mb-3 shadow-sm bg-white">
                {/* Input de Usuario */}
                <div className="position-relative border-bottom">
                  <input
                    type="text"
                    id="username"
                    name="username"
                    className="form-control border-0 py-3 px-3 shadow-none text-dark"
                    placeholder="Usuario"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    required
                    autoFocus={!usuario}
                    autoComplete="username"
                    style={{ fontSize: '15px' }}
                  />
                </div>

                {/* Input de Contraseña */}
                <div className="position-relative d-flex align-items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    className="form-control border-0 py-3 px-3 shadow-none pe-5 text-dark"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    style={{ fontSize: '15px' }}
                  />
                  <button
                    type="button"
                    className="btn btn-link text-muted position-absolute end-0 top-50 translate-middle-y me-2 p-1 text-decoration-none shadow-none"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    tabIndex={-1}
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              {/* Fila: Recordar credenciales */}
              <div className="d-flex align-items-center mb-4">
                <div className="form-check d-flex align-items-center mb-0">
                  <input
                    className="form-check-input me-2 mt-0"
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => handleRememberMeChange(e.target.checked)}
                    style={{ cursor: 'pointer', width: '1.1rem', height: '1.1rem' }}
                  />
                  <label
                    className="form-check-label text-secondary small user-select-none"
                    htmlFor="rememberMe"
                    style={{ cursor: 'pointer' }}
                  >
                    Recuérdame
                  </label>
                </div>
              </div>

              {/* Botón principal de Inicio de Sesión */}
              <button
                type="submit"
                className="btn btn-primary w-100 py-2 py-md-3 fw-semibold shadow-sm rounded-3 d-flex align-items-center justify-content-center"
                disabled={isLoading}
                style={{ fontSize: '15px' }}
              >
                {isLoading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-right-to-bracket me-2"></i>
                    Iniciar Sesión
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Pie de página / Copyright */}
          <div className="text-center text-muted small py-2 mt-4">
            © {new Date().getFullYear()} Sistema de Monitoreo
          </div>
        </div>

        {/* Columna Derecha: Imagen Hero a Pantalla Completa */}
        <div className="col-12 col-md-6 col-lg-7 col-xl-8 d-none d-md-block p-0 position-relative">
          <div
            className="h-100 w-100"
            style={{
              backgroundImage:
                'url(/images/login/background.webp), url(/images/login/background.jpg), linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center center',
              backgroundRepeat: 'no-repeat',
              minHeight: '100vh',
            }}
          />
        </div>
      </div>
    </div>
  );
}
