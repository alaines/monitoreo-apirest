-- Crear menú de Usuarios en el sistema
-- Este menú es necesario para el módulo de administración

-- Insertar menú de Usuarios si no existe
INSERT INTO menus (parent_id, lft, rght, name, estado, url, icono, codigo, modulo, orden, created, modified)
VALUES (
  NULL, -- parent_id: menú raíz
  1,    -- lft
  2,    -- rght
  'Usuarios',
  true,
  '/admin/users',
  'fas fa-users',
  'users',
  'Administración',
  1,    -- orden
  NOW(),
  NOW()
)
ON CONFLICT (codigo) DO UPDATE SET
  name = EXCLUDED.name,
  url = EXCLUDED.url,
  icono = EXCLUDED.icono,
  modulo = EXCLUDED.modulo,
  modified = NOW();

-- Asignar todos los permisos de 'users' a SUPER_ADMIN
INSERT INTO grupos_menus (grupo_id, menu_id, accion_id)
SELECT 
    (SELECT id FROM grupos WHERE nombre = 'SUPER_ADMIN') as grupo_id,
    (SELECT id FROM menus WHERE codigo = 'users') as menu_id,
    a.id as accion_id
FROM acciones a
WHERE a.estado = true
  AND NOT EXISTS (
    SELECT 1 FROM grupos_menus gm 
    WHERE gm.grupo_id = (SELECT id FROM grupos WHERE nombre = 'SUPER_ADMIN')
      AND gm.menu_id = (SELECT id FROM menus WHERE codigo = 'users')
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
WHERE g.nombre = 'SUPER_ADMIN' AND m.codigo = 'users'
ORDER BY a.codigo;
