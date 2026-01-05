-- Asignar todos los permisos a SUPER_ADMIN
-- Este script asegura que el grupo SUPER_ADMIN tenga acceso completo a todos los módulos

-- Eliminar permisos existentes de SUPER_ADMIN para evitar duplicados
DELETE FROM grupos_menus WHERE grupo_id = (SELECT id FROM grupos WHERE nombre = 'SUPER_ADMIN');

-- Insertar todos los permisos (todos los menús × todas las acciones)
INSERT INTO grupos_menus (grupo_id, menu_id, accion_id)
SELECT 
    (SELECT id FROM grupos WHERE nombre = 'SUPER_ADMIN') as grupo_id,
    m.id as menu_id,
    a.id as accion_id
FROM menus m
CROSS JOIN acciones a
WHERE m.estado = true
  AND a.estado = true
  AND NOT EXISTS (
    SELECT 1 FROM grupos_menus gm 
    WHERE gm.grupo_id = (SELECT id FROM grupos WHERE nombre = 'SUPER_ADMIN')
      AND gm.menu_id = m.id 
      AND gm.accion_id = a.id
  );

-- Verificar permisos asignados
SELECT 
    g.nombre as grupo,
    COUNT(*) as total_permisos
FROM grupos_menus gm
JOIN grupos g ON gm.grupo_id = g.id
WHERE g.nombre = 'SUPER_ADMIN'
GROUP BY g.nombre;
