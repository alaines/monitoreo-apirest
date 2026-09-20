import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Menu } from '../features/auth/types';

export function normalizeMenuRoute(
  ruta?: string, 
  codigo?: string, 
  nombre?: string,
  parentName?: string
): string {
  if (!ruta || ruta === '#' || ruta === '') {
    return '#';
  }

  // Si ya es una ruta absoluta limpia que empieza con /
  if (ruta.startsWith('/')) {
    return ruta;
  }

  const clean = ruta.trim().replace(/^\/+|\/+$/g, '');
  const pName = (parentName || '').toLowerCase();
  const n = (nombre || '').toLowerCase();

  // Distinguir la URL compartida 'incidencia/reportes/buscar' según el menú padre
  if (clean === 'incidencia/reportes/buscar' || clean === 'incidencia/reportes') {
    if (pName.includes('incidencia') || n.includes('ticket')) {
      return '/incidents';
    }
    return '/reportes/incidencias';
  }

  const map: Record<string, string> = {
    'mapas/red': '/cruces/mapa',
    'intersecciones/cruces/busqueda': '/cruces',
    'intersecciones/cruces': '/cruces',
    'intersecciones/cruces/': '/cruces',
    'incidencia/tickets': '/incidents',
    'incidencia/tickets/': '/incidents',
    'incidencia/tickets/detalleTicket': '/incidents',
    'reportes/incidencias': '/reportes/incidencias',
    'reportes/grafico': '/reportes/grafico',
    'reportes/mapa': '/reportes/mapa',
    'conteo/estadisticas/mensual': '/reportes/grafico',
    'conteo/estadisticas/comparativoMensual': '/reportes/grafico?tipo=comparativo',
    'acceso/users': '/admin/users',
    'acceso/users/': '/admin/users',
    'acceso/personas': '/admin/users',
    'acceso/personas/': '/admin/users',
    'admin/users': '/admin/users',
    'acceso/grupos/add': '/admin/grupos',
    'acceso/grupos': '/admin/grupos',
    'admin/grupos': '/admin/grupos',
    'acceso/menus/add': '/admin/menus',
    'acceso/menus': '/admin/menus',
    'admin/menus': '/admin/menus',
    'admin/catalogos': '/admin/catalogos',
    'intersecciones/tipos': '/mantenimientos/tipos',
    'intersecciones/tipos/': '/mantenimientos/tipos',
    'mantenimientos/tipos': '/mantenimientos/tipos',
    'incidencia/areas': '/mantenimientos/areas',
    'incidencia/areas/': '/mantenimientos/areas',
    'mantenimientos/areas': '/mantenimientos/areas',
    'incidencia/equipos': '/mantenimientos/equipos',
    'incidencia/equipos/': '/mantenimientos/equipos',
    'mantenimientos/equipos': '/mantenimientos/equipos',
    'incidencia/reportadores': '/mantenimientos/reportadores',
    'incidencia/reportadores/': '/mantenimientos/reportadores',
    'mantenimientos/reportadores': '/mantenimientos/reportadores',
    'incidencia/responsables': '/mantenimientos/responsables',
    'incidencia/responsables/': '/mantenimientos/responsables',
    'mantenimientos/responsables': '/mantenimientos/responsables',
    'intersecciones/administradores': '/mantenimientos/administradores',
    'intersecciones/administradores/': '/mantenimientos/administradores',
    'mantenimientos/administradores': '/mantenimientos/administradores',
    'intersecciones/ejes': '/mantenimientos/ejes',
    'intersecciones/ejes/': '/mantenimientos/ejes',
    'mantenimientos/ejes': '/mantenimientos/ejes',
    'incidencia/proyectos': '/mantenimientos/proyectos',
    'incidencia/proyectos/': '/mantenimientos/proyectos',
    'mantenimientos/proyectos': '/mantenimientos/proyectos',
    'incidencia/incidencias': '/mantenimientos/incidencias',
    'incidencia/incidencias/': '/mantenimientos/incidencias',
    'mantenimientos/incidencias': '/mantenimientos/incidencias',
    'perfil': '/perfil',
    'configuracion': '/configuracion',
  };

  if (map[clean]) return map[clean];
  return `/${clean}`;
}

