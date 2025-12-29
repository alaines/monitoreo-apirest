#!/bin/bash
# Script para iniciar el backend del sistema de monitoreo
# Ubicación: scripts/start-backend.sh

set -e

echo "🚀 Iniciando Backend - Sistema de Monitoreo"
echo "============================================"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Directorio raíz del proyecto
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Verificar que existe .env
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Error: Archivo .env no encontrado${NC}"
    echo "Por favor, crea el archivo .env:"
    echo "  cp .env.example .env"
    exit 1
fi

# Cargar variables de entorno
set -a
source .env
set +a

echo -e "${YELLOW}📋 Configuración:${NC}"
echo "   Database: $DATABASE_HOST:$DATABASE_PORT/$DATABASE_NAME"
echo "   Server:   $SERVER_URL"
echo "   Port:     $PORT"
echo ""

# Verificar puerto disponible
if netstat -tlnp 2>/dev/null | grep -q ":$PORT " || ss -tlnp 2>/dev/null | grep -q ":$PORT "; then
    echo -e "${RED}❌ Error: Puerto $PORT ya está en uso${NC}"
    echo "Proceso usando el puerto:"
    netstat -tlnp 2>/dev/null | grep ":$PORT " || ss -tlnp 2>/dev/null | grep ":$PORT "
    exit 1
fi

# Limpiar procesos anteriores
echo -e "${YELLOW}🧹 Limpiando procesos anteriores...${NC}"
pkill -9 -f "nest start" 2>/dev/null || true
sleep 2

# Verificar que Prisma Client esté generado
if [ ! -d "node_modules/@prisma/client" ]; then
    echo -e "${YELLOW}⚙️  Generando Prisma Client...${NC}"
    npm run prisma:generate
fi

# Iniciar backend
echo -e "${GREEN}✨ Iniciando backend en segundo plano...${NC}"
rm -f backend.log

# Exportar variables y ejecutar
(
    set -a
    source .env
    set +a
    npm run backend:dev > backend.log 2>&1
) &

BACKEND_PID=$!
echo "   PID: $BACKEND_PID"

# Esperar a que el servidor esté listo
echo -e "${YELLOW}⏳ Esperando que el servidor inicie...${NC}"
MAX_WAIT=60
WAITED=0

while [ $WAITED -lt $MAX_WAIT ]; do
    if netstat -tlnp 2>/dev/null | grep -q ":$PORT " || ss -tlnp 2>/dev/null | grep -q ":$PORT "; then
        echo -e "${GREEN}✅ Backend iniciado correctamente!${NC}"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo -e "${GREEN}🌐 URLs del Sistema:${NC}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "   API Base:     $SERVER_URL/api"
        echo "   Swagger:      $SERVER_URL/api/docs"
        echo "   Login:        $SERVER_URL/api/auth/login"
        echo "   Users:        $SERVER_URL/api/users"
        echo ""
        echo -e "${YELLOW}📝 Ver logs en tiempo real:${NC}"
        echo "   tail -f backend.log"
        echo ""
        echo -e "${YELLOW}🔑 Usuario de prueba:${NC}"
        echo "   Usuario:  admin_test"
        echo "   Password: admin123"
        echo ""
        echo -e "${YELLOW}🛑 Detener servidor:${NC}"
        echo "   pkill -9 -f 'nest start'"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        
        # Probar el endpoint
        sleep 5
        echo ""
        echo -e "${YELLOW}🧪 Probando conectividad...${NC}"
        if curl -s -f "http://localhost:$PORT/api/auth/login" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ API respondiendo correctamente${NC}"
        else
            echo -e "${YELLOW}⚠️  API aún inicializando, espera unos segundos más${NC}"
        fi
        
        exit 0
    fi
    
    # Verificar que el proceso siga vivo
    if ! ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${RED}❌ Error: El backend falló al iniciar${NC}"
        echo ""
        echo "Últimas líneas del log:"
        tail -30 backend.log
        exit 1
    fi
    
    sleep 2
    WAITED=$((WAITED + 2))
    echo -n "."
done

echo -e "${RED}❌ Timeout: El servidor no respondió en $MAX_WAIT segundos${NC}"
echo ""
echo "Ver logs completos:"
echo "  cat backend.log"
exit 1
