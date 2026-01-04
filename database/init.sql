-- ============================================
-- Script de Inicialización - Sistema de Monitoreo
-- ============================================
-- Este script crea la estructura base y un usuario administrador inicial
-- El sistema funcionará correctamente con solo estos datos

-- ============================================
-- 1. USUARIO ADMINISTRADOR INICIAL
-- ============================================
-- Credenciales:
-- Usuario: admin
-- Password: Admin123
-- ============================================

INSERT INTO usuarios (usuario, password, nombres, apellido_paterno, apellido_materno, estado, rol)
VALUES (
  'admin',
  '$2b$10$rQ7HqW.5X8J8wH5yG3b5FOYvXNKp3fBJ7L2xL.LJ0Bx5H5qW8xZ0S', -- Admin123
  'Administrador',
  'Sistema',
  'Monitoreo',
  true,
  'ADMINISTRADOR'
)
ON CONFLICT (usuario) DO NOTHING;

-- ============================================
-- 2. ESTADOS DE TICKETS (REQUERIDO)
-- ============================================
INSERT INTO estados (id, nombre, descripcion, estado) VALUES
  (1, 'PENDIENTE', 'Ticket pendiente de atención', true),
  (2, 'EN_PROCESO', 'Ticket en proceso de resolución', true),
  (3, 'RESUELTO', 'Ticket resuelto', true),
  (4, 'CERRADO', 'Ticket cerrado', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. PRIORIDADES (REQUERIDO)
-- ============================================
INSERT INTO prioridades (id, nombre, descripcion, nivel, estado) VALUES
  (1, 'BAJA', 'Prioridad baja', 1, true),
  (2, 'MEDIA', 'Prioridad media', 2, true),
  (3, 'ALTA', 'Prioridad alta', 3, true),
  (4, 'CRÍTICA', 'Prioridad crítica', 4, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. TIPOS DE INCIDENCIAS BASE
-- ============================================
-- Estructura jerárquica básica de tipos
INSERT INTO tipos (id, parent_id, name, estado, lft, rght) VALUES
  (1, NULL, 'CRUCE', true, 1, 8),
  (16, 1, 'CRUZ', true, 2, 3),
  (17, 1, 'T', true, 4, 5),
  (18, 1, 'ROTONDA', true, 6, 7),
  
  (3, NULL, 'PERIFERICO', true, 21, 42),
  (34, 3, 'SWITCH DE ACCESO', true, 22, 23),
  (35, 3, 'CONTROLADOR', true, 24, 25),
  (36, 3, 'CAMARA PTZ', true, 26, 27),
  (37, 3, 'TRAFICAM', true, 28, 29),
  (38, 3, 'CAMARA FISCALIZACION', true, 30, 31),
  (39, 3, 'SENSOR BLUETOOTH', true, 32, 33),
  (40, 3, 'PANEL DE MENSAJERIA', true, 34, 35),
  (41, 3, 'REPETIDOR ACUSTICO', true, 36, 37),
  (42, 3, 'ANTENA DE RADIOENLACE', true, 38, 39),
  (43, 3, 'SWITCH DE CABECERA', true, 40, 41),
  
  (4, NULL, 'GESTION', true, 9, 20),
  (6, 4, 'CENTRALIZADO', true, 10, 11),
  (7, 4, 'NO CENTRALIZADO', true, 12, 13),
  (8, 4, 'PROYECTADO', true, 14, 15),
  (27, 4, 'CENTRALIZADO - SUBREGULADO', true, 16, 17),
  (28, 4, 'NO CENTRALIZADO - SUBREGULADO', true, 18, 19),
  
  (9, NULL, 'COMUNICACION', true, 43, 50),
  (10, 9, 'FIBRA OPTICA', true, 44, 45),
  (12, 9, 'RED MOVIL', true, 46, 47),
  (11, 9, 'RADIOFRECUENCIA', true, 48, 49),
  
  (19, NULL, 'ESTRUCTURA', true, 51, 58),
  (20, 19, 'TUBULAR', true, 52, 53),
  (21, 19, 'CUADRADA', true, 54, 55),
  (22, 19, 'ORNAMENTAL', true, 56, 57),
  
  (23, NULL, 'OPERACION', true, 59, 68),
  (24, 23, 'ACTUADO TOTAL', true, 60, 61),
  (25, 23, 'SEMIACTUADO', true, 62, 63),
  (26, 23, 'MICROREGULADO', true, 64, 65),
  (29, 23, 'TIEMPOS FIJOS', true, 66, 67),
  
  (30, NULL, 'CONTROL', true, 69, 76),
  (31, 30, 'LOCAL', true, 70, 71),
  (32, 30, 'ORDENADOR', true, 72, 73),
  (33, 30, 'ADAPTATIVO', true, 74, 75),
  
  (44, NULL, 'PLATAFORMA', true, 77, 88),
  (45, 44, 'ADIMOT', true, 78, 79),
  (46, 44, 'FLEXCENCO', true, 80, 81),
  (47, 44, 'ECOTRAFIX', true, 82, 83),
  (48, 44, 'NO CENTRALIZADA', true, 84, 85),
  (49, 44, 'ATU', true, 86, 87)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 5. INCIDENCIAS BASE
-- ============================================
-- Tipos comunes de incidencias
INSERT INTO incidencias (id, tipo, descripcion, estado) VALUES
  (1, 'Semáforo apagado', 'El semáforo no enciende', true),
  (2, 'Semáforo intermitente', 'El semáforo parpadea constantemente', true),
  (3, 'Foco quemado', 'Una o más luces del semáforo no funcionan', true),
  (4, 'Cable cortado', 'Cable de alimentación o comunicación cortado', true),
  (5, 'Controlador dañado', 'El controlador del semáforo no responde', true),
  (6, 'Poste inclinado', 'El poste del semáforo está inclinado', true),
  (7, 'Señalización deteriorada', 'Señales viales dañadas o ilegibles', true),
  (8, 'Cámara no funciona', 'La cámara de seguridad no captura imágenes', true),
  (9, 'Problema de comunicación', 'Pérdida de conexión con el centro de control', true),
  (10, 'Otros', 'Otros tipos de incidencias', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 6. ADMINISTRADORES EJEMPLO (OPCIONAL)
-- ============================================
-- Puedes eliminar estos registros si no son necesarios
INSERT INTO administradores (id, nombre, telefono, email, direccion, estado) VALUES
  (1, 'Municipalidad Provincial de Lima', '01-3151600', 'contacto@munlima.gob.pe', 'Jr. Conde de Superunda 141, Lima', true),
  (2, 'Ministerio de Transportes', '01-6157800', 'webmaster@mtc.gob.pe', 'Jr. Zorritos 1203, Lima', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 7. EQUIPOS DE TRABAJO (OPCIONAL)
-- ============================================
INSERT INTO equipos (id, nombre, descripcion, estado) VALUES
  (1, 'Equipo de Mantenimiento', 'Encargado del mantenimiento preventivo y correctivo', true),
  (2, 'Equipo de Emergencias', 'Respuesta rápida a incidencias críticas', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 8. RESETEAR SECUENCIAS
-- ============================================
-- Ajustar secuencias para evitar conflictos con IDs
SELECT setval('usuarios_id_seq', (SELECT COALESCE(MAX(id), 1) FROM usuarios), true);
SELECT setval('estados_id_seq', (SELECT COALESCE(MAX(id), 4) FROM estados), true);
SELECT setval('prioridades_id_seq', (SELECT COALESCE(MAX(id), 4) FROM prioridades), true);
SELECT setval('tipos_id_seq', (SELECT COALESCE(MAX(id), 50) FROM tipos), true);
SELECT setval('incidencias_id_seq', (SELECT COALESCE(MAX(id), 10) FROM incidencias), true);
SELECT setval('administradores_id_seq', (SELECT COALESCE(MAX(id), 2) FROM administradores), true);
SELECT setval('equipos_id_seq', (SELECT COALESCE(MAX(id), 2) FROM equipos), true);

-- ============================================
-- VERIFICACIÓN
-- ============================================
SELECT 'Inicialización completada!' as mensaje;
SELECT COUNT(*) as total_usuarios FROM usuarios;
SELECT COUNT(*) as total_estados FROM estados;
SELECT COUNT(*) as total_prioridades FROM prioridades;
SELECT COUNT(*) as total_tipos FROM tipos;
SELECT COUNT(*) as total_incidencias FROM incidencias;

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. Usuario administrador inicial:
--    Usuario: admin
--    Password: Admin123
--    ¡CAMBIAR LA CONTRASEÑA DESPUÉS DEL PRIMER LOGIN!
--
-- 2. Este script es idempotente (puede ejecutarse múltiples veces)
--    gracias al uso de ON CONFLICT DO NOTHING
--
-- 3. El sistema funcionará correctamente con solo estos datos
--    Los cruces, tickets y otros datos pueden agregarse después
--
-- 4. Para crear más usuarios, usa la interfaz web después de
--    iniciar sesión con el usuario administrador
-- ============================================
