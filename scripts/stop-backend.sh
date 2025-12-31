#!/bin/bash
# Script para detener el backend del sistema de monitoreo

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🛑 Deteniendo Backend..."

# Detener Backend por puerto
if lsof -i:3001 >/dev/null 2>&1; then
    BACKEND_PID=$(lsof -ti:3001)
    echo "   Deteniendo proceso (PID: $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null
    sleep 2
    
    # Verificar si se detuvo, si no, forzar
    if lsof -i:3001 >/dev/null 2>&1; then
        echo -e "   ${YELLOW}Forzando cierre...${NC}"
        kill -9 $BACKEND_PID 2>/dev/null
    fi
    echo -e "   ${GREEN}✅ Backend detenido${NC}"
else
    echo "   ℹ️  Backend no estaba corriendo"
fi

# Limpiar procesos nest residuales
pkill -f "nest start" 2>/dev/null || true

echo ""
echo "✅ Backend detenido correctamente"
