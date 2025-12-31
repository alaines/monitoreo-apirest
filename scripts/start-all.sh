#!/bin/bash
# Script para iniciar todos los servicios del sistema de monitoreo

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🚀 Iniciando Sistema de Monitoreo${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Iniciar Backend
echo -e "${YELLOW}1. Iniciando Backend...${NC}"
bash "$SCRIPT_DIR/start-backend.sh"

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Error al iniciar el backend"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Iniciar Frontend
echo -e "${YELLOW}2. Iniciando Frontend...${NC}"
bash "$SCRIPT_DIR/start-frontend.sh"

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Error al iniciar el frontend"
    echo "Deteniendo backend..."
    bash "$SCRIPT_DIR/stop-backend.sh"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Sistema iniciado correctamente${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 URLs del Sistema:"
echo "   Backend API:  http://192.168.18.230:3001/api"
echo "   Swagger Docs: http://192.168.18.230:3001/api/docs"
echo "   Frontend:     http://192.168.18.230:5173"
echo ""
echo "📝 Ver estado:"
echo "   bash scripts/check-services.sh"
echo ""
echo "🛑 Detener sistema:"
echo "   bash scripts/stop-all.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
