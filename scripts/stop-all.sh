#!/bin/bash
# Script para detener todos los servicios del sistema de monitoreo

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}🛑 Deteniendo Sistema de Monitoreo${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Detener Backend
echo "1. Deteniendo Backend..."
bash "$SCRIPT_DIR/stop-backend.sh"

echo ""

# Detener Frontend
echo "2. Deteniendo Frontend..."
bash "$SCRIPT_DIR/stop-frontend.sh"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Sistema detenido correctamente${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