export function getMenuDisplayName(nombre: string, parentName?: string): string {
  const n = (nombre || '').trim();
  const p = (parentName || '').toLowerCase();
  
  if (p.includes('interseccion') || p.includes('cruce')) {
    if (n.toLowerCase() === 'mapa') return 'Mapa de Red';
    if (n.toLowerCase() === 'administrar') return 'Gestión de Intersecciones';
    if (n.toLowerCase() === 'consultas') return 'Búsqueda de Intersecciones';
  }

  if (p.includes('incidencia') || p.includes('ticket')) {
    if (n.toLowerCase() === 'administrar') return 'Gestión de Tickets';
    if (n.toLowerCase() === 'consultas') return 'Búsqueda de Tickets';
    if (n.toLowerCase().includes('ticket')) return 'Consulta x Ticket';
  }

  if (p.includes('reporte')) {
    if (n.toLowerCase() === 'generar') return 'Reporte de Incidencias';
  }

  if (p.includes('usuario')) {
    if (n.toLowerCase() === 'administrar') return 'Usuarios';
  }

  if (p.includes('grupo')) {
    if (n.toLowerCase() === 'administrar') return 'Grupos y Permisos';
  }

  if (p.includes('menu')) {
    if (n.toLowerCase() === 'administrar') return 'Menús del Sistema';
  }

  return n;
}

