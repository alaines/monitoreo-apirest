#!/bin/bash

# Script para iniciar los servicios del sistema de monitoreo de forma robusta

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🚀 Iniciando Sistema de Monitoreo..."

# Función para limpiar procesos
cleanup() {
    echo ""
    echo "🛑 Deteniendo servicios..."
    pkill -9 -f "nest start" 2>/dev/null
    pkill -9 -f "vite" 2>/dev/null
    sleep 2
    echo "✅ Servicios detenidos"
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT SIGTERM

# Limpiar procesos anteriores
echo "🧹 Limpiando procesos anteriores..."
pkill -9 -f "nest start" 2>/dev/null
pkill -9 -f "vite" 2>/dev/null
sleep 2

# Verificar puertos
echo "🔍 Verificando puertos..."
if lsof -i:3001 >/dev/null 2>&1; then
    echo "⚠️  Puerto 3001 en uso, limpiando..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null
    sleep 1
fi

if lsof -i:5173 >/dev/null 2>&1; then
    echo "⚠️  Puerto 5173 en uso, limpiando..."
    lsof -ti:5173 | xargs kill -9 2>/dev/null
    sleep 1
fi

# Crear directorio de logs
mkdir -p "$PROJECT_ROOT/logs"

# Iniciar Backend
echo "🔧 Iniciando Backend (NestJS)..."
cd "$PROJECT_ROOT"
nohup npm run backend:dev > "$PROJECT_ROOT/logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo "   PID: $BACKEND_PID"

# Esperar a que el backend inicie (puede tardar ~30s en compilar)
echo "   Esperando backend (compilando con webpack)..."
MAX_WAIT=60
COUNTER=0
while [ $COUNTER -lt $MAX_WAIT ]; do
    if lsof -i:3001 >/dev/null 2>&1; then
        echo "   ✅ Backend corriendo en puerto 3001"
        break
    fi
    sleep 2
    COUNTER=$((COUNTER + 2))
    if [ $COUNTER -ge $MAX_WAIT ]; then
        echo "❌ Error: Backend no inició en ${MAX_WAIT}s"
        echo "Ver logs en: $PROJECT_ROOT/logs/backend.log"
        tail -n 20 "$PROJECT_ROOT/logs/backend.log"
        exit 1
    fi
done

# Iniciar Frontend
echo "🌐 Iniciando Frontend (Vite)..."
cd "$PROJECT_ROOT/apps/frontend"
nohup npm run dev > "$PROJECT_ROOT/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "   PID: $FRONTEND_PID"

# Esperar a que el frontend inicie
echo "   Esperando frontend..."
MAX_WAIT=20
COUNTER=0
while [ $COUNTER -lt $MAX_WAIT ]; do
    if lsof -i:5173 >/dev/null 2>&1; then
        echo "   ✅ Frontend corriendo en puerto 5173"
        break
    fi
    sleep 1
    COUNTER=$((COUNTER + 1))
    if [ $COUNTER -ge $MAX_WAIT ]; then
        echo "❌ Error: Frontend no inició en ${MAX_WAIT}s"
        echo "Ver logs en: $PROJECT_ROOT/logs/frontend.log"
        tail -n 20 "$PROJECT_ROOT/logs/frontend.log"
        exit 1
    fi
done
    exit 1
fi
echo "   ✅ Frontend corriendo en puerto 5173"

echo ""
echo "✅ ¡Sistema iniciado correctamente!"
echo ""
echo "📊 Servicios:"
echo "   🔧 Backend:  http://192.168.18.230:3001"
echo "   🌐 Frontend: http://192.168.18.230:5173"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f $PROJECT_ROOT/logs/backend.log"
echo "   Frontend: tail -f $PROJECT_ROOT/logs/frontend.log"
echo ""
echo "⚠️  Presiona Ctrl+C para detener los servicios"
echo ""

# Mantener el script corriendo
tail -f /dev/null
