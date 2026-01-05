-- Migración 006: Sistema de Mantenimientos
-- Fecha: 2026-01-05
-- Descripción: Crear tablas de mantenimientos y menús necesarios

-- ================================================
-- PASO 1: Agregar columnas faltantes a tabla menus
-- ================================================
ALTER TABLE menus ADD COLUMN IF NOT EXISTS codigo VARCHAR(50);
ALTER TABLE menus ADD COLUMN IF NOT EXISTS modulo VARCHAR(100);
ALTER TABLE menus ADD COLUMN IF NOT EXISTS orden INTEGER DEFAULT 0;

-- Crear índice para codigo si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_menus_codigo') THEN
        CREATE UNIQUE INDEX idx_menus_codigo ON menus(codigo) WHERE codigo IS NOT NULL;
    END IF;
END $$;

-- ================================================
-- PASO 2: Agregar accion_id a grupos_menus si no existe
-- ================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'grupos_menus' AND column_name = 'accion_id'
    ) THEN
        -- Agregar columna accion_id
        ALTER TABLE grupos_menus ADD COLUMN accion_id INTEGER;
        
        -- Por defecto asignar accion 'view' (id=1) a todos los permisos existentes
        UPDATE grupos_menus SET accion_id = 1 WHERE accion_id IS NULL;
        
        -- Hacer la columna NOT NULL después de llenarla
        ALTER TABLE grupos_menus ALTER COLUMN accion_id SET NOT NULL;
        
        -- Agregar foreign key
        ALTER TABLE grupos_menus 
        ADD CONSTRAINT fk_grupos_menus_acciones 
        FOREIGN KEY (accion_id) REFERENCES acciones(id) ON DELETE CASCADE;
        
        -- Agregar índice
        CREATE INDEX idx_grupos_menus_accion_id ON grupos_menus(accion_id);
        
        -- Agregar constraint único
        ALTER TABLE grupos_menus 
        ADD CONSTRAINT uk_grupo_menu_accion 
        UNIQUE (grupo_id, menu_id, accion_id);
    END IF;
END $$;

-- ================================================
-- PASO 3: Crear tabla areas
-- ================================================
CREATE TABLE IF NOT EXISTS areas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    estado BOOLEAN DEFAULT TRUE,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- PASO 4: Crear tabla equipos
-- ================================================
CREATE TABLE IF NOT EXISTS equipos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(25) NOT NULL,
    estado BOOLEAN DEFAULT TRUE,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- PASO 5: Crear tabla reportadores
