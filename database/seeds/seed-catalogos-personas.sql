-- Insertar tipos de documento
INSERT INTO tipo_doc (nombre, estado, created, modified) VALUES
('DNI', true, NOW(), NOW()),
('RUC', true, NOW(), NOW()),
('Carnet de Extranjería', true, NOW(), NOW()),
('Pasaporte', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insertar estados civiles
INSERT INTO estado_civils (nombre, estado, created, modified) VALUES
('Soltero(a)', true, NOW(), NOW()),
('Casado(a)', true, NOW(), NOW()),
('Divorciado(a)', true, NOW(), NOW()),
('Viudo(a)', true, NOW(), NOW()),
('Conviviente', true, NOW(), NOW())
ON CONFLICT DO NOTHING;