export function getMenuIcon(icono?: string, nombre?: string): string {
  if (icono && icono.trim() && icono !== '#' && !icono.startsWith('http')) {
    if (icono.startsWith('fa-solid ') || icono.startsWith('fa-regular ') || icono.startsWith('fa-brands ')) return icono;
    if (icono.startsWith('fa-')) return `fa-solid ${icono}`;
    if (icono.startsWith('fas fa-')) return `fa-solid fa-${icono.substring(7)}`;
    if (icono.startsWith('fas ')) return `fa-solid ${icono.substring(4)}`;
    if (icono.startsWith('fa ')) return `fa-solid ${icono.substring(3)}`;
    return `fa-solid fa-${icono}`;
  }

  const n = (nombre || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (n.includes('inicio') || n.includes('dashboard') || n.includes('principal')) return 'fa-solid fa-house';
  if (n.includes('mapa') || n.includes('red')) return 'fa-solid fa-map-location-dot';
  if (n.includes('interseccion') || n.includes('cruce')) return 'fa-solid fa-traffic-light';
  if (n.includes('incidencia') || n.includes('ticket')) return 'fa-solid fa-triangle-exclamation';
  if (n.includes('consulta') || n.includes('buscar')) return 'fa-solid fa-magnifying-glass';
  if (n.includes('reporte') || n.includes('grafico') || n.includes('estadistica') || n.includes('volumen') || n.includes('comparativo')) return 'fa-solid fa-chart-column';
  if (n.includes('generar')) return 'fa-solid fa-file-invoice';
  if (n.includes('calor')) return 'fa-solid fa-fire';
  if (n.includes('mantenimiento')) return 'fa-solid fa-wrench';
  if (n.includes('area')) return 'fa-solid fa-building';
  if (n.includes('equipo')) return 'fa-solid fa-users-gear';
  if (n.includes('proyecto')) return 'fa-solid fa-diagram-project';
  if (n.includes('reportador')) return 'fa-solid fa-user-pen';
  if (n.includes('responsable')) return 'fa-solid fa-user-check';
  if (n.includes('administrador')) return 'fa-solid fa-user-shield';
  if (n.includes('eje') || n.includes('via')) return 'fa-solid fa-road';
  if (n.includes('tipo') || n.includes('catalogo')) return 'fa-solid fa-tags';
  if (n.includes('usuario') || n.includes('persona')) return 'fa-solid fa-users';
  if (n.includes('grupo') || n.includes('perfil')) return 'fa-solid fa-user-tag';
  if (n.includes('menu')) return 'fa-solid fa-bars';
  if (n.includes('conteo')) return 'fa-solid fa-car';
  if (n.includes('panel')) return 'fa-solid fa-gauge-high';
  if (n.includes('administrar')) return 'fa-solid fa-gear';

  return 'fa-solid fa-circle';
}

interface DynamicMenuItemProps {
  menu: Menu;
  level?: number;
  parentName?: string;
}

export function DynamicMenuItem({ menu, level = 0, parentName }: DynamicMenuItemProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Desenrollar menús contenedores vacíos o genéricos y deduplicar rutas redundantes
  const effectiveSubmenus: Menu[] = (() => {
    if (!menu.submenus || menu.submenus.length === 0) return [];
    
    // Desenrollar menús contenedores vacíos o genéricos (como "Opciones", "Tablas")
    const rawList: Menu[] = [];
    for (const sub of menu.submenus) {
      const isContainer = (
        sub.nombre.toLowerCase().startsWith('opciones') ||
        sub.nombre.toLowerCase().startsWith('tablas')
      ) && sub.submenus && sub.submenus.length > 0;

      if (isContainer) {
        rawList.push(...(sub.submenus || []));
      } else {
        rawList.push(sub);
      }
    }

    // Filtrar y deduplicar submenús para que no haya dos hermanos con la misma ruta destino
    const seenRoutes = new Set<string>();
    const result: Menu[] = [];

    for (const item of rawList) {
      const normalized = normalizeMenuRoute(item.ruta, item.codigo, item.nombre, menu.nombre);
      
      // Si el ítem no tiene ruta válida ni submenús propios, saltarlo
      if (normalized === '#' && (!item.submenus || item.submenus.length === 0)) {
        continue;
      }

      // Si ya tenemos un submenú hermano con la misma ruta exacta, no duplicar
      if (normalized !== '#') {
        if (seenRoutes.has(normalized)) {
          continue;
        }
        seenRoutes.add(normalized);
      }

      result.push(item);
    }

    return result;
  })();

  // Si un elemento de submenú solo tiene 1 hijo "Administrar" con ruta válida, transformarlo en enlace directo
  const isDirectActionNode = effectiveSubmenus.length === 1 && 
    (effectiveSubmenus[0].nombre.toLowerCase().startsWith('administrar') || 
     effectiveSubmenus[0].nombre.toLowerCase().startsWith('ver') ||
     effectiveSubmenus[0].nombre.toLowerCase().startsWith('usuarios') ||
     effectiveSubmenus[0].nombre.toLowerCase().startsWith('grupos') ||
     effectiveSubmenus[0].nombre.toLowerCase().startsWith('men')) &&
    normalizeMenuRoute(effectiveSubmenus[0].ruta, effectiveSubmenus[0].codigo, effectiveSubmenus[0].nombre, menu.nombre) !== '#';

  const finalSubmenus = isDirectActionNode ? [] : effectiveSubmenus;
  const directRoute = isDirectActionNode 
    ? normalizeMenuRoute(effectiveSubmenus[0].ruta, effectiveSubmenus[0].codigo, effectiveSubmenus[0].nombre, menu.nombre) 
    : null;
  const targetRoute = directRoute || normalizeMenuRoute(menu.ruta, menu.codigo, menu.nombre, parentName);
  
  const hasSubmenus = finalSubmenus.length > 0;
  const isLeafRoute = !hasSubmenus && targetRoute !== '#';

  const currentPathWithSearch = location.pathname + location.search;

  // Coincidencia EXACTA para items hoja (SOLO se activa el item específico que coincide exactamente)
  const isCurrentActive = isLeafRoute && (
    targetRoute.includes('?') 
      ? currentPathWithSearch === targetRoute 
      : location.pathname === targetRoute
  );

  // Un menú contenedor padre solo es childActive si uno de sus descendientes coincide exactamente
  const isChildActive = hasSubmenus && finalSubmenus.some(sub => {
    const subRoute = normalizeMenuRoute(sub.ruta, sub.codigo, sub.nombre, menu.nombre);
    if (subRoute === '#') {
      return (sub.submenus || []).some(grandChild => {
        const grandRoute = normalizeMenuRoute(grandChild.ruta, grandChild.codigo, grandChild.nombre, sub.nombre);
        return grandRoute !== '#' && (
          grandRoute.includes('?') 
            ? currentPathWithSearch === grandRoute 
            : location.pathname === grandRoute
        );
      });
    }
    return subRoute.includes('?') 
      ? currentPathWithSearch === subRoute 
      : location.pathname === subRoute;
  });

  // Estado abierto/cerrado: controlado por el usuario, inicializado según si contiene la ruta activa
  const [isOpen, setIsOpen] = useState(isChildActive);
  const prevPathnameRef = useRef(currentPathWithSearch);

  // Solo auto-expandir si el usuario navega a una nueva ruta dentro de este menú
  useEffect(() => {
    if (currentPathWithSearch !== prevPathnameRef.current) {
      prevPathnameRef.current = currentPathWithSearch;
      if (isChildActive) {
        setIsOpen(true);
      }
    }
  }, [currentPathWithSearch, isChildActive]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasSubmenus) {
      setIsOpen(prev => !prev);
    } else if (isLeafRoute) {
      navigate(targetRoute);
    }
  };

  const isParent = level === 0;
  const displayName = getMenuDisplayName(menu.nombre, parentName);
  const iconClass = getMenuIcon(menu.icono, displayName);

  return (
    <div style={{ marginBottom: '2px' }}>
      <button
        onClick={handleClick}
        type="button"
        style={{
          width: '100%',
          padding: isParent ? '12px 18px' : '10px 18px 10px ' + (24 + level * 16) + 'px',
          border: 'none',
          background: isCurrentActive 
            ? 'rgba(255, 255, 255, 0.18)' 
            : 'transparent',
          color: isCurrentActive 
            ? '#ffffff' 
            : (isParent && isChildActive && !isOpen)
            ? '#00c0ef'
            : 'rgba(255, 255, 255, 0.85)',
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: isParent ? '14px' : '13px',
          fontWeight: isCurrentActive ? 600 : isParent ? 500 : 400,
          transition: 'background 0.2s ease, border-left 0.2s ease',
          borderLeft: isCurrentActive 
            ? '4px solid #00c0ef' 
            : (isParent && isChildActive && !isOpen) 
            ? '4px solid #3c8dbc' 
            : '4px solid transparent',
          borderRadius: '0 4px 4px 0',
          outline: 'none',
          userSelect: 'none',
        }}
        onMouseEnter={(e) => {
          if (!isCurrentActive) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
            e.currentTarget.style.color = '#ffffff';
          }
        }}
        onMouseLeave={(e) => {
          if (!isCurrentActive) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = (isParent && isChildActive && !isOpen) ? '#00c0ef' : 'rgba(255, 255, 255, 0.85)';
          }
        }}
      >
        <i 
          className={iconClass} 
          style={{ 
            width: '20px', 
            textAlign: 'center', 
            fontSize: isParent ? '15px' : '13px',
            color: isCurrentActive ? '#00c0ef' : 'inherit'
          }}
        ></i>
        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {displayName}
        </span>
        {hasSubmenus && (
          <i 
            className={`fa-solid fa-chevron-${isOpen ? 'down' : 'right'}`} 
            style={{ fontSize: '11px', opacity: 0.7, transition: 'transform 0.2s ease' }}
          ></i>
        )}
      </button>

      {/* Renderizar submenús: controlado estrictamente por isOpen */}
      {hasSubmenus && isOpen && (
        <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.25)', padding: '2px 0' }}>
          {finalSubmenus.map(submenu => (
            <DynamicMenuItem 
              key={submenu.id} 
              menu={submenu} 
              level={level + 1} 
              parentName={menu.nombre}
            />
          ))}
        </div>
      )}
    </div>
  );
}
