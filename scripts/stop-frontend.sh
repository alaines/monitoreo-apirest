#!/bin/bash
# Script para detener el frontend del sistema de monitoreo

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🛑 Deteniendo Frontend..."

# Detener Frontend por puerto
if lsof -i:5173 >/dev/null 2>&1; then
    FRONTEND_PID=$(lsof -ti:5173)
    echo "   Deteniendo proceso (PID: $FRONTEND_PID)..."
    kill $FRONTEND_PID 2>/dev/null
    sleep 2
    
    # Verificar si se detuvo, si no, forzar
    if lsof -i:5173 >/dev/null 2>&1; then
        echo -e "   ${YELLOW}Forzando cierre...${NC}"
        kill -9 $FRONTEND_PID 2>/dev/null
    fi
    echo -e "   ${GREEN}✅ Frontend detenido${NC}"
else
    echo "   ℹ️  Frontend no estaba corriendo"
fi

# Limpiar procesos vite residuales
pkill -f "vite" 2>/dev/null || true

echo ""
echo "✅ Frontend detenido correctamente"
