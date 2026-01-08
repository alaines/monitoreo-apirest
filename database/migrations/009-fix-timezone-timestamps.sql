-- Migración: Estandarización de Zonas Horarias
-- Fecha: 2026-01-08
-- Descripción: Convertir todas las columnas timestamp a timestamptz (timestamp with time zone)
-- para garantizar el manejo correcto de zonas horarias

-- ============================================================================
-- TABLA: user_sessions
-- ============================================================================

-- Convertir columnas de timestamp sin zona horaria a timestamp con zona horaria (UTC)
ALTER TABLE user_sessions 
  ALTER COLUMN connected_at TYPE timestamptz USING connected_at AT TIME ZONE 'UTC',
  ALTER COLUMN last_activity TYPE timestamptz USING last_activity AT TIME ZONE 'UTC',
  ALTER COLUMN disconnected_at TYPE timestamptz USING disconnected_at AT TIME ZONE 'UTC';

-- Actualizar el default para nuevos registros
ALTER TABLE user_sessions 
  ALTER COLUMN connected_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN last_activity SET DEFAULT CURRENT_TIMESTAMP;

-- ============================================================================
-- TABLA: notifications
-- ============================================================================

ALTER TABLE notifications 
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN read_at TYPE timestamptz USING read_at AT TIME ZONE 'UTC';

ALTER TABLE notifications 
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- ============================================================================
-- TABLA: auditoria
-- ============================================================================

ALTER TABLE auditoria 
  ALTER COLUMN created TYPE timestamptz USING created AT TIME ZONE 'UTC';

ALTER TABLE auditoria 
  ALTER COLUMN created SET DEFAULT CURRENT_TIMESTAMP;

-- ============================================================================
-- NOTAS:
-- ============================================================================
-- 1. timestamptz siempre almacena en UTC internamente
-- 2. Acepta fechas en cualquier zona horaria y las convierte a UTC
-- 3. Al consultar, devuelve en la zona horaria de la sesión (configurable)
-- 4. CURRENT_TIMESTAMP automáticamente usa la hora UTC del servidor
-- 
-- Configuración recomendada para la conexión:
--   SET timezone = 'UTC';  -- Para el servidor/backend
--   SET timezone = 'America/Lima';  -- Para usuarios en Perú (si se desea)
-- ============================================================================

-- Verificación de los cambios
SELECT 
  table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name IN ('user_sessions', 'notifications', 'auditoria')
  AND (column_name LIKE '%_at' OR column_name = 'created')
ORDER BY table_name, ordinal_position;
