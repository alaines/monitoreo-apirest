#!/bin/bash
# ============================================
# Script de Backup - Base de Datos Monitoreo
# ============================================

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuración
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups/monitoreo}"
DB_NAME="${DB_NAME:-monitoreo}"
DB_USER="${DB_USER:-transito}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Crear directorio de backups
mkdir -p "$BACKUP_DIR"

# Nombre del archivo
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql"
BACKUP_FILE_GZ="${BACKUP_FILE}.gz"

echo -e "${YELLOW}Iniciando backup de base de datos...${NC}"
echo "  Base de datos: $DB_NAME"
echo "  Archivo: $BACKUP_FILE_GZ"
echo ""

# Hacer backup
if PGPASSWORD="${DB_PASSWORD}" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"; then
    # Comprimir
    gzip "$BACKUP_FILE"
    
    BACKUP_SIZE=$(du -h "$BACKUP_FILE_GZ" | cut -f1)
    echo -e "${GREEN}✓ Backup completado: $BACKUP_FILE_GZ ($BACKUP_SIZE)${NC}"
else
    echo -e "${RED}✗ Error al crear backup${NC}"
    rm -f "$BACKUP_FILE"
    exit 1
fi

# Limpiar backups antiguos
echo ""
echo -e "${YELLOW}Limpiando backups antiguos (> $RETENTION_DAYS días)...${NC}"
DELETED=$(find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete -print | wc -l)
echo -e "${GREEN}✓ Eliminados: $DELETED archivos${NC}"

# Listar backups recientes
echo ""
echo -e "${YELLOW}Backups recientes:${NC}"
ls -lht "$BACKUP_DIR"/*.sql.gz 2>/dev/null | head -5 || echo "No hay backups"

echo ""
echo -e "${GREEN}Backup finalizado exitosamente${NC}"
