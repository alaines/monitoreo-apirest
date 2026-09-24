-- ====================================================================
-- Migración 010: Estructuración y Asignación de Menús de Reportes
-- ====================================================================
-- Estandariza los 4 módulos analíticos bajo el menú principal "Reportes":
--   1. Reporte de Incidencias  (/reportes/incidencias)
--   2. Gráficos Estadísticos    (/reportes/grafico)
--   3. Mapa de Calor           (/reportes/mapa)
--   4. Dashboard Ejecutivo BI   (/reportes/bi-dashboard)
-- ====================================================================

SET client_encoding TO 'UTF8';

-- 1. Asegurar la existencia y metadatos del menú raíz 'Reportes'
INSERT INTO menus (name, codigo, url, icono, modulo, orden, estado, created, modified)
VALUES ('Reportes', 'reportes', '#', 'fa-solid fa-chart-column', 'Reportes', 3, true, NOW(), NOW())
ON CONFLICT (codigo) DO UPDATE SET
  name = 'Reportes',
  url = '#',
  icono = 'fa-solid fa-chart-column',
  modulo = 'Reportes',
  orden = 3,
  estado = true,
  modified = NOW();

-- 2. Insertar o actualizar los 4 submenús estándar bajo 'Reportes'
-- Submenú 1: Reporte de Incidencias
INSERT INTO menus (parent_id, name, codigo, url, icono, modulo, orden, estado, created, modified)
VALUES (
  (SELECT id FROM menus WHERE codigo = 'reportes' LIMIT 1),
  'Reporte de Incidencias',
  'reportes-incidencias',
  '/reportes/incidencias',
  'fa-solid fa-file-invoice',
  'Reportes',
  1,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (codigo) DO UPDATE SET
  parent_id = (SELECT id FROM menus WHERE codigo = 'reportes' LIMIT 1),
  name = 'Reporte de Incidencias',
  url = '/reportes/incidencias',
  icono = 'fa-solid fa-file-invoice',
  modulo = 'Reportes',
  orden = 1,
  estado = true,
  modified = NOW();

-- Submenú 2: Gráficos Estadísticos
INSERT INTO menus (parent_id, name, codigo, url, icono, modulo, orden, estado, created, modified)
VALUES (
  (SELECT id FROM menus WHERE codigo = 'reportes' LIMIT 1),
  'Gráficos Estadísticos',
  'reportes-graficos',
  '/reportes/grafico',
  'fa-solid fa-chart-pie',
  'Reportes',
  2,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (codigo) DO UPDATE SET
  parent_id = (SELECT id FROM menus WHERE codigo = 'reportes' LIMIT 1),
  name = 'Gráficos Estadísticos',
  url = '/reportes/grafico',
  icono = 'fa-solid fa-chart-pie',
  modulo = 'Reportes',
  orden = 2,
  estado = true,
  modified = NOW();

-- Submenú 3: Mapa de Calor
INSERT INTO menus (parent_id, name, codigo, url, icono, modulo, orden, estado, created, modified)
VALUES (
  (SELECT id FROM menus WHERE codigo = 'reportes' LIMIT 1),
  'Mapa de Calor',
  'reportes-mapa-calor',
  '/reportes/mapa',
  'fa-solid fa-fire',
  'Reportes',
  3,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (codigo) DO UPDATE SET
  parent_id = (SELECT id FROM menus WHERE codigo = 'reportes' LIMIT 1),
  name = 'Mapa de Calor',
  url = '/reportes/mapa',
  icono = 'fa-solid fa-fire',
  modulo = 'Reportes',
  orden = 3,
  estado = true,
  modified = NOW();

-- Submenú 4: Dashboard Ejecutivo BI
INSERT INTO menus (parent_id, name, codigo, url, icono, modulo, orden, estado, created, modified)
VALUES (
  (SELECT id FROM menus WHERE codigo = 'reportes' LIMIT 1),
  'Dashboard Ejecutivo BI',
  'reportes-bi',
  '/reportes/bi-dashboard',
  'fa-solid fa-chart-line',
  'Reportes',
  4,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (codigo) DO UPDATE SET
  parent_id = (SELECT id FROM menus WHERE codigo = 'reportes' LIMIT 1),
  name = 'Dashboard Ejecutivo BI',
  url = '/reportes/bi-dashboard',
  icono = 'fa-solid fa-chart-line',
  modulo = 'Reportes',
  orden = 4,
  estado = true,
  modified = NOW();

-- 3. Limpieza de nodos legacy bajo Reportes y desactivación del menú obsoleto Conteos
UPDATE menus 
SET estado = false, modified = NOW() 
WHERE id IN (7, 8) 
   OR parent_id = 7 
   OR (parent_id = (SELECT id FROM menus WHERE codigo = 'reportes' LIMIT 1) AND name ILIKE 'Opciones%') 
   OR codigo = 'reportes-generar';

UPDATE menus 
SET estado = false, modified = NOW() 
WHERE codigo = 'conteos' OR id = 26;


-- 4. Asignación de permisos completos a grupos de Administración
INSERT INTO grupos_menus (grupo_id, menu_id, accion_id)
SELECT 
  g.id as grupo_id,
  m.id as menu_id,
  a.id as accion_id
FROM grupos g
CROSS JOIN menus m
CROSS JOIN acciones a
WHERE g.nombre IN ('ADMINISTRADOR', 'SUPER_ADMIN', 'ADMINISTRADOR1')
  AND m.codigo IN ('reportes', 'reportes-incidencias', 'reportes-graficos', 'reportes-mapa-calor', 'reportes-bi')
  AND a.estado = true
  AND m.estado = true
ON CONFLICT (grupo_id, menu_id, accion_id) DO NOTHING;

-- 5. Asignación de permiso de lectura (view) a grupos de Supervisión y Operación
INSERT INTO grupos_menus (grupo_id, menu_id, accion_id)
SELECT 
  g.id as grupo_id,
  m.id as menu_id,
  a.id as accion_id
FROM grupos g
CROSS JOIN menus m
CROSS JOIN acciones a
WHERE g.nombre IN ('SUPERVISOR', 'CONSULTAS', 'CONSULTA', 'OPERADOR')
  AND m.codigo IN ('reportes', 'reportes-incidencias', 'reportes-graficos', 'reportes-mapa-calor', 'reportes-bi')
  AND a.codigo = 'view'
  AND a.estado = true
  AND m.estado = true
ON CONFLICT (grupo_id, menu_id, accion_id) DO NOTHING;
