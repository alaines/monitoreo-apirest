#!/bin/bash

# Script para reiniciar servicios de backend y frontend
# Autor: Aland Laines Calonge

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "========================================="
echo "  Reiniciando Servicios de Monitoreo"
echo "========================================="
echo ""

# Detener servicios existentes
echo "🛑 Deteniendo servicios existentes..."
pkill -f "nest start" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
sleep 2
echo "✅ Servicios detenidos"
echo ""

# Reiniciar Backend
echo "🚀 Iniciando Backend (Puerto 3001)..."
cd "$PROJECT_ROOT/apps/backend"
npm run dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend iniciado (PID: $BACKEND_PID)"
echo ""

# Esperar un poco para que el backend se inicie
sleep 3

# Reiniciar Frontend
echo "🚀 Iniciando Frontend (Puerto 5173)..."
cd "$PROJECT_ROOT/apps/frontend"
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend iniciado (PID: $FRONTEND_PID)"
echo ""

# Verificar servicios
sleep 3
echo "🔍 Verificando servicios..."
echo ""

if lsof -ti:3001 > /dev/null 2>&1; then
    echo "✅ Backend corriendo en http://localhost:3001"
else
    echo "❌ Backend no responde en puerto 3001"
    echo "   Ver logs: tail -f /tmp/backend.log"
fi

if lsof -ti:5173 > /dev/null 2>&1; then
    echo "✅ Frontend corriendo en http://localhost:5173"
else
    echo "❌ Frontend no responde en puerto 5173"
    echo "   Ver logs: tail -f /tmp/frontend.log"
fi

echo ""
echo "========================================="
echo "  Servicios reiniciados exitosamente"
echo "========================================="
echo ""
echo "📋 Comandos útiles:"
echo "   Ver logs backend:  tail -f /tmp/backend.log"
echo "   Ver logs frontend: tail -f /tmp/frontend.log"
echo "   Detener servicios: $SCRIPT_DIR/stop-services.sh"
echo ""
