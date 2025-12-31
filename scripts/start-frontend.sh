#!/bin/bash
# Script para iniciar el frontend del sistema de monitoreo

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Directorio raíz del proyecto
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/apps/frontend"

echo "🚀 Iniciando Frontend - Sistema de Monitoreo"
echo "============================================"
echo ""

# Verificar puerto disponible
if lsof -i:5173 >/dev/null 2>&1; then
    echo -e "${RED}❌ Error: Puerto 5173 ya está en uso${NC}"
    echo "Proceso usando el puerto:"
    lsof -i:5173
    exit 1
fi

# Limpiar procesos anteriores
echo -e "${YELLOW}🧹 Limpiando procesos anteriores...${NC}"
pkill -9 -f "vite" 2>/dev/null || true
sleep 2

# Verificar que existe el directorio
if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}❌ Error: Directorio frontend no encontrado${NC}"
    exit 1
fi

# Iniciar frontend
echo -e "${GREEN}✨ Iniciando frontend en segundo plano...${NC}"
cd "$FRONTEND_DIR"
rm -f "$PROJECT_ROOT/frontend.log"

npm run dev > "$PROJECT_ROOT/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "   PID: $FRONTEND_PID"

# Esperar a que el servidor esté listo
echo -e "${YELLOW}⏳ Esperando que Vite inicie...${NC}"
MAX_WAIT=30
WAITED=0

while [ $WAITED -lt $MAX_WAIT ]; do
    if lsof -i:5173 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend iniciado correctamente!${NC}"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo -e "${GREEN}🌐 URLs del Frontend:${NC}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "   Local:    http://localhost:5173"
        echo "   Network:  http://192.168.18.230:5173"
        echo ""
        echo -e "${YELLOW}📝 Ver logs en tiempo real:${NC}"
        echo "   tail -f $PROJECT_ROOT/frontend.log"
        echo ""
        echo -e "${YELLOW}🛑 Detener servidor:${NC}"
        echo "   bash scripts/stop-frontend.sh"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        
        exit 0
    fi
    
    # Verificar que el proceso siga vivo
    if ! ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "${RED}❌ Error: El frontend falló al iniciar${NC}"
        echo ""
        echo "Últimas líneas del log:"
        tail -30 "$PROJECT_ROOT/frontend.log"
        exit 1
    fi
    
    sleep 1
    WAITED=$((WAITED + 1))
    echo -n "."
done

echo -e "${RED}❌ Timeout: El servidor no respondió en $MAX_WAIT segundos${NC}"
echo ""
echo "Ver logs completos:"
echo "  cat $PROJECT_ROOT/frontend.log"
exit 1
