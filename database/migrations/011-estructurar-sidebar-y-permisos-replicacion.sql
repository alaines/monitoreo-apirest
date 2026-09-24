-- ====================================================================
-- Migración 011: Estructuración del Sidebar y Permisos de Replicación
-- ====================================================================
-- 1. Desactiva menús obsoletos y elementos legacy huérfanos
-- 2. Consolida los 5 módulos oficiales del sidebar
-- 3. Configura trigger en grupos_menus para auto-asignar accion_id=1
-- 4. Asigna permisos completos al grupo ADMINISTRADOR (id: 4)
-- ====================================================================

BEGIN;

-- 1. Actualizar registros nulos existentes en grupos_menus
UPDATE grupos_menus SET accion_id = 1 WHERE accion_id IS NULL;

-- 2. Asegurar valor por defecto 1 en la columna accion_id
ALTER TABLE grupos_menus ALTER COLUMN accion_id SET DEFAULT 1;

-- 3. Crear función y trigger para auto-asignar accion_id = 1 si viene nulo desde la replicación
CREATE OR REPLACE FUNCTION trg_grupos_menus_default_accion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.accion_id IS NULL THEN
    NEW.accion_id := 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_default_accion ON grupos_menus;
CREATE TRIGGER trg_set_default_accion
BEFORE INSERT OR UPDATE ON grupos_menus
FOR EACH ROW
EXECUTE FUNCTION trg_grupos_menus_default_accion();

-- 4. Desactivar menús redundantes, obsoletos o duplicados legacy
UPDATE menus SET estado = false WHERE id IN (3, 6, 7, 8, 9, 10, 12, 13, 14, 16, 18, 20, 21, 22, 23, 24, 25, 26, 27, 30, 33, 36, 37, 39, 40, 42, 44, 95, 96, 97, 98, 99, 100, 101, 102);

-- 5. Configurar los 5 Menús Raíz principales con sus íconos y órdenes oficiales
UPDATE menus SET name = 'Incidencias', url = '#', icono = 'fa-solid fa-triangle-exclamation', parent_id = NULL, orden = 1, estado = true WHERE id = 2;
UPDATE menus SET name = 'Intersecciones', url = '#', icono = 'fa-solid fa-traffic-light', parent_id = NULL, orden = 2, estado = true WHERE id = 1;
UPDATE menus SET name = 'Reportes', url = '#', icono = 'fa-solid fa-chart-column', parent_id = NULL, orden = 3, estado = true WHERE id = 111;
UPDATE menus SET name = 'Mantenimientos', url = '#', icono = 'fa-solid fa-wrench', parent_id = NULL, orden = 4, estado = true WHERE id = 94;
UPDATE menus SET name = 'Panel de Control', url = '#', icono = 'fa-solid fa-gauge-high', parent_id = NULL, orden = 5, estado = true WHERE id = 11;

-- 6. Submenús bajo 'Incidencias' (id: 2)
UPDATE menus SET name = 'Gestión de Tickets', url = '/incidents', icono = 'fa-solid fa-clipboard-list', parent_id = 2, orden = 1, estado = true WHERE id = 4;
UPDATE menus SET name = 'Búsqueda y Consultas', url = '/incidents', icono = 'fa-solid fa-magnifying-glass', parent_id = 2, orden = 2, estado = true WHERE id = 5;

-- 7. Submenús bajo 'Intersecciones' (id: 1)
UPDATE menus SET name = 'Mapa de Red', url = '/cruces/mapa', icono = 'fa-solid fa-map-location-dot', parent_id = 1, orden = 1, estado = true WHERE id = 41;
UPDATE menus SET name = 'Gestión de Intersecciones', url = '/cruces', icono = 'fa-solid fa-traffic-light', parent_id = 1, orden = 2, estado = true WHERE id = 38;

-- 8. Submenús bajo 'Panel de Control' (id: 11)
UPDATE menus SET name = 'Usuarios', url = '/admin/users', icono = 'fa-solid fa-users', parent_id = 11, orden = 1, estado = true WHERE id = 92;
UPDATE menus SET name = 'Grupos y Permisos', url = '/admin/grupos', icono = 'fa-solid fa-user-tag', parent_id = 11, orden = 2, estado = true WHERE id = 15;
UPDATE menus SET name = 'Menús del Sistema', url = '/admin/menus', icono = 'fa-solid fa-bars', parent_id = 11, orden = 3, estado = true WHERE id = 17;
UPDATE menus SET name = 'Catálogos Generales', url = '/admin/catalogos', icono = 'fa-solid fa-tags', parent_id = 11, orden = 4, estado = true WHERE id = 93;

-- 9. Asignar permisos completos a grupos administradores para todos los menús activos
INSERT INTO grupos_menus (grupo_id, menu_id, accion_id)
SELECT g.id, m.id, a.id
FROM grupos g
CROSS JOIN menus m
CROSS JOIN acciones a
WHERE g.nombre IN ('ADMINISTRADOR', 'SUPER_ADMIN', 'ADMINISTRADOR1')
  AND m.estado = true 
  AND a.estado = true
ON CONFLICT DO NOTHING;

COMMIT;
