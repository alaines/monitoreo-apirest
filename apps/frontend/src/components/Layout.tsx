import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../features/auth/authStore';
import { NotificationBell } from './notifications/NotificationBell';
import { NotificationToast } from './notifications/NotificationToast';
import { DynamicMenuItem } from './DynamicMenuItem';
import type { Menu } from '../features/auth/types';

const DEFAULT_FALLBACK_MENUS: Menu[] = [
  {
    id: 2,
    nombre: 'Incidencias',
    ruta: '#',
    icono: 'fa-solid fa-triangle-exclamation',
    orden: 1,
    menuPadreId: null,
    codigo: 'incidencias',
    submenus: [
      {
        id: 4,
        nombre: 'Gestión de Tickets',
        ruta: '/incidents',
        icono: 'fa-solid fa-clipboard-list',
        orden: 1,
        menuPadreId: 2,
        codigo: 'tickets',
        submenus: []
      }
    ]
  },
  {
    id: 1,
    nombre: 'Intersecciones',
    ruta: '#',
    icono: 'fa-solid fa-traffic-light',
    orden: 2,
    menuPadreId: null,
    codigo: 'intersecciones',
    submenus: [
      {
        id: 41,
        nombre: 'Mapa de Red',
        ruta: '/cruces/mapa',
        icono: 'fa-solid fa-map-location-dot',
        orden: 1,
        menuPadreId: 1,
        codigo: 'mapas/red',
        submenus: []
      },
      {
        id: 38,
        nombre: 'Gestión de Intersecciones',
        ruta: '/cruces',
        icono: 'fa-solid fa-traffic-light',
        orden: 2,
        menuPadreId: 1,
        codigo: 'intersecciones/cruces',
        submenus: []
      }
    ]
  },
  {
    id: 6,
    nombre: 'Reportes',
    ruta: '#',
    icono: 'fa-solid fa-chart-column',
    orden: 3,
    menuPadreId: null,
    codigo: 'reportes',
    submenus: [
      {
        id: 67,
        nombre: 'Reporte de Incidencias',
        ruta: '/reportes/incidencias',
        icono: 'fa-solid fa-file-invoice',
        orden: 1,
        menuPadreId: 6,
        codigo: 'reportes-incidencias',
        submenus: []
      },
      {
        id: 68,
        nombre: 'Gráficos Estadísticos',
        ruta: '/reportes/grafico',
        icono: 'fa-solid fa-chart-pie',
        orden: 2,
        menuPadreId: 6,
        codigo: 'reportes-graficos',
        submenus: []
      },
      {
        id: 69,
        nombre: 'Mapa de Calor',
        ruta: '/reportes/mapa',
        icono: 'fa-solid fa-fire',
        orden: 3,
        menuPadreId: 6,
        codigo: 'reportes-mapa-calor',
        submenus: []
      },
      {
        id: 70,
        nombre: 'Dashboard Ejecutivo BI',
        ruta: '/reportes/bi-dashboard',
        icono: 'fa-solid fa-chart-line',
        orden: 4,
        menuPadreId: 6,
        codigo: 'reportes-bi',
        submenus: []
      }
    ]
  },
  {
    id: 9,
    nombre: 'Mantenimientos',
    ruta: '#',
    icono: 'fa-solid fa-wrench',
    orden: 4,
    menuPadreId: null,
    codigo: 'mantenimientos',
    submenus: [
      { id: 21, nombre: 'Tipos de Incidencias', ruta: '/mantenimientos/incidencias', icono: 'fa-solid fa-circle-exclamation', orden: 1, menuPadreId: 9, codigo: 'incidencias_mant', submenus: [] },
      { id: 18, nombre: 'Áreas', ruta: '/mantenimientos/areas', icono: 'fa-solid fa-building', orden: 2, menuPadreId: 9, codigo: 'areas', submenus: [] },
      { id: 20, nombre: 'Equipos', ruta: '/mantenimientos/equipos', icono: 'fa-solid fa-users-gear', orden: 3, menuPadreId: 9, codigo: 'equipos', submenus: [] },
      { id: 23, nombre: 'Proyectos', ruta: '/mantenimientos/proyectos', icono: 'fa-solid fa-diagram-project', orden: 4, menuPadreId: 9, codigo: 'proyectos', submenus: [] },
      { id: 24, nombre: 'Reportadores', ruta: '/mantenimientos/reportadores', icono: 'fa-solid fa-user-pen', orden: 5, menuPadreId: 9, codigo: 'reportadores', submenus: [] },
      { id: 25, nombre: 'Responsables', ruta: '/mantenimientos/responsables', icono: 'fa-solid fa-user-check', orden: 6, menuPadreId: 9, codigo: 'responsables', submenus: [] },
      { id: 36, nombre: 'Catálogo de Tipos', ruta: '/mantenimientos/tipos', icono: 'fa-solid fa-tags', orden: 7, menuPadreId: 9, codigo: 'tipos', submenus: [] },
      { id: 39, nombre: 'Administradores / Contratistas', ruta: '/mantenimientos/administradores', icono: 'fa-solid fa-user-shield', orden: 8, menuPadreId: 9, codigo: 'administradores', submenus: [] },
      { id: 42, nombre: 'Ejes y Vías', ruta: '/mantenimientos/ejes', icono: 'fa-solid fa-road', orden: 9, menuPadreId: 9, codigo: 'ejes-vias', submenus: [] },
    ]
  },
  {
    id: 11,
    nombre: 'Panel de Control',
    ruta: '#',
    icono: 'fa-solid fa-gauge-high',
    orden: 5,
    menuPadreId: null,
    codigo: 'panel-control',
    submenus: [
      { id: 13, nombre: 'Usuarios', ruta: '/admin/users', icono: 'fa-solid fa-users', orden: 1, menuPadreId: 11, codigo: 'usuarios', submenus: [] },
      { id: 15, nombre: 'Grupos y Permisos', ruta: '/admin/grupos', icono: 'fa-solid fa-user-tag', orden: 2, menuPadreId: 11, codigo: 'grupos', submenus: [] },
      { id: 17, nombre: 'Menús del Sistema', ruta: '/admin/menus', icono: 'fa-solid fa-bars', orden: 3, menuPadreId: 11, codigo: 'menus', submenus: [] },
      { id: 48, nombre: 'Catálogos Generales', ruta: '/admin/catalogos', icono: 'fa-solid fa-tags', orden: 4, menuPadreId: 11, codigo: 'catalogos', submenus: [] },
    ]
  }
];

