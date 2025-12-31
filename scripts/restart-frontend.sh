#!/bin/bash
# Script para reiniciar el frontend del sistema de monitoreo

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔄 Reiniciando Frontend..."
echo ""

# Detener frontend
bash "$SCRIPT_DIR/stop-frontend.sh"

echo ""
sleep 2

# Iniciar frontend
bash "$SCRIPT_DIR/start-frontend.sh"
