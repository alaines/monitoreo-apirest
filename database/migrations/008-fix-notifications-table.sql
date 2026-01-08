-- Migración de corrección: Recrear tabla notifications con estructura correcta
-- Fecha: 8 de Enero de 2026
-- Razón: La tabla se creó como "Notification" pero Prisma espera "notifications"

-- Eliminar tabla incorrecta
DROP TABLE IF EXISTS "Notification" CASCADE;

-- Crear tabla con nombre y estructura correctos según Prisma schema
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP(6),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Crear índices según Prisma schema
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Verificar creación
SELECT 'Tabla notifications creada correctamente' AS resultado;
