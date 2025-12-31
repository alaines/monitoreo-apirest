#!/bin/bash
# Script para reiniciar todos los servicios del sistema de monitoreo

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 Reiniciando Sistema de Monitoreo"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Detener todo
bash "$SCRIPT_DIR/stop-all.sh"

echo ""
sleep 3
echo ""

# Iniciar todo
bash "$SCRIPT_DIR/start-all.sh"