-- ================================================
CREATE TABLE IF NOT EXISTS reportadores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    estado BOOLEAN DEFAULT TRUE,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- PASO 6: Crear tabla responsables
-- ================================================
CREATE TABLE IF NOT EXISTS responsables (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    equipo_id INTEGER REFERENCES equipos(id),
    estado BOOLEAN DEFAULT TRUE,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- PASO 7: Crear tabla administradores
-- ================================================
CREATE TABLE IF NOT EXISTS administradores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    responsable VARCHAR(255),
    telefono VARCHAR(20),
    email VARCHAR(100),
    estado BOOLEAN DEFAULT TRUE,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- PASO 8: Crear tabla ejes
-- ================================================
CREATE TABLE IF NOT EXISTS ejes (
    id SERIAL PRIMARY KEY,
    nombre_via VARCHAR(255) NOT NULL,
    tipo_via VARCHAR(100),
    nro_carriles INTEGER,
    ciclovia BOOLEAN DEFAULT FALSE,
    observaciones TEXT,
    estado BOOLEAN DEFAULT TRUE,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- PASO 9: Crear tabla proyectos
-- ================================================
CREATE TABLE IF NOT EXISTS proyectos (
    id SERIAL PRIMARY KEY,
    siglas VARCHAR(6) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    etapa VARCHAR(100),
    ejecutado_x_empresa VARCHAR(255),
    ano_proyecto INTEGER,
    red VARCHAR(100),
    estado BOOLEAN DEFAULT TRUE,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- PASO 10: Crear tabla prioridades
-- ================================================
CREATE TABLE IF NOT EXISTS prioridades (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    nivel INTEGER NOT NULL,
    estado BOOLEAN DEFAULT TRUE,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar prioridades por defecto
INSERT INTO prioridades (nombre, nivel) 
SELECT nombre, nivel FROM (VALUES
    ('Baja', 1),
    ('Media', 2),
    ('Alta', 3),
    ('Urgente', 4)
) AS v(nombre, nivel)
WHERE NOT EXISTS (SELECT 1 FROM prioridades WHERE nombre = v.nombre);

-- ================================================
-- PASO 11: Crear tabla incidencias
-- ================================================
CREATE TABLE IF NOT EXISTS incidencias (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(100) NOT NULL,
    parent_id INTEGER REFERENCES incidencias(id),
    prioridad_id INTEGER REFERENCES prioridades(id),
    caracteristica VARCHAR(2),
    estado BOOLEAN DEFAULT TRUE,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- PASO 12: Crear menús de Mantenimientos
-- ================================================

-- Eliminar menús duplicados si existen
DELETE FROM grupos_menus WHERE menu_id IN (
    SELECT id FROM menus WHERE name = 'Mantenimientos' AND url IS NULL
);
DELETE FROM menus WHERE name = 'Mantenimientos' AND url IS NULL;

-- Crear menú principal Mantenimientos
INSERT INTO menus (codigo, name, modulo, parent_id, url, icono, orden, estado, created, modified)
SELECT 'mantenimientos', 'Mantenimientos', 'Administración', NULL, '#', 'fas fa-tools', 5, TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE codigo = 'mantenimientos');

-- Obtener el ID del menú Mantenimientos y crear submenús
DO $$ 
DECLARE
    v_parent_id INTEGER;
    v_menu_id INTEGER;
    v_accion_id INTEGER;
BEGIN
    SELECT id INTO v_parent_id FROM menus WHERE codigo = 'mantenimientos';
    
    -- Insertar submenús
    INSERT INTO menus (codigo, name, modulo, parent_id, url, icono, orden, estado, created, modified)
    SELECT 
        v.codigo, 
        v.name, 
        'Administración', 
        v_parent_id,
        v.url,
        v.icono,
        v.orden,
        TRUE,
        NOW(),
        NOW()
    FROM (VALUES
        ('catalogos', 'Catálogos', '/mantenimientos/catalogos', 'fas fa-list', 1),
        ('areas_mant', 'Áreas', '/mantenimientos/areas', 'fas fa-map-marked', 2),
        ('equipos_mant', 'Equipos', '/mantenimientos/equipos', 'fas fa-users-cog', 3),
        ('reportadores_mant', 'Reportadores', '/mantenimientos/reportadores', 'fas fa-user-tag', 4),
        ('responsables_mant', 'Responsables', '/mantenimientos/responsables', 'fas fa-user-tie', 5),
        ('administradores_mant', 'Administradores', '/mantenimientos/administradores', 'fas fa-user-shield', 6),
        ('ejes_mant', 'Ejes', '/mantenimientos/ejes', 'fas fa-road', 7),
        ('proyectos_mant', 'Proyectos', '/mantenimientos/proyectos', 'fas fa-project-diagram', 8),
        ('incidencias_mant', 'Incidencias', '/mantenimientos/incidencias', 'fas fa-exclamation-triangle', 9)
    ) AS v(codigo, name, url, icono, orden)
    WHERE NOT EXISTS (SELECT 1 FROM menus WHERE codigo = v.codigo);

    -- Dar permisos al grupo SUPER_ADMIN (id=1) con todas las acciones
    FOR v_menu_id IN 
        SELECT id FROM menus 
        WHERE codigo IN ('mantenimientos', 'catalogos', 'areas_mant', 'equipos_mant', 'reportadores_mant', 
                         'responsables_mant', 'administradores_mant', 'ejes_mant', 'proyectos_mant', 'incidencias_mant')
    LOOP
        FOR v_accion_id IN 
            SELECT id FROM acciones WHERE codigo IN ('view', 'create', 'update', 'delete')
        LOOP
            INSERT INTO grupos_menus (grupo_id, menu_id, accion_id)
            SELECT 1, v_menu_id, v_accion_id
            WHERE NOT EXISTS (
                SELECT 1 FROM grupos_menus 
                WHERE grupo_id = 1 
                AND menu_id = v_menu_id 
                AND accion_id = v_accion_id
            );
        END LOOP;
    END LOOP;
END $$;

-- ================================================
-- Verificación final
-- ================================================

-- Mostrar menús creados
SELECT 'Menús de Mantenimientos creados:' as mensaje;
SELECT id, codigo, name, parent_id, url, orden
FROM menus 
WHERE codigo IN ('mantenimientos', 'catalogos', 'areas_mant', 'equipos_mant', 'reportadores_mant', 
                 'responsables_mant', 'administradores_mant', 'ejes_mant', 'proyectos_mant', 'incidencias_mant')
ORDER BY parent_id NULLS FIRST, orden;

-- Mostrar permisos creados
SELECT 'Permisos creados para grupo SUPER_ADMIN:' as mensaje;
SELECT COUNT(*) as total_permisos 
FROM grupos_menus gm
INNER JOIN menus m ON gm.menu_id = m.id
WHERE gm.grupo_id = 1 
AND m.codigo IN ('mantenimientos', 'catalogos', 'areas_mant', 'equipos_mant', 'reportadores_mant', 
                 'responsables_mant', 'administradores_mant', 'ejes_mant', 'proyectos_mant', 'incidencias_mant');

SELECT 'Tablas creadas:' as mensaje;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('areas', 'equipos', 'reportadores', 'responsables', 'administradores', 'ejes', 'proyectos', 'incidencias', 'prioridades')
ORDER BY table_name;
