#!/bin/bash
# Script de ejecución de migraciones de base de datos
# Uso: ./ejecutar-migraciones.sh [--host HOST] [--port PORT] [--user USER] [--db DATABASE] [--password PASSWORD]

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Valores por defecto
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-monitoreo}"
DB_USER="${DB_USER:-transito}"
DB_PASS="${DB_PASS:-transito}"

# Directorio de migraciones
MIGRATIONS_DIR="$(dirname "$0")/database/migrations"

# Parsear argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        --host)
            DB_HOST="$2"
            shift 2
            ;;
        --port)
            DB_PORT="$2"
            shift 2
            ;;
        --user)
            DB_USER="$2"
            shift 2
            ;;
        --db)
            DB_NAME="$2"
            shift 2
            ;;
        --password)
            DB_PASS="$2"
            shift 2
            ;;
        *)
            echo "Argumento desconocido: $1"
            echo "Uso: $0 [--host HOST] [--port PORT] [--user USER] [--db DATABASE] [--password PASSWORD]"
            exit 1
            ;;
    esac
done

echo -e "${YELLOW}======================================${NC}"
echo -e "${YELLOW}  Ejecutando Migraciones de BD${NC}"
echo -e "${YELLOW}======================================${NC}"
echo ""
echo "Host: $DB_HOST:$DB_PORT"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo ""

# Verificar conexión a la base de datos
echo -e "${YELLOW}Verificando conexión...${NC}"
export PGPASSWORD=$DB_PASS
if ! psql -U $DB_USER -d $DB_NAME -h $DB_HOST -p $DB_PORT -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${RED}✗ Error: No se puede conectar a la base de datos${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Conexión exitosa${NC}"
echo ""

# Contador de migraciones
success_count=0
error_count=0

# Ejecutar migraciones en orden
echo -e "${YELLOW}Ejecutando migraciones...${NC}"
echo ""

for migration in $(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort); do
    migration_name=$(basename "$migration")
    echo -n "  $migration_name ... "
    
    if PGPASSWORD=$DB_PASS psql -U $DB_USER -d $DB_NAME -h $DB_HOST -p $DB_PORT -f "$migration" > /tmp/migration_output.log 2>&1; then
        echo -e "${GREEN}✓${NC}"
        ((success_count++))
    else
        echo -e "${RED}✗${NC}"
        echo -e "${RED}    Error details:${NC}"
        tail -5 /tmp/migration_output.log | sed 's/^/    /'
        ((error_count++))
    fi
done

echo ""
echo -e "${YELLOW}======================================${NC}"
echo -e "${YELLOW}  Resumen${NC}"
echo -e "${YELLOW}======================================${NC}"
echo -e "${GREEN}Exitosas: $success_count${NC}"
echo -e "${RED}Fallidas: $error_count${NC}"
echo ""

# Verificación post-migración
echo -e "${YELLOW}Ejecutando verificaciones...${NC}"
echo ""

# Verificar tablas principales
echo -n "  Verificando tablas de mantenimientos... "
table_count=$(PGPASSWORD=$DB_PASS psql -U $DB_USER -d $DB_NAME -h $DB_HOST -p $DB_PORT -t -c "
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('areas', 'equipos', 'reportadores', 'responsables', 'administradores', 'ejes', 'proyectos', 'incidencias', 'prioridades', 'acciones')
" 2>/dev/null | tr -d ' ')

if [ "$table_count" -eq 10 ]; then
    echo -e "${GREEN}✓ ($table_count/10 tablas)${NC}"
else
    echo -e "${YELLOW}⚠ ($table_count/10 tablas)${NC}"
fi

# Verificar menús
echo -n "  Verificando menús de mantenimientos... "
menu_count=$(PGPASSWORD=$DB_PASS psql -U $DB_USER -d $DB_NAME -h $DB_HOST -p $DB_PORT -t -c "
SELECT COUNT(*) FROM menus 
WHERE codigo IN ('mantenimientos', 'catalogos', 'areas_mant', 'equipos_mant', 'reportadores_mant', 
                 'responsables_mant', 'administradores_mant', 'ejes_mant', 'proyectos_mant', 'incidencias_mant')
" 2>/dev/null | tr -d ' ')

if [ "$menu_count" -eq 10 ]; then
    echo -e "${GREEN}✓ ($menu_count/10 menús)${NC}"
else
    echo -e "${YELLOW}⚠ ($menu_count/10 menús)${NC}"
fi

# Verificar permisos
echo -n "  Verificando permisos SUPER_ADMIN... "
permiso_count=$(PGPASSWORD=$DB_PASS psql -U $DB_USER -d $DB_NAME -h $DB_HOST -p $DB_PORT -t -c "
SELECT COUNT(*) FROM grupos_menus WHERE grupo_id = 1
" 2>/dev/null | tr -d ' ')

if [ "$permiso_count" -gt 0 ]; then
    echo -e "${GREEN}✓ ($permiso_count permisos)${NC}"
else
    echo -e "${RED}✗ (0 permisos)${NC}"
fi

echo ""

if [ $error_count -eq 0 ]; then
    echo -e "${GREEN}✓ Todas las migraciones completadas exitosamente${NC}"
    exit 0
else
    echo -e "${RED}✗ Algunas migraciones fallaron. Revisa los logs arriba.${NC}"
    exit 1
fi
