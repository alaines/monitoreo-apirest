import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../features/auth/authStore';
import { NotificationBell } from './notifications/NotificationBell';
import { NotificationToast } from './notifications/NotificationToast';

export function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [crucesSubmenuOpen, setCrucesSubmenuOpen] = useState(false);
  const [reportesSubmenuOpen, setReportesSubmenuOpen] = useState(false);
  const [adminSubmenuOpen, setAdminSubmenuOpen] = useState(false);
  const [mantenimientosSubmenuOpen, setMantenimientosSubmenuOpen] = useState(false);

  const canManageUsers = user?.grupo?.nombre === 'SUPER_ADMIN' || 
                         user?.grupo?.nombre === 'ADMINISTRADOR' || 
                         user?.grupo?.nombre === 'SUPERVISOR';

  const isActive = (path: string) => location.pathname === path;
  const isActivePath = (path: string) => location.pathname.startsWith(path);

  // Debug: mostrar datos del usuario en consola
  useEffect(() => {
    console.log('Usuario actual:', user);
    console.log('Grupo:', user?.grupo);
    console.log('Puede gestionar usuarios:', canManageUsers);
  }, [user, canManageUsers]);

  // Abrir automáticamente el submenú de cruces si estamos en una ruta de cruces
  useEffect(() => {
    if (isActivePath('/cruces')) {
      setCrucesSubmenuOpen(true);
    }
    if (isActivePath('/reportes')) {
      setReportesSubmenuOpen(true);
    }
    if (isActivePath('/admin')) {
      setAdminSubmenuOpen(true);
    }
    if (isActivePath('/mantenimientos')) {
      setMantenimientosSubmenuOpen(true);
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
                zIndex: 1001
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
                <button
                  onClick={() => navigate('/reportes/mapa')}
                  style={{
                    width: '100%',
                    padding: '10px 20px 10px 52px',
                    border: 'none',
                    background: isActive('/reportes/mapa') ? 'rgba(95, 149, 152, 0.3)' : 'transparent',
                    color: 'white',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '13px',
                    transition: 'background 0.2s',
                    borderLeft: isActive('/reportes/mapa') ? '4px solid var(--primary)' : '4px solid transparent'
                  }}
                  onMouseEnter={(e) => !isActive('/reportes/mapa') && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={(e) => !isActive('/reportes/mapa') && (e.currentTarget.style.background = 'transparent')}
                >
                  <i className="fas fa-map-marked-alt" style={{ width: '16px', fontSize: '12px' }}></i>
                  Mapa de Calor
                </button>
              </div>
            )}
          </div>

          {/* Mantenimientos con submenú */}
          {canManageUsers && (
            <div>
              <button
                onClick={() => setMantenimientosSubmenuOpen(!mantenimientosSubmenuOpen)}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  border: 'none',
                  background: isActivePath('/mantenimientos') ? 'rgba(95, 149, 152, 0.2)' : 'transparent',
                  color: 'white',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '14px',
                  transition: 'background 0.2s',
                  borderLeft: isActivePath('/mantenimientos') ? '4px solid var(--primary-light)' : '4px solid transparent'
                }}
                onMouseEnter={(e) => !isActivePath('/mantenimientos') && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                onMouseLeave={(e) => !isActivePath('/mantenimientos') && (e.currentTarget.style.background = 'transparent')}
              >
                <i className="fas fa-cogs" style={{ width: '20px' }}></i>
                Mantenimientos
                <i
                  className={`fas fa-chevron-${mantenimientosSubmenuOpen ? 'down' : 'right'} ms-auto`}
                  style={{ fontSize: '12px' }}
                ></i>
              </button>

              {mantenimientosSubmenuOpen && (
                <div style={{ background: 'rgba(0,0,0,0.2)', paddingLeft: '20px' }}>
                  <button
                    onClick={() => navigate('/mantenimientos/tipos')}
                    style={{
                      width: '100%',
                      padding: '10px 20px',
                      border: 'none',
                      background: isActive('/mantenimientos/tipos') ? 'rgba(95, 149, 152, 0.3)' : 'transparent',
                      color: 'white',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '13px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => !isActive('/mantenimientos/tipos') && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={(e) => !isActive('/mantenimientos/tipos') && (e.currentTarget.style.background = 'transparent')}
                  >
                    <i className="fas fa-folder-tree" style={{ width: '16px', fontSize: '12px' }}></i>
                    Tipos
                  </button>

                  <button
                    onClick={() => navigate('/mantenimientos/areas')}
                    style={{
                      width: '100%',
                      padding: '10px 20px',
                      border: 'none',
                      background: isActive('/mantenimientos/areas') ? 'rgba(95, 149, 152, 0.3)' : 'transparent',
                      color: 'white',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '13px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => !isActive('/mantenimientos/areas') && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={(e) => !isActive('/mantenimientos/areas') && (e.currentTarget.style.background = 'transparent')}
                  >
                    <i className="fas fa-building" style={{ width: '16px', fontSize: '12px' }}></i>
                    Áreas
                  </button>

                  <button
                    onClick={() => navigate('/mantenimientos/equipos')}
                    style={{
                      width: '100%',
                      padding: '10px 20px',
                      border: 'none',
                      background: isActive('/mantenimientos/equipos') ? 'rgba(95, 149, 152, 0.3)' : 'transparent',
                      color: 'white',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '13px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => !isActive('/mantenimientos/equipos') && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={(e) => !isActive('/mantenimientos/equipos') && (e.currentTarget.style.background = 'transparent')}
                  >
                    <i className="fas fa-users-cog" style={{ width: '16px', fontSize: '12px' }}></i>
                    Equipos
                  </button>

                  <button
                    onClick={() => navigate('/mantenimientos/reportadores')}
                    style={{
                      width: '100%',
                      padding: '10px 20px',
                      border: 'none',
                      background: isActive('/mantenimientos/reportadores') ? 'rgba(95, 149, 152, 0.3)' : 'transparent',
                      color: 'white',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '13px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => !isActive('/mantenimientos/reportadores') && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={(e) => !isActive('/mantenimientos/reportadores') && (e.currentTarget.style.background = 'transparent')}
                  >
                    <i className="fas fa-user-tie" style={{ width: '16px', fontSize: '12px' }}></i>
                    Reportadores
                  </button>

                  <button
                    onClick={() => navigate('/mantenimientos/responsables')}
                    style={{
                      width: '100%',
                      padding: '10px 20px',
                      border: 'none',
                      background: isActive('/mantenimientos/responsables') ? 'rgba(95, 149, 152, 0.3)' : 'transparent',
                      color: 'white',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '13px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => !isActive('/mantenimientos/responsables') && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={(e) => !isActive('/mantenimientos/responsables') && (e.currentTarget.style.background = 'transparent')}
                  >
                    <i className="fas fa-user-check" style={{ width: '16px', fontSize: '12px' }}></i>
                    Responsables
                  </button>

                  <button
                    onClick={() => navigate('/mantenimientos/administradores')}
                    style={{
                      width: '100%',
                      padding: '10px 20px',
                      border: 'none',
                      background: isActive('/mantenimientos/administradores') ? 'rgba(95, 149, 152, 0.3)' : 'transparent',
                      color: 'white',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '13px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => !isActive('/mantenimientos/administradores') && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={(e) => !isActive('/mantenimientos/administradores') && (e.currentTarget.style.background = 'transparent')}
                  >
                    <i className="fas fa-user-shield" style={{ width: '16px', fontSize: '12px' }}></i>
                    Administradores
                  </button>

                  <button
                    onClick={() => navigate('/mantenimientos/ejes')}
                    style={{
                      width: '100%',
                      padding: '10px 20px',
                      border: 'none',
                      background: isActive('/mantenimientos/ejes') ? 'rgba(95, 149, 152, 0.3)' : 'transparent',
                      color: 'white',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '13px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => !isActive('/mantenimientos/ejes') && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={(e) => !isActive('/mantenimientos/ejes') && (e.currentTarget.style.background = 'transparent')}
                  >
                    <i className="fas fa-road" style={{ width: '16px', fontSize: '12px' }}></i>
                    Ejes
                  </button>

                  <button
                    onClick={() => navigate('/mantenimientos/proyectos')}
                    style={{
                      width: '100%',
                      padding: '10px 20px',
                      border: 'none',
                      background: isActive('/mantenimientos/proyectos') ? 'rgba(95, 149, 152, 0.3)' : 'transparent',
                      color: 'white',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '13px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => !isActive('/mantenimientos/proyectos') && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={(e) => !isActive('/mantenimientos/proyectos') && (e.currentTarget.style.background = 'transparent')}
                  >
                    <i className="fas fa-project-diagram" style={{ width: '16px', fontSize: '12px' }}></i>
                    Proyectos
                  </button>

                  <button
                    onClick={() => navigate('/mantenimientos/incidencias')}
                    style={{
                      width: '100%',
                      padding: '10px 20px',
                      border: 'none',
                      background: isActive('/mantenimientos/incidencias') ? 'rgba(95, 149, 152, 0.3)' : 'transparent',
                      color: 'white',
                                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '13px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => !isActive('/mantenimientos/incidencias') && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={(e) => !isActive('/mantenimientos/incidencias') && (e.currentTarget.style.background = 'transparent')}
                  >
                    <i className="fas fa-exclamation-triangle" style={{ width: '16px', fontSize: '12px' }}></i>
                    Tipos de Incidencias
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Panel de Control con submenú - AL FINAL */}
          {canManageUsers && (
            <div>
              <button
                onClick={() => setAdminSubmenuOpen(!adminSubmenuOpen)}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  border: 'none',
                  background: isActivePath('/admin') ? 'rgba(95, 149, 152, 0.2)' : 'transparent',
                  color: 'white',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '14px',
                  transition: 'background 0.2s',
                  borderLeft: isActivePath('/admin') ? '4px solid var(--primary-light)' : '4px solid transparent'
                }}
                onMouseEnter={(e) => !isActivePath('/admin') && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                onMouseLeave={(e) => !isActivePath('/admin') && (e.currentTarget.style.background = 'transparent')}
              >
                <i className="fas fa-tools" style={{ width: '20px' }}></i>
                Panel de Control
                <i
                  className={`fas fa-chevron-${adminSubmenuOpen ? 'down' : 'right'} ms-auto`}
                  style={{ fontSize: '12px' }}
                ></i>
              </button>

              {adminSubmenuOpen && (
                <div style={{ background: 'rgba(0,0,0,0.2)', paddingLeft: '20px' }}>
                  <button
                    onClick={() => navigate('/admin/users')}
                    style={{
                      width: '100%',
                      padding: '10px 20px',
                      border: 'none',
                      background: isActive('/admin/users') ? 'rgba(95, 149, 152, 0.3)' : 'transparent',
                      color: 'white',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '13px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => !isActive('/admin/users') && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={(e) => !isActive('/admin/users') && (e.currentTarget.style.background = 'transparent')}
                  >
                    <i className="fas fa-users" style={{ width: '16px', fontSize: '12px' }}></i>
                    Usuarios
                  </button>

                  <button
                    onClick={() => navigate('/admin/grupos')}
                    style={{
                      width: '100%',
                      padding: '10px 20px',
                      border: 'none',
                      background: isActive('/admin/grupos') ? 'rgba(95, 149, 152, 0.3)' : 'transparent',
                      color: 'white',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '13px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => !isActive('/admin/grupos') && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={(e) => !isActive('/admin/grupos') && (e.currentTarget.style.background = 'transparent')}
                  >
                    <i className="fas fa-shield-alt" style={{ width: '16px', fontSize: '12px' }}></i>
                    Grupos y Permisos
                  </button>

                  <button
                    onClick={() => navigate('/admin/menus')}
                    style={{
                      width: '100%',
                      padding: '10px 20px',
                      border: 'none',
                      background: isActive('/admin/menus') ? 'rgba(95, 149, 152, 0.3)' : 'transparent',
                      color: 'white',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '13px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => !isActive('/admin/menus') && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={(e) => !isActive('/admin/menus') && (e.currentTarget.style.background = 'transparent')}
                  >
                    <i className="fas fa-bars" style={{ width: '16px', fontSize: '12px' }}></i>
                    Menús
                  </button>

                  <button
                    onClick={() => navigate('/admin/catalogos')}
                    style={{
                      width: '100%',
                      padding: '10px 20px',
                      border: 'none',
                      background: isActive('/admin/catalogos') ? 'rgba(95, 149, 152, 0.3)' : 'transparent',
                      color: 'white',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '13px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => !isActive('/admin/catalogos') && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={(e) => !isActive('/admin/catalogos') && (e.currentTarget.style.background = 'transparent')}
                  >
                    <i className="fas fa-database" style={{ width: '16px', fontSize: '12px' }}></i>
                    Catálogos
                  </button>
                </div>
              )}
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
                © {new Date().getFullYear()} Sistema de Monitoreo
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
