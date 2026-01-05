-- Hacer nullable el campo registro_id en la tabla auditoria
-- Algunos eventos de auditoría pueden no tener un registro específico asociado

ALTER TABLE auditoria ALTER COLUMN registro_id DROP NOT NULL;

COMMENT ON COLUMN auditoria.registro_id IS 'ID del registro afectado (nullable para operaciones sin registro específico)';
