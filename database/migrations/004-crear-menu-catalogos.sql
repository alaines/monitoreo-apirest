-- Crear menú de Catálogos en el sistema
-- Este menú es necesario para la gestión de tipos jerárquicos

-- Insertar menú de Catálogos si no existe
INSERT INTO menus (parent_id, lft, rght, name, estado, url, icono, codigo, modulo, orden, created, modified)
VALUES (
  NULL, -- parent_id: menú raíz
  1,    -- lft
  2,    -- rght
  'Catálogos',
  true,
  '/admin/catalogos',
  'fas fa-folder-tree',
  'catalogos',
  'Administración',
  3,    -- orden
  NOW(),
  NOW()
)
ON CONFLICT (codigo) DO UPDATE SET
  name = EXCLUDED.name,
  url = EXCLUDED.url,
  icono = EXCLUDED.icono,
  modulo = EXCLUDED.modulo,
  modified = NOW();

-- Asignar todos los permisos de 'catalogos' a SUPER_ADMIN
INSERT INTO grupos_menus (grupo_id, menu_id, accion_id)
SELECT 
    (SELECT id FROM grupos WHERE nombre = 'SUPER_ADMIN') as grupo_id,
    (SELECT id FROM menus WHERE codigo = 'catalogos') as menu_id,
    a.id as accion_id
FROM acciones a
WHERE a.estado = true
  AND NOT EXISTS (
    SELECT 1 FROM grupos_menus gm 
    WHERE gm.grupo_id = (SELECT id FROM grupos WHERE nombre = 'SUPER_ADMIN')
      AND gm.menu_id = (SELECT id FROM menus WHERE codigo = 'catalogos')
      AND gm.accion_id = a.id
  );

-- Verificar resultado
SELECT 
    m.codigo as menu,
    a.codigo as accion
FROM grupos_menus gm
JOIN grupos g ON gm.grupo_id = g.id
JOIN menus m ON gm.menu_id = m.id
JOIN acciones a ON gm.accion_id = a.id
WHERE g.nombre = 'SUPER_ADMIN' AND m.codigo = 'catalogos'
ORDER BY a.codigo;
