import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../features/auth/authStore';

export function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [crucesSubmenuOpen, setCrucesSubmenuOpen] = useState(false);
  const [reportesSubmenuOpen, setReportesSubmenuOpen] = useState(false);

  const canManageUsers = user?.grupo?.nombre === 'ADMINISTRADOR' || user?.grupo?.nombre === 'SUPERVISOR';

  const isActive = (path: string) => location.pathname === path;
  const isActivePath = (path: string) => location.pathname.startsWith(path);

  // Abrir automáticamente el submenú de cruces si estamos en una ruta de cruces
  useEffect(() => {
    if (isActivePath('/cruces')) {
      setCrucesSubmenuOpen(true);
    }
    if (isActivePath('/reportes')) {
      setReportesSubmenuOpen(true);
    }
  }, [location.pathname]);

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
          {isActive('/') && 'Inicio'}
          {isActive('/incidents') && 'Gestión de Incidencias'}
          {isActivePath('/cruces') && 'Cruces'}
          {isActivePath('/reportes') && 'Reportes'}
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
            backgroundColor: 'var(--primary-darkest)',
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
              background: isActive('/') ? 'rgba(95, 149, 152, 0.2)' : 'transparent',
              color: 'white',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '14px',
              transition: 'background 0.2s',
              borderLeft: isActive('/') ? '4px solid var(--primary-light)' : '4px solid transparent'
            }}
            onMouseEnter={(e) => !isActive('/') && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={(e) => !isActive('/') && (e.currentTarget.style.background = 'transparent')}
          >
            <i className="fas fa-chart-line" style={{ width: '20px' }}></i>
            Inicio
          </button>

          <button
            onClick={() => navigate('/incidents')}
            style={{
              width: '100%',
              padding: '12px 20px',
              border: 'none',
              background: isActive('/incidents') ? 'rgba(95, 149, 152, 0.2)' : 'transparent',
              color: 'white',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '14px',
              transition: 'background 0.2s',
              borderLeft: isActive('/incidents') ? '4px solid var(--primary-light)' : '4px solid transparent'
            }}
            onMouseEnter={(e) => !isActive('/incidents') && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={(e) => !isActive('/incidents') && (e.currentTarget.style.background = 'transparent')}
          >
            <i className="fas fa-ticket-alt" style={{ width: '20px' }}></i>
            Incidencias
          </button>

          {/* Cruces con submenú */}
          <div>
            <button
              onClick={() => setCrucesSubmenuOpen(!crucesSubmenuOpen)}
              style={{
                width: '100%',
                padding: '12px 20px',
                border: 'none',
                background: isActivePath('/cruces') ? 'rgba(95, 149, 152, 0.2)' : 'transparent',
                color: 'white',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '14px',
                transition: 'background 0.2s',
                borderLeft: isActivePath('/cruces') ? '4px solid var(--primary-light)' : '4px solid transparent'
              }}
              onMouseEnter={(e) => !isActivePath('/cruces') && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={(e) => !isActivePath('/cruces') && (e.currentTarget.style.background = 'transparent')}
            >
              <i className="fas fa-traffic-light" style={{ width: '20px' }}></i>
              <span style={{ flex: 1 }}>Cruces</span>
              <i className={`fas fa-chevron-${crucesSubmenuOpen ? 'down' : 'right'}`} style={{ fontSize: '12px' }}></i>
            </button>

            {/* Submenú de Cruces */}
            {crucesSubmenuOpen && (
              <div style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <button
                  onClick={() => navigate('/cruces')}
                  style={{
                    width: '100%',
                    padding: '10px 20px 10px 52px',
                    border: 'none',
                    background: (isActive('/cruces') || location.pathname.startsWith('/cruces/') && !isActive('/cruces/mapa')) ? 'rgba(95, 149, 152, 0.3)' : 'transparent',
                    color: 'white',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '13px',
                    transition: 'background 0.2s',
                    borderLeft: (isActive('/cruces') || location.pathname.startsWith('/cruces/') && !isActive('/cruces/mapa')) ? '4px solid var(--primary)' : '4px solid transparent'
                  }}
                  onMouseEnter={(e) => !(isActive('/cruces') || location.pathname.startsWith('/cruces/') && !isActive('/cruces/mapa')) && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={(e) => !(isActive('/cruces') || location.pathname.startsWith('/cruces/') && !isActive('/cruces/mapa')) && (e.currentTarget.style.background = 'transparent')}
                >
                  <i className="fas fa-list" style={{ width: '16px', fontSize: '12px' }}></i>
                  Gestión
                </button>

                <button
                  onClick={() => navigate('/cruces/mapa')}
                  style={{
                    width: '100%',
                    padding: '10px 20px 10px 52px',
                    border: 'none',
                    background: isActive('/cruces/mapa') ? 'rgba(95, 149, 152, 0.3)' : 'transparent',
                    color: 'white',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '13px',
                    transition: 'background 0.2s',
                    borderLeft: isActive('/cruces/mapa') ? '4px solid var(--primary)' : '4px solid transparent'
                  }}
                  onMouseEnter={(e) => !isActive('/cruces/mapa') && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={(e) => !isActive('/cruces/mapa') && (e.currentTarget.style.background = 'transparent')}
                >
                  <i className="fas fa-map-marked-alt" style={{ width: '16px', fontSize: '12px' }}></i>
                  Mapa
                </button>
              </div>
            )}
          </div>

          {/* Reportes con submenú */}
          <div>
            <button
              onClick={() => setReportesSubmenuOpen(!reportesSubmenuOpen)}
              style={{
                width: '100%',
                padding: '12px 20px',
                border: 'none',
                background: isActivePath('/reportes') ? 'rgba(95, 149, 152, 0.2)' : 'transparent',
                color: 'white',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '14px',
                transition: 'background 0.2s',
                borderLeft: isActivePath('/reportes') ? '4px solid var(--primary-light)' : '4px solid transparent'
              }}
              onMouseEnter={(e) => !isActivePath('/reportes') && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={(e) => !isActivePath('/reportes') && (e.currentTarget.style.background = 'transparent')}
            >
              <i className="fas fa-file-alt" style={{ width: '20px' }}></i>
              <span style={{ flex: 1 }}>Reportes</span>
              <i className={`fas fa-chevron-${reportesSubmenuOpen ? 'down' : 'right'}`} style={{ fontSize: '12px' }}></i>
            </button>

            {/* Submenú de Reportes */}
            {reportesSubmenuOpen && (
              <div style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <button
                  onClick={() => navigate('/reportes/incidencias')}
                  style={{
                    width: '100%',
                    padding: '10px 20px 10px 52px',
                    border: 'none',
                    background: isActive('/reportes/incidencias') ? 'rgba(95, 149, 152, 0.3)' : 'transparent',
                    color: 'white',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '13px',
                    transition: 'background 0.2s',
                    borderLeft: isActive('/reportes/incidencias') ? '4px solid var(--primary)' : '4px solid transparent'
                  }}
                  onMouseEnter={(e) => !isActive('/reportes/incidencias') && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={(e) => !isActive('/reportes/incidencias') && (e.currentTarget.style.background = 'transparent')}
                >
                  <i className="fas fa-ticket-alt" style={{ width: '16px', fontSize: '12px' }}></i>
                  Incidencias
                </button>
                <button
                  onClick={() => navigate('/reportes/grafico')}
                  style={{
                    width: '100%',
                    padding: '10px 20px 10px 52px',
                    border: 'none',
                    background: isActive('/reportes/grafico') ? 'rgba(95, 149, 152, 0.3)' : 'transparent',
                    color: 'white',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '13px',
                    transition: 'background 0.2s',
                    borderLeft: isActive('/reportes/grafico') ? '4px solid var(--primary)' : '4px solid transparent'
                  }}
                  onMouseEnter={(e) => !isActive('/reportes/grafico') && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={(e) => !isActive('/reportes/grafico') && (e.currentTarget.style.background = 'transparent')}
                >
                  <i className="fas fa-chart-bar" style={{ width: '16px', fontSize: '12px' }}></i>
                  Reporte Gráfico
                </button>
              </div>
            )}
          </div>

          {canManageUsers && (
            <button
              onClick={() => navigate('/users')}
              style={{
                width: '100%',
                padding: '12px 20px',
                border: 'none',
                background: isActive('/users') ? 'rgba(95, 149, 152, 0.2)' : 'transparent',
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
