-- Script para asignar permisos completos al grupo ADMINISTRADOR
-- Fecha: 2026-01-09
-- Los administradores también deben tener acceso completo

-- Asignar TODAS las acciones a TODOS los menús para el grupo ADMINISTRADOR
INSERT INTO grupos_menus (grupo_id, menu_id, accion_id)
SELECT 
  g.id as grupo_id,
  m.id as menu_id,
  a.id as accion_id
FROM grupos g
CROSS JOIN menus m
CROSS JOIN acciones a
WHERE g.nombre = 'ADMINISTRADOR'
  AND a.estado = true
  AND m.estado = true
ON CONFLICT DO NOTHING;

-- Verificar
SELECT 
  g.nombre as grupo,
  COUNT(DISTINCT gm.menu_id) as menus_asignados,
  COUNT(*) as total_permisos
FROM grupos_menus gm
JOIN grupos g ON gm.grupo_id = g.id
WHERE g.nombre IN ('SUPER_ADMIN', 'ADMINISTRADOR')
GROUP BY g.nombre
ORDER BY g.nombre;

-- Resumen final de permisos por grupo
SELECT 
  g.nombre as grupo,
  COUNT(DISTINCT u.id) as usuarios_count,
  COUNT(DISTINCT gm.menu_id) as menus_con_acceso
FROM grupos g
LEFT JOIN users u ON g.id = u.grupo_id
LEFT JOIN grupos_menus gm ON g.id = gm.grupo_id
GROUP BY g.id, g.nombre
ORDER BY g.id;