export function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isActive = (path: string) => location.pathname === path;
  const isActivePath = (path: string) => location.pathname.startsWith(path);

  const baseMenus = (user?.menus && user.menus.length > 0) ? user.menus : DEFAULT_FALLBACK_MENUS;
  const menusToRender = baseMenus.map(m => {
    if (m.codigo === 'reportes' || m.nombre.toLowerCase().includes('reportes')) {
      const hasBi = m.submenus?.some(s => s.ruta === '/reportes/bi-dashboard' || s.codigo === 'reportes-bi');
      if (!hasBi) {
        return {
          ...m,
          submenus: [
            ...(m.submenus || []),
            {
              id: 99,
              nombre: 'Dashboard Ejecutivo BI',
              ruta: '/reportes/bi-dashboard',
              icono: 'fa-solid fa-chart-line',
              orden: 4,
              menuPadreId: m.id,
              codigo: 'reportes-bi',
              submenus: []
            }
          ]
        };
      }
    }
    return m;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', maxWidth: '100%', backgroundColor: 'var(--gray-100)', overflow: 'hidden' }}>
      {/* Header */}
      <header className="bg-white border-bottom" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        height: '60px',
        width: '100%',
        flexShrink: 0,
        zIndex: 1050,
        position: 'relative',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="btn btn-light"
            style={{ fontSize: '20px', padding: '8px 12px' }}
            title="Mostrar / Ocultar menú lateral"
          >
            <i className="fa-solid fa-bars"></i>
          </button>

          <div
            style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            <i className="fa-solid fa-traffic-light" style={{ fontSize: '22px' }}></i>
            SISTEMA DE MONITOREO
          </div>
        </div>

        <div style={{ fontSize: '15px', fontWeight: '500', color: 'var(--gray-600)' }}>
          {isActive('/') && 'Inicio'}
          {isActive('/incidents') && 'Gestión de Incidencias'}
          {isActivePath('/cruces') && 'Intersecciones'}
          {isActivePath('/reportes') && 'Reportes'}
          {isActivePath('/mantenimientos') && 'Mantenimientos'}
          {isActivePath('/admin') && 'Panel de Control'}
          {isActive('/perfil') && 'Mi Perfil'}
          {isActive('/configuracion') && 'Configuración'}
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
                <i className="fa-solid fa-user" style={{ fontSize: '14px' }}></i>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '13px', fontWeight: '500', lineHeight: '1.2' }}>
                  {user?.usuario || 'Usuario'}
                </div>
                <div style={{ fontSize: '11px', color: '#6c757d', lineHeight: '1.2' }}>
                  {user?.grupo?.nombre || 'Usuario'}
                </div>
              </div>
              <i className="fa-solid fa-chevron-down" style={{ fontSize: '10px', marginLeft: '4px' }}></i>
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
                  <i className="fa-solid fa-user me-2 text-primary"></i>Mi Perfil
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
                  <i className="fa-solid fa-gear me-2 text-secondary"></i>Configuración
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
                  <i className="fa-solid fa-arrow-right-from-bracket me-2"></i>Cerrar Sesión
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Contenedor con Sidebar y Contenido */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', width: '100%', minWidth: 0, minHeight: 0 }}>
        {/* Sidebar */}
        <aside
          style={{
            width: sidebarOpen ? '260px' : '0',
            minWidth: sidebarOpen ? '260px' : '0',
            backgroundColor: 'var(--primary-darkest)',
            transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            overflowX: 'hidden',
            overflowY: 'auto',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: sidebarOpen ? '2px 0 8px rgba(0,0,0,0.15)' : 'none'
          }}
        >
          {/* Navegación en sidebar */}
          <nav style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>
            {/* Inicio siempre fijo en primer lugar */}
            <DynamicMenuItem
              menu={{
                id: 0,
                nombre: 'Inicio',
                ruta: '/',
                icono: 'fa-solid fa-house',
                orden: 0,
                menuPadreId: null,
                codigo: 'inicio',
                submenus: []
              }}
            />
            {/* Menús dinámicos */}
            {menusToRender.map(menu => (
              <DynamicMenuItem key={menu.id} menu={menu} />
            ))}
          </nav>
        </aside>

        {/* Contenedor principal */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, width: '100%' }}>
          {/* Contenido */}
          <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', width: '100%', minWidth: 0 }}>
            {children}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-top" style={{
        flexShrink: 0,
        padding: '12px 20px',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div className="container-fluid">
          <div className="row align-items-center">
            <div className="col-md-6">
              <p className="mb-0 text-muted" style={{ fontSize: '13px' }}>
                © {new Date().getFullYear()} Sistema de Monitoreo <span className="ms-2 badge bg-primary">v1.4.8</span>
              </p>
            </div>
            <div className="col-md-6 text-md-end">
              <small className="text-muted">División de Monitoreo y Control - SGF - GMU</small>
            </div>
          </div>
        </div>
      </footer>

      {/* Notificación Toast */}
      <NotificationToast />
    </div>
  );
}
