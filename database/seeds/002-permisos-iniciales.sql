-- ============================================
-- SEEDS SPRINT 7: Datos iniciales para permisos
-- ============================================
-- Ejecutar DESPUÉS de la migración 001-sprint7-permisos.sql
-- ============================================

BEGIN;

-- ============================================
-- 1. INSERTAR MENÚS DEL SISTEMA
-- ============================================

-- Menús principales (ya deberían existir, esta es una verificación)
INSERT INTO menus (parent_id, name, url, icono, estado, codigo, modulo, orden, lft, rght) VALUES
  (NULL, 'Dashboard', '/inicio', 'dashboard', true, 'inicio', 'dashboard', 1, 1, 2),
  (NULL, 'Operaciones', NULL, 'build', true, 'operaciones', 'operaciones', 2, 3, 10),
  (NULL, 'Reportes', NULL, 'assessment', true, 'reportes', 'reportes', 3, 11, 14),
  (NULL, 'Administración', NULL, 'settings', true, 'administracion', 'administracion', 4, 15, 26)
ON CONFLICT (codigo) DO UPDATE SET
  name = EXCLUDED.name,
  icono = EXCLUDED.icono,
  modulo = EXCLUDED.modulo,
  orden = EXCLUDED.orden;

-- Submenús de Operaciones
INSERT INTO menus (parent_id, name, url, icono, estado, codigo, modulo, orden, lft, rght) VALUES
  ((SELECT id FROM menus WHERE codigo = 'operaciones'), 'Tickets', '/tickets', 'confirmation_number', true, 'tickets', 'operaciones', 1, 4, 5),
  ((SELECT id FROM menus WHERE codigo = 'operaciones'), 'Cruces', '/cruces', 'traffic', true, 'cruces', 'operaciones', 2, 6, 7),
  ((SELECT id FROM menus WHERE codigo = 'operaciones'), 'Seguimientos', '/seguimientos', 'track_changes', true, 'seguimientos', 'operaciones', 3, 8, 9)
ON CONFLICT (codigo) DO UPDATE SET
  parent_id = EXCLUDED.parent_id,
  name = EXCLUDED.name,
  url = EXCLUDED.url;

-- Submenús de Reportes
INSERT INTO menus (parent_id, name, url, icono, estado, codigo, modulo, orden, lft, rght) VALUES
  ((SELECT id FROM menus WHERE codigo = 'reportes'), 'Estadísticas', '/reportes/estadisticas', 'bar_chart', true, 'reportes-estadisticas', 'reportes', 1, 12, 13)
ON CONFLICT (codigo) DO UPDATE SET
  parent_id = EXCLUDED.parent_id,
  name = EXCLUDED.name;

-- Submenús de Administración
INSERT INTO menus (parent_id, name, url, icono, estado, codigo, modulo, orden, lft, rght) VALUES
  ((SELECT id FROM menus WHERE codigo = 'administracion'), 'Usuarios', '/administracion/usuarios', 'people', true, 'usuarios', 'administracion', 1, 16, 17),
  ((SELECT id FROM menus WHERE codigo = 'administracion'), 'Grupos/Perfiles', '/administracion/grupos', 'group', true, 'grupos', 'administracion', 2, 18, 19),
  ((SELECT id FROM menus WHERE codigo = 'administracion'), 'Tipos de Incidencia', '/administracion/tipos', 'category', true, 'tipos', 'administracion', 3, 20, 21),
  ((SELECT id FROM menus WHERE codigo = 'administracion'), 'Catálogos', '/administracion/catalogos', 'list_alt', true, 'catalogos', 'administracion', 4, 22, 23),
  ((SELECT id FROM menus WHERE codigo = 'administracion'), 'Auditoría', '/administracion/auditoria', 'history', true, 'auditoria', 'administracion', 5, 24, 25)
ON CONFLICT (codigo) DO UPDATE SET
  parent_id = EXCLUDED.parent_id,
  name = EXCLUDED.name,
  url = EXCLUDED.url;

-- ============================================
-- 2. VERIFICAR ACCIONES (ya insertadas en migración)
-- ============================================

-- Solo para referencia, estas ya se insertaron en la migración:
-- view, create, edit, delete, export, print, approve, assign

-- ============================================
-- 3. CONFIGURAR PERMISOS POR GRUPO
-- ============================================

