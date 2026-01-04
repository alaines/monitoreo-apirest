-- Script para corregir coordenadas sin punto decimal en la tabla cruces
-- Ejemplo: -77107469 debe ser -77.107469
-- Formato esperado: -XX.XXXXXX (2 enteros + 6 decimales para Perú)

-- 1. Verificar cuántos registros tienen coordenadas sin decimales
-- (valores absolutos mayores a 180 indican que falta el punto decimal)
SELECT 
    COUNT(*) as total_con_error,
    COUNT(CASE WHEN ABS(longitud) > 180 THEN 1 END) as longitud_sin_decimal,
    COUNT(CASE WHEN ABS(latitud) > 90 THEN 1 END) as latitud_sin_decimal
FROM cruces
WHERE ABS(longitud) > 180 OR ABS(latitud) > 90;

-- 2. Mostrar ejemplos de registros con error
SELECT 
    id,
    nombre,
    longitud as longitud_actual,
    latitud as latitud_actual,
    CASE 
        WHEN ABS(longitud) > 180 THEN longitud / 1000000.0
        ELSE longitud
    END as longitud_corregida,
    CASE 
        WHEN ABS(latitud) > 90 THEN latitud / 1000000.0
        ELSE latitud
    END as latitud_corregida
FROM cruces
WHERE ABS(longitud) > 180 OR ABS(latitud) > 90
LIMIT 10;

-- 3. Corregir longitudes sin punto decimal
-- Dividir entre 1,000,000 para insertar el punto decimal en la posición correcta
UPDATE cruces
SET longitud = longitud / 1000000.0
WHERE ABS(longitud) > 180;

-- 4. Corregir latitudes sin punto decimal
UPDATE cruces
SET latitud = latitud / 1000000.0
WHERE ABS(latitud) > 90;

-- 5. Verificar resultados después de la corrección
SELECT 
    COUNT(*) as total_registros,
    COUNT(CASE WHEN ABS(longitud) > 180 THEN 1 END) as longitud_aun_con_error,
    COUNT(CASE WHEN ABS(latitud) > 90 THEN 1 END) as latitud_aun_con_error,
    MIN(longitud) as min_longitud,
    MAX(longitud) as max_longitud,
    MIN(latitud) as min_latitud,
    MAX(latitud) as max_latitud
FROM cruces;

-- 6. Actualizar la geometría (geom) después de corregir las coordenadas
-- Solo para los registros que tienen coordenadas válidas
UPDATE cruces
SET geom = ST_SetSRID(ST_MakePoint(longitud, latitud), 4326)
WHERE longitud IS NOT NULL 
  AND latitud IS NOT NULL
  AND ABS(longitud) <= 180 
  AND ABS(latitud) <= 90;

-- 7. Verificar algunos ejemplos después de la corrección
SELECT 
    id,
    nombre,
    latitud,
    longitud,
    ST_AsText(geom) as geometria
FROM cruces
WHERE longitud IS NOT NULL AND latitud IS NOT NULL
ORDER BY id
LIMIT 10;
