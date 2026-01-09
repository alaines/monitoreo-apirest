# Migraciones de Base de Datos

## Instrucciones de Instalación en Nuevo Servidor

### 1. Ejecutar migraciones en orden

Las migraciones deben ejecutarse en orden numérico:

```bash
# Conectar a la base de datos
PGPASSWORD='tu_password' psql -U tu_usuario -d nombre_bd -h servidor

# Ejecutar cada migración en orden
\i 001-sprint7-permisos.sql
\i 002-crear-tabla-acciones.sql
\i 003-crear-tabla-tipos.sql
\i 004-crear-catalogos.sql
\i 005-crear-menu-mantenimientos.sql
\i 006-sistema-mantenimientos.sql
```

### 2. Script de ejecución automática

```bash
#!/bin/bash
# Archivo: ejecutar-migraciones.sh

DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="monitoreo"
DB_USER="transito"
DB_PASS="transito"

echo "Ejecutando migraciones en orden..."

for migration in database/migrations/*.sql; do
    echo "Ejecutando: $migration"
    PGPASSWORD=$DB_PASS psql -U $DB_USER -d $DB_NAME -h $DB_HOST -f "$migration"
    if [ $? -eq 0 ]; then
        echo "$migration completado"
    else
        echo "Error en $migration"
        exit 1
    fi
done

echo "Todas las migraciones completadas exitosamente"
```

### 3. Verificación Post-Instalación

Después de ejecutar las migraciones, verifica:

```sql
-- Verificar tablas creadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verificar estructura de grupos_menus
\d grupos_menus

-- Verificar menús de mantenimientos
SELECT codigo, name, parent_id, url 
FROM menus 
WHERE codigo LIKE '%mant%' OR codigo = 'mantenimientos'
ORDER BY parent_id NULLS FIRST, orden;

-- Verificar permisos del grupo SUPER_ADMIN
SELECT COUNT(*) as total_permisos
FROM grupos_menus
WHERE grupo_id = 1;
```

## Notas Importantes

### Estructura de grupos_menus

La tabla `grupos_menus` debe tener la columna `accion_id`:

```sql
CREATE TABLE grupos_menus (
    id SERIAL PRIMARY KEY,
    grupo_id INTEGER NOT NULL,
    menu_id INTEGER NOT NULL,
    accion_id INTEGER NOT NULL,
    FOREIGN KEY (grupo_id) REFERENCES grupos(id),
    FOREIGN KEY (menu_id) REFERENCES menus(id),
    FOREIGN KEY (accion_id) REFERENCES acciones(id),
    UNIQUE (grupo_id, menu_id, accion_id)
);
```

### Estructura de menus

La tabla `menus` debe incluir:

```sql
ALTER TABLE menus ADD COLUMN codigo VARCHAR(50);
ALTER TABLE menus ADD COLUMN modulo VARCHAR(100);
ALTER TABLE menus ADD COLUMN orden INTEGER DEFAULT 0;
```

## Rollback

Si necesitas revertir cambios:

```sql
-- Eliminar menús de mantenimientos
DELETE FROM grupos_menus WHERE menu_id IN (
    SELECT id FROM menus WHERE codigo LIKE '%mant%' OR codigo = 'mantenimientos'
);
DELETE FROM menus WHERE codigo LIKE '%mant%' OR codigo = 'mantenimientos';

-- Eliminar tablas de mantenimientos
DROP TABLE IF EXISTS incidencias CASCADE;
DROP TABLE IF EXISTS prioridades CASCADE;
DROP TABLE IF EXISTS proyectos CASCADE;
DROP TABLE IF EXISTS ejes CASCADE;
DROP TABLE IF EXISTS administradores CASCADE;
DROP TABLE IF EXISTS responsables CASCADE;
DROP TABLE IF EXISTS reportadores CASCADE;
DROP TABLE IF EXISTS equipos CASCADE;
DROP TABLE IF EXISTS areas CASCADE;
```

## Troubleshooting

### Error: "column accion_id does not exist"

Ejecuta la migración 006 que agrega la columna `accion_id` a `grupos_menus`.

### Error: "duplicate key value violates unique constraint"

Verifica si los menús ya existen:
```sql
SELECT * FROM menus WHERE codigo = 'mantenimientos';
```

Si existen duplicados, elimina los antiguos antes de ejecutar la migración.

### Permisos faltantes

Si un usuario no ve los menús, verifica:
```sql
-- Ver permisos del grupo del usuario
SELECT m.codigo, m.name, a.codigo as accion
FROM grupos_menus gm
JOIN menus m ON gm.menu_id = m.id
JOIN acciones a ON gm.accion_id = a.id
WHERE gm.grupo_id = (SELECT grupo_id FROM users WHERE id = TU_USER_ID);
```