-- Limpiar permisos existentes de grupos predefinidos para reconfigurarlos
DELETE FROM grupos_menus 
WHERE grupo_id IN (
  SELECT id FROM grupos WHERE nombre IN ('SUPER_ADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'OPERADOR', 'TECNICO', 'CONSULTA')
);

-- ============================================
-- 3.1. SUPER_ADMIN - Acceso total
-- ============================================

INSERT INTO grupos_menus (grupo_id, menu_id, accion_id)
SELECT 
  g.id,
  m.id,
  a.id
FROM grupos g
CROSS JOIN menus m
CROSS JOIN acciones a
WHERE g.nombre = 'SUPER_ADMIN'
  AND m.estado = true
  AND a.estado = true
ON CONFLICT (grupo_id, menu_id, accion_id) DO NOTHING;

-- ============================================
-- 3.2. ADMINISTRADOR - Acceso completo operativo
-- ============================================

-- Dashboard: solo ver
INSERT INTO grupos_menus (grupo_id, menu_id, accion_id)
SELECT g.id, m.id, a.id
FROM grupos g, menus m, acciones a
WHERE g.nombre = 'ADMINISTRADOR'
  AND m.codigo = 'inicio'
  AND a.codigo IN ('view')
ON CONFLICT DO NOTHING;

-- Tickets: completo (ver, crear, editar, exportar)
INSERT INTO grupos_menus (grupo_id, menu_id, accion_id)
SELECT g.id, m.id, a.id
FROM grupos g, menus m, acciones a
WHERE g.nombre = 'ADMINISTRADOR'
  AND m.codigo = 'tickets'
  AND a.codigo IN ('view', 'create', 'edit', 'delete', 'export', 'assign')
ON CONFLICT DO NOTHING;

-- Cruces: completo
INSERT INTO grupos_menus (grupo_id, menu_id, accion_id)
SELECT g.id, m.id, a.id
FROM grupos g, menus m, acciones a
WHERE g.nombre = 'ADMINISTRADOR'
  AND m.codigo = 'cruces'
  AND a.codigo IN ('view', 'create', 'edit', 'delete', 'export')
ON CONFLICT DO NOTHING;

-- Seguimientos: completo
INSERT INTO grupos_menus (grupo_id, menu_id, accion_id)
SELECT g.id, m.id, a.id
FROM grupos g, menus m, acciones a
WHERE g.nombre = 'ADMINISTRADOR'
  AND m.codigo = 'seguimientos'
  AND a.codigo IN ('view', 'create', 'edit', 'delete', 'export')
ON CONFLICT DO NOTHING;

-- Reportes: ver y exportar
INSERT INTO grupos_menus (grupo_id, menu_id, accion_id)
SELECT g.id, m.id, a.id
FROM grupos g, menus m, acciones a
WHERE g.nombre = 'ADMINISTRADOR'
  AND m.codigo LIKE 'reportes%'
  AND a.codigo IN ('view', 'export', 'print')
ON CONFLICT DO NOTHING;

-- Administración: completo
INSERT INTO grupos_menus (grupo_id, menu_id, accion_id)
SELECT g.id, m.id, a.id
FROM grupos g, menus m, acciones a
WHERE g.nombre = 'ADMINISTRADOR'
  AND m.codigo IN ('usuarios', 'grupos', 'tipos', 'catalogos', 'auditoria')
  AND a.codigo IN ('view', 'create', 'edit', 'delete', 'export')
ON CONFLICT DO NOTHING;

-- ============================================
-- 3.3. SUPERVISOR - Gestión operativa
-- ============================================

-- Dashboard: ver
INSERT INTO grupos_menus (grupo_id, menu_id, accion_id)
SELECT g.id, m.id, a.id
FROM grupos g, menus m, acciones a
WHERE g.nombre = 'SUPERVISOR'
  AND m.codigo = 'inicio'
  AND a.codigo IN ('view')
ON CONFLICT DO NOTHING;

-- Tickets: ver, crear, editar, asignar
INSERT INTO grupos_menus (grupo_id, menu_id, accion_id)
SELECT g.id, m.id, a.id
FROM grupos g, menus m, acciones a
WHERE g.nombre = 'SUPERVISOR'
  AND m.codigo = 'tickets'
  AND a.codigo IN ('view', 'create', 'edit', 'export', 'assign', 'approve')
ON CONFLICT DO NOTHING;

-- Cruces: ver y editar
INSERT INTO grupos_menus (grupo_id, menu_id, accion_id)
SELECT g.id, m.id, a.id
FROM grupos g, menus m, acciones a
WHERE g.nombre = 'SUPERVISOR'
  AND m.codigo = 'cruces'
  AND a.codigo IN ('view', 'edit', 'export')
ON CONFLICT DO NOTHING;

-- Seguimientos: completo
INSERT INTO grupos_menus (grupo_id, menu_id, accion_id)
SELECT g.id, m.id, a.id
FROM grupos g, menus m, acciones a
WHERE g.nombre = 'SUPERVISOR'
  AND m.codigo = 'seguimientos'
  AND a.codigo IN ('view', 'create', 'edit', 'export')
ON CONFLICT DO NOTHING;

-- Reportes: ver y exportar
INSERT INTO grupos_menus (grupo_id, menu_id, accion_id)
SELECT g.id, m.id, a.id
FROM grupos g, menus m, acciones a
WHERE g.nombre = 'SUPERVISOR'
  AND m.codigo LIKE 'reportes%'
  AND a.codigo IN ('view', 'export', 'print')
ON CONFLICT DO NOTHING;

-- ============================================
-- 3.4. OPERADOR - Trabajo de campo
-- ============================================

-- Dashboard: ver
INSERT INTO grupos_menus (grupo_id, menu_id, accion_id)
SELECT g.id, m.id, a.id
FROM grupos g, menus m, acciones a
WHERE g.nombre = 'OPERADOR'
  AND m.codigo = 'inicio'
  AND a.codigo IN ('view')
ON CONFLICT DO NOTHING;

-- Tickets: ver, crear, editar (solo los suyos)
INSERT INTO grupos_menus (grupo_id, menu_id, accion_id)
SELECT g.id, m.id, a.id
FROM grupos g, menus m, acciones a
WHERE g.nombre = 'OPERADOR'
  AND m.codigo = 'tickets'
  AND a.codigo IN ('view', 'create', 'edit')
ON CONFLICT DO NOTHING;

-- Cruces: solo ver
INSERT INTO grupos_menus (grupo_id, menu_id, accion_id)
SELECT g.id, m.id, a.id
FROM grupos g, menus m, acciones a
WHERE g.nombre = 'OPERADOR'
  AND m.codigo = 'cruces'
  AND a.codigo IN ('view')
ON CONFLICT DO NOTHING;

-- Seguimientos: ver y crear
INSERT INTO grupos_menus (grupo_id, menu_id, accion_id)
SELECT g.id, m.id, a.id
FROM grupos g, menus m, acciones a
WHERE g.nombre = 'OPERADOR'
  AND m.codigo = 'seguimientos'
  AND a.codigo IN ('view', 'create')
ON CONFLICT DO NOTHING;

-- ============================================
-- 3.5. TECNICO - Especialista técnico
-- ============================================

-- Similar a OPERADOR pero con más acceso a cruces y periféricos
INSERT INTO grupos_menus (grupo_id, menu_id, accion_id)
SELECT g.id, m.id, a.id
FROM grupos g, menus m, acciones a
WHERE g.nombre = 'TECNICO'
  AND m.codigo IN ('inicio', 'tickets', 'cruces', 'seguimientos')
  AND a.codigo IN ('view', 'create', 'edit', 'export')
ON CONFLICT DO NOTHING;

-- ============================================
-- 3.6. CONSULTA - Solo lectura
-- ============================================

INSERT INTO grupos_menus (grupo_id, menu_id, accion_id)
SELECT g.id, m.id, a.id
FROM grupos g, menus m, acciones a
WHERE g.nombre = 'CONSULTA'
  AND m.estado = true
  AND a.codigo IN ('view')
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. ACTUALIZAR USUARIO ADMIN
-- ============================================

-- Asignar usuario admin al grupo SUPER_ADMIN
UPDATE users
SET grupo_id = (SELECT id FROM grupos WHERE nombre = 'SUPER_ADMIN' LIMIT 1)
WHERE usuario = 'admin';

-- ============================================
-- 5. CONFIGURACIONES ADICIONALES
-- ============================================

INSERT INTO configuracion (clave, valor, descripcion, tipo, editable) VALUES
  ('permisos.cache_ttl', '300', 'Tiempo de caché de permisos en segundos', 'number', true),
  ('permisos.verificar_jerarquia', 'true', 'Verificar jerarquía de menús en permisos', 'boolean', true),
  ('auditoria.excluir_tablas', 'spatial_ref_sys,audits,audit_deltas', 'Tablas excluidas de auditoría', 'string', true),
  ('sesion.timeout_minutos', '60', 'Timeout de sesión en minutos', 'number', true)
ON CONFLICT (clave) DO NOTHING;

-- ============================================
-- 6. ESTADÍSTICAS DE SEEDS
-- ============================================

DO $$
DECLARE
  total_grupos INTEGER;
  total_menus INTEGER;
  total_acciones INTEGER;
  total_permisos INTEGER;
  permisos_por_grupo RECORD;
BEGIN
  SELECT COUNT(*) INTO total_grupos FROM grupos WHERE estado = true;
  SELECT COUNT(*) INTO total_menus FROM menus WHERE estado = true;
  SELECT COUNT(*) INTO total_acciones FROM acciones WHERE estado = true;
  SELECT COUNT(*) INTO total_permisos FROM grupos_menus;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SEEDS APLICADOS CORRECTAMENTE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Grupos activos: %', total_grupos;
  RAISE NOTICE 'Menús activos: %', total_menus;
  RAISE NOTICE 'Acciones disponibles: %', total_acciones;
  RAISE NOTICE 'Permisos configurados: %', total_permisos;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Permisos por grupo:';
  
  FOR permisos_por_grupo IN 
    SELECT g.nombre, COUNT(gm.id) as total
    FROM grupos g
    LEFT JOIN grupos_menus gm ON g.id = gm.grupo_id
    WHERE g.estado = true
    GROUP BY g.nombre
    ORDER BY total DESC
  LOOP
    RAISE NOTICE '  % : % permisos', permisos_por_grupo.nombre, permisos_por_grupo.total;
  END LOOP;
  
  RAISE NOTICE '========================================';
END $$;

COMMIT;
