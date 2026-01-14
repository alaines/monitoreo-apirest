import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../features/auth/authStore';
import { NotificationBell } from './notifications/NotificationBell';
import { NotificationToast } from './notifications/NotificationToast';
import { DynamicMenuItem } from './DynamicMenuItem';

export function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const canManageUsers = user?.grupo?.nombre === 'SUPER_ADMIN' || 
                         user?.grupo?.nombre === 'ADMINISTRADOR' || 
                         user?.grupo?.nombre === 'SUPERVISOR';

  const isActive = (path: string) => location.pathname === path;
  const isActivePath = (path: string) => location.pathname.startsWith(path);

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
        zIndex: 1050,
        position: 'relative'
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
          {isActivePath('/admin') && 'Panel de Control'}
          {isActive('/users') && 'Gestión de Usuarios'}
        </div>

        {/* Notificaciones y Usuario en header */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <NotificationBell />
          
          <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="btn btn-light d-flex align-items-center gap-2"
            style={{
              padding: '6px 12px',
              border: '1px solid #dee2e6',
              borderRadius: '8px'
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
              color: 'white'
            }}>
              <i className="fas fa-user" style={{ fontSize: '14px' }}></i>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: '500', lineHeight: '1.2' }}>
                {user?.usuario || 'Usuario'}
              </div>
              <div style={{ fontSize: '11px', color: '#6c757d', lineHeight: '1.2' }}>
                {user?.grupo?.nombre || 'Usuario'}
              </div>
            </div>
            <i className="fas fa-chevron-down" style={{ fontSize: '10px', marginLeft: '4px' }}></i>
          </button>

          {/* Dropdown usuario */}
          {showUserMenu && (
            <div
              className="bg-white border rounded shadow"
              style={{
                position: 'absolute',
                top: '100%',
                right: '0',
                marginTop: '8px',
                minWidth: '200px',
                zIndex: 1060
              }}
            >
              <a
                href="#"
                className="d-block p-3 text-decoration-none text-dark border-bottom"
                style={{ fontSize: '14px' }}
                onClick={(e) => {
                  e.preventDefault();
                  setShowUserMenu(false);
                  navigate('/perfil');
                }}
              >
                <i className="fas fa-user me-2"></i>Mi Perfil
              </a>
              <a
                href="#"
                className="d-block p-3 text-decoration-none text-dark border-bottom"
                style={{ fontSize: '14px' }}
                onClick={(e) => {
                  e.preventDefault();
                  setShowUserMenu(false);
                  navigate('/configuracion');
                }}
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
        </div>
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
          <nav style={{ flex: 1, padding: '20px 0', overflowY: 'auto' }}>
            {user?.menus && user.menus.length > 0 ? (
              user.menus.map(menu => (
                <DynamicMenuItem key={menu.id} menu={menu} />
              ))
            ) : (
              <div style={{ padding: '20px', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                <i className="fas fa-exclamation-triangle mb-2" style={{ display: 'block', fontSize: '24px' }}></i>
                <small>No hay menús disponibles</small>
              </div>
            )}
          </nav>
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
                © {new Date().getFullYear()} Sistema de Monitoreo <span className="ms-2 badge bg-secondary">v1.1.6</span>
              </p>
            </div>
            <div className="col-md-6 text-md-end">
              <small className="text-muted">Todos los derechos reservados</small>
            </div>
          </div>
        </div>
      </footer>

      {/* Notificación Toast */}
      <NotificationToast />
    </div>
  );
}
