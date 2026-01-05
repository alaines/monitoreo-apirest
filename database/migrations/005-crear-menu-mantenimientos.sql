-- Crear menú principal de Mantenimientos
INSERT INTO menus (name, codigo, url, icono, modulo, orden, estado, created, modified)
VALUES ('Mantenimientos', 'mantenimientos', '#', 'fas fa-cogs', NULL, 4, true, NOW(), NOW())
ON CONFLICT (codigo) DO UPDATE SET modified = NOW();

-- Cambiar el menú catalogos de Administración a Mantenimientos
UPDATE menus 
SET modulo = 'Mantenimientos', orden = 1, name = 'Tipos'
WHERE codigo = 'catalogos';

-- Crear submenús de Mantenimientos
INSERT INTO menus (name, codigo, url, icono, modulo, orden, estado, created, modified) VALUES
('Áreas', 'areas', '/mantenimientos/areas', 'fas fa-building', 'Mantenimientos', 2, true, NOW(), NOW()),
('Equipos', 'equipos', '/mantenimientos/equipos', 'fas fa-users-cog', 'Mantenimientos', 3, true, NOW(), NOW()),
('Reportadores', 'reportadores', '/mantenimientos/reportadores', 'fas fa-user-tie', 'Mantenimientos', 4, true, NOW(), NOW()),
('Responsables', 'responsables', '/mantenimientos/responsables', 'fas fa-user-check', 'Mantenimientos', 5, true, NOW(), NOW()),
('Administradores', 'administradores', '/mantenimientos/administradores', 'fas fa-user-shield', 'Mantenimientos', 6, true, NOW(), NOW()),
('Ejes', 'ejes', '/mantenimientos/ejes', 'fas fa-road', 'Mantenimientos', 7, true, NOW(), NOW()),
('Proyectos', 'proyectos', '/mantenimientos/proyectos', 'fas fa-project-diagram', 'Mantenimientos', 8, true, NOW(), NOW()),
('Tipos de Incidencias', 'incidencias', '/mantenimientos/incidencias', 'fas fa-exclamation-triangle', 'Mantenimientos', 9, true, NOW(), NOW())
ON CONFLICT (codigo) DO UPDATE SET modified = NOW();

-- Asignar todos los permisos de los nuevos menús al grupo SUPER_ADMIN
INSERT INTO grupos_menus (grupo_id, menu_id, accion_id)
SELECT 
    (SELECT id FROM grupos WHERE nombre = 'SUPER_ADMIN' LIMIT 1),
    m.id,
    a.id
FROM menus m
CROSS JOIN acciones a
WHERE m.codigo IN ('areas', 'equipos', 'reportadores', 'responsables', 'administradores', 'ejes', 'proyectos', 'incidencias')
  AND a.estado = true
  AND NOT EXISTS (
    SELECT 1 FROM grupos_menus gm 
    WHERE gm.grupo_id = (SELECT id FROM grupos WHERE nombre = 'SUPER_ADMIN' LIMIT 1)
      AND gm.menu_id = m.id 
      AND gm.accion_id = a.id
  );
