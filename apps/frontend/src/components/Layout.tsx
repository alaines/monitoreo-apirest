import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../features/auth/authStore';

export function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const canManageUsers = user?.grupo?.nombre === 'ADMINISTRADOR' || user?.grupo?.nombre === 'SUPERVISOR';

  const isActive = (path: string) => location.pathname === path;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--gray-100)', overflow: 'hidden' }}>
      {/* Header */}
      <header className="bg-white border-bottom" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        height: '60px',
        flexShrink: 0,
        zIndex: 999
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="btn btn-light"
            style={{ fontSize: '20px', padding: '8px 12px' }}
          >
            <i className="fas fa-bars"></i>
          </button>
          
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-map-marker-alt" style={{ fontSize: '24px' }}></i>
            SISTEMA DE MONITOREO
          </div>
        </div>

        <div style={{ fontSize: '16px', fontWeight: '500', color: 'var(--gray-600)' }}>
          {isActive('/') && 'Dashboard'}
          {isActive('/incidents') && 'Gestión de Incidencias'}
          {isActive('/cruces') && 'Gestión de Cruces'}
          {isActive('/users') && 'Gestión de Usuarios'}
        </div>

        <div style={{ width: '48px' }}></div>
      </header>

      {/* Contenedor con Sidebar y Contenido */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside 
          style={{ 
            width: sidebarOpen ? '250px' : '0',
            backgroundColor: 'var(--primary-dark)',
            transition: 'width 0.3s ease',
            overflow: 'hidden',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Navegación en sidebar */}
          <nav style={{ flex: 1, padding: '20px 0' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              width: '100%',
              padding: '12px 20px',
              border: 'none',
              background: isActive('/') ? 'rgba(52, 152, 219, 0.2)' : 'transparent',
              color: 'white',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '14px',
              transition: 'background 0.2s',
              borderLeft: isActive('/') ? '4px solid var(--primary)' : '4px solid transparent'
            }}
            onMouseEnter={(e) => !isActive('/') && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={(e) => !isActive('/') && (e.currentTarget.style.background = 'transparent')}
          >
            <i className="fas fa-chart-line" style={{ width: '20px' }}></i>
            Dashboard
          </button>

          <button
            onClick={() => navigate('/incidents')}
            style={{
              width: '100%',
              padding: '12px 20px',
              border: 'none',
              background: isActive('/incidents') ? 'rgba(52, 152, 219, 0.2)' : 'transparent',
              color: 'white',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '14px',
              transition: 'background 0.2s',
              borderLeft: isActive('/incidents') ? '4px solid var(--primary)' : '4px solid transparent'
            }}
            onMouseEnter={(e) => !isActive('/incidents') && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={(e) => !isActive('/incidents') && (e.currentTarget.style.background = 'transparent')}
          >
            <i className="fas fa-ticket-alt" style={{ width: '20px' }}></i>
            Incidencias
          </button>

          <button
            onClick={() => navigate('/cruces')}
            style={{
              width: '100%',
              padding: '12px 20px',
              border: 'none',
              background: isActive('/cruces') ? 'rgba(52, 152, 219, 0.2)' : 'transparent',
              color: 'white',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '14px',
              transition: 'background 0.2s',
              borderLeft: isActive('/cruces') ? '4px solid var(--primary)' : '4px solid transparent'
            }}
            onMouseEnter={(e) => !isActive('/cruces') && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={(e) => !isActive('/cruces') && (e.currentTarget.style.background = 'transparent')}
          >
            <i className="fas fa-traffic-light" style={{ width: '20px' }}></i>
            Cruces
          </button>

          <button
            style={{
              width: '100%',
              padding: '12px 20px',
              border: 'none',
              background: 'transparent',
              color: 'white',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '14px',
              transition: 'background 0.2s',
              borderLeft: '4px solid transparent'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <i className="fas fa-file-alt" style={{ width: '20px' }}></i>
            Reportes
          </button>

          {canManageUsers && (
            <button
              onClick={() => navigate('/users')}
              style={{
                width: '100%',
                padding: '12px 20px',
                border: 'none',
                background: isActive('/users') ? 'rgba(52, 152, 219, 0.2)' : 'transparent',
                color: 'white',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '14px',
                transition: 'background 0.2s',
                borderLeft: isActive('/users') ? '4px solid var(--primary)' : '4px solid transparent'
              }}
              onMouseEnter={(e) => !isActive('/users') && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={(e) => !isActive('/users') && (e.currentTarget.style.background = 'transparent')}
            >
              <i className="fas fa-users" style={{ width: '20px' }}></i>
              Usuarios
            </button>
          )}
        </nav>

        {/* Usuario en sidebar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '15px 20px', position: 'relative' }}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              width: '100%',
              padding: '10px',
              border: 'none',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '14px'
            }}
          >
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--primary)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <i className="fas fa-user" style={{ fontSize: '14px' }}></i>
            </div>
            <div style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.usuario || 'Usuario'}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.grupo?.nombre || 'Usuario'}
              </div>
            </div>
          </button>

          {/* Dropdown usuario */}
          {showUserMenu && (
            <div
              className="bg-white border rounded shadow"
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '20px',
                right: '20px',
                marginBottom: '8px',
                zIndex: 1001
              }}
            >
              <a
                href="#"
                className="d-block p-3 text-decoration-none text-dark border-bottom"
                style={{ fontSize: '14px' }}
                onClick={(e) => e.preventDefault()}
              >
                <i className="fas fa-user me-2"></i>Mi Perfil
              </a>
              <a
                href="#"
                className="d-block p-3 text-decoration-none text-dark border-bottom"
                style={{ fontSize: '14px' }}
                onClick={(e) => e.preventDefault()}
              >
                <i className="fas fa-cog me-2"></i>Configuración
              </a>
              <a
                href="#"
                className="d-block p-3 text-decoration-none"
                style={{ fontSize: '14px', color: 'var(--danger)' }}
                onClick={(e) => {
                  e.preventDefault();
                  logout();
                  navigate('/login');
                }}
              >
                <i className="fas fa-sign-out-alt me-2"></i>Cerrar Sesión
              </a>
            </div>
          )}
        </div>
      </aside>

      {/* Contenedor principal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Contenido */}
        <main style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </div>

      {/* Footer */}
      <footer className="bg-white border-top" style={{
        flexShrink: 0,
        padding: '16px 20px'
      }}>
        <div className="container-fluid">
          <div className="row align-items-center">
            <div className="col-md-6">
              <p className="mb-0 text-muted" style={{ fontSize: '14px' }}>
                © {new Date().getFullYear()} Sistema de Monitoreo
              </p>
            </div>
            <div className="col-md-6 text-md-end">
              <small className="text-muted">Todos los derechos reservados</small>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
