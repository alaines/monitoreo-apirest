#!/bin/bash
# Script para reiniciar todos los servicios del sistema de monitoreo
# DEPRECATED: Usar restart-all.sh en su lugar
# Autor: Aland Laines Calonge

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "⚠️  AVISO: Este script está deprecated. Usa restart-all.sh"
echo ""
sleep 2

# Redirigir al nuevo script
bash "$SCRIPT_DIR/restart-all.sh"
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
