#!/bin/bash
# Script para iniciar todos los servicios del sistema de monitoreo
# DEPRECATED: Usar start-all.sh en su lugar

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "⚠️  AVISO: Este script está deprecated. Usa start-all.sh"
echo ""
sleep 2

# Redirigir al nuevo script
bash "$SCRIPT_DIR/start-all.sh"

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
