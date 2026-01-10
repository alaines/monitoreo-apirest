-- Script para asignar TODOS los permisos de TODOS los menús al grupo SUPER_ADMIN
-- Fecha: 2026-01-09
-- Descripción: El usuario "admin" y grupo SUPER_ADMIN tendrán acceso completo a todo el sistema

-- Verificar que solo existan los 24 menús del snapshot
DO $$
DECLARE
  menu_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO menu_count FROM menus;
  
  IF menu_count != 24 THEN
    RAISE EXCEPTION 'ERROR: Se esperaban 24 menús pero hay %. Ejecuta primero insert-menus.sql', menu_count;
  ELSE
    RAISE NOTICE 'Verificación OK: Existen exactamente 24 menús en la BD';
  END IF;
END $$;

-- Verificar que existe el grupo SUPER_ADMIN
DO $$
DECLARE
  grupo_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM grupos WHERE nombre = 'SUPER_ADMIN') INTO grupo_exists;
  
  IF NOT grupo_exists THEN
    RAISE EXCEPTION 'ERROR: No existe el grupo SUPER_ADMIN';
  ELSE
    RAISE NOTICE 'Verificación OK: Grupo SUPER_ADMIN existe';
  END IF;
END $$;

-- Limpiar permisos existentes del grupo SUPER_ADMIN (por si acaso)
DELETE FROM grupos_menus WHERE grupo_id = (SELECT id FROM grupos WHERE nombre = 'SUPER_ADMIN');

-- Asignar TODAS las acciones a TODOS los menús para el grupo SUPER_ADMIN
-- Esto crea: 24 menús × 6 acciones = 144 permisos
INSERT INTO grupos_menus (grupo_id, menu_id, accion_id)
SELECT 
  g.id as grupo_id,
  m.id as menu_id,
  a.id as accion_id
FROM grupos g
CROSS JOIN menus m
CROSS JOIN acciones a
WHERE g.nombre = 'SUPER_ADMIN'
  AND a.estado = true
  AND m.estado = true;

-- Verificar inserción
DO $$
DECLARE
  permisos_count INTEGER;
  expected_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO permisos_count 
  FROM grupos_menus 
  WHERE grupo_id = (SELECT id FROM grupos WHERE nombre = 'SUPER_ADMIN');
  
  -- 24 menús × 6 acciones = 144 permisos esperados
  expected_count := 24 * 6;
  
  IF permisos_count = expected_count THEN
    RAISE NOTICE 'SUCCESS: Se asignaron % permisos al grupo SUPER_ADMIN', permisos_count;
  ELSE
    RAISE WARNING 'Se esperaban % permisos pero se insertaron %', expected_count, permisos_count;
  END IF;
END $$;

-- Mostrar resumen
SELECT 
  g.nombre as grupo,
  COUNT(DISTINCT gm.menu_id) as menus_asignados,
  COUNT(DISTINCT gm.accion_id) as acciones_distintas,
  COUNT(*) as total_permisos
FROM grupos_menus gm
JOIN grupos g ON gm.grupo_id = g.id
WHERE g.nombre = 'SUPER_ADMIN'
GROUP BY g.nombre;

-- Mostrar detalle de permisos por menú (primeros 10)
SELECT 
  m.id,
  m.name as menu,
  STRING_AGG(a.nombre, ', ' ORDER BY a.orden) as permisos
FROM grupos_menus gm
JOIN menus m ON gm.menu_id = m.id
JOIN acciones a ON gm.accion_id = a.id
JOIN grupos g ON gm.grupo_id = g.id
WHERE g.nombre = 'SUPER_ADMIN'
GROUP BY m.id, m.name
ORDER BY m.id
LIMIT 10;

-- Verificar usuario admin
SELECT 
  u.id,
  u.usuario,
  g.nombre as grupo,
  'Tiene acceso completo a ' || COUNT(DISTINCT gm.menu_id) || ' menús' as acceso
FROM users u
JOIN grupos g ON u.grupo_id = g.id
LEFT JOIN grupos_menus gm ON g.id = gm.grupo_id
WHERE u.usuario = 'admin'
GROUP BY u.id, u.usuario, g.nombre;
