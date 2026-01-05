-- ============================================
-- MIGRACIÓN SPRINT 7: Sistema de Permisos
-- ============================================
-- Fecha: 4 de enero de 2026
-- Descripción: Migración de sistema simple a permisos granulares
-- Opción B: Tabla de acciones separada
-- ============================================

BEGIN;

-- ============================================
-- 1. CREAR TABLA DE ACCIONES
-- ============================================

CREATE TABLE IF NOT EXISTS acciones (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  codigo VARCHAR(20) UNIQUE NOT NULL,
  descripcion VARCHAR(200),
  orden INTEGER DEFAULT 0,
  estado BOOLEAN DEFAULT true,
  created TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  modified TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_acciones_codigo ON acciones(codigo);

COMMENT ON TABLE acciones IS 'Catálogo de acciones disponibles en el sistema';
COMMENT ON COLUMN acciones.codigo IS 'Código único de la acción (ej: view, create, edit, delete)';

-- ============================================
-- 2. INSERTAR ACCIONES PREDEFINIDAS
-- ============================================

INSERT INTO acciones (nombre, codigo, descripcion, orden) VALUES
  ('Ver', 'view', 'Permite visualizar información', 1),
  ('Crear', 'create', 'Permite crear nuevos registros', 2),
  ('Editar', 'edit', 'Permite modificar registros existentes', 3),
  ('Eliminar', 'delete', 'Permite eliminar registros', 4),
  ('Exportar', 'export', 'Permite exportar datos', 5),
  ('Imprimir', 'print', 'Permite imprimir reportes', 6),
  ('Aprobar', 'approve', 'Permite aprobar/rechazar solicitudes', 7),
  ('Asignar', 'assign', 'Permite asignar recursos o tareas', 8);

-- ============================================
-- 3. EXTENDER TABLA MENUS
-- ============================================

-- Agregar nuevas columnas a menus
ALTER TABLE menus
  ADD COLUMN IF NOT EXISTS codigo VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS modulo VARCHAR(50),
  ADD COLUMN IF NOT EXISTS orden INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_menus_codigo ON menus(codigo);

COMMENT ON COLUMN menus.codigo IS 'Código único del menú para referencias programáticas';
COMMENT ON COLUMN menus.modulo IS 'Módulo al que pertenece (administracion, operaciones, etc)';

-- Actualizar códigos de menús existentes por ID (más preciso)
UPDATE menus SET codigo = 'intersecciones',     modulo = 'operaciones', orden = 1 WHERE id = 1 AND codigo IS NULL;
UPDATE menus SET codigo = 'incidencias',        modulo = 'operaciones', orden = 2 WHERE id = 2 AND codigo IS NULL;
UPDATE menus SET codigo = 'tickets',            modulo = 'operaciones', orden = 2 WHERE id = 4 AND codigo IS NULL;
UPDATE menus SET codigo = 'reportes',           modulo = 'reportes', orden = 3 WHERE id = 6 AND codigo IS NULL;
UPDATE menus SET codigo = 'reportes-generar',   modulo = 'reportes', orden = 4 WHERE id = 8 AND codigo IS NULL;
UPDATE menus SET codigo = 'mantenimientos',     modulo = 'administracion', orden = 5 WHERE id = 9 AND codigo IS NULL;
UPDATE menus SET codigo = 'panel-control',      modulo = 'administracion', orden = 6 WHERE id = 11 AND codigo IS NULL;
UPDATE menus SET codigo = 'usuarios',           modulo = 'administracion', orden = 7 WHERE id = 12 AND codigo IS NULL;
UPDATE menus SET codigo = 'grupos',             modulo = 'administracion', orden = 8 WHERE id = 14 AND codigo IS NULL;
UPDATE menus SET codigo = 'menu',               modulo = 'administracion', orden = 9 WHERE id = 16 AND codigo IS NULL;
UPDATE menus SET codigo = 'areas',              modulo = 'catalogos', orden = 10 WHERE id = 18 AND codigo IS NULL;
UPDATE menus SET codigo = 'equipos',            modulo = 'catalogos', orden = 11 WHERE id = 20 AND codigo IS NULL;
UPDATE menus SET codigo = 'proyectos',          modulo = 'catalogos', orden = 12 WHERE id = 23 AND codigo IS NULL;
UPDATE menus SET codigo = 'reportadores',       modulo = 'catalogos', orden = 13 WHERE id = 24 AND codigo IS NULL;
UPDATE menus SET codigo = 'responsables',       modulo = 'catalogos', orden = 14 WHERE id = 25 AND codigo IS NULL;
UPDATE menus SET codigo = 'conteos',            modulo = 'reportes', orden = 15 WHERE id = 26 AND codigo IS NULL;
UPDATE menus SET codigo = 'tipos',              modulo = 'catalogos', orden = 16 WHERE id = 36 AND codigo IS NULL;
UPDATE menus SET codigo = 'administradores',    modulo = 'catalogos', orden = 17 WHERE id = 39 AND codigo IS NULL;
UPDATE menus SET codigo = 'ejes-vias',          modulo = 'catalogos', orden = 18 WHERE id = 42 AND codigo IS NULL;

-- ============================================
-- 4. MIGRAR TABLA GRUPOS_MENUS
-- ============================================

-- Renombrar tabla actual a backup temporal (solo si no existe el backup)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'grupos_menus' AND table_schema = 'public')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'grupos_menus_backup' AND table_schema = 'public') THEN
    ALTER TABLE grupos_menus RENAME TO grupos_menus_backup;
  END IF;
