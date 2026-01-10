import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Menu } from '../features/auth/types';

interface DynamicMenuItemProps {
  menu: Menu;
  level?: number;
}

export function DynamicMenuItem({ menu, level = 0 }: DynamicMenuItemProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [submenuOpen, setSubmenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;
  const isActivePath = (path: string) => location.pathname.startsWith(path);

  const hasSubmenus = menu.submenus && menu.submenus.length > 0;
  const isParent = level === 0;
  const isChild = level === 1;

  const handleClick = () => {
    if (hasSubmenus) {
      setSubmenuOpen(!submenuOpen);
    } else if (menu.ruta && menu.ruta !== '#') {
      navigate(menu.ruta);
    }
  };

  // Determinar si el menú está activo
  const isMenuActive = hasSubmenus 
    ? isActivePath(menu.ruta === '#' ? `/temp-${menu.codigo}` : menu.ruta)
    : isActive(menu.ruta);

  // Estilos para menú principal
  const parentStyles = {
    width: '100%',
    padding: '12px 20px',
    border: 'none',
    background: isMenuActive ? 'rgba(95, 149, 152, 0.2)' : 'transparent',
    color: 'white',
    textAlign: 'left' as const,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '14px',
    transition: 'background 0.2s',
    borderLeft: isMenuActive ? '4px solid var(--primary-light)' : '4px solid transparent'
  };

  // Estilos para submenú
  const childStyles = {
    width: '100%',
    padding: '10px 20px 10px 52px',
    border: 'none',
    background: isMenuActive ? 'rgba(95, 149, 152, 0.3)' : 'transparent',
    color: 'white',
    textAlign: 'left' as const,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    transition: 'background 0.2s',
    borderLeft: isMenuActive ? '4px solid var(--primary)' : '4px solid transparent'
  };

  const buttonStyle = isParent ? parentStyles : childStyles;

  return (
    <div>
      <button
        onClick={handleClick}
        style={buttonStyle}
        onMouseEnter={(e) => !isMenuActive && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
        onMouseLeave={(e) => !isMenuActive && (e.currentTarget.style.background = 'transparent')}
      >
        {menu.icono && (
          <i 
            className={menu.icono} 
            style={{ width: isParent ? '20px' : '16px', fontSize: isChild ? '12px' : undefined }}
          ></i>
        )}
        <span style={{ flex: 1 }}>{menu.nombre}</span>
        {hasSubmenus && (
          <i 
            className={`fas fa-chevron-${submenuOpen ? 'down' : 'right'}`} 
            style={{ fontSize: '12px' }}
          ></i>
        )}
      </button>

      {/* Renderizar submenús recursivamente */}
      {hasSubmenus && submenuOpen && (
        <div style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
          {menu.submenus!.map(submenu => (
            <DynamicMenuItem 
              key={submenu.id} 
              menu={submenu} 
              level={level + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
