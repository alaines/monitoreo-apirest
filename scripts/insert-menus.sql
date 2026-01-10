-- Script para insertar la estructura de menús actual del sistema
-- Fecha: 2026-01-09
-- Descripción: Snapshot de la estructura de menús del sidebar de Layout.tsx

-- Primero, hacer backup de la tabla actual (opcional)
-- CREATE TABLE menus_backup AS SELECT * FROM menus;

-- Limpiar tabla de menús (cuidado: esto eliminará todos los menús existentes)
-- Si deseas mantener los antiguos, comenta las siguientes líneas
DELETE FROM grupos_menus;
DELETE FROM menus;

-- Resetear la secuencia del ID
ALTER SEQUENCE menus_id_seq RESTART WITH 1;

-- Insertar menús principales (nivel 1)
INSERT INTO menus (id, parent_id, name, url, icono, orden, estado, codigo, created, modified) VALUES
(1, NULL, 'Inicio', '/', 'fas fa-chart-line', 1, true, 'inicio', NOW(), NOW()),
(2, NULL, 'Incidencias', '/incidents', 'fas fa-ticket-alt', 2, true, 'incidencias', NOW(), NOW()),
(3, NULL, 'Cruces', '#', 'fas fa-traffic-light', 3, true, 'cruces', NOW(), NOW()),
(6, NULL, 'Reportes', '#', 'fas fa-file-alt', 4, true, 'reportes', NOW(), NOW()),
(10, NULL, 'Mantenimientos', '#', 'fas fa-cogs', 5, true, 'mantenimientos', NOW(), NOW()),
(20, NULL, 'Panel de Control', '#', 'fas fa-tools', 6, true, 'panel-control', NOW(), NOW());

-- Insertar submenús de Cruces (parent_id = 3)
INSERT INTO menus (id, parent_id, name, url, icono, orden, estado, codigo, created, modified) VALUES
(4, 3, 'Gestión', '/cruces', 'fas fa-list', 1, true, 'cruces-gestion', NOW(), NOW()),
(5, 3, 'Mapa', '/cruces/mapa', 'fas fa-map-marked-alt', 2, true, 'cruces-mapa', NOW(), NOW());

-- Insertar submenús de Reportes (parent_id = 6)
INSERT INTO menus (id, parent_id, name, url, icono, orden, estado, codigo, created, modified) VALUES
(7, 6, 'Incidencias', '/reportes/incidencias', 'fas fa-ticket-alt', 1, true, 'reportes-incidencias', NOW(), NOW()),
(8, 6, 'Reporte Gráfico', '/reportes/grafico', 'fas fa-chart-bar', 2, true, 'reportes-grafico', NOW(), NOW()),
(9, 6, 'Mapa de Calor', '/reportes/mapa', 'fas fa-map-marked-alt', 3, true, 'reportes-mapa', NOW(), NOW());

-- Insertar submenús de Mantenimientos (parent_id = 10)
INSERT INTO menus (id, parent_id, name, url, icono, orden, estado, codigo, created, modified) VALUES
(11, 10, 'Tipos', '/mantenimientos/tipos', 'fas fa-folder-tree', 1, true, 'mantenimientos-tipos', NOW(), NOW()),
(12, 10, 'Áreas', '/mantenimientos/areas', 'fas fa-building', 2, true, 'mantenimientos-areas', NOW(), NOW()),
(13, 10, 'Equipos', '/mantenimientos/equipos', 'fas fa-users-cog', 3, true, 'mantenimientos-equipos', NOW(), NOW()),
(14, 10, 'Reportadores', '/mantenimientos/reportadores', 'fas fa-user-tie', 4, true, 'mantenimientos-reportadores', NOW(), NOW()),
(15, 10, 'Responsables', '/mantenimientos/responsables', 'fas fa-user-check', 5, true, 'mantenimientos-responsables', NOW(), NOW()),
(16, 10, 'Administradores', '/mantenimientos/administradores', 'fas fa-user-shield', 6, true, 'mantenimientos-administradores', NOW(), NOW()),
(17, 10, 'Ejes', '/mantenimientos/ejes', 'fas fa-road', 7, true, 'mantenimientos-ejes', NOW(), NOW()),
(18, 10, 'Proyectos', '/mantenimientos/proyectos', 'fas fa-project-diagram', 8, true, 'mantenimientos-proyectos', NOW(), NOW()),
(19, 10, 'Tipos de Incidencias', '/mantenimientos/incidencias', 'fas fa-exclamation-triangle', 9, true, 'mantenimientos-incidencias', NOW(), NOW());

-- Insertar submenús de Panel de Control (parent_id = 20)
INSERT INTO menus (id, parent_id, name, url, icono, orden, estado, codigo, created, modified) VALUES
(21, 20, 'Usuarios', '/admin/users', 'fas fa-users', 1, true, 'panel-usuarios', NOW(), NOW()),
(22, 20, 'Grupos y Permisos', '/admin/grupos', 'fas fa-shield-alt', 2, true, 'panel-grupos', NOW(), NOW()),
(23, 20, 'Menús', '/admin/menus', 'fas fa-bars', 3, true, 'panel-menus', NOW(), NOW()),
(24, 20, 'Catálogos', '/admin/catalogos', 'fas fa-list', 4, true, 'panel-catalogos', NOW(), NOW());

-- Resetear la secuencia al siguiente ID disponible
SELECT setval('menus_id_seq', (SELECT MAX(id) FROM menus));

-- Verificar inserción
SELECT 
  m.id,
  m.parent_id,
  CASE WHEN m.parent_id IS NULL THEN m.name ELSE '  └─ ' || m.name END as menu,
  m.url,
  m.icono,
  m.orden,
  m.estado,
  m.codigo
FROM menus m
ORDER BY 
  COALESCE(m.parent_id, m.id),
  m.orden,
  m.id;

-- Mensaje de éxito
DO $$
BEGIN
  RAISE NOTICE 'Menús insertados correctamente. Total: %', (SELECT COUNT(*) FROM menus);
END $$;