END $$;

-- Crear nueva tabla grupos_menus con accion_id
CREATE TABLE grupos_menus (
  id SERIAL PRIMARY KEY,
  grupo_id INTEGER NOT NULL,
  menu_id INTEGER NOT NULL,
  accion_id INTEGER NOT NULL,
  CONSTRAINT fk_grupos_menus_grupos FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE,
  CONSTRAINT fk_grupos_menus_menus FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
  CONSTRAINT fk_grupos_menus_acciones FOREIGN KEY (accion_id) REFERENCES acciones(id) ON DELETE CASCADE,
  CONSTRAINT uk_grupo_menu_accion UNIQUE (grupo_id, menu_id, accion_id)
);

CREATE INDEX idx_grupos_menus_grupo_id ON grupos_menus(grupo_id);
CREATE INDEX idx_grupos_menus_menu_id ON grupos_menus(menu_id);
CREATE INDEX idx_grupos_menus_accion_id ON grupos_menus(accion_id);

COMMENT ON TABLE grupos_menus IS 'Permisos granulares: qué acciones puede hacer cada grupo en cada menú';

-- ============================================
-- 5. MIGRAR DATOS EXISTENTES
-- ============================================
-- Los registros antiguos se migran dando acceso completo (view, create, edit, delete)

INSERT INTO grupos_menus (grupo_id, menu_id, accion_id)
SELECT 
  gmb.grupo_id,
  gmb.menu_id,
  a.id
FROM grupos_menus_backup gmb
CROSS JOIN acciones a
WHERE a.codigo IN ('view', 'create', 'edit', 'delete')
  AND NOT EXISTS (
    SELECT 1 FROM grupos_menus gm
    WHERE gm.grupo_id = gmb.grupo_id 
      AND gm.menu_id = gmb.menu_id 
      AND gm.accion_id = a.id
  );

COMMENT ON TABLE grupos_menus_backup IS 'Backup de grupos_menus antes de migración - eliminar después de validar';

-- ============================================
-- 6. CREAR TABLA DE AUDITORIA
-- ============================================

