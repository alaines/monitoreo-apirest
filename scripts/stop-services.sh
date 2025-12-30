#!/bin/bash

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # Sin color

echo "🛑 Deteniendo servicios..."

# Detener Backend
if lsof -i:3001 >/dev/null 2>&1; then
    BACKEND_PID=$(lsof -ti:3001)
    echo "   Deteniendo Backend (PID: $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null
    sleep 2
    
    # Verificar si se detuvo, si no, forzar
    if lsof -i:3001 >/dev/null 2>&1; then
        echo -e "   ${YELLOW}Forzando cierre del backend...${NC}"
        kill -9 $BACKEND_PID 2>/dev/null
    fi
    echo -e "   ${GREEN}✅ Backend detenido${NC}"
else
    echo "   ℹ️  Backend no estaba corriendo"
fi

# Detener Frontend
if lsof -i:5173 >/dev/null 2>&1; then
    FRONTEND_PID=$(lsof -ti:5173)
    echo "   Deteniendo Frontend (PID: $FRONTEND_PID)..."
    kill $FRONTEND_PID 2>/dev/null
    sleep 2
    
    # Verificar si se detuvo, si no, forzar
    if lsof -i:5173 >/dev/null 2>&1; then
        echo -e "   ${YELLOW}Forzando cierre del frontend...${NC}"
        kill -9 $FRONTEND_PID 2>/dev/null
    fi
    echo -e "   ${GREEN}✅ Frontend detenido${NC}"
else
    echo "   ℹ️  Frontend no estaba corriendo"
fi

# Limpiar procesos de npm/node que puedan estar huérfanos
echo "   Limpiando procesos residuales..."
pkill -f "nest start" 2>/dev/null
pkill -f "vite" 2>/dev/null

sleep 1
echo ""
echo "✅ Servicios detenidos correctamente"
