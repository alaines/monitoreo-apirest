#!/bin/bash

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # Sin color

PROJECT_ROOT="/home/alaines/monitoreo-apirest"

echo "🔍 Verificando estado de servicios..."
echo ""

# Verificar Backend
echo "📡 Backend (Puerto 3001):"
if lsof -i:3001 >/dev/null 2>&1; then
    BACKEND_PID=$(lsof -ti:3001)
    echo -e "   ${GREEN}✅ Corriendo${NC} (PID: $BACKEND_PID)"
    echo "   URL: http://192.168.18.230:3001/api"
    
    # Test de conectividad (401 = API funcionando, requiere auth)
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://192.168.18.230:3001/api/incidents)
    if [ "$HTTP_CODE" = "401" ]; then
        echo -e "   ${GREEN}✅ API responde correctamente (requiere auth)${NC}"
    else
        echo -e "   ${YELLOW}⚠️  Código HTTP inesperado: $HTTP_CODE${NC}"
    fi
else
    echo -e "   ${RED}❌ No está corriendo${NC}"
fi

echo ""

# Verificar Frontend
echo "🌐 Frontend (Puerto 5173):"
if lsof -i:5173 >/dev/null 2>&1; then
    FRONTEND_PID=$(lsof -ti:5173)
    echo -e "   ${GREEN}✅ Corriendo${NC} (PID: $FRONTEND_PID)"
    echo "   URL: http://192.168.18.230:5173"
    
    # Test de conectividad
    if curl -s http://192.168.18.230:5173 | head -1 | grep -q "<!DOCTYPE"; then
        echo -e "   ${GREEN}✅ Servidor web responde correctamente${NC}"
    else
        echo -e "   ${YELLOW}⚠️  Servidor web no responde como esperado${NC}"
    fi
else
    echo -e "   ${RED}❌ No está corriendo${NC}"
fi

echo ""

# Verificar logs recientes
echo "📋 Últimas líneas de logs:"
echo ""
if [ -f "$PROJECT_ROOT/logs/backend.log" ]; then
    echo "Backend (últimas 3 líneas):"
    tail -n 3 "$PROJECT_ROOT/logs/backend.log" | sed 's/^/   /'
else
    echo "   No hay log de backend"
fi

echo ""

if [ -f "$PROJECT_ROOT/logs/frontend.log" ]; then
    echo "Frontend (últimas 3 líneas):"
    tail -n 3 "$PROJECT_ROOT/logs/frontend.log" | sed 's/^/   /'
else
    echo "   No hay log de frontend"
fi

echo ""
echo "Para ver logs completos:"
echo "   Backend:  tail -f $PROJECT_ROOT/logs/backend.log"
echo "   Frontend: tail -f $PROJECT_ROOT/logs/frontend.log"