CREATE TABLE IF NOT EXISTS auditoria (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL,
  tabla VARCHAR(50) NOT NULL,
  registro_id INTEGER NOT NULL,
  accion VARCHAR(20) NOT NULL,
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  ip VARCHAR(45),
  user_agent TEXT,
  created TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_auditoria_users FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_auditoria_usuario_id ON auditoria(usuario_id);
CREATE INDEX idx_auditoria_tabla_registro ON auditoria(tabla, registro_id);
CREATE INDEX idx_auditoria_accion ON auditoria(accion);
CREATE INDEX idx_auditoria_created ON auditoria(created);

COMMENT ON TABLE auditoria IS 'Registro de cambios realizados en el sistema';
COMMENT ON COLUMN auditoria.accion IS 'CREATE, UPDATE, DELETE';
COMMENT ON COLUMN auditoria.datos_anteriores IS 'Estado del registro antes del cambio (UPDATE/DELETE)';
COMMENT ON COLUMN auditoria.datos_nuevos IS 'Estado del registro después del cambio (CREATE/UPDATE)';

-- ============================================
-- 7. CREAR TABLA DE CONFIGURACION
-- ============================================

CREATE TABLE IF NOT EXISTS configuracion (
  id SERIAL PRIMARY KEY,
  clave VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT,
  descripcion TEXT,
  tipo VARCHAR(20) DEFAULT 'string',
  editable BOOLEAN DEFAULT true,
  created TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  modified TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_configuracion_clave ON configuracion(clave);

COMMENT ON TABLE configuracion IS 'Parámetros de configuración del sistema';
COMMENT ON COLUMN configuracion.tipo IS 'string, number, boolean, json';

-- Insertar configuraciones iniciales
INSERT INTO configuracion (clave, valor, descripcion, tipo, editable) VALUES
  ('sistema.nombre', 'Sistema de Monitoreo de Tráfico', 'Nombre del sistema', 'string', true),
  ('sistema.version', '2.0.0', 'Versión actual del sistema', 'string', false),
  ('tickets.autoasignar', 'false', 'Auto-asignar tickets nuevos', 'boolean', true),
  ('tickets.prioridad_default', '2', 'ID de prioridad por defecto', 'number', true),
  ('reportes.max_registros', '10000', 'Máximo de registros en reportes', 'number', true),
  ('auditoria.retener_dias', '90', 'Días de retención de auditoría', 'number', true),
  ('email.smtp_host', '', 'Servidor SMTP', 'string', true),
  ('email.smtp_port', '587', 'Puerto SMTP', 'number', true),
  ('email.from', 'noreply@movingenia.com', 'Email remitente', 'string', true);

-- ============================================
-- 8. CREAR GRUPOS PREDEFINIDOS (si no existen)
-- ============================================

INSERT INTO grupos (nombre, descripcion, estado, edicion) VALUES
  ('SUPER_ADMIN', 'Super Administrador del Sistema', true, false),
  ('ADMINISTRADOR', 'Administrador General', true, false),
  ('SUPERVISOR', 'Supervisor de Operaciones', true, true),
  ('OPERADOR', 'Operador de Campo', true, true),
  ('TECNICO', 'Técnico Especialista', true, true),
  ('CONSULTA', 'Solo Consulta', true, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- 9. ASIGNAR PERMISOS A GRUPOS PREDEFINIDOS
-- ============================================

-- SUPER_ADMIN: acceso total a todo
DO $$
DECLARE
  grupo_id_admin INTEGER;
  menu_record RECORD;
  accion_record RECORD;
BEGIN
  SELECT id INTO grupo_id_admin FROM grupos WHERE nombre = 'SUPER_ADMIN' LIMIT 1;
  
  IF grupo_id_admin IS NOT NULL THEN
    FOR menu_record IN SELECT id FROM menus WHERE estado = true LOOP
      FOR accion_record IN SELECT id FROM acciones WHERE estado = true LOOP
        INSERT INTO grupos_menus (grupo_id, menu_id, accion_id)
        VALUES (grupo_id_admin, menu_record.id, accion_record.id)
        ON CONFLICT (grupo_id, menu_id, accion_id) DO NOTHING;
      END LOOP;
    END LOOP;
  END IF;
END $$;

-- ADMINISTRADOR: acceso completo excepto configuración crítica
DO $$
DECLARE
  grupo_id_admin INTEGER;
  menu_record RECORD;
  accion_record RECORD;
BEGIN
  SELECT id INTO grupo_id_admin FROM grupos WHERE nombre = 'ADMINISTRADOR' LIMIT 1;
  
  IF grupo_id_admin IS NOT NULL THEN
    FOR menu_record IN SELECT id FROM menus WHERE estado = true AND codigo != 'configuracion' LOOP
      FOR accion_record IN SELECT id FROM acciones WHERE codigo IN ('view', 'create', 'edit', 'delete', 'export') LOOP
        INSERT INTO grupos_menus (grupo_id, menu_id, accion_id)
        VALUES (grupo_id_admin, menu_record.id, accion_record.id)
        ON CONFLICT (grupo_id, menu_id, accion_id) DO NOTHING;
      END LOOP;
    END LOOP;
  END IF;
END $$;

-- CONSULTA: solo ver
DO $$
DECLARE
  grupo_id_consulta INTEGER;
  menu_record RECORD;
  accion_view_id INTEGER;
BEGIN
  SELECT id INTO grupo_id_consulta FROM grupos WHERE nombre = 'CONSULTA' LIMIT 1;
  SELECT id INTO accion_view_id FROM acciones WHERE codigo = 'view' LIMIT 1;
  
  IF grupo_id_consulta IS NOT NULL AND accion_view_id IS NOT NULL THEN
    FOR menu_record IN SELECT id FROM menus WHERE estado = true LOOP
      INSERT INTO grupos_menus (grupo_id, menu_id, accion_id)
      VALUES (grupo_id_consulta, menu_record.id, accion_view_id)
      ON CONFLICT (grupo_id, menu_id, accion_id) DO NOTHING;
    END LOOP;
  END IF;
END $$;

-- ============================================
-- 10. VALIDACIÓN DE MIGRACIÓN
-- ============================================

DO $$
DECLARE
  total_grupos INTEGER;
  total_menus INTEGER;
  total_acciones INTEGER;
  total_permisos_antiguos INTEGER;
  total_permisos_nuevos INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_grupos FROM grupos WHERE estado = true;
  SELECT COUNT(*) INTO total_menus FROM menus WHERE estado = true;
  SELECT COUNT(*) INTO total_acciones FROM acciones WHERE estado = true;
  SELECT COUNT(*) INTO total_permisos_antiguos FROM grupos_menus_backup;
  SELECT COUNT(*) INTO total_permisos_nuevos FROM grupos_menus;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VALIDACIÓN DE MIGRACIÓN';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Grupos activos: %', total_grupos;
  RAISE NOTICE 'Menús activos: %', total_menus;
  RAISE NOTICE 'Acciones disponibles: %', total_acciones;
  RAISE NOTICE 'Permisos antiguos: %', total_permisos_antiguos;
  RAISE NOTICE 'Permisos nuevos (granulares): %', total_permisos_nuevos;
  RAISE NOTICE '========================================';
  
  -- Validar que se crearon los permisos correctamente
  IF total_permisos_nuevos < total_permisos_antiguos THEN
    RAISE WARNING 'ADVERTENCIA: Los permisos nuevos son menos que los antiguos. Revisar migración.';
  END IF;
END $$;

COMMIT;

-- ============================================
-- ROLLBACK (en caso de error)
-- ============================================
-- Para revertir esta migración, ejecutar:
/*
BEGIN;
DROP TABLE IF EXISTS grupos_menus;
ALTER TABLE grupos_menus_backup RENAME TO grupos_menus;
DROP TABLE IF EXISTS acciones CASCADE;
DROP TABLE IF EXISTS auditoria CASCADE;
DROP TABLE IF EXISTS configuracion CASCADE;
ALTER TABLE menus DROP COLUMN IF EXISTS codigo;
ALTER TABLE menus DROP COLUMN IF EXISTS modulo;
ALTER TABLE menus DROP COLUMN IF EXISTS orden;
COMMIT;
*/

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Esta migración mantiene la tabla grupos_menus_backup por seguridad
-- 2. Los usuarios mantendrán sus grupos (grupo_id en tabla users)
-- 3. Se crearon 6 grupos predefinidos con permisos base
-- 4. Después de validar, eliminar grupos_menus_backup:
--    DROP TABLE grupos_menus_backup;
-- 5. Regenerar Prisma Client después de aplicar:
--    npx prisma generate
